import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
export const metadata: Metadata = { title: {default:"OPEN TAB. — Your Window to Everything Interesting",template:"%s | OPEN TAB."}, description:"International stories across sports, entertainment, creators, technology, business, lifestyle and more.", metadataBase:new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"), applicationName:"OPEN TAB", openGraph:{type:"website",siteName:"OPEN TAB",title:"OPEN TAB. — Your Window to Everything Interesting",description:"The stories, people and ideas shaping our world."}, twitter:{card:"summary_large_image",title:"OPEN TAB. — Your Window to Everything Interesting",description:"Your Window to Everything Interesting."}, robots:{index:true,follow:true} };
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><ServiceWorkerRegister/><SiteHeader/>{children}<SiteFooter/></body></html>}