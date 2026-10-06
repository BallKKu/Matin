// // // "use client";

// // // import Link from "next/link";
// // // import { usePathname } from "next/navigation";
// // // import { useState } from "react";

// // // const designLinks = [
// // //   { label: "ออกแบบด้วย Prompt", href: "/design?mode=text#design-tools", icon: "✎" },
// // //   { label: "เลือกคีย์เวิร์ด", href: "/design?mode=keywords#design-tools", icon: "✿" },
// // //   { label: "ใช้ภาพต้นแบบ", href: "/design?mode=upload#design-tools", icon: "▧" },
// // // ];

// // // export default function CustomerNavbar() {
// // //   const pathname = usePathname();
// // //   const [mobileOpen, setMobileOpen] = useState(false);
// // //   const isHome = pathname === "/home" || pathname === "/";
// // //   const isPatterns = pathname === "/patterns";
// // //   const isDesign = pathname === "/design";
// // //   const isAuth = pathname === "/login" || pathname === "/register";
// // //   const isWorkspace = pathname === "/workspace" || pathname === "/shop" || pathname === "/admin";

// // //   if (isWorkspace) return null;

// // //   const linkClass = (active: boolean) => `rounded-full px-4 py-2.5 text-sm font-medium transition ${active ? "bg-orange-100 text-orange-950" : "text-stone-600 hover:bg-orange-50 hover:text-orange-900"}`;

// // //   return (
// // //     <header className="sticky top-0 z-50 border-b border-[#e9e0d3] bg-[#fbf9f5]/95 shadow-[0_4px_24px_-20px_rgba(49,34,18,0.55)] backdrop-blur-xl">
// // //       <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-4 sm:px-7">
// // //         <Link href="/home" className="group flex shrink-0 items-center gap-3" aria-label="Mudmee home">
// // //           <span className="relative grid size-11 place-items-center overflow-hidden rounded-[17px] bg-[#4b2816] text-xl text-[#f1d389] shadow-md shadow-orange-950/15 transition group-hover:rotate-3">
// // //             <span className="absolute inset-1 rounded-[13px] border border-[#f1d389]/40" />
// // //             <span className="relative">ม</span>
// // //           </span>
// // //           <span className="leading-tight"><span className="block text-[13px] font-bold tracking-[0.2em] text-[#4b2816]">MUDMEE</span><span className="mt-1 block text-[10px] tracking-[0.16em] text-stone-500">SILK DESIGN STUDIO</span></span>
// // //         </Link>

// // //         {!isAuth && <nav className="hidden items-center gap-1 lg:flex" aria-label="เมนูหลัก">
// // //           <Link href="/home" className={linkClass(isHome)}>หน้าแรก</Link>
// // //           <Link href="/patterns" className={linkClass(isPatterns)}>ดูลวดลาย</Link>
// // //           <details className="group relative">
// // //             <summary className={`${linkClass(isDesign)} flex cursor-pointer list-none items-center gap-2 [&::-webkit-details-marker]:hidden`}>
// // //               ออกแบบลายผ้า <span className="text-[10px] transition group-open:rotate-180">⌄</span>
// // //             </summary>
// // //             <div className="absolute left-0 top-full z-50 mt-3 w-64 rounded-2xl border border-stone-200 bg-white p-2 shadow-xl shadow-stone-900/10">
// // //               {designLinks.map((item) => <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-stone-700 transition hover:bg-orange-50 hover:text-orange-950"><span className="grid size-8 place-items-center rounded-lg bg-orange-100 text-orange-900">{item.icon}</span>{item.label}</Link>)}
// // //             </div>
// // //           </details>
// // //           <details className="group relative">
// // //             <summary className={`${linkClass(pathname === "/profile" || pathname === "/favorites" || pathname === "/my-designs")} flex cursor-pointer list-none items-center gap-2 [&::-webkit-details-marker]:hidden`}>
// // //               <span aria-hidden="true">♙</span> โปรไฟล์ <span className="text-[10px] transition group-open:rotate-180">⌄</span>
// // //             </summary>
// // //             <div className="absolute right-0 top-full z-50 mt-3 w-56 rounded-2xl border border-stone-200 bg-white p-2 shadow-xl shadow-stone-900/10">
// // //               <Link href="/profile" className="block rounded-xl px-3 py-3 text-sm text-stone-700 transition hover:bg-orange-50 hover:text-orange-950">แก้ไขโปรไฟล์</Link>
// // //               <Link href="/favorites" className="block rounded-xl px-3 py-3 text-sm text-stone-700 transition hover:bg-orange-50 hover:text-orange-950">ผลงานที่ชอบ</Link>
// // //               <Link href="/my-designs" className="block rounded-xl px-3 py-3 text-sm text-stone-700 transition hover:bg-orange-50 hover:text-orange-950">แบบร่างและผลงานที่บันทึก</Link>
// // //             </div>
// // //           </details>
// // //         </nav>}

// // //         <div className="hidden items-center gap-2 lg:flex">
// // //           <Link href="/login" className="rounded-full px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-orange-50">เข้าสู่ระบบ</Link>
// // //           <Link href="/register" className="rounded-full bg-[#4b2816] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#63391f]">สมัครสมาชิก <span className="ml-1 text-[#f1d389]">↗</span></Link>
// // //         </div>

// // //         {!isAuth && <button type="button" aria-label={mobileOpen ? "ปิดเมนู" : "เปิดเมนู"} aria-expanded={mobileOpen} onClick={() => setMobileOpen((open) => !open)} className="grid size-11 place-items-center rounded-full border border-stone-200 bg-white text-xl text-stone-800 lg:hidden">{mobileOpen ? "×" : "☰"}</button>}
// // //         {isAuth && <Link href={pathname === "/login" ? "/register" : "/login"} className="rounded-full bg-[#4b2816] px-4 py-2.5 text-sm font-semibold text-white lg:hidden">{pathname === "/login" ? "สมัครสมาชิก" : "เข้าสู่ระบบ"}</Link>}
// // //       </div>

