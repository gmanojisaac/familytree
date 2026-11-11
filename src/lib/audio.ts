import {parseBuffer} from "music-metadata";
import {requireThat} from "./http";
export async function validateAudio(bytes:Buffer,claimedMime:string){
 requireThat(bytes.length>44&&bytes.length<=Math.min(Number(process.env.MAX_AUDIO_BYTES??3145728),3145728),413,"Audio must be under 3 MB.");
 const isWave=bytes.toString("ascii",0,4)==="RIFF"&&bytes.toString("ascii",8,12)==="WAVE";
 const isOgg=bytes.toString("ascii",0,4)==="OggS",isWebm=bytes.subarray(0,4).equals(Buffer.from([0x1a,0x45,0xdf,0xa3]));
 const isMp3=bytes.toString("ascii",0,3)==="ID3"||(bytes[0]===0xff&&(bytes[1]&0xe0)===0xe0);
 const mime=isWave?"audio/wav":isOgg?"audio/ogg":isWebm?"audio/webm":isMp3?"audio/mpeg":null;
 requireThat(mime&&["audio/wav","audio/x-wav","audio/ogg","audio/webm","audio/mpeg"].includes(claimedMime.split(";")[0]),400,"Upload a valid WAV, Ogg, WebM, or MP3 audio file.");
 let duration=0;
 try{duration=(await parseBuffer(bytes,{mimeType:mime,size:bytes.length},{duration:true})).format.duration??0;}catch{requireThat(false,400,"This audio file could not be decoded.");}
 requireThat(Number.isFinite(duration)&&duration>0&&duration<=Math.min(Number(process.env.MAX_AUDIO_SECONDS??90),90),400,"Audio needs a readable duration between 0 and 90 seconds. Try the WAV recorder.");
 return {mime,duration};
}
export async function scanAudio(bytes:Buffer){
 if(!process.env.AUDIO_SCAN_URL){requireThat(process.env.NODE_ENV!=="production",503,"Production uploads require a private malware-scanning service.");return;}
 requireThat(process.env.AUDIO_SCAN_URL.startsWith("https://"),503,"The scanning service must use HTTPS.");
 const result=await fetch(process.env.AUDIO_SCAN_URL,{method:"POST",headers:{"Content-Type":"application/octet-stream",Authorization:"Bearer "+process.env.AUDIO_SCAN_TOKEN},body:new Uint8Array(bytes),signal:AbortSignal.timeout(20000)});
 requireThat(result.ok&&(await result.json()).clean===true,400,"Audio did not pass the private upload scan.");
}
