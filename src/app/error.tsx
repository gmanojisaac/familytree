"use client";
export default function ErrorPage({reset}:{reset:()=>void}){return <main id="main" className="center-state"><h1>A little pause in the grove.</h1><p>We couldn’t load this page. Check your connection and try again.</p><button className="btn primary" onClick={reset}>Try again</button><a href="/login">Return to sign in</a></main>;}
