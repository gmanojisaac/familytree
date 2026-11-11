// Browser-side PCM encoding gives the server a reliable, independently verifiable duration.
export function encodeWav(samples:Float32Array,sampleRate:number){
 const buffer=new ArrayBuffer(44+samples.length*2),v=new DataView(buffer);
 function text(offset:number,s:string){for(let i=0;i<s.length;i++)v.setUint8(offset+i,s.charCodeAt(i));}
 text(0,"RIFF");v.setUint32(4,36+samples.length*2,true);text(8,"WAVE");text(12,"fmt ");v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,sampleRate,true);v.setUint32(28,sampleRate*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);text(36,"data");v.setUint32(40,samples.length*2,true);
 for(let i=0;i<samples.length;i++){const s=Math.max(-1,Math.min(1,samples[i]));v.setInt16(44+i*2,s<0?s*32768:s*32767,true);}return buffer;
}
