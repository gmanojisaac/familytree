import {z} from "zod";
import {createHash} from "node:crypto";
import {db} from "@/lib/db";
import {actorFrom,adult,personAccess,audit,limit} from "@/lib/policy";
import {sameOrigin,failure,requireThat} from "@/lib/http";
import {storeAudio,removeAudio} from "@/lib/storage";
import {validateAudio,scanAudio} from "@/lib/audio";
import {validateRuntime} from "@/lib/env";
import prompts from "../../../../data/legacy_voice_prompts.json";
const consentSchema=z.object({promptKey:z.string(),transcript:z.string().max(5000),nowAudience:z.array(z.string()).max(30),afterAudience:z.array(z.string()).max(30),allowMemorial:z.boolean(),allowDownload:z.literal(false),accepted:z.literal(true)}).strict();
export async function POST(request:Request){
 let storageKey:string|undefined;
 try{
 validateRuntime();sameOrigin(request);const actor=await actorFrom(request.headers);adult(actor);await limit(actor,"voice-upload",10);
 const owner=await db.person.findUniqueOrThrow({where:{id:actor.personId}});requireThat(!owner.deceased&&!owner.isMinor);
 requireThat(Number(request.headers.get("content-length")??0)<=4194304,413,"Upload is too large.");
 // Bound the stream before multipart parsing to cover chunked uploads.
 const reader=request.body?.getReader();requireThat(reader,400);const chunks:Uint8Array[]=[];let size=0;
 while(true){const next=await reader.read();if(next.done)break;size+=next.value.length;requireThat(size<=4194304,413,"Upload is too large.");chunks.push(next.value);}
 const bounded=new Request(request.url,{method:"POST",headers:{"Content-Type":request.headers.get("content-type")??""},body:Buffer.concat(chunks)});
 const form=await bounded.formData();requireThat([...form.keys()].every(k=>["audio","consent"].includes(k)),400);
 const file=form.get("audio");requireThat(file instanceof File,400,"Choose an audio recording.");
 const consent=consentSchema.parse(JSON.parse(String(form.get("consent"))));
 requireThat(prompts.prompts.some(p=>p.key===consent.promptKey),400,"Choose a fixed recording prompt.");
 requireThat(!consent.afterAudience.length||consent.allowMemorial,400);
 if(consent.allowMemorial)requireThat(await db.legacySteward.findUnique({where:{ownerPersonId:actor.personId}}),400,"Choose an adult legacy steward before granting future use.");
 for(const period of ["nowAudience","afterAudience"] as const)for(const pid of consent[period]){
 const person=await personAccess(actor,pid);
 if(person.isMinor){const guardians=await db.guardianConsent.findMany({where:{childPersonId:pid},include:{guardian:{include:{person:true}}}});
 requireThat(guardians.some(g=>g.guardian.person&&(consent[period].includes(g.guardian.person.id)||(period==="nowAudience"&&g.guardian.person.id===actor.personId))),400,"Include a managing guardian in the same recording audience so they can review it.");
 }
 }
 const bytes=Buffer.from(await file.arrayBuffer()),validated=await validateAudio(bytes,file.type);await scanAudio(bytes);storageKey=await storeAudio(bytes);
 const clip=await db.$transaction(async tx=>{
 const c=await tx.voiceConsent.create({data:{ownerPersonId:actor.personId,allowMemorial:consent.allowMemorial,allowDownload:false,audience:{create:[...consent.nowAudience.map(personId=>({personId,period:"NOW"as const})),...consent.afterAudience.map(personId=>({personId,period:"AFTER"as const}))]}}});
 const m=await tx.mediaAsset.create({data:{storageKey:storageKey!,mime:validated.mime,bytes:bytes.length,sha256:createHash("sha256").update(bytes).digest("hex")}});
 return tx.voiceClip.create({data:{ownerPersonId:actor.personId,promptKey:consent.promptKey,transcript:consent.transcript,duration:validated.duration,consentRecordId:c.id,mediaId:m.id}});
 });await audit(actor,"voice-saved",clip.id);return Response.json({id:clip.id});
 }catch(e){if(storageKey)await removeAudio(storageKey).catch(()=>{});return failure(e);}
}
