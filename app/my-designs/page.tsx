"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { deleteDemoDesign, readDemoDesigns, type SavedDesign } from "@/lib/demo-designs";

export default function MyDesignsPage() {
  const [designs, setDesigns] = useState<SavedDesign[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [chartFor, setChartFor] = useState<SavedDesign | null>(null);
  const [threeDFor, setThreeDFor] = useState<SavedDesign | null>(null);
  const [angle, setAngle] = useState(0);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setDesigns(readDemoDesigns());
      setLoaded(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  function remove(id: string) { 
    setDesigns(deleteDemoDesign(id));
  }

  return <main className="min-h-screen bg-orange-50 px-5 py-10 text-stone-800 sm:px-8">
    <div className="mx-auto max-w-6xl">
      <Link href="/design" className="text-sm font-medium text-orange-900 hover:underline">← กลับไปออกแบบลาย</Link>
      <div className="mt-7 flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-xs font-bold tracking-[.2em] text-orange-800">MY DESIGN LIBRARY · DEMO</p><h1 className="mt-2 text-3xl font-semibold">ผลงานลายผ้าที่บันทึก</h1><p className="mt-2 text-sm text-stone-600">ตัวอย่างผลงานและลายที่บันทึกไว้ในเบราว์เซอร์สำหรับเดโม</p></div>
        <Link href="/design" className="rounded-full bg-orange-800 px-5 py-3 text-sm font-semibold text-white hover:bg-orange-900">＋ สร้างลายใหม่</Link>
      </div>
      {!loaded ? <p className="mt-12 text-center text-stone-500">กำลังโหลดผลงาน…</p> : designs.length ? <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {designs.map((design) => <article key={design.id} className="relative overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-sm">
          <img src={design.image} alt={`ลายผ้า ${design.prompt}`} className="aspect-square w-full bg-stone-100 object-cover" />
          <button type="button" onClick={() => remove(design.id)} aria-label="ลบลายนี้" title="ลบลายนี้" className="absolute right-3 top-3 z-10 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/90 px-3.5 py-2 text-xs font-semibold text-stone-700 shadow-lg shadow-stone-900/10 backdrop-blur transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2">
            <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="size-4"><path d="M4 6h12M8 6V4.75c0-.41.34-.75.75-.75h2.5c.41 0 .75.34.75.75V6m-6.5 0 .55 9.08c.03.51.45.92.97.92h4.96c.52 0 .94-.41.97-.92L14.5 6M8.25 8.5v4.75m3.5-4.75v4.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            ลบลาย
          </button>
          <div className="p-5"><p className="text-xs text-stone-500">{new Date(design.createdAt).toLocaleString("th-TH")}</p><p className="mt-3 line-clamp-3 text-sm leading-6">{design.prompt}</p>
            <div className="mt-3 flex gap-2">{design.colors.map((color) => <span key={color} title={color} className="size-6 rounded-full border border-black/10" style={{ backgroundColor: color }} />)}</div>
            <div className="mt-5 flex flex-wrap gap-2"><Link href={`/design?prompt=${encodeURIComponent(design.prompt)}`} className="rounded-full bg-orange-800 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-900">ใช้ Prompt นี้ต่อ</Link><button type="button" onClick={() => setChartFor(design)} className="rounded-full border border-orange-300 px-4 py-2 text-sm font-semibold text-orange-900 hover:bg-orange-50">ดูผังลายทอ</button><button type="button" onClick={() => { setAngle(0); setThreeDFor(design); }} className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50">ดูตัวอย่าง 3D</button></div>
          </div>
        </article>)}
      </div> : <div className="mt-10 rounded-3xl border border-dashed border-orange-300 bg-white px-6 py-16 text-center"><p className="text-lg font-semibold">ยังไม่มีลายที่บันทึก</p><p className="mt-2 text-sm text-stone-500">สร้างลายแล้วกด “บันทึกลายนี้” เพื่อเก็บไว้ดูภายหลัง</p><Link href="/design" className="mt-5 inline-flex rounded-full bg-orange-800 px-5 py-3 text-sm font-semibold text-white">เริ่มออกแบบลาย</Link></div>}
      <p className="mt-8 text-center text-xs text-stone-500">โหมดเดโม · บันทึกไว้ในเบราว์เซอร์เครื่องนี้ ยังไม่เชื่อมฐานข้อมูล</p>
    </div>
    {chartFor && <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 p-4" role="presentation" onClick={() => setChartFor(null)}>
      <section role="dialog" aria-modal="true" aria-labelledby="weaving-chart-title" className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 p-5 sm:p-6"><div><p className="text-xs font-bold tracking-[.2em] text-orange-800">SAMPLE WEAVING CHART</p><h2 id="weaving-chart-title" className="mt-2 text-xl font-semibold">ผังลายทอ</h2><p className="mt-1 line-clamp-2 text-sm text-stone-500">{chartFor.prompt}</p></div><button type="button" aria-label="ปิดผังลายทอ" onClick={() => setChartFor(null)} className="grid size-9 shrink-0 place-items-center rounded-full border border-stone-200 text-stone-600 hover:bg-stone-50">×</button></div>
        <div className="px-5 pb-6 sm:px-6"><img src="/output/pattern_tile_pixel.png" alt="ผังลายทอแบบกริด" className="max-h-[65vh] w-full rounded-2xl border border-stone-200 bg-stone-50 object-contain" /><p className="mt-3 text-xs text-stone-500">ภาพตัวอย่างผังลายทอสำหรับแสดงฟังก์ชันเดโม</p></div>
      </section>
    </div>}
    {threeDFor && <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 p-4" role="presentation" onClick={() => setThreeDFor(null)}>
      <section role="dialog" aria-modal="true" aria-labelledby="three-d-title" className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 p-5 sm:p-6"><div><p className="text-xs font-bold tracking-[.2em] text-orange-800">3D FABRIC PREVIEW</p><h2 id="three-d-title" className="mt-2 text-xl font-semibold">ตัวอย่างลายบนผ้า 3 มิติ</h2><p className="mt-1 text-sm text-stone-500">{threeDFor.prompt}</p></div><button type="button" aria-label="ปิดตัวอย่าง 3D" onClick={() => setThreeDFor(null)} className="grid size-9 shrink-0 place-items-center rounded-full border border-stone-200 text-stone-600 hover:bg-stone-50">×</button></div>
        <div className="mx-5 grid min-h-[340px] place-items-center overflow-hidden rounded-2xl bg-[radial-gradient(ellipse_at_50%_40%,#f4e8cb,#d4c2a1_55%,#baa27c)] p-8" style={{ perspective: "1000px" }}><div className="relative aspect-[.76] w-[55%] max-w-[250px] transition-transform duration-300" style={{ transform: `rotateY(${angle}deg) rotateX(4deg) rotateZ(-4deg)`, transformStyle: "preserve-3d", boxShadow: "20px 26px 32px rgba(48,35,20,.28), inset -14px 0 20px rgba(0,0,0,.24)" }}><img src={threeDFor.image} alt={`ผ้าลาย ${threeDFor.prompt}`} className="size-full rounded-sm object-cover" /><div className="absolute inset-y-0 right-0 w-3 translate-x-2 bg-gradient-to-r from-[#8b6a43] to-[#e9d8b6]" style={{ transform: "rotateY(70deg)", transformOrigin: "left" }} /><div className="absolute inset-x-0 bottom-0 h-3 translate-y-2 bg-gradient-to-b from-[#b69668] to-[#eadabb]" style={{ transform: "rotateX(-70deg)", transformOrigin: "top" }} /></div></div>
        <label className="m-5 flex items-center gap-4 rounded-2xl border border-stone-200 p-4 text-sm"><span className="shrink-0 font-medium">หมุนดูมุมผ้า</span><input type="range" min="-35" max="35" value={angle} onChange={(event) => setAngle(Number(event.target.value))} className="w-full accent-orange-900" /><span className="w-10 text-right text-stone-500">{angle}°</span></label>
      </section>
    </div>}
  </main>;
}