// // //       {!isAuth && mobileOpen && <nav className="border-t border-stone-200 bg-[#fbf9f5] px-4 pb-5 pt-3 lg:hidden" aria-label="เมนูมือถือ">
// // //         <div className="mx-auto flex max-w-7xl flex-col gap-1">
// // //           <Link onClick={() => setMobileOpen(false)} href="/home" className={linkClass(isHome)}>หน้าแรก</Link>
// // //           <Link onClick={() => setMobileOpen(false)} href="/patterns" className={linkClass(isPatterns)}>ดูลวดลาย</Link>
// // //           <p className="px-4 pb-1 pt-3 text-[11px] font-bold tracking-[0.16em] text-stone-400">ออกแบบลายผ้า</p>
// // //           {designLinks.map((item) => <Link onClick={() => setMobileOpen(false)} key={item.href} href={item.href} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-stone-700 hover:bg-orange-50"><span className="text-orange-900">{item.icon}</span>{item.label}</Link>)}
// // //           <p className="px-4 pb-1 pt-3 text-[11px] font-bold tracking-[0.16em] text-stone-400">โปรไฟล์</p>
// // //           <Link onClick={() => setMobileOpen(false)} href="/profile" className="rounded-xl px-4 py-3 text-sm text-stone-700 hover:bg-orange-50">แก้ไขโปรไฟล์</Link>
// // //           <Link onClick={() => setMobileOpen(false)} href="/favorites" className="rounded-xl px-4 py-3 text-sm text-stone-700 hover:bg-orange-50">ผลงานที่ชอบ</Link>
// // //           <Link onClick={() => setMobileOpen(false)} href="/my-designs" className="rounded-xl px-4 py-3 text-sm text-stone-700 hover:bg-orange-50">แบบร่างและผลงานที่บันทึก</Link>
// // //           <div className="mt-3 grid grid-cols-2 gap-2 border-t border-stone-200 pt-4"><Link onClick={() => setMobileOpen(false)} href="/login" className="rounded-full border border-stone-300 py-3 text-center text-sm font-semibold text-stone-800">เข้าสู่ระบบ</Link><Link onClick={() => setMobileOpen(false)} href="/register" className="rounded-full bg-[#4b2816] py-3 text-center text-sm font-semibold text-white">สมัครสมาชิก</Link></div>
// // //         </div>
// // //       </nav>}
// // //     </header>
// // //   );
// // // }

// // "use client";

// // import Link from "next/link";
// // import { usePathname } from "next/navigation";
// // import { useEffect, useState } from "react";
// // import { createClient } from "@/utils/supabase/client";
// // import { User } from "@supabase/supabase-js";

// // const designLinks = [
// //   { label: "ออกแบบด้วย Prompt", href: "/design?mode=text#design-tools", icon: "✎" },
// //   { label: "เลือกคีย์เวิร์ด", href: "/design?mode=keywords#design-tools", icon: "✿" },
// //   { label: "ใช้ภาพต้นแบบ", href: "/design?mode=upload#design-tools", icon: "▧" },
// // ];

// // export default function CustomerNavbar() {
// //   const supabase = createClient();
// //   const pathname = usePathname();
// //   const [mobileOpen, setMobileOpen] = useState(false);
// //   const [user, setUser] = useState<User | null>(null);

// //   const isHome = pathname === "/home" || pathname === "/";
// //   const isPatterns = pathname === "/patterns";
// //   const isDesign = pathname === "/design";
// //   const isAuth = pathname === "/login" || pathname === "/register";
// //   const isWorkspace = pathname === "/workspace" || pathname === "/shop" || pathname === "/admin";

// //   // เช็กสถานะการเข้าสู่ระบบจาก Supabase
// //   useEffect(() => {
// //     supabase.auth.getUser().then(({ data }) => {
// //       setUser(data.user);
// //     });

// //     const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
// //       setUser(session?.user ?? null);
// //     });

// //     return () => subscription.unsubscribe();
// //   }, [supabase]);

// //   // ฟังก์ชันออกจากระบบ
// //   const handleLogout = async () => {
// //     await supabase.auth.signOut();
// //     window.location.href = "/";
// //   };

// //   if (isWorkspace) return null;

// //   const linkClass = (active: boolean) =>
// //     `rounded-full px-4 py-2.5 text-sm font-medium transition ${
// //       active ? "bg-orange-100 text-orange-950" : "text-stone-600 hover:bg-orange-50 hover:text-orange-900"
// //     }`;

// //   return (
// //     <header className="sticky top-0 z-50 border-b border-[#e9e0d3] bg-[#fbf9f5]/95 shadow-[0_4px_24px_-20px_rgba(49,34,18,0.55)] backdrop-blur-xl">
// //       <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-4 sm:px-7">
// //         <Link href="/home" className="group flex shrink-0 items-center gap-3" aria-label="Mudmee home">
// //           <span className="relative grid size-11 place-items-center overflow-hidden rounded-[17px] bg-[#4b2816] text-xl text-[#f1d389] shadow-md shadow-orange-950/15 transition group-hover:rotate-3">
// //             <span className="absolute inset-1 rounded-[13px] border border-[#f1d389]/40" />
// //             <span className="relative">ม</span>
// //           </span>
// //           <span className="leading-tight">
// //             <span className="block text-[13px] font-bold tracking-[0.2em] text-[#4b2816]">MUDMEE</span>
// //             <span className="mt-1 block text-[10px] tracking-[0.16em] text-stone-500">SILK DESIGN STUDIO</span>
// //           </span>
// //         </Link>

// //         {!isAuth && (
// //           <nav className="hidden items-center gap-1 lg:flex" aria-label="เมนูหลัก">
// //             <Link href="/home" className={linkClass(isHome)}>
// //               หน้าแรก
// //             </Link>
// //             <Link href="/patterns" className={linkClass(isPatterns)}>
// //               ดูลวดลาย
// //             </Link>
// //             <details className="group relative">
// //               <summary className={`${linkClass(isDesign)} flex cursor-pointer list-none items-center gap-2 [&::-webkit-details-marker]:hidden`}>
// //                 ออกแบบลายผ้า <span className="text-[10px] transition group-open:rotate-180">⌄</span>
// //               </summary>
// //               <div className="absolute left-0 top-full z-50 mt-3 w-64 rounded-2xl border border-stone-200 bg-white p-2 shadow-xl shadow-stone-900/10">
// //                 {designLinks.map((item) => (
// //                   <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-stone-700 transition hover:bg-orange-50 hover:text-orange-950">
// //                     <span className="grid size-8 place-items-center rounded-lg bg-orange-100 text-orange-900">{item.icon}</span>
// //                     {item.label}
// //                   </Link>
// //                 ))}
// //               </div>
// //             </details>

