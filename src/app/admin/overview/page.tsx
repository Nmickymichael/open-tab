"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity, ArrowDownRight, ArrowUpRight, Bell, BookOpen, CheckCircle2,
  ChevronDown, CircleHelp, Clapperboard, FileText, Globe2, LayoutDashboard,
  LogOut, Megaphone, MessageSquare, Plus, Search, Settings, ShieldCheck,
  Sparkles, TrendingUp, Users, Video, Zap
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Metric = { label: string; value: number; change: string; icon: typeof FileText };
type Article = { id: string; title: string; status: string; updated_at: string; author_id?: string };
type StaffProfile = { id: string; display_name: string | null; role: string };

const navGroups = [
  { label: "WORKSPACE", items: [{ label: "Overview", icon: LayoutDashboard, href: "/admin/overview" }, { label: "Stories", icon: FileText, href: "/admin" }, { label: "Video library", icon: Video, href: "/admin" }, { label: "Creators", icon: Users, href: "/admin" }] },
  { label: "AUDIENCE", items: [{ label: "Community", icon: MessageSquare, href: "/admin" }, { label: "Newsletter", icon: Megaphone, href: "/admin" }, { label: "Analytics", icon: TrendingUp, href: "/admin" }] },
  { label: "MANAGEMENT", items: [{ label: "Editorial desk", icon: BookOpen, href: "/admin/desk" }, { label: "Advertising", icon: Megaphone, href: "/admin/monetization" }, { label: "Settings & audit", icon: Settings, href: "/admin" }] }
];

function MetricCard({ metric }: { metric: Metric }) {
  const Icon = metric.icon;
  return <div className="rounded-2xl border border-white/[.07] bg-[#15171c] p-5 shadow-[0_12px_35px_rgba(0,0,0,.12)]">
    <div className="flex items-center justify-between"><span className="text-xs font-semibold tracking-wide text-slate-400">{metric.label}</span><span className="rounded-xl bg-white/[.06] p-2 text-[#f04438]"><Icon size={17}/></span></div>
    <div className="mt-5 flex items-end justify-between gap-2"><strong className="text-3xl font-semibold tracking-tight text-white">{metric.value.toLocaleString()}</strong><span className="mb-1 inline-flex items-center gap-1 text-[11px] text-emerald-400"><ArrowUpRight size={13}/>{metric.change}</span></div>
  </div>;
}

