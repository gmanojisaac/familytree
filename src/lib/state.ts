import {db} from "./db";
import {type Actor,allowedPeople,treeAccess,childVoiceAllowed,adult} from "./policy";
import {canPlayClip} from "./voice-policy";
import voicePrompts from "../../data/legacy_voice_prompts.json";
export async function getState(actor:Actor,requestedTree?:string){
 const people=await allowedPeople(actor), visibleIds=people.map(p=>p.id);
 const memberships=actor.isChild?[]:await db.treeMembership.findMany({where:{accountId:actor.accountId},include:{tree:true}});
 const childTrees=actor.isChild?await db.familyTree.findMany({where:{visibility:{some:{personId:actor.personId,sourceLinkId:null}}}}):[];
 const trees=actor.isChild?childTrees.map(t=>({id:t.id,name:t.name,role:"MEMBER",code:null})):memberships.map(m=>({id:m.treeId,name:m.tree.name,role:m.role,code:m.role==="STEWARD"?m.tree.inviteCode:null}));
 const treeId=requestedTree??trees[0]?.id??null;if(treeId)await treeAccess(actor,treeId);
 const nativeIds=new Set((await db.personTreeVisibility.findMany({where:{treeId:{in:trees.map(t=>t.id)},sourceLinkId:null},select:{personId:true}})).map(v=>v.personId));
 const inTree=treeId?(await db.personTreeVisibility.findMany({where:{treeId,personId:{in:visibleIds}}})).map(v=>v.personId):[];
 const edges=treeId?await db.relationshipEdge.findMany({where:{status:"APPROVED",sourceId:{in:inTree},targetId:{in:inTree}},select:{id:true,sourceId:true,targetId:true,kind:true,subtype:true}}):[];
 const stewardTrees=memberships.filter(m=>m.role==="STEWARD").map(m=>m.treeId);
 const links=actor.isChild?[]:await db.treeLinkRequest.findMany({where:{OR:[{fromTreeId:{in:stewardTrees}},{toTreeId:{in:stewardTrees}}]},include:{approvals:{select:{treeId:true,approved:true}}},orderBy:{createdAt:"desc"}});
 const invitations=actor.isChild?[]:await db.invitation.findMany({where:{treeId:{in:stewardTrees}},select:{id:true,treeId:true,email:true,expiresAt:true,consumedAt:true,revokedAt:true},orderBy:{createdAt:"desc"}});
 const allOccasions=await db.occasion.findMany({where:{personId:{in:visibleIds},enabled:true}});
 const occasions=actor.isChild?[]:allOccasions.filter(o=>nativeIds.has(o.personId)&&(people.find(p=>p.id===o.personId)?.privacy?.dateVisibility!=="PRIVATE"||o.personId===actor.personId));
 const childIds=actor.isChild?[]:(await db.guardianConsent.findMany({where:{guardianAccountId:actor.accountId},select:{childPersonId:true}})).map(c=>c.childPersonId);
 const greetings=actor.isChild?[]:await db.greeting.findMany({where:{OR:[{senderId:actor.personId},{recipientId:actor.personId},{recipientId:{in:childIds}}]},include:{template:true,reply:{include:{template:true}}},orderBy:{createdAt:"desc"},take:50});
 const clips=await db.voiceClip.findMany({where:{ownerPersonId:{in:visibleIds},status:"ACTIVE"},include:{owner:true,consent:{include:{audience:true}}}});
 const approvedChildClips=actor.isChild?[]:await db.guardianVoiceApproval.findMany({where:{guardianAccountId:actor.accountId,approved:true}});
 const voices=[];for(const c of clips)if(await canPlayClip(actor,c))voices.push({id:c.id,ownerPersonId:c.ownerPersonId,promptKey:c.promptKey,transcript:c.transcript,duration:c.duration,createdAt:c.createdAt,memorial:c.owner.deceased,childReviewFor:[...new Set(c.consent.audience.filter(a=>childIds.includes(a.personId)).map(a=>a.personId))],approvedChildren:approvedChildClips.filter(a=>a.clipId===c.id).map(a=>a.childPersonId)});
 const guardian=actor.isChild?[]:await db.guardianConsent.findMany({where:{guardianAccountId:actor.accountId},select:{childPersonId:true,explore:true,greetings:true,voice:true}});
 return {
 me:{personId:actor.personId,isChild:actor.isChild,moderator:actor.moderator,adultVerified:actor.adultVerified},
 trees,treeId,people:people.map(p=>({id:p.id,displayName:p.displayName,isMinor:p.isMinor,deceased:p.deceased,generation:p.generation,color:p.color,inTree:inTree.includes(p.id),
 date:actor.isChild||p.isMinor||!nativeIds.has(p.id)||!p.birthDate||(p.id!==actor.personId&&p.privacy?.dateVisibility==="PRIVATE")?null:(p.id===actor.personId||p.privacy?.dateVisibility==="FULL"?p.birthDate.toISOString().slice(0,10):p.birthDate.toISOString().slice(5,10)),
 editable:!actor.isChild&&(p.accountId===actor.accountId||(!p.accountId&&nativeIds.has(p.id)&&stewardTrees.includes(treeId??"")&&(!p.isMinor||guardian.some(c=>c.childPersonId===p.id)))),showPhoto:!actor.isChild&&!!p.privacy?.showPhoto,linked:!!p.privacy?.allowLinked})),
 edges,links:links.map(l=>({id:l.id,fromTreeId:l.fromTreeId,toTreeId:l.toTreeId,fromPersonId:l.fromPersonId,toPersonId:l.toPersonId,kind:l.kind,subtype:l.subtype,status:l.status,approvals:l.approvals})),
 invitations,occasions,greetings:greetings.filter(g=>visibleIds.includes(g.senderId)&&visibleIds.includes(g.recipientId)),
 templates:actor.isChild?[]:await db.greetingTemplate.findMany({where:actor.moderator?{}:{enabled:true}}),
 replies:actor.isChild?[]:await db.greetingReplyTemplate.findMany({where:{enabled:true}}),
 voices,prompts:voicePrompts.prompts,guardian,
 reviews:actor.isChild?[]:actor.moderator?await db.memorialStatusReview.findMany({orderBy:{createdAt:"desc"},take:50}):await db.memorialStatusReview.findMany({where:{ownerPersonId:{in:visibleIds}}}),
 voiceListeningAllowed:await childVoiceAllowed(actor),preferences:people.find(p=>p.id===actor.personId)?.notification??null,
 privacy:actor.isChild?null:people.find(p=>p.id===actor.personId)?.privacy??null,
 steward:actor.isChild?null:await db.legacySteward.findUnique({where:{ownerPersonId:actor.personId}}),
 reports:actor.moderator?await db.moderationReport.findMany({orderBy:{createdAt:"desc"},take:50}):[],
 audit:actor.moderator?await db.auditLog.findMany({orderBy:{createdAt:"desc"},take:50}):[]
 };
}
export type GroveState=Awaited<ReturnType<typeof getState>>;
export async function exportOwn(actor:Actor){
 adult(actor);
 return {exportedAt:new Date().toISOString(),
 person:await db.person.findUnique({where:{id:actor.personId},include:{privacy:true,notification:true,occasions:true}}),
 consents:await db.voiceConsent.findMany({where:{ownerPersonId:actor.personId},include:{audience:true}}),
 clips:await db.voiceClip.findMany({where:{ownerPersonId:actor.personId},select:{id:true,promptKey:true,transcript:true,duration:true,createdAt:true,status:true}}),
 memberships:await db.treeMembership.findMany({where:{accountId:actor.accountId},select:{treeId:true,role:true}})};
}
