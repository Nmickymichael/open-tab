import type {Metadata} from "next";
import {SavedItems} from "@/components/saved-items";
export const metadata:Metadata={title:"Saved Items | OPEN TAB",description:"Stories and videos saved on this device."};
export default function SavedPage(){return <main className="wrap min-h-[60vh] py-10 md:py-14"><div className="eyebrow">Your library</div><h1 className="headline mt-3 text-5xl md:text-7xl">SAVED ITEMS<span className="accent">.</span></h1><p className="muted mt-4 max-w-xl text-sm">Your personal reading and watching list, stored locally in this browser.</p><div className="mt-8"><SavedItems/></div></main>}
