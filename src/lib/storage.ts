import {randomBytes,createCipheriv,createDecipheriv} from "node:crypto";
import {mkdir,writeFile,readFile,rm} from "node:fs/promises";
import path from "node:path";
import {S3Client,PutObjectCommand,GetObjectCommand,DeleteObjectCommand} from "@aws-sdk/client-s3";
function key(){const key=Buffer.from(process.env.MEDIA_ENCRYPTION_KEY??"","hex");if(key.length!==32)throw new Error("Media encryption key is missing.");return key;}
export function encryptAudio(data:Buffer){const iv=randomBytes(12),cipher=createCipheriv("aes-256-gcm",key(),iv);return Buffer.concat([iv,cipher.update(data),cipher.final(),cipher.getAuthTag()]);}
export function decryptAudio(data:Buffer){const decipher=createDecipheriv("aes-256-gcm",key(),data.subarray(0,12));decipher.setAuthTag(data.subarray(-16));return Buffer.concat([decipher.update(data.subarray(12,-16)),decipher.final()]);}
function client(){return new S3Client({region:process.env.S3_REGION??"us-east-1",endpoint:process.env.S3_ENDPOINT||undefined,forcePathStyle:!!process.env.S3_ENDPOINT,credentials:{accessKeyId:process.env.S3_ACCESS_KEY_ID!,secretAccessKey:process.env.S3_SECRET_ACCESS_KEY!}});}
function filePath(storageKey:string){if(!/^[a-f0-9]{48}$/.test(storageKey))throw new Error("Invalid storage key.");return path.join(/*turbopackIgnore: true*/ process.env.MEDIA_LOCAL_DIR??".private-media",storageKey);}
export async function storeAudio(data:Buffer){
 const storageKey=randomBytes(24).toString("hex"),encrypted=encryptAudio(data);
 if(process.env.MEDIA_STORAGE==="s3")await client().send(new PutObjectCommand({Bucket:process.env.S3_BUCKET,Key:storageKey,Body:encrypted,ContentType:"application/octet-stream",CacheControl:"no-store"}));
 else{if(process.env.NODE_ENV==="production")throw new Error("Local storage cannot run in production.");const file=filePath(storageKey);await mkdir(path.dirname(file),{recursive:true});await writeFile(file,encrypted,{flag:"wx"});}
 return storageKey;
}
export async function readAudio(storageKey:string){
 if(process.env.MEDIA_STORAGE==="s3"){const result=await client().send(new GetObjectCommand({Bucket:process.env.S3_BUCKET,Key:storageKey}));return decryptAudio(Buffer.from(await result.Body!.transformToByteArray()));}
 return decryptAudio(await readFile(/*turbopackIgnore: true*/ filePath(storageKey)));
}
export async function removeAudio(storageKey:string){if(process.env.MEDIA_STORAGE==="s3")await client().send(new DeleteObjectCommand({Bucket:process.env.S3_BUCKET,Key:storageKey}));else await rm(filePath(storageKey),{force:true});}
