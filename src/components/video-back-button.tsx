"use client";
import {useRouter} from "next/navigation";
export function VideoBackButton(){const router=useRouter();return <button type="button" onClick={()=>{if(window.history.length>1)router.back();else router.push("/videos")}} className="pill mb-6 inline-flex items-center gap-2" aria-label="Go back to the previous page">← Back to videos</button>}
