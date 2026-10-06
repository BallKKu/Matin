// import Link from "next/link";

// const portals = [
//   { label: "พื้นที่ลูกค้า", path: "/workspace", icon: "✿", description: "ค้นหาลาย ออกแบบด้วย AI บันทึกแบบ และติดตามงานผลิต", tag: "CUSTOMER" },
//   { label: "พื้นที่ร้านค้า", path: "/shop", icon: "▧", description: "ตรวจคำขอผลิต เสนอราคา และอัปเดตความคืบหน้าการทอ", tag: "SILK SHOP" },
//   { label: "ผู้ดูแลระบบ", path: "/admin", icon: "⌘", description: "ดูแลผู้ใช้งาน ร้านค้า สินค้า คำสั่งซื้อ และรายงาน", tag: "ADMIN" },
// ];

// export default function Home() {
//   return <main className="min-h-[calc(100vh-76px)] overflow-hidden bg-[#f7f5f0] text-[#2e261f]">
//     <section className="relative overflow-hidden bg-[#39281e] text-white">
//       <div className="absolute inset-0 opacity-[.12]" style={{ backgroundImage: "repeating-linear-gradient(45deg,transparent,transparent 16px,#edcf84 17px,transparent 19px),repeating-linear-gradient(-45deg,transparent,transparent 16px,#edcf84 17px,transparent 19px)" }} />
//       <div className="relative mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
//         <p className="text-xs font-semibold tracking-[.28em] text-amber-200">MUDMEE AI STUDIO</p>
//         <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight sm:text-6xl">สืบสานลายผ้าไทย<br /><span className="text-[#e9c878]">ด้วยจินตนาการของคุณ</span></h1>
//         <p className="mt-5 max-w-xl text-sm leading-7 text-stone-200 sm:text-base">พื้นที่สร้างสรรค์ลายผ้าไหมมัดหมี่ เชื่อมต่อแรงบันดาลใจของคุณกับภูมิปัญญาช่างทอ</p>
//         <div className="mt-8 flex flex-wrap gap-3"><Link href="/patterns" className="rounded-full bg-[#efd58e] px-6 py-3 text-sm font-semibold text-[#342318] hover:bg-amber-100">ค้นหาลายผ้า <span className="ml-2">→</span></Link><Link href="/design" className="rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10">เริ่มออกแบบด้วย AI</Link></div>
//         <span className="absolute -bottom-16 right-8 hidden text-[280px] leading-none text-white/[.04] lg:block">✿</span>
//       </div>
//     </section>
//     <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
//       <div className="mb-7"><p className="text-[10px] font-bold tracking-[.22em] text-[#9a6b35]">CHOOSE YOUR WORKSPACE</p><h2 className="mt-2 text-2xl font-semibold sm:text-3xl">เลือกพื้นที่ที่ต้องการเข้าใช้งาน</h2><p className="mt-2 text-sm text-stone-500">ต้นแบบหน้าจอสำหรับลูกค้า ร้านค้า และผู้ดูแลระบบ</p></div>
//       <div className="grid gap-4 md:grid-cols-3">{portals.map((portal, i) => <Link key={portal.path} href={portal.path} className="group rounded-[24px] border border-[#eae4d9] bg-white p-6 transition hover:-translate-y-1 hover:border-[#c7ad86] hover:shadow-xl hover:shadow-stone-900/5"><div className="flex items-center justify-between"><span className={`grid size-12 place-items-center rounded-2xl text-xl ${i === 1 ? "bg-[#e8f0e8] text-emerald-800" : i === 2 ? "bg-[#ece8f1] text-violet-800" : "bg-[#f5ecdc] text-[#75502e]"}`}>{portal.icon}</span><span className="text-[9px] font-bold tracking-[.2em] text-stone-400">{portal.tag}</span></div><h3 className="mt-5 text-xl font-semibold">{portal.label}</h3><p className="mt-2 min-h-12 text-sm leading-6 text-stone-500">{portal.description}</p><span className="mt-5 inline-flex items-center text-sm font-semibold text-[#79532f]">เปิดพื้นที่ทำงาน <span className="ml-2 transition group-hover:translate-x-1">→</span></span></Link>)}</div>
//       <div className="mt-7 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#eee8dc] px-5 py-4"><p className="text-sm text-stone-600">มีบัญชีอยู่แล้ว? เข้าสู่ระบบเพื่อใช้งานต่อ</p><div className="flex gap-2"><Link href="/login" className="rounded-full border border-[#d6c7ae] bg-white px-5 py-2.5 text-sm font-medium text-[#593c25] hover:bg-[#4b2c1b] hover:text-white">เข้าสู่ระบบ</Link><Link href="/register" className="rounded-full bg-[#4b2c1b] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#69452b]">สมัครสมาชิก</Link></div></div>
//     </section>
//   </main>;
// }

import { redirect } from 'next/navigation';

export default function RootPage() {
  redirect('/home');
}