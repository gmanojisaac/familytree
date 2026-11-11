import {it,expect,vi,afterEach} from "vitest";
const objects=vi.hoisted(()=>new Map<string,Uint8Array>());
vi.mock("@vercel/blob",()=>({
 put:vi.fn(async(path:string,bytes:Uint8Array)=>{objects.set(path,bytes);return {pathname:path};}),
 get:vi.fn(async(path:string)=>{const bytes=objects.get(path);return bytes?{statusCode:200,stream:new ReadableStream({start(c){c.enqueue(bytes);c.close();}})}:null;}),
 del:vi.fn(async(path:string)=>{objects.delete(path);})
}));
import {put,get,del} from "@vercel/blob";
import {storeAudio,readAudio,removeAudio} from "@/lib/storage";
afterEach(()=>{vi.unstubAllEnvs();objects.clear();});
it("encrypts Blob objects, reads only through private uncached SDK access, and deletes them",async()=>{
 vi.stubEnv("MEDIA_STORAGE","blob");
 const original=Buffer.from("private original audio bytes"),key=await storeAudio(original);
 expect(key).toMatch(/^[a-f0-9]{48}$/);
 expect(Buffer.from(objects.get("voice/"+key+".bin")!).includes(original)).toBe(false);
 expect(put).toHaveBeenCalledWith("voice/"+key+".bin",expect.any(Uint8Array),expect.objectContaining({access:"private",allowOverwrite:false}));
 expect(await readAudio(key)).toEqual(original);
 expect(get).toHaveBeenCalledWith("voice/"+key+".bin",{access:"private",useCache:false});
 await removeAudio(key);expect(del).toHaveBeenCalledWith("voice/"+key+".bin");
 await expect(readAudio(key)).rejects.toThrow("unavailable");
});
