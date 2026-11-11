"use client";
import {createContext,useContext} from "react";
import type {GroveState} from "@/lib/state";
import type {Action} from "@/lib/schemas";
export type GroveContextValue={state:GroveState;run:(action:Action,data:unknown)=>Promise<Record<string,unknown>|null>;busy:boolean;navigate:(section:string)=>void;selectPerson:(id:string)=>void};
export const GroveContext=createContext<GroveContextValue|null>(null);
export function useGrove(){const value=useContext(GroveContext);if(!value)throw new Error("Missing grove context");return value;}
export function Avatar({person,small=false}:{person:{displayName:string;isMinor:boolean;color?:string};small?:boolean}){return <span className={small?"avatar small":"avatar"} style={{background:person.color??"#e6f1e7"}}><img src={person.isMinor?"/assets/svg/avatar-child.svg":"/assets/svg/avatar-adult.svg"} alt=""/><span className="avatar-initial">{person.displayName.charAt(0)}</span></span>;}
export function Icon({name}:{name:string}){return <img className="asset-icon" src={"/assets/svg/"+name+".svg"} alt="" aria-hidden="true"/>;}
export function formData(e:React.FormEvent<HTMLFormElement>){e.preventDefault();return new FormData(e.currentTarget);}
export function friendly(value:string){return value.replaceAll("_"," ").toLowerCase();}
