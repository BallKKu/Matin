"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Role = "customer" | "shop" | "admin";
type Item = { title: string; note: string; icon: string; href?: string };

const roles: Record<Role, { name: string; subtitle: string; initials: string }> = {
  customer: { name: "ลูกค้า", subtitle: "ออกแบบลายผ้าและติดตามงานผลิตของคุณ", initials: "ล" },
  shop: { name: "ร้านค้า", subtitle: "จัดการคำขอผลิตและดูแลคำสั่งซื้อ", initials: "ร" },
  admin: { name: "ผู้ดูแลระบบ", subtitle: "จัดการข้อมูลและภาพรวมของแพลตฟอร์ม", initials: "ผ" },
};

const groups: Record<Role, { label: string; icon: string; items: Item[] }[]> = {
  customer: [
    { label: "เริ่มต้นใช้งาน", icon: "⌂", items: [
      { title: "ค้นหาลายผ้าไหมมัดหมี่", note: "ค้นหาและเลือกชมลายผ้าจากคอลเลกชัน", icon: "⌕", href: "/patterns" },
      { title: "ออกแบบลายผ้าด้วย AI", note: "สร้างลายใหม่จากไอเดียของคุณ", icon: "✳", href: "/design" },
      { title: "สมัครสมาชิก", note: "สร้างบัญชีเพื่อบันทึกผลงาน", icon: "＋", href: "/register" },
      { title: "เข้าสู่ระบบ", note: "เข้าสู่บัญชีของคุณ", icon: "↗", href: "/login" },
      { title: "ลืมรหัสผ่าน", note: "ขอความช่วยเหลือในการเข้าบัญชี", icon: "⌑", href: "/forgot-password" },
    ] },
    { label: "ออกแบบและจัดการลาย", icon: "✳", items: [
      { title: "รายละเอียดลายผ้า", note: "ดูสี รูปแบบ และข้อมูลของลาย", icon: "▧", href: "/patterns" },
      { title: "ออกแบบด้วย Prompt", note: "บรรยายลายที่ต้องการเป็นข้อความ", icon: "✎", href: "/design?mode=text#design-tools" },
      { title: "ออกแบบด้วยภาพต้นแบบ", note: "ใช้ภาพอ้างอิงเป็นแรงบันดาลใจ", icon: "▧", href: "/design?mode=upload#design-tools" },
      { title: "กำหนดสีสำหรับสร้างลาย", note: "เลือกชุดสีสำหรับผลงานใหม่", icon: "◉", href: "/design#design-tools" },
      { title: "แก้ไขและปรับแต่งลายผ้า", note: "ปรับรายละเอียดก่อนนำไปผลิต", icon: "⚙", href: "/design#design-tools" },
      { title: "ตัวอย่างบนผลิตภัณฑ์ 3 มิติ", note: "ทดลองดูภาพตัวอย่างผลิตภัณฑ์", icon: "◇" },
      { title: "บันทึกลายผ้า / แบบร่าง", note: "เก็บไอเดียไว้กลับมาทำต่อ", icon: "♡" },
      { title: "แบบร่างและผลงานของฉัน", note: "รวมลายที่บันทึกและออกแบบไว้", icon: "▤", href: "/my-designs" },
    ] },
    { label: "การผลิตและคำสั่งซื้อ", icon: "▣", items: [
      { title: "ส่งคำขอผลิต", note: "ส่งลายให้ร้านค้าประเมินการผลิต", icon: "➤" },
      { title: "คำสั่งซื้อของฉัน", note: "ดูรายละเอียดและสถานะคำสั่งซื้อ", icon: "▣" },
      { title: "ยืนยันราคาและรายละเอียด", note: "ตรวจสอบข้อเสนอจากร้านค้าก่อนยืนยัน", icon: "✓" },
    ] },
  ],
  shop: [
    { label: "งานของร้าน", icon: "▣", items: [
      { title: "คำขอผลิตจากลูกค้า", note: "ตรวจสอบคำขอที่รอประเมิน", icon: "✉" },
      { title: "รายละเอียดลายและผังทอ", note: "เปิดดูแบบและข้อมูลประกอบการผลิต", icon: "▦" },
      { title: "ตรวจสอบความเป็นไปได้", note: "ประเมินวัสดุ เทคนิค และกำลังการผลิต", icon: "⌕" },
      { title: "แจ้งผลการตรวจสอบ", note: "ส่งผลประเมินให้ลูกค้าทราบ", icon: "✓" },
      { title: "ขอแก้ไขรายละเอียดงาน", note: "แจ้งข้อมูลที่ต้องปรับเพิ่มเติม", icon: "✎" },
      { title: "กำหนดราคาและระยะเวลา", note: "จัดทำข้อเสนอสำหรับลูกค้า", icon: "฿" },
      { title: "ยืนยันคำสั่งผลิต", note: "เริ่มงานหลังยืนยันรายละเอียด", icon: "▸" },
      { title: "อัปเดตสถานะการผลิต", note: "แจ้งความคืบหน้าของงาน", icon: "↻" },
      { title: "คำสั่งซื้อและประวัติ", note: "ดูงานปัจจุบันและรายการที่ผ่านมา", icon: "▤" },
      { title: "Dashboard ร้านค้า", note: "สรุปภาพรวมงานและรายได้", icon: "▥" },
      { title: "เข้าสู่ระบบร้านค้า", note: "เข้าพื้นที่ทำงานของร้านค้า", icon: "↗", href: "/login" },
      { title: "ลืมรหัสผ่าน", note: "ขอความช่วยเหลือในการเข้าบัญชี", icon: "⌑", href: "/forgot-password" },
    ] },
  ],
  admin: [
    { label: "จัดการระบบ", icon: "⚙", items: [
      { title: "จัดการผู้ใช้งาน", note: "ดูแลบัญชีลูกค้าและสิทธิ์ใช้งาน", icon: "♙" },
      { title: "จัดการข้อมูลร้านค้า", note: "ดูแลร้านค้าและข้อมูลการติดต่อ", icon: "⌂" },
      { title: "จัดการผลิตภัณฑ์", note: "เพิ่มและแก้ไขรายการผลิตภัณฑ์", icon: "◇" },
      { title: "จัดการคำสั่งซื้อ", note: "ตรวจสอบและติดตามคำสั่งซื้อทั้งหมด", icon: "▣" },
      { title: "เนื้อหาและความรู้ลายผ้า", note: "เผยแพร่เรื่องราวและคลังความรู้", icon: "▤" },
      { title: "รายงานและสถิติ", note: "ดูภาพรวมการใช้งานและยอดคำสั่งซื้อ", icon: "▥" },
      { title: "เข้าสู่ระบบแอดมิน", note: "เข้าพื้นที่จัดการระบบ", icon: "↗", href: "/login" },
      { title: "ลืมรหัสผ่าน", note: "ขอความช่วยเหลือในการเข้าบัญชี", icon: "⌑", href: "/forgot-password" },
    ] },
  ],
};

