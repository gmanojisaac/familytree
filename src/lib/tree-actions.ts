import {createHash,createHmac,randomBytes} from "node:crypto";
import {db} from "./db";
import {type Actor,treeAccess,personAccess,audit,limit} from "./policy";
import {requireThat} from "./http";
import {schemas,type Action} from "./schemas";
import {parentCycle} from "./graph";
const hash=(token:string)=>createHash("sha256").update(token).digest("hex");
export async function treeAction(actor:Actor,action:Action,raw:unknown):Promise<object|undefined>{
 if(["create-tree","add-person","add-edge","link"].includes(action)){const d=raw as {kind:string;subtype:string};requireThat((d.kind==="PARENT_CHILD"&&["biological","adoptive","step"].includes(d.subtype))||(d.kind==="PARTNER"&&["partner","married","former"].includes(d.subtype))||(d.kind==="GUARDIAN"&&d.subtype==="guardian"),400,"Choose a detail matching the relationship type.");}
 switch(action){
 case "edit-person":{
 const d=schemas[action].parse(raw),p=await personAccess(actor,d.personId);
 if(p.accountId)requireThat(p.accountId===actor.accountId,403,"Adults edit their own identities.");
 else{
 const memberships=await db.treeMembership.findMany({where:{accountId:actor.accountId,role:"STEWARD"}});
 requireThat(await db.personTreeVisibility.findFirst({where:{personId:p.id,treeId:{in:memberships.map(m=>m.treeId)},sourceLinkId:null}}));
 if(p.isMinor)requireThat(await db.guardianConsent.findUnique({where:{guardianAccountId_childPersonId:{guardianAccountId:actor.accountId,childPersonId:p.id}}}));
 }
 await limit(actor,"profile-edits",5);
 const birthDate=d.birthDate?new Date(d.birthDate+"T00:00:00Z"):null;
 requireThat(!birthDate||(!Number.isNaN(birthDate.getTime())&&birthDate<=new Date()&&birthDate.toISOString().startsWith(d.birthDate!)),400,"Choose a valid past date.");
 await db.person.update({where:{id:p.id},data:{displayName:d.displayName,...(d.birthDate!==undefined?{birthDate}:{})}});
 await audit(actor,action,p.id);return {};
 }
 case "add-edge":{
 const d=schemas[action].parse(raw);await treeAccess(actor,d.treeId,true);requireThat(d.sourceId!==d.targetId,400,"A person cannot be related to themselves.");
 for(const personId of [d.sourceId,d.targetId]){
 const p=await personAccess(actor,personId);requireThat(await db.personTreeVisibility.findFirst({where:{personId,treeId:d.treeId,sourceLinkId:null}}));
 if(p.isMinor){requireThat(d.kind!=="PARTNER",400,"Partner links require adults.");requireThat(await db.guardianConsent.findUnique({where:{guardianAccountId_childPersonId:{guardianAccountId:actor.accountId,childPersonId:personId}}}));}
 }
 await db.$transaction(async tx=>{
 await tx.$executeRaw`SELECT pg_advisory_xact_lock(830119)`;
 const edges=await tx.relationshipEdge.findMany({where:{status:"APPROVED"}});
 requireThat(!(d.kind==="PARENT_CHILD"&&parentCycle(edges,d.sourceId,d.targetId)),400,"This would create a parenthood cycle.");
 requireThat(!edges.some(e=>e.kind===d.kind&&((e.sourceId===d.sourceId&&e.targetId===d.targetId)||(d.kind==="PARTNER"&&e.sourceId===d.targetId&&e.targetId===d.sourceId))),409,"This relationship already exists.");
 await tx.relationshipEdge.create({data:{...d,assertedBy:actor.accountId}});
 },{isolationLevel:"Serializable"});
 await audit(actor,action,d.treeId);return {};
 }

 case "create-tree":{
 const d=schemas[action].parse(raw);
 const tree=await db.$transaction(async tx=>{
 const t=await tx.familyTree.create({data:{name:d.name,memberships:{create:{accountId:actor.accountId,role:"STEWARD"}}}});
 await tx.person.update({where:{id:actor.personId},data:{displayName:d.displayName}});
 const r=await tx.person.create({data:{displayName:d.relativeName,generation:0,privacy:{create:{}}}});
 await tx.personTreeVisibility.createMany({data:[{treeId:t.id,personId:actor.personId},{treeId:t.id,personId:r.id}]});
 await tx.relationshipEdge.create({data:{treeId:t.id,sourceId:r.id,targetId:actor.personId,kind:d.kind,subtype:d.subtype,assertedBy:actor.accountId}});
 return t;});await audit(actor,action,tree.id);return {treeId:tree.id};
 }
 case "add-person":{
 const d=schemas[action].parse(raw);requireThat((d.kind==="PARTNER"&&d.direction==="partner")||(d.kind==="GUARDIAN"&&d.direction==="guardian")||(d.kind==="PARENT_CHILD"&&["parent","child"].includes(d.direction)),400,"Choose a matching typed relationship.");await treeAccess(actor,d.treeId,true);const relative=await personAccess(actor,d.relatedTo);
 requireThat(await db.personTreeVisibility.findFirst({where:{personId:relative.id,treeId:d.treeId,sourceLinkId:null}}));
 requireThat(!(d.kind==="PARTNER"&&(d.isMinor||relative.isMinor)),400,"Partner relationships require adults.");
 const p=await db.$transaction(async tx=>{
 const p=await tx.person.create({data:{displayName:d.displayName,isMinor:d.isMinor,generation:relative.generation+(d.direction==="parent"||d.direction==="guardian"?-1:d.direction==="child"?1:0),privacy:{create:{}},notification:{create:{}},visibility:{create:{treeId:d.treeId}}}});
 if(d.isMinor)await tx.guardianConsent.create({data:{guardianAccountId:actor.accountId,childPersonId:p.id}});
 const sourceId=d.direction==="parent"||d.direction==="guardian"?p.id:relative.id,targetId=sourceId===p.id?relative.id:p.id;
 await tx.relationshipEdge.create({data:{treeId:d.treeId,sourceId,targetId,kind:d.kind,subtype:d.subtype,assertedBy:actor.accountId}});return p;});
 await audit(actor,action,p.id);return {personId:p.id};
 }
 case "invite":{
 const d=schemas[action].parse(raw);await treeAccess(actor,d.treeId,true);await limit(actor,"invitations",10);
 if(d.personId){const p=await personAccess(actor,d.personId);requireThat(!p.isMinor&&!p.deceased&&!p.accountId,400,"Invite an unclaimed adult person.");requireThat(await db.personTreeVisibility.findFirst({where:{treeId:d.treeId,personId:p.id,sourceLinkId:null}}));}
 const random=randomBytes(32).toString("base64url"),token=random+"."+createHmac("sha256",process.env.BETTER_AUTH_SECRET!).update(random).digest("base64url");
 const invite=await db.invitation.create({data:{treeId:d.treeId,personId:d.personId,email:d.email.toLowerCase(),createdBy:actor.accountId,tokenHash:hash(token),expiresAt:new Date(Date.now()+48*3600_000)}});
 await audit(actor,action,invite.id);return {url:process.env.BETTER_AUTH_URL+"/invite?token="+token};
 }
 case "accept-invite":{
 const d=schemas[action].parse(raw),account=await db.account.findUniqueOrThrow({where:{id:actor.accountId}}),invite=await db.invitation.findUnique({where:{tokenHash:hash(d.token)}});
 requireThat(invite&&!invite.consumedAt&&!invite.revokedAt&&invite.expiresAt>new Date()&&invite.email===account.email.toLowerCase(),400,"The invitation is unavailable or belongs to a different verified email.");
 await db.$transaction(async tx=>{
 const consumed=await tx.invitation.updateMany({where:{id:invite.id,consumedAt:null,revokedAt:null,expiresAt:{gt:new Date()}},data:{consumedAt:new Date()}});
 requireThat(consumed.count===1,409,"This invitation has already been used.");let personId=actor.personId;
 if(invite.personId&&invite.personId!==actor.personId){
 const p=await tx.person.findUniqueOrThrow({where:{id:invite.personId}});requireThat(!p.accountId&&!p.isMinor&&!p.deceased);
 requireThat(await tx.personTreeVisibility.count({where:{personId:actor.personId}})===0,409,"You already have a family identity. Ask for an invitation without a person claim.");
 await tx.person.update({where:{id:actor.personId},data:{accountId:null}});await tx.person.update({where:{id:p.id},data:{accountId:actor.accountId}});personId=p.id;
 }
 await tx.treeMembership.upsert({where:{accountId_treeId:{accountId:actor.accountId,treeId:invite.treeId}},create:{accountId:actor.accountId,treeId:invite.treeId},update:{}});
 await tx.personTreeVisibility.upsert({where:{personId_treeId:{personId,treeId:invite.treeId}},create:{personId,treeId:invite.treeId},update:{}});
 },{isolationLevel:"Serializable"});await audit(actor,action,invite.id);return {treeId:invite.treeId};
 }
 case "revoke-invite":{
 const d=schemas[action].parse(raw),inv=await db.invitation.findUnique({where:{id:d.invitationId}});requireThat(inv,404);await treeAccess(actor,inv.treeId,true);
 await db.invitation.update({where:{id:inv.id},data:{revokedAt:new Date()}});await audit(actor,action,inv.id);return {};
 }
 case "preview-link":{
 const d=schemas[action].parse(raw);await limit(actor,"connection-preview",10);const tree=await db.familyTree.findUnique({where:{inviteCode:d.code}});
 const p=tree&&await db.personTreeVisibility.findFirst({where:{treeId:tree.id,personId:d.personId,sourceLinkId:null},include:{person:{include:{privacy:true}}}});
 requireThat(p&&!p.person.isMinor&&!p.person.deceased&&p.person.privacy?.allowLinked,404,"No consenting adult matches those private codes.");
 return {treeId:tree!.id,treeName:tree!.name,personId:p.personId,displayName:p.person.displayName,sharing:"Only the two selected adult profiles and relationship. No other relatives, dates, recordings, or membership."};
 }
 case "link":{
 const d=schemas[action].parse(raw);await treeAccess(actor,d.treeId,true);const tree=await db.familyTree.findUnique({where:{inviteCode:d.code}});
 requireThat(tree&&tree.id!==d.treeId,400,"Choose a different consenting grove.");
 const from=await personAccess(actor,d.fromPersonId),to=await db.person.findUnique({where:{id:d.toPersonId},include:{privacy:true}});
 requireThat(from.accountId===actor.accountId&&!from.isMinor&&from.privacy?.allowLinked&&to&&!to.isMinor&&!to.deceased&&to.privacy?.allowLinked,403,"Both affected adults must opt into linked visibility. Children cannot be cross-tree endpoints.");
 for(const [treeId,personId]of [[d.treeId,from.id],[tree.id,to.id]])requireThat(await db.personTreeVisibility.findFirst({where:{treeId,personId,sourceLinkId:null}}));
 const link=await db.treeLinkRequest.create({data:{fromTreeId:d.treeId,toTreeId:tree.id,fromPersonId:from.id,toPersonId:to.id,kind:d.kind,subtype:d.subtype,requestedBy:actor.accountId}});
 await audit(actor,action,link.id);return {linkId:link.id};
 }
 case "review-link":{
 const d=schemas[action].parse(raw);
 await db.$transaction(async tx=>{
 await tx.$executeRaw`SELECT pg_advisory_xact_lock(830119)`;
 const l=await tx.treeLinkRequest.findUnique({where:{id:d.linkId},include:{approvals:true}});requireThat(l?.status==="PENDING",409,"This connection is no longer pending.");
 const ends=await tx.person.findMany({where:{id:{in:[l.fromPersonId,l.toPersonId]}},include:{privacy:true}});
 requireThat(ends.length===2&&ends.every(p=>!p.isMinor&&p.privacy?.allowLinked));
 const source=ends.find(p=>p.id===l.fromPersonId)?.accountId===actor.accountId,target=ends.find(p=>p.id===l.toPersonId)?.accountId===actor.accountId;
 requireThat(source||target,403,"The affected adult must approve their own profile.");const treeId=source?l.fromTreeId:l.toTreeId;requireThat((await tx.treeMembership.findUnique({where:{accountId_treeId:{accountId:actor.accountId,treeId}}}))?.role==="STEWARD");
 await tx.relationshipApproval.upsert({where:{linkId_treeId:{linkId:l.id,treeId}},create:{linkId:l.id,treeId,accountId:actor.accountId,approved:d.approve},update:{approved:d.approve}});
 if(!d.approve){await tx.treeLinkRequest.update({where:{id:l.id},data:{status:"DECLINED"}});return;}
 if(await tx.relationshipApproval.count({where:{linkId:l.id,approved:true}})!==2)return;
 const edges=await tx.relationshipEdge.findMany({where:{status:"APPROVED"}});
 requireThat(l.fromPersonId!==l.toPersonId&&!(l.kind==="PARENT_CHILD"&&parentCycle(edges,l.fromPersonId,l.toPersonId)),400,"This relationship would create a parenthood cycle.");
 requireThat(!edges.some(e=>e.kind===l.kind&&((e.sourceId===l.fromPersonId&&e.targetId===l.toPersonId)||(l.kind==="PARTNER"&&e.sourceId===l.toPersonId&&e.targetId===l.fromPersonId))),409,"This relationship already exists.");
 await tx.treeLinkRequest.update({where:{id:l.id},data:{status:"APPROVED"}});
 for(const [personId,treeId]of [[l.toPersonId,l.fromTreeId],[l.fromPersonId,l.toTreeId]])await tx.personTreeVisibility.upsert({where:{personId_treeId:{personId,treeId}},create:{personId,treeId,sourceLinkId:l.id},update:{}});
 const assertion={treeId:l.fromTreeId,sourceId:l.fromPersonId,targetId:l.toPersonId,kind:l.kind,subtype:l.subtype,assertedBy:l.requestedBy,sourceLinkId:l.id,status:"APPROVED" as const};
 await tx.relationshipEdge.upsert({where:{sourceId_targetId_kind:{sourceId:l.fromPersonId,targetId:l.toPersonId,kind:l.kind}},create:assertion,update:assertion});
 },{isolationLevel:"Serializable"});await audit(actor,action,d.linkId);return {};
 }
 case "unlink":{
 const d=schemas[action].parse(raw),l=await db.treeLinkRequest.findUnique({where:{id:d.linkId}});requireThat(l,404);
 requireThat(await db.treeMembership.findFirst({where:{accountId:actor.accountId,role:"STEWARD",treeId:{in:[l.fromTreeId,l.toTreeId]}}}));
 await db.$transaction([db.treeLinkRequest.update({where:{id:l.id},data:{status:d.reason==="dispute"?"DISPUTED":"REVOKED"}}),db.personTreeVisibility.deleteMany({where:{sourceLinkId:l.id}}),db.relationshipEdge.updateMany({where:{sourceLinkId:l.id},data:{status:"REVOKED"}})]);await audit(actor,action+":"+d.reason,l.id);return {};
 }
 }
}
