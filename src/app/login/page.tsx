import Link from "next/link";
import {isDemo} from "@/lib/env";
import {LoginForm} from "@/components/login-form";
export const dynamic="force-dynamic";
export default function Login(){return <main id="main" className="auth-page"><Link href="/" className="brand"><img src="/assets/svg/app-favicon.svg" alt="" width="40" height="40"/>familygrove</Link><section className="auth-card"><div><span className="eyebrow">YOUR PRIVATE CORNER OF THE WORLD</span><h1>Welcome to<br/><em>your grove.</em></h1><p>A one-time email link brings you home. Your family details stay inside your circle.</p><LoginForm demo={isDemo()} emailAvailable={!!process.env.SMTP_HOST && !!process.env.SMTP_FROM}/></div><img src="/assets/png/empty-sapling.png" alt="A sapling waiting to grow with your family"/></section></main>;}