// //             {/* แสดงเมนูโปรไฟล์ เฉพาะเมื่อผู้ใช้ "ล็อกอินแล้ว" */}
// //             {user && (
// //               <details className="group relative">
// //                 <summary className={`${linkClass(pathname === "/profile" || pathname === "/favorites" || pathname === "/my-designs")} flex cursor-pointer list-none items-center gap-2 [&::-webkit-details-marker]:hidden`}>
// //                   <span aria-hidden="true">♙</span> โปรไฟล์ <span className="text-[10px] transition group-open:rotate-180">⌄</span>
// //                 </summary>
// //                 <div className="absolute right-0 top-full z-50 mt-3 w-56 rounded-2xl border border-stone-200 bg-white p-2 shadow-xl shadow-stone-900/10">
// //                   <Link href="/profile" className="block rounded-xl px-3 py-3 text-sm text-stone-700 transition hover:bg-orange-50 hover:text-orange-950">แก้ไขโปรไฟล์</Link>
// //                   <Link href="/favorites" className="block rounded-xl px-3 py-3 text-sm text-stone-700 transition hover:bg-orange-50 hover:text-orange-950">ผลงานที่ชอบ</Link>
// //                   <Link href="/my-designs" className="block rounded-xl px-3 py-3 text-sm text-stone-700 transition hover:bg-orange-50 hover:text-orange-950">แบบร่างและผลงานที่บันทึก</Link>
// //                   <button onClick={handleLogout} className="w-full text-left rounded-xl px-3 py-3 text-sm text-red-600 transition hover:bg-red-50">ออกจากระบบ</button>
// //                 </div>
// //               </details>
// //             )}
// //           </nav>
// //         )}

// //         {/* ปุ่มฝั่งขวา (Desktop) */}
// //         {!isAuth && (
// //           <div className="hidden items-center gap-2 lg:flex">
// //             {user ? (
// //               // กรณีล็อกอินแล้ว
// //               <button onClick={handleLogout} className="rounded-full border border-stone-300 px-5 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-100">
// //                 ออกจากระบบ
// //               </button>
// //             ) : (
// //               // กรณียังไม่ล็อกอิน
// //               <>
// //                 <Link href="/login" className="rounded-full px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-orange-50">
// //                   เข้าสู่ระบบ
// //                 </Link>
// //                 <Link href="/register" className="rounded-full bg-[#4b2816] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#63391f]">
// //                   สมัครสมาชิก <span className="ml-1 text-[#f1d389]">↗</span>
// //                 </Link>
// //               </>
// //             )}
// //           </div>
// //         )}

// //         {/* ปุ่ม Mobile */}
// //         {!isAuth && (
// //           <button type="button" aria-label={mobileOpen ? "ปิดเมนู" : "เปิดเมนู"} aria-expanded={mobileOpen} onClick={() => setMobileOpen((open) => !open)} className="grid size-11 place-items-center rounded-full border border-stone-200 bg-white text-xl text-stone-800 lg:hidden">
// //             {mobileOpen ? "×" : "☰"}
// //           </button>
// //         )}
// //         {isAuth && (
// //           <Link href={pathname === "/login" ? "/register" : "/login"} className="rounded-full bg-[#4b2816] px-4 py-2.5 text-sm font-semibold text-white lg:hidden">
// //             {pathname === "/login" ? "สมัครสมาชิก" : "เข้าสู่ระบบ"}
// //           </Link>
// //         )}
// //       </div>

// //       {/* เมนูมือถือ (Mobile Menu) */}
// //       {!isAuth && mobileOpen && (
// //         <nav className="border-t border-stone-200 bg-[#fbf9f5] px-4 pb-5 pt-3 lg:hidden" aria-label="เมนูมือถือ">
// //           <div className="mx-auto flex max-w-7xl flex-col gap-1">
// //             <Link onClick={() => setMobileOpen(false)} href="/home" className={linkClass(isHome)}>หน้าแรก</Link>
// //             <Link onClick={() => setMobileOpen(false)} href="/patterns" className={linkClass(isPatterns)}>ดูลวดลาย</Link>
            
// //             <p className="px-4 pb-1 pt-3 text-[11px] font-bold tracking-[0.16em] text-stone-400">ออกแบบลายผ้า</p>
// //             {designLinks.map((item) => (
// //               <Link onClick={() => setMobileOpen(false)} key={item.href} href={item.href} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-stone-700 hover:bg-orange-50">
// //                 <span className="text-orange-900">{item.icon}</span>{item.label}
// //               </Link>
// //             ))}

// //             {/* แสดงโปรไฟล์ในมือถือเมื่อล็อกอินแล้ว */}
// //             {user && (
// //               <>
// //                 <p className="px-4 pb-1 pt-3 text-[11px] font-bold tracking-[0.16em] text-stone-400">โปรไฟล์</p>
// //                 <Link onClick={() => setMobileOpen(false)} href="/profile" className="rounded-xl px-4 py-3 text-sm text-stone-700 hover:bg-orange-50">แก้ไขโปรไฟล์</Link>
// //                 <Link onClick={() => setMobileOpen(false)} href="/favorites" className="rounded-xl px-4 py-3 text-sm text-stone-700 hover:bg-orange-50">ผลงานที่ชอบ</Link>
// //                 <Link onClick={() => setMobileOpen(false)} href="/my-designs" className="rounded-xl px-4 py-3 text-sm text-stone-700 hover:bg-orange-50">แบบร่างและผลงานที่บันทึก</Link>
// //               </>
// //             )}

// //             <div className="mt-3 grid grid-cols-1 gap-2 border-t border-stone-200 pt-4">
// //               {user ? (
// //                 <button onClick={() => { setMobileOpen(false); handleLogout(); }} className="rounded-full border border-stone-300 py-3 text-center text-sm font-semibold text-stone-800">
// //                   ออกจากระบบ
// //                 </button>
// //               ) : (
// //                 <div className="grid grid-cols-2 gap-2">
// //                   <Link onClick={() => setMobileOpen(false)} href="/login" className="rounded-full border border-stone-300 py-3 text-center text-sm font-semibold text-stone-800">เข้าสู่ระบบ</Link>
// //                   <Link onClick={() => setMobileOpen(false)} href="/register" className="rounded-full bg-[#4b2816] py-3 text-center text-sm font-semibold text-white">สมัครสมาชิก</Link>
// //                 </div>
// //               )}
// //             </div>
// //           </div>
// //         </nav>
// //       )}
// //     </header>
// //   );
// // }


// "use client";

// import Link from "next/link";
// import { usePathname } from "next/navigation";
// import { useEffect, useState } from "react";
// import { createClient } from "@/utils/supabase/client";
// import { User } from "@supabase/supabase-js";

// const designLinks = [
//   { label: "ออกแบบด้วย Prompt", href: "/design?mode=text#design-tools", icon: "✎" },
//   { label: "เลือกคีย์เวิร์ด", href: "/design?mode=keywords#design-tools", icon: "✿" },
//   { label: "ใช้ภาพต้นแบบ", href: "/design?mode=upload#design-tools", icon: "▧" },
// ];