export default function AdminOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [role, setRole] = useState("");
  const [message, setMessage] = useState("");
  const [articles, setArticles] = useState<Article[]>([]);
  const [staff, setStaff] = useState<StaffProfile[]>([]);
  const [metrics, setMetrics] = useState({ stories: 0, published: 0, videos: 0, readers: 0, comments: 0, views: 0 });
  const [activeNav, setActiveNav] = useState("Overview");

  const loadDashboard = useCallback(async () => {
    if (!supabase) { setLoading(false); return; }
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) { setLoading(false); return; }
    setUserEmail(user.email || "");
    const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (profileError || profile?.role !== "admin") {
      setRole(profile?.role || "unprovisioned");
      setLoading(false);
      return;
    }
    setRole("admin");
    const [storyCount, publishedCount, videoCount, readerCount, commentCount, viewCount, recent, team] = await Promise.all([
      supabase.from("articles").select("id", { count: "exact", head: true }),
      supabase.from("articles").select("id", { count: "exact", head: true }).eq("status", "published"),
      supabase.from("videos").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "reader"),
      supabase.from("comments").select("id", { count: "exact", head: true }),
      supabase.from("article_views").select("id", { count: "exact", head: true }),
      supabase.from("articles").select("id,title,status,updated_at,author_id").order("updated_at", { ascending: false }).limit(6),
      supabase.from("profiles").select("id,display_name,role").in("role", ["admin", "editor", "author"]).order("display_name").limit(6)
    ]);
    setMetrics({ stories: storyCount.count || 0, published: publishedCount.count || 0, videos: videoCount.count || 0, readers: readerCount.count || 0, comments: commentCount.count || 0, views: viewCount.count || 0 });
    setArticles((recent.data || []) as Article[]);
    setStaff((team.data || []) as StaffProfile[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    void loadDashboard();
    const { data: listener } = supabase.auth.onAuthStateChange(() => { void loadDashboard(); });
    return () => listener.subscription.unsubscribe();
  }, [loadDashboard]);

  async function signIn() {
    if (!supabase) return;
    setMessage("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setMessage(error.message);
    else { setLoading(true); await loadDashboard(); }
  }

  async function signOut() {
    await supabase?.auth.signOut();
    setRole("");
    setUserEmail("");
  }

  if (loading) return <main className="grid min-h-screen place-items-center bg-[#0d0f13] text-sm text-slate-400">Loading OPEN TAB control room…</main>;
  if (!supabase) return <main className="min-h-screen bg-[#0d0f13] p-8 text-white"><h1 className="text-3xl font-bold">OPEN TAB Control Room</h1><p className="mt-3 text-slate-400">Supabase is not connected. Add the public project URL and anon key to your environment when you are ready.</p></main>;
  if (!userEmail) return <main className="grid min-h-screen place-items-center bg-[#0d0f13] px-5 text-white"><div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#15171c] p-8"><div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f04438]"><Globe2/></div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#f04438]">Mickoryn Media · Secure access</p><h1 className="mt-3 text-3xl font-bold">Global Admin Portal</h1><p className="mt-2 text-sm text-slate-400">Sign in with your provisioned OPEN TAB administrator account.</p><label className="mt-7 block text-xs text-slate-300">Email</label><input className="mt-2 w-full rounded-xl border border-white/10 bg-[#0d0f13] px-4 py-3 text-sm outline-none focus:border-[#f04438]" type="email" value={email} onChange={e=>setEmail(e.target.value)}/><label className="mt-4 block text-xs text-slate-300">Password</label><input className="mt-2 w-full rounded-xl border border-white/10 bg-[#0d0f13] px-4 py-3 text-sm outline-none focus:border-[#f04438]" type="password" value={password} onChange={e=>setPassword(e.target.value)}/><button onClick={signIn} className="mt-6 w-full rounded-xl bg-[#f04438] px-4 py-3 text-sm font-bold">Sign in securely</button>{message&&<p role="alert" className="mt-4 text-sm text-red-300">{message}</p>}</div></main>;
  if (role !== "admin") return <main className="grid min-h-screen place-items-center bg-[#0d0f13] px-5 text-white"><div className="max-w-md rounded-3xl border border-white/10 bg-[#15171c] p-8"><ShieldCheck className="text-[#f04438]" size={34}/><h1 className="mt-4 text-2xl font-bold">Administrator access required</h1><p className="mt-2 text-sm leading-6 text-slate-400">This control room is restricted to the OPEN TAB administrator role. Your current role is {role || "unknown"}.</p><button onClick={signOut} className="mt-6 rounded-xl border border-white/10 px-4 py-2 text-sm">Sign out</button></div></main>;

  const cards: Metric[] = [
    { label: "Total stories", value: metrics.stories, change: "All time", icon: FileText },
    { label: "Published stories", value: metrics.published, change: "Live", icon: CheckCircle2 },
    { label: "Video library", value: metrics.videos, change: "Managed", icon: Clapperboard },
    { label: "Reader accounts", value: metrics.readers, change: "Registered", icon: Users },
    { label: "Community comments", value: metrics.comments, change: "All time", icon: MessageSquare },
    { label: "Article views", value: metrics.views, change: "Recorded events", icon: Activity }
  ];

  return <main className="min-h-screen bg-[#0d0f13] text-slate-100">
    <div className="flex min-h-screen">
      <aside className="hidden w-[250px] shrink-0 border-r border-white/[.07] bg-[#111318] px-5 py-6 lg:flex lg:flex-col">
        <Link href="/" className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f04438] text-lg font-black">O</span><span className="text-lg font-black tracking-tight">OPEN TAB<span className="text-[#f04438]">.</span><small className="mt-1 block text-[9px] font-medium uppercase tracking-[.2em] text-slate-500">Control room</small></span></Link>
        <div className="mt-10 space-y-8">{navGroups.map(group=><div key={group.label}><p className="mb-3 px-3 text-[9px] font-bold tracking-[.2em] text-slate-600">{group.label}</p><nav className="space-y-1">{group.items.map(item=>{const Icon=item.icon;return <Link key={item.label} href={item.href} onClick={()=>setActiveNav(item.label)} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-[13px] transition ${activeNav===item.label?"bg-[#f04438]/15 font-semibold text-white":"text-slate-400 hover:bg-white/[.04] hover:text-white"}`}><Icon size={17}/>{item.label}</Link>})}</nav></div>)}</div>
        <div className="mt-auto rounded-2xl border border-[#f04438]/20 bg-[#f04438]/[.07] p-4"><div className="flex items-center gap-2 text-xs font-semibold text-white"><Sparkles size={15} className="text-[#f04438]"/> OPEN TAB newsroom</div><p className="mt-2 text-[11px] leading-5 text-slate-400">Your global media operation, in one place.</p><Link href="/admin/desk" className="mt-3 inline-flex text-[11px] font-bold text-[#ff766d]">Open editorial desk ↗</Link></div>
      </aside>
      <section className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-4 border-b border-white/[.07] bg-[#0d0f13]/90 px-5 py-4 backdrop-blur-xl md:px-9">
          <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#f04438]">Mickoryn Media / OPEN TAB</p><h1 className="mt-1 text-xl font-semibold tracking-tight">Global overview</h1></div>
          <div className="flex items-center gap-2 md:gap-4"><div className="hidden items-center gap-2 rounded-xl border border-white/[.08] bg-white/[.03] px-3 py-2 text-xs text-slate-500 sm:flex"><Search size={14}/> Search workspace <kbd className="ml-5 rounded bg-white/10 px-1.5 py-0.5 text-[9px]">⌘ K</kbd></div><span className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[.08] px-3 py-2 text-[10px] font-semibold text-emerald-400"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400"/> System online</span><button onClick={signOut} title="Sign out" className="rounded-xl border border-white/10 p-2 text-slate-400 hover:text-white"><LogOut size={17}/></button></div>
        </header>
        <div className="mx-auto max-w-[1500px] px-5 py-8 md:px-9">
          <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs text-slate-500">Wednesday · OPEN TAB operations</p><h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Good to see you back.</h2><p className="mt-2 text-sm text-slate-400">Here is what is happening across your publication today.</p></div><Link href="/admin" className="inline-flex items-center gap-2 rounded-xl bg-[#f04438] px-4 py-3 text-xs font-bold text-white hover:bg-[#d9362c]"><Plus size={15}/> Create a story</Link></div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{cards.map(card=><MetricCard key={card.label} metric={card}/>)}</div>
          <div className="mt-7 grid gap-5 xl:grid-cols-[1.55fr_1fr]">
            <section className="rounded-2xl border border-white/[.07] bg-[#15171c] p-5 md:p-6"><div className="flex items-center justify-between"><div><h3 className="font-semibold text-white">Editorial activity</h3><p className="mt-1 text-xs text-slate-500">Your latest content updates</p></div><Link href="/admin" className="text-xs font-semibold text-[#ff766d]">Manage stories ↗</Link></div><div className="mt-6 overflow-x-auto"><table className="w-full min-w-[480px] text-left"><thead><tr className="border-b border-white/[.07] text-[10px] uppercase tracking-wider text-slate-500"><th className="pb-3 font-medium">Story</th><th className="pb-3 font-medium">Status</th><th className="pb-3 font-medium">Last updated</th></tr></thead><tbody>{articles.map(article=><tr key={article.id} className="border-b border-white/[.05] last:border-0"><td className="max-w-[270px] py-4 pr-4"><p className="truncate text-sm font-medium text-slate-200">{article.title}</p><p className="mt-1 text-[10px] text-slate-600">Editorial content</p></td><td className="py-4"><span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${article.status==="published"?"bg-emerald-500/10 text-emerald-400":"bg-amber-500/10 text-amber-300"}`}>{article.status}</span></td><td className="py-4 text-xs text-slate-500">{new Date(article.updated_at).toLocaleDateString()}</td></tr>)}{!articles.length&&<tr><td colSpan={3} className="py-8 text-center text-sm text-slate-500">No stories yet. Create your first article from the editorial desk.</td></tr>}</tbody></table></div></section>
            <section className="rounded-2xl border border-white/[.07] bg-[#15171c] p-5 md:p-6"><div className="flex items-center justify-between"><div><h3 className="font-semibold">Editorial team</h3><p className="mt-1 text-xs text-slate-500">Provisioned newsroom accounts</p></div><Users size={18} className="text-[#f04438]"/></div><div className="mt-5 space-y-4">{staff.map(person=><div key={person.id} className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-full bg-white/[.07] text-xs font-bold text-[#ff766d]">{(person.display_name||"OT").slice(0,2).toUpperCase()}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{person.display_name||"Editorial team member"}</p><p className="mt-0.5 text-[10px] capitalize text-slate-500">{person.role}</p></div><span className="h-2 w-2 rounded-full bg-emerald-400"/></div>)}{!staff.length&&<p className="text-sm text-slate-500">No additional staff accounts found.</p>}</div><Link href="/admin/desk" className="mt-6 inline-flex items-center gap-2 text-xs font-semibold text-[#ff766d]">Manage editorial workflow <ArrowDownRight size={14}/></Link></section>
          </div>
          <div className="mt-5 grid gap-5 md:grid-cols-3">
            <Link href="/admin" className="group rounded-2xl border border-white/[.07] bg-[#15171c] p-5 hover:border-[#f04438]/40"><div className="flex items-center justify-between"><FileText className="text-[#f04438]"/><Zap size={16} className="text-slate-600 group-hover:text-[#f04438]"/></div><h3 className="mt-4 font-semibold">Publishing studio</h3><p className="mt-2 text-xs leading-5 text-slate-500">Draft, edit, schedule and publish stories across OPEN TAB.</p></Link>
            <Link href="/admin/desk" className="group rounded-2xl border border-white/[.07] bg-[#15171c] p-5 hover:border-[#f04438]/40"><div className="flex items-center justify-between"><BookOpen className="text-[#f04438]"/><Zap size={16} className="text-slate-600 group-hover:text-[#f04438]"/></div><h3 className="mt-4 font-semibold">Newsroom workflow</h3><p className="mt-2 text-xs leading-5 text-slate-500">Assignments, deadlines, sources, corrections and story history.</p></Link>
            <Link href="/videos" className="group rounded-2xl border border-white/[.07] bg-[#15171c] p-5 hover:border-[#f04438]/40"><div className="flex items-center justify-between"><Clapperboard className="text-[#f04438]"/><Zap size={16} className="text-slate-600 group-hover:text-[#f04438]"/></div><h3 className="mt-4 font-semibold">OPEN TAB TV</h3><p className="mt-2 text-xs leading-5 text-slate-500">Explore the public video and podcast experience.</p></Link>
          </div>
          <footer className="mt-10 flex flex-wrap justify-between gap-3 border-t border-white/[.07] py-5 text-[10px] text-slate-600"><span>OPEN TAB · A Mickoryn Media publication</span><span className="flex items-center gap-2"><ShieldCheck size={13}/> Administrator session · Role-based access</span></footer>
        </div>
      </section>
    </div>
  </main>;
}