const stats: Record<Role, { value: string; label: string; icon: string }[]> = {
  customer: [{ value: "08", label: "ลายที่บันทึก", icon: "♡" }, { value: "03", label: "แบบร่าง", icon: "✳" }, { value: "02", label: "คำสั่งซื้อ", icon: "▣" }],
  shop: [{ value: "12", label: "คำขอใหม่", icon: "✉" }, { value: "08", label: "กำลังผลิต", icon: "↻" }, { value: "฿24k", label: "ยอดเดือนนี้", icon: "฿" }],
  admin: [{ value: "248", label: "ผู้ใช้งาน", icon: "♙" }, { value: "18", label: "ร้านค้าพันธมิตร", icon: "⌂" }, { value: "36", label: "คำสั่งซื้อรอตรวจ", icon: "▣" }],
};

const demos = [
  { name: "ดอกคูนทอง", type: "ลายดอกไม้ · 6 สี", image: "/output/pattern_tile.png" },
  { name: "ผืนผ้าคราม", type: "ลายเรขาคณิต · 4 สี", image: "/output/pattern_master_2x2.png" },
  { name: "ลายประยุกต์อีสาน", type: "ลายประยุกต์ · 5 สี", image: "/output/pattern_tile_pixel.png" },
];

export default function Workspace({ role }: { role: Role }) {
  const [active, setActive] = useState("");
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState("");
  const [saved, setSaved] = useState<string[]>([]);
  const [mobileMenu, setMobileMenu] = useState(false);
  const info = roles[role];
  const allItems = groups[role].flatMap((group) => group.items);
  const visibleItems = useMemo(() => allItems.filter((item) => `${item.title} ${item.note}`.toLowerCase().includes(query.trim().toLowerCase())), [allItems, query]);
  const flash = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 2600); };
  const jump = (label: string) => { setActive(label); setMobileMenu(false); document.getElementById(label)?.scrollIntoView({ behavior: "smooth", block: "start" }); };

  return <div className="min-h-screen bg-[#f7f5f0] text-[#28241f]">
    <header className="sticky top-0 z-40 border-b border-[#eae5da] bg-[#fbfaf7]/95 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-4 sm:px-7">
        <Link href="/home" className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-2xl bg-[#492b1a] text-xl text-[#f4d995]">ม</span><span className="leading-tight"><b className="block text-[12px] tracking-[.2em] text-[#492b1a]">MUDMEE</b><small className="text-[9px] tracking-[.14em] text-stone-500">SILK DESIGN STUDIO</small></span></Link>
        <div className="hidden items-center gap-2 md:flex"><span className="rounded-full bg-[#f2ede3] px-3 py-1.5 text-xs font-medium text-[#765c41]">DEMO WORKSPACE</span><span className="ml-2 grid size-9 place-items-center rounded-full bg-[#e9ddc7] text-sm font-semibold text-[#543923]">{info.initials}</span><span className="text-sm">{info.name}</span></div>
        <button className="rounded-xl border border-stone-200 px-3 py-2 text-sm md:hidden" onClick={() => setMobileMenu((v) => !v)}>{mobileMenu ? "ปิดเมนู" : "☰ เมนู"}</button>
      </div>
      {mobileMenu && <div className="border-t border-stone-200 bg-white p-3 md:hidden">{groups[role].map((g) => <button key={g.label} onClick={() => jump(g.label)} className="block w-full rounded-xl px-4 py-3 text-left text-sm hover:bg-orange-50">{g.icon}　{g.label}</button>)}</div>}
    </header>
    <div className="mx-auto grid max-w-[1440px] md:grid-cols-[248px_1fr]">
      <aside className="hidden min-h-[calc(100vh-72px)] border-r border-[#eae5da] bg-[#fbfaf7] p-5 md:block">
        <p className="px-3 pb-3 pt-2 text-[10px] font-bold tracking-[.2em] text-stone-400">WORKSPACE MENU</p>
        <nav className="space-y-1">{groups[role].map((group) => <button key={group.label} onClick={() => jump(group.label)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${active === group.label ? "bg-[#4b2c1b] text-white" : "text-stone-600 hover:bg-orange-50 hover:text-[#4b2c1b]"}`}><span>{group.icon}</span>{group.label}</button>)}</nav>
        <div className="mt-9 rounded-2xl bg-[#f1ebdf] p-4"><p className="text-sm font-semibold text-[#4b2c1b]">เลือกมุมมอง</p><p className="mt-1 text-xs leading-5 text-stone-600">ทดลองเปิดหน้าสำหรับบทบาทอื่น</p><div className="mt-3 space-y-1">{(["customer", "shop", "admin"] as Role[]).filter((r) => r !== role).map((r) => <Link key={r} href={`/${r === "customer" ? "workspace" : r}`} className="flex items-center justify-between rounded-lg px-2 py-2 text-xs text-stone-700 hover:bg-white">{roles[r].name}<span>→</span></Link>)}</div></div>
        <Link href="/home" className="mt-4 flex items-center gap-2 px-3 py-3 text-sm text-stone-500 hover:text-orange-900">← กลับหน้าหลัก</Link>
      </aside>
      <main className="min-w-0 px-4 py-7 sm:px-7 lg:px-10 lg:py-9">
        <div className="mb-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div><p className="text-[10px] font-bold tracking-[.22em] text-[#9a6b35]">MUDMEE AI STUDIO / {info.name.toUpperCase()}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">สวัสดี, {role === "customer" ? "คุณมินตรา" : role === "shop" ? "กลุ่มทอผ้าบ้านดอน" : "ผู้ดูแลระบบ"} <span className="text-2xl">✦</span></h1><p className="mt-2 text-sm text-stone-500">{info.subtitle}</p></div><label className="relative block w-full lg:max-w-xs"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400">⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ค้นหาเมนูหรือรายการ..." className="w-full rounded-full border border-stone-200 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-orange-800 focus:ring-2 focus:ring-orange-100" /></label></div>
        <div className="grid gap-3 sm:grid-cols-3">{stats[role].map((stat) => <div key={stat.label} className="flex items-center gap-4 rounded-2xl border border-[#eee8dd] bg-white p-4 shadow-[0_8px_24px_-24px_rgba(41,30,20,.3)]"><span className="grid size-11 place-items-center rounded-xl bg-[#f5efe4] text-xl text-[#79532f]">{stat.icon}</span><div><p className="text-xl font-semibold">{stat.value}</p><p className="text-xs text-stone-500">{stat.label}</p></div><span className="ml-auto text-xs text-emerald-700">↗ <span className="text-stone-400">เดือนนี้</span></span></div>)}</div>
        {role === "customer" && <section className="mt-6 grid gap-4 lg:grid-cols-[1.35fr_.65fr]"><div className="relative min-h-[220px] overflow-hidden rounded-[26px] bg-[#3d281d] p-6 text-white sm:p-8"><div className="absolute inset-0 opacity-[.15]" style={{ backgroundImage: "repeating-linear-gradient(45deg,transparent,transparent 13px,#e6c777 14px,transparent 16px),repeating-linear-gradient(-45deg,transparent,transparent 13px,#e6c777 14px,transparent 16px)" }} /><div className="relative max-w-lg"><p className="text-[10px] font-bold tracking-[.22em] text-amber-200">YOUR CREATIVE SPACE</p><h2 className="mt-3 text-2xl font-semibold sm:text-3xl">ทุกลายผ้า เริ่มจากเรื่องราวของคุณ</h2><p className="mt-2 text-sm leading-6 text-stone-200">สร้างแรงบันดาลใจใหม่ให้ผ้าไหมมัดหมี่ แล้วนำแบบของคุณไปต่อยอดกับช่างทอ</p><Link href="/design" className="mt-5 inline-flex rounded-full bg-[#f0d595] px-5 py-2.5 text-sm font-semibold text-[#392517] hover:bg-amber-100">เริ่มออกแบบลาย <span className="ml-2">→</span></Link></div><span className="absolute -bottom-12 -right-2 text-[180px] leading-none text-white/[.06]">✿</span></div><div className="flex flex-col justify-between rounded-[26px] border border-[#eee8dd] bg-white p-6"><div><p className="text-xs font-bold tracking-[.15em] text-stone-400">งานล่าสุด</p><h3 className="mt-2 text-xl font-semibold">ผ้าคลุมไหล่ · ลายดอกคูน</h3><p className="mt-2 text-sm text-stone-500">กำลังตรวจสอบโดยร้านค้า</p></div><div className="mt-5"><div className="flex justify-between text-[10px] text-stone-400"><span>รับคำขอแล้ว</span><span>กำลังทอ</span><span>จัดส่ง</span></div><div className="mt-2 flex gap-1">{[1, 2, 3, 4].map((n) => <span key={n} className={`h-1.5 flex-1 rounded-full ${n < 3 ? "bg-[#8a623d]" : "bg-stone-100"}`} />)}</div></div><button onClick={() => jump("การผลิตและคำสั่งซื้อ")} className="mt-5 self-start text-sm font-medium text-[#78502e] hover:underline">ดูสถานะคำสั่งซื้อ →</button></div></section>}
        {role !== "customer" && <section className="mt-6 rounded-[26px] border border-[#eee8dd] bg-white p-5 sm:p-6"><div className="flex items-start justify-between"><div><p className="text-[10px] font-bold tracking-[.18em] text-stone-400">OVERVIEW</p><h2 className="mt-1 text-xl font-semibold">{role === "shop" ? "งานที่ต้องดำเนินการ" : "ภาพรวมแพลตฟอร์ม"}</h2></div><button onClick={() => flash("อัปเดตข้อมูลล่าสุดแล้ว")} className="rounded-full border border-stone-200 px-4 py-2 text-xs hover:bg-stone-50">↻ รีเฟรช</button></div><div className="mt-5 grid gap-3 sm:grid-cols-3">{(role === "shop" ? ["รอตรวจสอบ", "รอเสนอราคา", "กำลังผลิต"] : ["ผู้ใช้ใหม่เดือนนี้", "คำสั่งซื้อเดือนนี้", "ลายผ้าในระบบ"]).map((t, i) => <button key={t} onClick={() => jump(groups[role][0].label)} className="rounded-2xl bg-[#f8f6f1] p-4 text-left hover:bg-[#f3ede1]"><p className="text-xs text-stone-500">{t}</p><p className="mt-2 text-2xl font-semibold">{role === "shop" ? ["05", "03", "08"][i] : ["32", "64", "128"][i]}<span className="ml-2 text-xs font-normal text-emerald-700">↗ {i + 4}%</span></p></button>)}</div></section>}
        {role === "customer" && <section className="mt-9"><div className="mb-4 flex items-end justify-between"><div><p className="text-[10px] font-bold tracking-[.18em] text-[#9a6b35]">PATTERN INSPIRATION</p><h2 className="mt-1 text-xl font-semibold">ลายผ้าที่น่าสนใจ</h2></div><Link href="/patterns" className="text-sm font-medium text-[#79532f] hover:underline">ดูลายผ้าทั้งหมด →</Link></div><div className="grid gap-4 sm:grid-cols-3">{demos.map((d) => <div key={d.name} className="group overflow-hidden rounded-2xl border border-[#eee8dd] bg-white"><Link href="/patterns" className="block aspect-[1.6] overflow-hidden bg-[#eee9dc]"><img src={d.image} alt={d.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /></Link><div className="flex items-center justify-between p-4"><div><h3 className="font-semibold">{d.name}</h3><p className="mt-1 text-xs text-stone-500">{d.type}</p></div><button onClick={() => setSaved((prev) => prev.includes(d.name) ? prev.filter((x) => x !== d.name) : [...prev, d.name])} className={`grid size-9 place-items-center rounded-full border transition ${saved.includes(d.name) ? "border-rose-200 bg-rose-50 text-rose-600" : "border-stone-200 text-stone-500 hover:text-rose-500"}`} aria-label="บันทึกลาย">{saved.includes(d.name) ? "♥" : "♡"}</button></div></div>)}</div></section>}
        <section className="mt-9" id={groups[role][0].label}><div className="mb-4"><p className="text-[10px] font-bold tracking-[.18em] text-[#9a6b35]">QUICK ACCESS</p><h2 className="mt-1 text-xl font-semibold">เมนูทั้งหมด</h2></div>{visibleItems.length === 0 ? <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-9 text-center text-sm text-stone-500">ไม่พบเมนูที่ค้นหา ลองใช้คำอื่น</div> : groups[role].map((group) => { const items = group.items.filter((item) => visibleItems.includes(item)); if (!items.length) return null; return <div id={group.label} key={group.label} className="mb-7 scroll-mt-24"><div className="mb-3 flex items-center gap-2"><span className="text-sm text-[#8a623d]">{group.icon}</span><h3 className="text-sm font-semibold">{group.label}</h3><span className="text-xs text-stone-400">{items.length} รายการ</span></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{items.map((item) => <div key={item.title} className="group flex min-h-[104px] items-center gap-4 rounded-2xl border border-[#eee8dd] bg-white p-4 transition hover:-translate-y-0.5 hover:border-[#d4c1a3] hover:shadow-md"><span className="grid size-11 shrink-0 place-items-center rounded-[15px] bg-[#f5efe4] text-lg text-[#765333] transition group-hover:bg-[#4b2c1b] group-hover:text-white">{item.icon}</span><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{item.title}</p><p className="mt-1 text-xs leading-5 text-stone-500">{item.note}</p></div>{item.href ? <Link aria-label={`ไปที่ ${item.title}`} href={item.href} className="grid size-9 shrink-0 place-items-center rounded-full text-stone-400 hover:bg-orange-50 hover:text-orange-900">↗</Link> : <button aria-label={`เปิด ${item.title}`} onClick={() => { setActive(item.title); flash(`เปิดตัวอย่าง: ${item.title}`); }} className="grid size-9 shrink-0 place-items-center rounded-full text-stone-400 hover:bg-orange-50 hover:text-orange-900">→</button>}</div>)}</div></div> })}</section>
        <section className="mb-5 rounded-2xl bg-[#eee8dc] p-5 sm:flex sm:items-center sm:justify-between"><div><p className="font-semibold text-[#4b2c1b]">อยากดูมุมมองอื่นไหม?</p><p className="mt-1 text-xs text-stone-600">หน้าจอนี้เป็นต้นแบบสำหรับทดลองการใช้งาน</p></div><div className="mt-3 flex flex-wrap gap-2 sm:mt-0">{(["customer", "shop", "admin"] as Role[]).filter((r) => r !== role).map((r) => <Link key={r} href={`/${r === "customer" ? "workspace" : r}`} className="rounded-full border border-[#d6c7ae] bg-white px-4 py-2 text-xs font-medium text-[#593c25] hover:bg-[#4b2c1b] hover:text-white">{roles[r].name} →</Link>)}</div></section>
      </main>
    </div>
    {toast && <div role="status" className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#332419] px-5 py-3 text-sm text-white shadow-xl">{toast}</div>}
  </div>;
}