// export default function CustomerNavbar() {
//   const supabase = createClient();
//   const pathname = usePathname();
//   const [mobileOpen, setMobileOpen] = useState(false);
//   const [user, setUser] = useState<User | null>(null);

//   const isHome = pathname === "/home" || pathname === "/";
//   const isPatterns = pathname === "/patterns";
//   const isDesign = pathname === "/design";
//   const isAuth = pathname === "/login" || pathname === "/register";
//   const isWorkspace = pathname === "/workspace" || pathname === "/shop" || pathname === "/admin";

//   // ดึงสถานะ Auth และฟังการเปลี่ยนแปลงเมื่อ Login / Logout
//   useEffect(() => {
//     supabase.auth.getUser().then(({ data }) => {
//       setUser(data.user);
//     });

//     const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
//       setUser(session?.user ?? null);
//     });

//     return () => subscription.unsubscribe();
//   }, [supabase]);

//   // ฟังก์ชันออกจากระบบ
//   const handleLogout = async () => {
//     await supabase.auth.signOut();
//     window.location.href = "/";
//   };

//   if (isWorkspace) return null;

//   const linkClass = (active: boolean) =>
//     `rounded-full px-4 py-2.5 text-sm font-medium transition ${
//       active ? "bg-orange-100 text-orange-950" : "text-stone-600 hover:bg-orange-50 hover:text-orange-900"
//     }`;

//   return (
//     <header className="sticky top-0 z-50 border-b border-[#e9e0d3] bg-[#fbf9f5]/95 shadow-[0_4px_24px_-20px_rgba(49,34,18,0.55)] backdrop-blur-xl">
//       <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-4 sm:px-7">
//         <Link href="/home" className="group flex shrink-0 items-center gap-3" aria-label="Mudmee home">
//           <span className="relative grid size-11 place-items-center overflow-hidden rounded-[17px] bg-[#4b2816] text-xl text-[#f1d389] shadow-md shadow-orange-950/15 transition group-hover:rotate-3">
//             <span className="absolute inset-1 rounded-[13px] border border-[#f1d389]/40" />
//             <span className="relative">ม</span>
//           </span>
//           <span className="leading-tight">
//             <span className="block text-[13px] font-bold tracking-[0.2em] text-[#4b2816]">MUDMEE</span>
//             <span className="mt-1 block text-[10px] tracking-[0.16em] text-stone-500">SILK DESIGN STUDIO</span>
//           </span>
//         </Link>

//         {!isAuth && (
//           <nav className="hidden items-center gap-1 lg:flex" aria-label="เมนูหลัก">
//             <Link href="/home" className={linkClass(isHome)}>
//               หน้าแรก
//             </Link>
//             <Link href="/patterns" className={linkClass(isPatterns)}>
//               ดูลวดลาย
//             </Link>
//             <details className="group relative">
//               <summary className={`${linkClass(isDesign)} flex cursor-pointer list-none items-center gap-2 [&::-webkit-details-marker]:hidden`}>
//                 ออกแบบลายผ้า <span className="text-[10px] transition group-open:rotate-180">⌄</span>
//               </summary>
//               <div className="absolute left-0 top-full z-50 mt-3 w-64 rounded-2xl border border-stone-200 bg-white p-2 shadow-xl shadow-stone-900/10">
//                 {designLinks.map((item) => (
//                   <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-stone-700 transition hover:bg-orange-50 hover:text-orange-950">
//                     <span className="grid size-8 place-items-center rounded-lg bg-orange-100 text-orange-900">{item.icon}</span>
//                     {item.label}
//                   </Link>
//                 ))}
//               </div>
//             </details>

//             {/* แสดงโปรไฟล์เฉพาะคนที่เข้าสู่ระบบแล้ว */}
//             {user && (
//               <details className="group relative">
//                 <summary className={`${linkClass(pathname === "/profile" || pathname === "/favorites" || pathname === "/my-designs")} flex cursor-pointer list-none items-center gap-2 [&::-webkit-details-marker]:hidden`}>
//                   <span aria-hidden="true">♙</span> โปรไฟล์ <span className="text-[10px] transition group-open:rotate-180">⌄</span>
//                 </summary>
//                 <div className="absolute right-0 top-full z-50 mt-3 w-56 rounded-2xl border border-stone-200 bg-white p-2 shadow-xl shadow-stone-900/10">
//                   <Link href="/profile" className="block rounded-xl px-3 py-3 text-sm text-stone-700 transition hover:bg-orange-50 hover:text-orange-950">แก้ไขโปรไฟล์</Link>
//                   <Link href="/favorites" className="block rounded-xl px-3 py-3 text-sm text-stone-700 transition hover:bg-orange-50 hover:text-orange-950">ผลงานที่ชอบ</Link>
//                   <Link href="/my-designs" className="block rounded-xl px-3 py-3 text-sm text-stone-700 transition hover:bg-orange-50 hover:text-orange-950">แบบร่างและผลงานที่บันทึก</Link>
//                   <button onClick={handleLogout} className="w-full text-left rounded-xl px-3 py-3 text-sm text-red-600 transition hover:bg-red-50">ออกจากระบบ</button>
//                 </div>
//               </details>
//             )}
//           </nav>
//         )}

//         {/* ปุ่มฝั่งขวา (Desktop) */}
//         {!isAuth && (
//           <div className="hidden items-center gap-2 lg:flex">
//             {user ? (
//               <button onClick={handleLogout} className="rounded-full border border-stone-300 px-5 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-100">
//                 ออกจากระบบ
//               </button>
//             ) : (
//               <>
//                 <Link href="/login" className="rounded-full px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-orange-50">
//                   เข้าสู่ระบบ
//                 </Link>
//                 <Link href="/register" className="rounded-full bg-[#4b2816] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#63391f]">
//                   สมัครสมาชิก <span className="ml-1 text-[#f1d389]">↗</span>
//                 </Link>
//               </>
//             )}
//           </div>
//         )}

//         {/* ปุ่ม Mobile Toggle */}
//         {!isAuth && (
//           <button type="button" aria-label={mobileOpen ? "ปิดเมนู" : "เปิดเมนู"} aria-expanded={mobileOpen} onClick={() => setMobileOpen((open) => !open)} className="grid size-11 place-items-center rounded-full border border-stone-200 bg-white text-xl text-stone-800 lg:hidden">
//             {mobileOpen ? "×" : "☰"}
//           </button>
//         )}
//         {isAuth && (
//           <Link href={pathname === "/login" ? "/register" : "/login"} className="rounded-full bg-[#4b2816] px-4 py-2.5 text-sm font-semibold text-white lg:hidden">
//             {pathname === "/login" ? "สมัครสมาชิก" : "เข้าสู่ระบบ"}
//           </Link>
//         )}
//       </div>

