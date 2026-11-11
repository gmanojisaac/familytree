import {db} from "./db";
import {type Actor,adult,personAccess,audit,limit,allowedPeople,treeAccess} from "./policy";
import {requireThat} from "./http";
import {schemas,type Action} from "./schemas";
import {canPlayClip} from "./voice-policy";
import {treeAction} from "./tree-actions";
export {getState,exportOwn} from "./state";
export {validAction} from "./schemas";
export async function mutate(actor:Actor,action:Action,raw:unknown){
 const data=schemas[action].parse(raw);adult(actor);await limit(actor,"mutations",100);
 const result=await treeAction(actor,action,data);if(result!==undefined)return result;
 switch(action){
 case "greet":{
 const d=schemas[action].parse(data);await limit(actor,"greetings",10);const p=await personAccess(actor,d.recipientId);requireThat(p.id!==actor.personId&&!p.deceased);
 const t=await db.greetingTemplate.findUnique({where:{id:d.templateId}}),o=await db.occasion.findUnique({where:{id:d.occasionId}});
 const sender=await db.notificationPreference.findUnique({where:{personId:actor.personId}});
 requireThat(t?.enabled&&o?.enabled&&o.personId===p.id&&o.kind===t.occasion&&p.privacy?.dateVisibility!=="PRIVATE",400,"That fixed wish does not match a shared occasion.");
 requireThat(!p.notification?.doNotDisturb&&!p.notification?.mutedPersonIds.includes(actor.personId)&&!sender?.mutedPersonIds.includes(p.id),403,"Wishes are paused for this recipient.");
 if(p.isMinor)requireThat(await db.guardianConsent.findFirst({where:{childPersonId:p.id,greetings:true}}),403,"The guardian has not enabled occasion wishes.");
 const g=await db.greeting.create({data:{senderId:actor.personId,recipientId:p.id,templateId:t.id,occasionId:o.id}});await audit(actor,action,g.id);return {};
 }
 case "reply":{
 const d=schemas[action].parse(data);await limit(actor,"greetings",10);const g=await db.greeting.findUnique({where:{id:d.greetingId},include:{template:true}});
 requireThat(g&&g.recipientId===actor.personId,404);const sender=await personAccess(actor,g.senderId),receiver=await db.notificationPreference.findUnique({where:{personId:actor.personId}});
 requireThat(!sender.notification?.doNotDisturb&&!sender.notification?.mutedPersonIds.includes(actor.personId)&&!receiver?.mutedPersonIds.includes(sender.id));
 requireThat(g.template.allowedReplies.includes(d.templateId)&&await db.greetingReplyTemplate.findFirst({where:{id:d.templateId,enabled:true}}),400,"Choose an applicable fixed reply.");
 await db.greetingReply.create({data:{greetingId:g.id,templateId:d.templateId}});await audit(actor,action,g.id);return {};
 }
 case "privacy":{
 const d=schemas[action].parse(data);
 await db.$transaction([db.privacyPreference.upsert({where:{personId:actor.personId},create:{personId:actor.personId,dateVisibility:d.dateVisibility,showPhoto:d.showPhoto,allowLinked:d.allowLinked},update:{dateVisibility:d.dateVisibility,showPhoto:d.showPhoto,allowLinked:d.allowLinked}}),
 db.notificationPreference.upsert({where:{personId:actor.personId},create:{personId:actor.personId,doNotDisturb:d.doNotDisturb,hideLegacy:d.hideLegacy},update:{doNotDisturb:d.doNotDisturb,hideLegacy:d.hideLegacy}})]);
 await audit(actor,action,actor.personId);return {};
 }
 case "occasion":{
 const d=schemas[action].parse(data);requireThat(new Date(Date.UTC(2024,d.month-1,d.day)).getUTCMonth()===d.month-1,400,"Choose a valid calendar date.");
 await db.occasion.upsert({where:{personId_kind:{personId:actor.personId,kind:d.kind}},create:{personId:actor.personId,...d},update:d});return {};
 }
 case "mute":{
 const d=schemas[action].parse(data);await personAccess(actor,d.personId);const p=await db.notificationPreference.findUnique({where:{personId:actor.personId}}),ids=new Set(p?.mutedPersonIds??[]);
 if(d.muted)ids.add(d.personId);else ids.delete(d.personId);
 await db.notificationPreference.upsert({where:{personId:actor.personId},create:{personId:actor.personId,mutedPersonIds:[...ids]},update:{mutedPersonIds:[...ids]}});return {};
 }
 case "guardian":{
 const d=schemas[action].parse(data),c=await db.guardianConsent.findUnique({where:{guardianAccountId_childPersonId:{guardianAccountId:actor.accountId,childPersonId:d.childId}}});requireThat(c,404);
 await db.guardianConsent.update({where:{id:c.id},data:{explore:d.explore,greetings:d.greetings,voice:d.voice}});await audit(actor,action,c.childPersonId);return {};
 }
 case "approve-child-clip":{
 const d=schemas[action].parse(data);requireThat(await db.guardianConsent.findUnique({where:{guardianAccountId_childPersonId:{guardianAccountId:actor.accountId,childPersonId:d.childId}}}));
 const clip=await db.voiceClip.findUnique({where:{id:d.clipId},include:{owner:true,consent:{include:{audience:true}}}});requireThat(clip&&await canPlayClip(actor,clip)&&clip.consent.audience.some(a=>a.personId===d.childId),404,"Only an authorized guardian who can review the original clip may approve it.");
 await db.guardianVoiceApproval.upsert({where:{guardianAccountId_childPersonId_clipId:{guardianAccountId:actor.accountId,childPersonId:d.childId,clipId:d.clipId}},create:{guardianAccountId:actor.accountId,childPersonId:d.childId,clipId:d.clipId,approved:d.approved},update:{approved:d.approved}});await audit(actor,action,d.clipId);return {};
 }
 case "child-mode":{
 const d=schemas[action].parse(data),c=await db.guardianConsent.findUnique({where:{guardianAccountId_childPersonId:{guardianAccountId:actor.accountId,childPersonId:d.childId}}});requireThat(c?.explore);
 await db.session.update({where:{id:actor.sessionId},data:{activeChildId:d.childId}});return {};
 }
 case "steward":{
 const d=schemas[action].parse(data);
 for(const pid of [d.stewardPersonId,d.backupPersonId].filter(Boolean)as string[]){const p=await personAccess(actor,pid);requireThat(!p.isMinor&&!p.deceased&&p.id!==actor.personId&&p.accountId,400,"Choose another living adult account.");}
 requireThat(d.stewardPersonId!==d.backupPersonId,400);
 await db.legacySteward.upsert({where:{ownerPersonId:actor.personId},create:{ownerPersonId:actor.personId,...d},update:d});await audit(actor,action,actor.personId);return {};
 }
 case "memorial-request":{
 const d=schemas[action].parse(data);await personAccess(actor,d.ownerPersonId);const s=await db.legacySteward.findUnique({where:{ownerPersonId:d.ownerPersonId}});
 requireThat(s&&[s.stewardPersonId,s.backupPersonId].includes(actor.personId));
 requireThat(await db.voiceConsent.findFirst({where:{ownerPersonId:d.ownerPersonId,allowMemorial:true,withdrawnAt:null}}),403,"No advance memorial consent exists.");
 requireThat(!await db.memorialStatusReview.findFirst({where:{ownerPersonId:d.ownerPersonId,status:"PENDING"}}),409,"A human review is already pending.");
 const r=await db.memorialStatusReview.create({data:{ownerPersonId:d.ownerPersonId,requestedBy:actor.accountId,evidenceCode:d.evidenceCode}});await audit(actor,action,r.id);return {};
 }
 case "memorial-review":{
 requireThat(actor.moderator);const d=schemas[action].parse(data),r=await db.memorialStatusReview.findUnique({where:{id:d.reviewId}});requireThat(r?.status==="PENDING",409);
 requireThat(r.requestedBy!==actor.accountId,403,"An independent human reviewer must decide.");
 await db.$transaction([db.memorialStatusReview.update({where:{id:r.id},data:{status:d.approve?"APPROVED":"DECLINED",reviewedBy:actor.accountId}}),...(d.approve?[db.person.update({where:{id:r.ownerPersonId},data:{deceased:true}})]:[])]);
 await audit(actor,action,r.id);return {};
 }
 case "memorial-freeze":{
 const d=schemas[action].parse(data),s=await db.legacySteward.findUnique({where:{ownerPersonId:d.ownerPersonId}});
 requireThat(actor.moderator||(s&&[s.stewardPersonId,s.backupPersonId].includes(actor.personId)));
 await db.memorialStatusReview.updateMany({where:{ownerPersonId:d.ownerPersonId},data:{frozen:true}});
 await db.voiceClip.updateMany({where:{ownerPersonId:d.ownerPersonId,status:"ACTIVE"},data:{status:"FROZEN"}});await audit(actor,action,d.ownerPersonId);return {};
 }
 case "report":{
 const d=schemas[action].parse(data);
 requireThat((await allowedPeople(actor)).some(p=>p.id===d.subjectId)||await db.treeLinkRequest.findFirst({where:{id:d.subjectId,OR:[{fromPersonId:actor.personId},{toPersonId:actor.personId}]}}),404);
 await db.moderationReport.create({data:{reporterAccountId:actor.accountId,category:d.category,subjectId:d.subjectId}});await audit(actor,action,d.subjectId);return {};
 }
 case "resolve-report":{
 requireThat(actor.moderator);const d=schemas[action].parse(data);await db.moderationReport.update({where:{id:d.reportId},data:{status:"RESOLVED"}});await audit(actor,action,d.reportId);return {};
 }
 case "template-toggle":{
 requireThat(actor.moderator);const d=schemas[action].parse(data);await db.greetingTemplate.update({where:{id:d.templateId},data:{enabled:d.enabled}});await audit(actor,action,d.templateId);return {};
 }
 case "verify-adult":{
 requireThat(actor.moderator);const d=schemas[action].parse(data),a=await db.account.findUnique({where:{email:d.accountEmail.toLowerCase()}});requireThat(a?.emailVerified,404,"No verified account matches.");
 await db.account.update({where:{id:a.id},data:{adultVerified:true}});await audit(actor,action,a.id);return {};
 }
 case "erasure":{
 const r=await db.erasureRequest.create({data:{accountId:actor.accountId}});await audit(actor,action,r.id);return {requestId:r.id};
 }
 case "revoke-sessions":{
 await db.session.deleteMany({where:{userId:actor.accountId}});await audit(actor,action,actor.accountId);return {};
 }
 case "dissolve-tree":{
 const d=schemas[action].parse(data);await treeAccess(actor,d.treeId,true);
 requireThat(await db.treeMembership.count({where:{treeId:d.treeId}})===1,409,"Other members remain. Resolve stewardship before dissolution.");
 requireThat(await db.treeLinkRequest.count({where:{OR:[{fromTreeId:d.treeId},{toTreeId:d.treeId}],status:{in:["PENDING","APPROVED","DISPUTED"]}}})===0,409,"Unlink connected groves first.");
 await db.familyTree.delete({where:{id:d.treeId}});await audit(actor,action,d.treeId);return {};
 }
 }
 return {};
}
