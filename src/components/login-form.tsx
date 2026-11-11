"use client";
import {useRouter} from "next/navigation";
import {useState} from "react";
import {ArrowRight,ShieldCheck} from "lucide-react";
export function LoginForm({demo}:{demo:boolean}){
 const router=useRouter();
 function destination(){const v=new URL(window.location.href).searchParams.get("returnTo");return v?.startsWith("/invite’token=")?v:"/grove";}
 const[error,setError]=useState(""),[sent,setSent]=useState(false),[busy,setBusy]=useState(false);
 async function enter(persona:string){setBusy(true);setError("");try{const r=await fetch("/api/demo",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({persona})});if(!r.ok)throw new Error((await r.json()).error??"Unable to sign in.");router.push(destination());router.refresh();}catch(e){setError((e as Error).message);setBusy(false);}}
 async function login(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setError("");const email=new FormData(e.currentTarget).get("email");
 try{const r=await fetch("/api/auth/sign-in/magic-link",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,callbackURL:destination(),name:"Family member"})});if(!r.ok)throw new Error("Email sign-in is unavailable. Check the configured mail provider.");setSent(true);}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 return <><form onSubmit={login}><label>Email address<input name="email" type="email" autoComplete="email" placeholder="you@example.com" required/></label><button className="btn primary" disabled={busy}>Send a private sign-in link <ArrowRight size={16}/></button>{sent&&<p role="status">Check your email. Your one-use link expires in five minutes.</p>}</form>{error&&<p role="alert" className="error">{error}</p>}
 {demo&&<div className="demo-box"><span className="eyebrow">EXPLORE A FICTIONAL FAMILY</span><p>Local demo only. All people are fictional. Choose a role to try the real application.</p><div className="demo-buttons">{[["maya","Enter as Maya"],["arun","Enter as Arun"],["lila","Enter as Lila"],["moderator","Human reviewer"],["outsider","Outside account"]].map(([id,label])=><button key={id} disabled={busy} onClick={()=>enter(id)} className="btn secondary">{label}</button>)}</div></div>}<p className="hint"><ShieldCheck size={14}/> Email verification is required. New adults need human approval before editing.</p></>;
}