//       {/* เมนูสำหรับมือถือ */}
//       {!isAuth && mobileOpen && (
//         <nav className="border-t border-stone-200 bg-[#fbf9f5] px-4 pb-5 pt-3 lg:hidden" aria-label="เมนูมือถือ">
//           <div className="mx-auto flex max-w-7xl flex-col gap-1">
//             <Link onClick={() => setMobileOpen(false)} href="/home" className={linkClass(isHome)}>หน้าแรก</Link>
//             <Link onClick={() => setMobileOpen(false)} href="/patterns" className={linkClass(isPatterns)}>ดูลวดลาย</Link>
            
//             <p className="px-4 pb-1 pt-3 text-[11px] font-bold tracking-[0.16em] text-stone-400">ออกแบบลายผ้า</p>
//             {designLinks.map((item) => (
//               <Link onClick={() => setMobileOpen(false)} key={item.href} href={item.href} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-stone-700 hover:bg-orange-50">
//                 <span className="text-orange-900">{item.icon}</span>{item.label}
//               </Link>
//             ))}

//             {user && (
//               <>
//                 <p className="px-4 pb-1 pt-3 text-[11px] font-bold tracking-[0.16em] text-stone-400">โปรไฟล์</p>
//                 <Link onClick={() => setMobileOpen(false)} href="/profile" className="rounded-xl px-4 py-3 text-sm text-stone-700 hover:bg-orange-50">แก้ไขโปรไฟล์</Link>
//                 <Link onClick={() => setMobileOpen(false)} href="/favorites" className="rounded-xl px-4 py-3 text-sm text-stone-700 hover:bg-orange-50">ผลงานที่ชอบ</Link>
//                 <Link onClick={() => setMobileOpen(false)} href="/my-designs" className="rounded-xl px-4 py-3 text-sm text-stone-700 hover:bg-orange-50">แบบร่างและผลงานที่บันทึก</Link>
//               </>
//             )}

//             <div className="mt-3 grid grid-cols-1 gap-2 border-t border-stone-200 pt-4">
//               {user ? (
//                 <button onClick={() => { setMobileOpen(false); handleLogout(); }} className="rounded-full border border-stone-300 py-3 text-center text-sm font-semibold text-stone-800">
//                   ออกจากระบบ
//                 </button>
//               ) : (
//                 <div className="grid grid-cols-2 gap-2">
//                   <Link onClick={() => setMobileOpen(false)} href="/login" className="rounded-full border border-stone-300 py-3 text-center text-sm font-semibold text-stone-800">เข้าสู่ระบบ</Link>
//                   <Link onClick={() => setMobileOpen(false)} href="/register" className="rounded-full bg-[#4b2816] py-3 text-center text-sm font-semibold text-white">สมัครสมาชิก</Link>
//                 </div>
//               )}
//             </div>
//           </div>
//         </nav>
//       )}
//     </header>
//   );
// }

// "use client";

// import Link from "next/link";
// import { usePathname } from "next/navigation";
// import { useEffect, useState, useRef } from "react";
// import { createClient } from "@/utils/supabase/client";
// import { User } from "@supabase/supabase-js";

// const designLinks = [
//   { label: "ออกแบบด้วย Prompt", href: "/design?mode=text#design-tools", icon: "✎" },
//   { label: "เลือกคีย์เวิร์ด", href: "/design?mode=keywords#design-tools", icon: "✿" },
//   { label: "ใช้ภาพต้นแบบ", href: "/design?mode=upload#design-tools", icon: "▧" },
// ];

// export default function CustomerNavbar() {
//   const supabase = createClient();
//   const pathname = usePathname();
//   const [mobileOpen, setMobileOpen] = useState(false);
//   const [user, setUser] = useState<User | null>(null);
//   const [displayName, setDisplayName] = useState("โปรไฟล์");

//   // State สำหรับควบคุม Dropdown ของแต่ละเมนู
//   const [designOpen, setDesignOpen] = useState(false);
//   const [profileOpen, setProfileOpen] = useState(false);

//   // Ref สำหรับเช็กการคลิกภายนอก (Click Outside)
//   const designRef = useRef<HTMLDivElement>(null);
//   const profileRef = useRef<HTMLDivElement>(null);

//   const isHome = pathname === "/home" || pathname === "/";
//   const isPatterns = pathname === "/patterns";
//   const isDesign = pathname === "/design";
//   const isAuth = pathname === "/login" || pathname === "/register";
//   const isWorkspace = pathname === "/workspace" || pathname === "/shop" || pathname === "/admin";

//   const loadProfileName = async (currentUser?: User | null) => {
//     try {
//       const stored = window.localStorage.getItem("mudmee-profile");
//       if (stored) {
//         const parsed = JSON.parse(stored);
//         if (parsed.name && parsed.name.trim() !== "") {
//           setDisplayName(parsed.name);
//           return;
//         }
//       }

//       const activeUser = currentUser ?? user;
//       if (activeUser) {
//         const nameFromMeta = activeUser.user_metadata?.full_name || activeUser.user_metadata?.name;
//         if (nameFromMeta && nameFromMeta.trim() !== "") {
//           setDisplayName(nameFromMeta);
//           return;
//         }
//       }

//       setDisplayName("โปรไฟล์");
//     } catch {
//       setDisplayName("โปรไฟล์");
//     }
//   };

//   useEffect(() => {
//     supabase.auth.getUser().then(({ data }) => {
//       setUser(data.user);
//       loadProfileName(data.user);
//     });

//     const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
//       setUser(session?.user ?? null);
//       loadProfileName(session?.user ?? null);
//     });

//     const handleProfileUpdate = () => loadProfileName();
//     window.addEventListener("mudmee-profile-updated", handleProfileUpdate);

//     // ปิด Dropdown เมื่อคลิกพื้นที่อื่นภายนอกเมนู
//     const handleClickOutside = (event: MouseEvent) => {
//       if (designRef.current && !designRef.current.contains(event.target as Node)) {
//         setDesignOpen(false);
//       }
//       if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
//         setProfileOpen(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);

//     return () => {
//       subscription.unsubscribe();
//       window.removeEventListener("mudmee-profile-updated", handleProfileUpdate);
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, [supabase]);

//   // ปิด Dropdown ทุกครั้งเมื่อมีการเปลี่ยน Route / URL
//   useEffect(() => {
//     setDesignOpen(false);
//     setProfileOpen(false);
//     setMobileOpen(false);
//   }, [pathname]);

