import {actorFrom} from "@/lib/policy";
import {getState,mutate,validAction,exportOwn} from "@/lib/service";
import {failure,jsonBody,sameOrigin,requireThat} from "@/lib/http";
import {validateRuntime} from "@/lib/env";
export const dynamic="force-dynamic";
export async function GET(request:Request,{params}:{params:Promise<{path:string[]}>}){
 try{validateRuntime();const actor=await actorFrom(request.headers),{path}=await params;
 if(path[0]==="state")return Response.json(await getState(actor,new URL(request.url).searchParams.get("tree")??undefined));
 if(path[0]==="export")return Response.json(await exportOwn(actor),{headers:{"Content-Disposition":'attachment; filename="my-family-grove-data.json"'}});
 return Response.json({error:"Not found."},{status:404});
 }catch(e){return failure(e);}
}
export async function POST(request:Request,{params}:{params:Promise<{path:string[]}>}){
 try{validateRuntime();sameOrigin(request);const actor=await actorFrom(request.headers),{path}=await params;requireThat(path.length===1&&validAction(path[0]),404,"Not found.");
 if(!validAction(path[0]))return Response.json({error:"Not found."},{status:404});
 return Response.json(await mutate(actor,path[0],await jsonBody(request)));}catch(e){return failure(e);}
}
