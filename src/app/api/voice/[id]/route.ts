import {db} from "@/lib/db";
import {actorFrom,adult,audit} from "@/lib/policy";
import {sameOrigin,failure,requireThat} from "@/lib/http";
import {canPlayClip} from "@/lib/voice-policy";
import {readAudio,removeAudio} from "@/lib/storage";
import {validateRuntime} from "@/lib/env";
export const dynamic="force-dynamic";
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){
 try{validateRuntime();const actor=await actorFrom(request.headers),{id}=await params;
 const clip=await db.voiceClip.findUnique({where:{id},include:{owner:true,media:true,consent:{include:{audience:true}}}});
 requireThat(clip&&await canPlayClip(actor,clip),404,"This recording is unavailable.");
 const bytes=await readAudio(clip.media.storageKey);
 await db.voicePlaybackAudit.create({data:{clipId:id,viewerPersonId:actor.personId}});
 return new Response(new Uint8Array(bytes),{headers:{"Content-Type":clip.media.mime,"Content-Length":String(bytes.length),"Cache-Control":"private, no-store","Content-Disposition":"inline","X-Robots-Tag":"noindex, nofollow","Cross-Origin-Resource-Policy":"same-origin"}});
 }catch(e){return failure(e);}
}
export async function DELETE(request:Request,{params}:{params:Promise<{id:string}>}){
 try{validateRuntime();sameOrigin(request);const actor=await actorFrom(request.headers);adult(actor);const {id}=await params;
 const c=await db.voiceClip.findUnique({where:{id},include:{owner:true,media:true}});requireThat(c,404);
 const steward=await db.legacySteward.findUnique({where:{ownerPersonId:c.ownerPersonId}});
 requireThat((c.ownerPersonId===actor.personId&&!c.owner.deceased)||(c.owner.deceased&&(actor.moderator||[steward?.stewardPersonId,steward?.backupPersonId].includes(actor.personId))));
 await db.$transaction([db.voiceClip.update({where:{id},data:{status:"DELETED"}}),db.voiceConsent.update({where:{id:c.consentRecordId},data:{withdrawnAt:new Date()}})]);
 await removeAudio(c.media.storageKey);await audit(actor,"voice-deleted",id);return Response.json({deleted:true});
 }catch(e){return failure(e);}
}