//   const handleLogout = async () => {
//     await supabase.auth.signOut();
//     window.location.href = "/";
//   };

//   if (isWorkspace) return null;

//   const linkClass = (active: boolean) =>
//     `rounded-full px-4 py-2.5 text-sm font-medium transition ${
//       active ? "bg-orange-100 text-orange-950" : "text-stone-600 hover:bg-orange-50 hover:text-orange-900"
//     }`;

//   return (
//     <header className="sticky top-0 z-50 border-b border-[#e9e0d3] bg-[#fbf9f5]/95 shadow-[0_4px_24px_-20px_rgba(49,34,18,0.55)] backdrop-blur-xl">
//       <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-4 sm:px-7">
//         <Link href="/home" className="group flex shrink-0 items-center gap-3" aria-label="Mudmee home">
//           <span className="relative grid size-11 place-items-center overflow-hidden rounded-[17px] bg-[#4b2816] text-xl text-[#f1d389] shadow-md shadow-orange-950/15 transition group-hover:rotate-3">
//             <span className="absolute inset-1 rounded-[13px] border border-[#f1d389]/40" />
//             <span className="relative">ม</span>
//           </span>
//           <span className="leading-tight">
//             <span className="block text-[13px] font-bold tracking-[0.2em] text-[#4b2816]">MUDMEE</span>
//             <span className="mt-1 block text-[10px] tracking-[0.16em] text-stone-500">SILK DESIGN STUDIO</span>
//           </span>
//         </Link>

//         {!isAuth && (
//           <nav className="hidden items-center gap-1 lg:flex" aria-label="เมนูหลัก">
//             <Link href="/home" className={linkClass(isHome)}>
//               หน้าแรก
//             </Link>
//             <Link href="/patterns" className={linkClass(isPatterns)}>
//               ดูลวดลาย
//             </Link>

//             {/* Dropdown: ออกแบบลายผ้า */}
//             <div className="relative" ref={designRef}>
//               <button
//                 type="button"
//                 onClick={() => setDesignOpen((prev) => !prev)}
//                 className={`${linkClass(isDesign)} flex cursor-pointer items-center gap-2`}
//               >
//                 ออกแบบลายผ้า <span className={`text-[10px] transition-transform ${designOpen ? "rotate-180" : ""}`}>⌄</span>
//               </button>

//               {designOpen && (
//                 <div className="absolute left-0 top-full z-50 mt-3 w-64 rounded-2xl border border-stone-200 bg-white p-2 shadow-xl shadow-stone-900/10">
//                   {designLinks.map((item) => (
//                     <Link
//                       key={item.href}
//                       href={item.href}
//                       onClick={() => setDesignOpen(false)}
//                       className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-stone-700 transition hover:bg-orange-50 hover:text-orange-950"
//                     >
//                       <span className="grid size-8 place-items-center rounded-lg bg-orange-100 text-orange-900">{item.icon}</span>
//                       {item.label}
//                     </Link>
//                   ))}
//                 </div>
//               )}
//             </div>

//             {/* Dropdown: โปรไฟล์ / ชื่อผู้ใช้ */}
//             {user && (
//               <div className="relative" ref={profileRef}>
//                 <button
//                   type="button"
//                   onClick={() => setProfileOpen((prev) => !prev)}
//                   className={`${linkClass(
//                     pathname === "/profile" || pathname === "/favorites" || pathname === "/my-designs"
//                   )} flex cursor-pointer items-center gap-2`}
//                 >
//                   {displayName}{" "}
//                   <span className={`text-[10px] transition-transform ${profileOpen ? "rotate-180" : ""}`}>⌄</span>
//                 </button>

//                 {profileOpen && (
//                   <div className="absolute right-0 top-full z-50 mt-3 w-56 rounded-2xl border border-stone-200 bg-white p-2 shadow-xl shadow-stone-900/10">
//                     <Link
//                       href="/profile"
//                       onClick={() => setProfileOpen(false)}
//                       className="block rounded-xl px-3 py-3 text-sm text-stone-700 transition hover:bg-orange-50 hover:text-orange-950"
//                     >
//                       แก้ไขโปรไฟล์
//                     </Link>
//                     <Link
//                       href="/favorites"
//                       onClick={() => setProfileOpen(false)}
//                       className="block rounded-xl px-3 py-3 text-sm text-stone-700 transition hover:bg-orange-50 hover:text-orange-950"
//                     >
//                       ผลงานที่ชอบ
//                     </Link>
//                     <Link
//                       href="/my-designs"
//                       onClick={() => setProfileOpen(false)}
//                       className="block rounded-xl px-3 py-3 text-sm text-stone-700 transition hover:bg-orange-50 hover:text-orange-950"
//                     >
//                       แบบร่างและผลงานที่บันทึก
//                     </Link>
//                     <button
//                       onClick={() => {
//                         setProfileOpen(false);
//                         handleLogout();
//                       }}
//                       className="w-full text-left rounded-xl px-3 py-3 text-sm text-red-600 transition hover:bg-red-50"
//                     >
//                       ออกจากระบบ
//                     </button>
//                   </div>
//                 )}
//               </div>
//             )}
//           </nav>
//         )}

//         {!isAuth && (
//           <div className="hidden items-center gap-2 lg:flex">
//             {user ? (
//               <button onClick={handleLogout} className="rounded-full border border-stone-300 px-5 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-100">
//                 ออกจากระบบ
//               </button>
//             ) : (
//               <>
//                 <Link href="/login" className="rounded-full px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-orange-50">
//                   เข้าสู่ระบบ
//                 </Link>
//                 <Link href="/register" className="rounded-full bg-[#4b2816] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#63391f]">
//                   สมัครสมาชิก 
//                 </Link>
//               </>
//             )}
//           </div>
//         )}

//         {!isAuth && (
//           <button type="button" aria-label={mobileOpen ? "ปิดเมนู" : "เปิดเมนู"} aria-expanded={mobileOpen} onClick={() => setMobileOpen((open) => !open)} className="grid size-11 place-items-center rounded-full border border-stone-200 bg-white text-xl text-stone-800 lg:hidden">
//             {mobileOpen ? "×" : "☰"}
//           </button>
//         )}
//         {isAuth && (
//           <Link href={pathname === "/login" ? "/register" : "/login"} className="rounded-full bg-[#4b2816] px-4 py-2.5 text-sm font-semibold text-white lg:hidden">
//             {pathname === "/login" ? "สมัครสมาชิก" : "เข้าสู่ระบบ"}
//           </Link>
//         )}
//       </div>

