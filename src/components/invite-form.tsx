"use client";
import {useRouter} from "next/navigation";
import Link from "next/link";
import {useState} from "react";
export function InviteForm({token}:{token:string}){const router=useRouter();const[error,setError]=useState(""),[busy,setBusy]=useState(false);
 async function accept(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setError("");try{const r=await fetch("/api/grove/accept-invite",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token,consent:true})});const data=await r.json();if(!r.ok)throw new Error(data.error);window.history.replaceState({},"","/invite");router.replace("/grove");router.refresh();}catch(e){setError((e as Error).message);setBusy(false);}}
 return <><Link className="btn secondary" href={"/login?returnTo="+encodeURIComponent("/invite?token="+token)}>Sign in with my invited email</Link><form onSubmit={accept}><label className="check"><input type="checkbox" required/>I agree to join this private grove and share my family profile with its members.</label><button className="btn primary" disabled={busy}>Accept private invitation</button></form>{error&&<p className="error" role="alert">{error}</p>}</>;
}
