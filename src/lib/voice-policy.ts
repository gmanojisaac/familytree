import {db} from "./db";
import {type Actor,allowedPeople,childVoiceAllowed} from "./policy";
type Clip={id:string;status:string;ownerPersonId:string;owner:{deceased:boolean};consent:{withdrawnAt:Date|null;allowMemorial:boolean;audience:{personId:string;period:string}[]}};
export async function canPlayClip(actor:Actor,clip:Clip){
 if(clip.status!=="ACTIVE"||clip.consent.withdrawnAt)return false;
 if(!(await allowedPeople(actor)).some(p=>p.id===clip.ownerPersonId))return false;
 const prefs=await db.notificationPreference.findUnique({where:{personId:actor.personId}});
 if(prefs?.hideLegacy||prefs?.mutedPersonIds.includes(clip.ownerPersonId)||!(await childVoiceAllowed(actor)))return false;
 if(actor.isChild&&!await db.guardianVoiceApproval.findFirst({where:{guardianAccountId:actor.accountId,childPersonId:actor.personId,clipId:clip.id,approved:true}}))return false;
 if(clip.owner.deceased){
  if(!clip.consent.allowMemorial)return false;
  const review=await db.memorialStatusReview.findFirst({where:{ownerPersonId:clip.ownerPersonId,status:"APPROVED",frozen:false}});
  if(!review||await db.memorialStatusReview.findFirst({where:{ownerPersonId:clip.ownerPersonId,frozen:true}}))return false;
  return clip.consent.audience.some(a=>a.personId===actor.personId&&a.period==="AFTER");
 }
 if(actor.personId===clip.ownerPersonId&&!actor.isChild)return true;
 return clip.consent.audience.some(a=>a.personId===actor.personId&&a.period==="NOW");
}
