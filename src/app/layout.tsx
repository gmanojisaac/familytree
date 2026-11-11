import type {Metadata} from "next";
import "./globals.css";
export const metadata:Metadata={title:{default:"Family Grove · A little closer, across generations",template:"%s · Family Grove"},description:"A private place for your family to grow, celebrate, and remember.",icons:{icon:"/assets/svg/app-favicon.svg"}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en" data-scroll-behavior="smooth"><body><a className="skip-link" href="#main">Skip to content</a>{children}</body></html>;}
