import {headers} from "next/headers";
import {redirect} from "next/navigation";
import {actorFrom} from "@/lib/policy";
import {getState} from "@/lib/state";
import {GroveShell} from "@/components/grove-shell";
import {ApiError} from "@/lib/http";
import {validateRuntime} from "@/lib/env";
export const dynamic="force-dynamic";
export const metadata={title:"Your private grove",robots:{index:false,follow:false}};
export default async function Grove({params}:{params:Promise<{section?:string[]}>}){
 validateRuntime();let actor;
 try{actor=await actorFrom(await headers());}catch(e){if(e instanceof ApiError&&e.status===401)redirect("/login");throw e;}
 const state=await getState(actor),{section}=await params;
 return <GroveShell initial={state} initialSection={section?.[0]??"overview"}/>;
}
