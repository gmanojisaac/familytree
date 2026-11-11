import {describe,it,expect} from "vitest";
import {parentCycle,relationshipPath,graphLayout} from "@/lib/graph";
import {schemas} from "@/lib/schemas";
import {encodeWav} from "@/lib/wav";
import {validateAudio} from "@/lib/audio";
import {encryptAudio,decryptAudio} from "@/lib/storage";
import {isDemo,validateRuntime} from "@/lib/env";
import {vi} from "vitest";
describe("typed genealogy and trust boundaries",()=>{
 const edges=[{sourceId:"a",targetId:"b",kind:"PARENT_CHILD"},{sourceId:"b",targetId:"c",kind:"PARENT_CHILD"},{sourceId:"d",targetId:"b",kind:"PARENT_CHILD",subtype:"adoptive"},{sourceId:"a",targetId:"d",kind:"PARTNER"}];
 it("rejects ancestry cycles and self-links while preserving multiple parents",()=>{expect(parentCycle(edges,"c","a")).toBe(true);expect(parentCycle(edges,"a","a")).toBe(true);expect(parentCycle(edges,"d","c")).toBe(false);});
 it("traces a typed graph without inventing kinship",()=>{expect(relationshipPath(edges,"d","c")).toEqual(["d","b","c"]);expect(relationshipPath(edges,"a","hidden")).toEqual([]);expect(Object.keys(graphLayout([{id:"a",generation:0},{id:"b",generation:1}]))).toHaveLength(2);});
 it("rejects arbitrary text and unknown template payload fields",()=>{expect(()=>schemas.greet.parse({recipientId:"b",templateId:"birthday_01",occasionId:"o",text:"unreviewed"})).toThrow();expect(()=>schemas.reply.parse({greetingId:"g",templateId:"thank_you",emoji:"x"})).toThrow();});
 it("validates actual audio bytes and independently measured duration",async()=>{const wav=Buffer.from(encodeWav(new Float32Array(8000),8000));expect((await validateAudio(wav,"audio/wav")).duration).toBe(1);await expect(validateAudio(Buffer.from("<script>bad</script>"),"audio/wav")).rejects.toThrow();await expect(validateAudio(Buffer.from(encodeWav(new Float32Array(8000*91),8000)),"audio/wav")).rejects.toThrow();});
 it("encrypts private recordings with authenticated encryption",()=>{const raw=Buffer.from("private audio"),encrypted=encryptAudio(raw);expect(encrypted.includes(raw)).toBe(false);expect(decryptAudio(encrypted)).toEqual(raw);encrypted[20]^=1;expect(()=>decryptAudio(encrypted)).toThrow();});
 it("fails closed if demo mode is enabled in production",()=>{vi.stubEnv("NODE_ENV","production");expect(isDemo()).toBe(false);expect(()=>validateRuntime()).toThrow();vi.unstubAllEnvs();});
});
