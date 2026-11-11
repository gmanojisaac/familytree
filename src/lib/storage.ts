import {randomBytes,createCipheriv,createDecipheriv} from "node:crypto";
import {mkdir,writeFile,readFile,rm} from "node:fs/promises";
import path from "node:path";
import {S3Client,PutObjectCommand,GetObjectCommand,DeleteObjectCommand} from "@aws-sdk/client-s3";
import {put,get,del} from "@vercel/blob";
function key(){const key=Buffer.from(process.env.MEDIA_ENCRYPTION_KEY??"","hex");if(key.length!==32)throw new Error("Media encryption key is missing.");return key;}
export function encryptAudio(data:Buffer){const iv=randomBytes(12),cipher=createCipheriv("aes-256-gcm",key(),iv);return Buffer.concat([iv,cipher.update(data),cipher.final(),cipher.getAuthTag()]);}
export function decryptAudio(data:Buffer){const decipher=createDecipheriv("aes-256-gcm",key(),data.subarray(0,12));decipher.setAuthTag(data.subarray(-16));return Buffer.concat([decipher.update(data.subarray(12,-16)),decipher.final()]);}
function client(){return new S3Client({region:process.env.S3_REGION??"us-east-1",endpoint:process.env.S3_ENDPOINT||undefined,forcePathStyle:!!process.env.S3_ENDPOINT,credentials:{accessKeyId:process.env.S3_ACCESS_KEY_ID!,secretAccessKey:process.env.S3_SECRET_ACCESS_KEY!}});}
function validKey(storageKey:string){if(!/^[a-f0-9]{48}$/.test(storageKey))throw new Error("Invalid storage key.");return storageKey;}
function blobPath(storageKey:string){return "voice/"+validKey(storageKey)+".bin";}
function filePath(storageKey:string){return path.join(/*turbopackIgnore: true*/ process.env.MEDIA_LOCAL_DIR??".private-media",validKey(storageKey));}
export async function storeAudio(data:Buffer){
 const storageKey=randomBytes(24).toString("hex"),encrypted=encryptAudio(data);
 if(process.env.MEDIA_STORAGE==="blob")await put(blobPath(storageKey),encrypted,{access:"private",addRandomSuffix:false,allowOverwrite:false,contentType:"application/octet-stream",cacheControlMaxAge:60});
 else if(process.env.MEDIA_STORAGE==="s3")await client().send(new PutObjectCommand({Bucket:process.env.S3_BUCKET,Key:storageKey,Body:encrypted,ContentType:"application/octet-stream",CacheControl:"no-store"}));
 else{if(process.env.NODE_ENV==="production")throw new Error("Local storage cannot run in production.");const file=filePath(storageKey);await mkdir(path.dirname(file),{recursive:true});await writeFile(file,encrypted,{flag:"wx"});}
 return storageKey;
}
export async function readAudio(storageKey:string){
 if(process.env.MEDIA_STORAGE==="blob"){
  const result=await get(blobPath(storageKey),{access:"private",useCache:false});
  if(!result||result.statusCode!==200)throw new Error("Private recording is unavailable.");
  return decryptAudio(Buffer.from(await new Response(result.stream).arrayBuffer()));
 }
 if(process.env.MEDIA_STORAGE==="s3"){const result=await client().send(new GetObjectCommand({Bucket:process.env.S3_BUCKET,Key:validKey(storageKey)}));return decryptAudio(Buffer.from(await result.Body!.transformToByteArray()));}
 return decryptAudio(await readFile(/*turbopackIgnore: true*/ filePath(storageKey)));
}
export async function removeAudio(storageKey:string){
 if(process.env.MEDIA_STORAGE==="blob")await del(blobPath(storageKey));
 else if(process.env.MEDIA_STORAGE==="s3")await client().send(new DeleteObjectCommand({Bucket:process.env.S3_BUCKET,Key:validKey(storageKey)}));
 else await rm(filePath(storageKey),{force:true});
}
