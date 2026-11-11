import "dotenv/config";
import {randomBytes} from "node:crypto";
import {get} from "@vercel/blob";
import {storeAudio,readAudio,removeAudio} from "../src/lib/storage";
process.env.MEDIA_STORAGE="blob";
process.env.MEDIA_ENCRYPTION_KEY=randomBytes(32).toString("hex");
let key:string|undefined;
try{
 const bytes=Buffer.from("Family Grove non-personal encrypted storage verification");
 key=await storeAudio(bytes);
 const restored=await readAudio(key);
 if(!restored.equals(bytes))throw new Error("Private storage did not preserve exact bytes.");
 const result=await get("voice/"+key+".bin",{access:"private",useCache:false});
 if(!result||result.statusCode!==200)throw new Error("Private object could not be retrieved.");
 const anonymous=await fetch(result.blob.url,{redirect:"manual"});
 if(anonymous.status===200)throw new Error("The object was publicly readable.");
 await removeAudio(key);key=undefined;
 console.log("PASS: encrypted private Blob write/read/delete; unauthenticated object access denied.");
}finally{if(key)await removeAudio(key);}