//       {!isAuth && mobileOpen && (
//         <nav className="border-t border-stone-200 bg-[#fbf9f5] px-4 pb-5 pt-3 lg:hidden" aria-label="เมนูมือถือ">
//           <div className="mx-auto flex max-w-7xl flex-col gap-1">
//             <Link onClick={() => setMobileOpen(false)} href="/home" className={linkClass(isHome)}>หน้าแรก</Link>
//             <Link onClick={() => setMobileOpen(false)} href="/patterns" className={linkClass(isPatterns)}>ดูลวดลาย</Link>

//             <p className="px-4 pb-1 pt-3 text-[11px] font-bold tracking-[0.16em] text-stone-400">ออกแบบลายผ้า</p>
//             {designLinks.map((item) => (
//               <Link onClick={() => setMobileOpen(false)} key={item.href} href={item.href} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-stone-700 hover:bg-orange-50">
//                 <span className="text-orange-900">{item.icon}</span>{item.label}
//               </Link>
//             ))}

//             {user && (
//               <>
//                 <p className="px-4 pb-1 pt-3 text-[11px] font-bold tracking-[0.16em] text-stone-400">{displayName}</p>
//                 <Link onClick={() => setMobileOpen(false)} href="/profile" className="rounded-xl px-4 py-3 text-sm text-stone-700 hover:bg-orange-50">แก้ไขโปรไฟล์</Link>
//                 <Link onClick={() => setMobileOpen(false)} href="/favorites" className="rounded-xl px-4 py-3 text-sm text-stone-700 hover:bg-orange-50">ผลงานที่ชอบ</Link>
//                 <Link onClick={() => setMobileOpen(false)} href="/my-designs" className="rounded-xl px-4 py-3 text-sm text-stone-700 hover:bg-orange-50">แบบร่างและผลงานที่บันทึก</Link>
//               </>
//             )}

//             <div className="mt-3 grid grid-cols-1 gap-2 border-t border-stone-200 pt-4">
//               {user ? (
//                 <button onClick={() => { setMobileOpen(false); handleLogout(); }} className="rounded-full border border-stone-300 py-3 text-center text-sm font-semibold text-stone-800">
//                   ออกจากระบบ
//                 </button>
//               ) : (
//                 <div className="grid grid-cols-2 gap-2">
//                   <Link onClick={() => setMobileOpen(false)} href="/login" className="rounded-full border border-stone-300 py-3 text-center text-sm font-semibold text-stone-800">เข้าสู่ระบบ</Link>
//                   <Link onClick={() => setMobileOpen(false)} href="/register" className="rounded-full bg-[#4b2816] py-3 text-center text-sm font-semibold text-white">สมัครสมาชิก</Link>
//                 </div>
//               )}
//             </div>
//           </div>
//         </nav>
//       )}
//     </header>
//   );
// }

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";

const designLinks = [
  { label: "ออกแบบด้วย Prompt", href: "/design?mode=text#design-tools", icon: "✎" },
  { label: "เลือกคีย์เวิร์ด", href: "/design?mode=keywords#design-tools", icon: "✿" },
  { label: "ใช้ภาพต้นแบบ", href: "/design?mode=upload#design-tools", icon: "▧" },
];

