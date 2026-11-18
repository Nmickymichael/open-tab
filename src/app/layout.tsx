import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
export const metadata: Metadata = { title: {default:"OPEN TAB. — Your Window to Everything Interesting",template:"%s | OPEN TAB."}, description:"International stories across sports, entertainment, creators, technology, business, lifestyle and more.", metadataBase:new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000") };
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><SiteHeader/>{children}<SiteFooter/></body></html>}