"use client";

import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  return <main className="flex min-h-[calc(100vh-76px)] items-center justify-center bg-[#f7f5f0] px-5 py-12"><section className="w-full max-w-md rounded-[28px] border border-[#eee8dd] bg-white p-7 shadow-lg shadow-stone-900/5 sm:p-9"><Link href="/login" className="text-sm text-[#79532f] hover:underline">← กลับเข้าสู่ระบบ</Link><div className="mt-7 grid size-12 place-items-center rounded-2xl bg-[#f5efe4] text-xl text-[#79532f]">⌑</div><h1 className="mt-5 text-2xl font-semibold">ลืมรหัสผ่าน</h1><p className="mt-2 text-sm leading-6 text-stone-500">กรอกอีเมลที่ใช้สมัครสมาชิก เพื่อรับคำแนะนำในการตั้งรหัสผ่านใหม่</p>{submitted ? <div role="status" className="mt-6 rounded-2xl bg-emerald-50 p-4 text-sm leading-6 text-emerald-800">รับคำขอแล้ว (ตัวอย่าง) หากอีเมลนี้อยู่ในระบบ จะได้รับคำแนะนำสำหรับตั้งรหัสผ่านใหม่</div> : <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }} className="mt-6 space-y-4"><label className="block text-sm font-medium">อีเมล<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3 outline-none focus:border-orange-800 focus:ring-2 focus:ring-orange-100" /></label><button className="w-full rounded-xl bg-[#4b2c1b] px-5 py-3 font-semibold text-white hover:bg-[#69452b]">ส่งคำแนะนำ</button></form>}<p className="mt-6 text-center text-sm text-stone-500">ยังไม่มีบัญชี? <Link href="/register" className="font-semibold text-[#79532f] hover:underline">สมัครสมาชิก</Link></p></section></main>;
}