export default function CustomerNavbar() {
  const supabase = createClient();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState("โปรไฟล์");

  // State สำหรับควบคุม Dropdown ของแต่ละเมนู
  const [designOpen, setDesignOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Ref สำหรับเช็กการคลิกภายนอก (Click Outside)
  const designRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const isHome = pathname === "/home" || pathname === "/";
  const isPatterns = pathname === "/patterns";
  const isDesign = pathname === "/design";
  const isAuth = pathname === "/login" || pathname === "/register";
  const isWorkspace = pathname === "/workspace" || pathname === "/shop" || pathname === "/admin";

  const loadProfileName = async (currentUser?: User | null) => {
    try {
      const stored = window.localStorage.getItem("mudmee-profile");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.name && parsed.name.trim() !== "") {
          setDisplayName(parsed.name);
          return;
        }
      }

      const activeUser = currentUser ?? user;
      if (activeUser) {
        const nameFromMeta = activeUser.user_metadata?.full_name || activeUser.user_metadata?.name;
        if (nameFromMeta && nameFromMeta.trim() !== "") {
          setDisplayName(nameFromMeta);
          return;
        }
      }

      setDisplayName("โปรไฟล์");
    } catch {
      setDisplayName("โปรไฟล์");
    }
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      loadProfileName(data.user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      loadProfileName(session?.user ?? null);
    });

    const handleProfileUpdate = () => loadProfileName();
    window.addEventListener("mudmee-profile-updated", handleProfileUpdate);

    // ปิด Dropdown เมื่อคลิกพื้นที่อื่นภายนอกเมนู
    const handleClickOutside = (event: MouseEvent) => {
      if (designRef.current && !designRef.current.contains(event.target as Node)) {
        setDesignOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("mudmee-profile-updated", handleProfileUpdate);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [supabase]);

  // ปิด Dropdown ทุกครั้งเมื่อมีการเปลี่ยน Route / URL
  useEffect(() => {
    setDesignOpen(false);
    setProfileOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/home";
  };

  if (isWorkspace) return null;

  const linkClass = (active: boolean) =>
    `rounded-full px-4 py-2.5 text-sm font-medium transition ${
      active ? "bg-orange-100 text-orange-950" : "text-stone-600 hover:bg-orange-50 hover:text-orange-900"
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-[#e9e0d3] bg-[#fbf9f5]/95 shadow-[0_4px_24px_-20px_rgba(49,34,18,0.55)] backdrop-blur-xl">
      <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-4 sm:px-7">
        <Link href="/home" className="group flex shrink-0 items-center gap-3" aria-label="Mudmee home">
          <span className="relative grid size-11 place-items-center overflow-hidden rounded-[17px] bg-[#4b2816] text-xl text-[#f1d389] shadow-md shadow-orange-950/15 transition group-hover:rotate-3">
            <span className="absolute inset-1 rounded-[13px] border border-[#f1d389]/40" />
            <span className="relative">ม</span>
          </span>
          <span className="leading-tight">
            <span className="block text-[13px] font-bold tracking-[0.2em] text-[#4b2816]">MUDMEE</span>
            <span className="mt-1 block text-[10px] tracking-[0.16em] text-stone-500">SILK DESIGN STUDIO</span>
          </span>
        </Link>

        {!isAuth && (
          <nav className="hidden items-center gap-1 lg:flex" aria-label="เมนูหลัก">
            <Link href="/home" className={linkClass(isHome)}>
              หน้าแรก
            </Link>
            <Link href="/patterns" className={linkClass(isPatterns)}>
              ดูลวดลาย
            </Link>

            {/* Dropdown: ออกแบบลายผ้า */}
            <div className="relative" ref={designRef}>
              <button
                type="button"
                onClick={() => setDesignOpen((prev) => !prev)}
                className={`${linkClass(isDesign)} flex cursor-pointer items-center gap-2`}
              >
                ออกแบบลายผ้า <span className={`text-[10px] transition-transform ${designOpen ? "rotate-180" : ""}`}>⌄</span>
              </button>

              {designOpen && (
                <div className="absolute left-0 top-full z-50 mt-3 w-64 rounded-2xl border border-stone-200 bg-white p-2 shadow-xl shadow-stone-900/10">
                  {designLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setDesignOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-stone-700 transition hover:bg-orange-50 hover:text-orange-950"
                    >
                      <span className="grid size-8 place-items-center rounded-lg bg-orange-100 text-orange-900">{item.icon}</span>
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Dropdown: โปรไฟล์ / ชื่อผู้ใช้ */}
            {user && (
              <div className="relative" ref={profileRef}>
                <button
                  type="button"
                  onClick={() => setProfileOpen((prev) => !prev)}
                  className={`${linkClass(
                    pathname === "/profile" || pathname === "/favorites" || pathname === "/my-designs"
                  )} flex cursor-pointer items-center gap-2`}
                >
                  {displayName}{" "}
                  <span className={`text-[10px] transition-transform ${profileOpen ? "rotate-180" : ""}`}>⌄</span>
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-full z-50 mt-3 w-56 rounded-2xl border border-stone-200 bg-white p-2 shadow-xl shadow-stone-900/10">
                    <Link
                      href="/profile"
                      onClick={() => setProfileOpen(false)}
                      className="block rounded-xl px-3 py-3 text-sm text-stone-700 transition hover:bg-orange-50 hover:text-orange-950"
                    >
                      แก้ไขโปรไฟล์
                    </Link>
                    <Link
                      href="/favorites"
                      onClick={() => setProfileOpen(false)}
                      className="block rounded-xl px-3 py-3 text-sm text-stone-700 transition hover:bg-orange-50 hover:text-orange-950"
                    >
                      ผลงานที่ชอบ
                    </Link>
                    <Link
                      href="/my-designs"
                      onClick={() => setProfileOpen(false)}
                      className="block rounded-xl px-3 py-3 text-sm text-stone-700 transition hover:bg-orange-50 hover:text-orange-950"
                    >
                      แบบร่างและผลงานที่บันทึก
                    </Link>
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        handleLogout();
                      }}
                      className="w-full text-left rounded-xl px-3 py-3 text-sm text-red-600 transition hover:bg-red-50"
                    >
                      ออกจากระบบ
                    </button>
                  </div>
                )}
              </div>
            )}
          </nav>
        )}

        {!isAuth && (
          <div className="hidden items-center gap-2 lg:flex">
            {user ? (
              <button onClick={handleLogout} className="rounded-full border border-stone-300 px-5 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-100">
                ออกจากระบบ
              </button>
            ) : (
              <>
                <Link href="/login" className="rounded-full px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-orange-50">
                  เข้าสู่ระบบ
                </Link>
                <Link href="/register" className="rounded-full bg-[#4b2816] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#63391f]">
                  สมัครสมาชิก 
                </Link>
              </>
            )}
          </div>
        )}

        {!isAuth && (
          <button type="button" aria-label={mobileOpen ? "ปิดเมนู" : "เปิดเมนู"} aria-expanded={mobileOpen} onClick={() => setMobileOpen((open) => !open)} className="grid size-11 place-items-center rounded-full border border-stone-200 bg-white text-xl text-stone-800 lg:hidden">
            {mobileOpen ? "×" : "☰"}
          </button>
        )}
        {isAuth && (
          <Link href={pathname === "/login" ? "/register" : "/login"} className="rounded-full bg-[#4b2816] px-4 py-2.5 text-sm font-semibold text-white lg:hidden">
            {pathname === "/login" ? "สมัครสมาชิก" : "เข้าสู่ระบบ"}
          </Link>
        )}
      </div>

      {!isAuth && mobileOpen && (
        <nav className="border-t border-stone-200 bg-[#fbf9f5] px-4 pb-5 pt-3 lg:hidden" aria-label="เมนูมือถือ">
          <div className="mx-auto flex max-w-7xl flex-col gap-1">
            <Link onClick={() => setMobileOpen(false)} href="/home" className={linkClass(isHome)}>หน้าแรก</Link>
            <Link onClick={() => setMobileOpen(false)} href="/patterns" className={linkClass(isPatterns)}>ดูลวดลาย</Link>

            <p className="px-4 pb-1 pt-3 text-[11px] font-bold tracking-[0.16em] text-stone-400">ออกแบบลายผ้า</p>
            {designLinks.map((item) => (
              <Link onClick={() => setMobileOpen(false)} key={item.href} href={item.href} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-stone-700 hover:bg-orange-50">
                <span className="text-orange-900">{item.icon}</span>{item.label}
              </Link>
            ))}

            {user && (
              <>
                <p className="px-4 pb-1 pt-3 text-[11px] font-bold tracking-[0.16em] text-stone-400">{displayName}</p>
                <Link onClick={() => setMobileOpen(false)} href="/profile" className="rounded-xl px-4 py-3 text-sm text-stone-700 hover:bg-orange-50">แก้ไขโปรไฟล์</Link>
                <Link onClick={() => setMobileOpen(false)} href="/favorites" className="rounded-xl px-4 py-3 text-sm text-stone-700 hover:bg-orange-50">ผลงานที่ชอบ</Link>
                <Link onClick={() => setMobileOpen(false)} href="/my-designs" className="rounded-xl px-4 py-3 text-sm text-stone-700 hover:bg-orange-50">แบบร่างและผลงานที่บันทึก</Link>
              </>
            )}

            <div className="mt-3 grid grid-cols-1 gap-2 border-t border-stone-200 pt-4">
              {user ? (
                <button onClick={() => { setMobileOpen(false); handleLogout(); }} className="rounded-full border border-stone-300 py-3 text-center text-sm font-semibold text-stone-800">
                  ออกจากระบบ
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link onClick={() => setMobileOpen(false)} href="/login" className="rounded-full border border-stone-300 py-3 text-center text-sm font-semibold text-stone-800">เข้าสู่ระบบ</Link>
                  <Link onClick={() => setMobileOpen(false)} href="/register" className="rounded-full bg-[#4b2816] py-3 text-center text-sm font-semibold text-white">สมัครสมาชิก</Link>
                </div>
              )}
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}