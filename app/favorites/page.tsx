"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { patterns } from "@/components/PatternOrderCatalog";

export default function FavoritesPage() {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("mudmee-favorites");
      if (saved) setFavoriteIds(JSON.parse(saved) as string[]);
    } catch { /* Show an empty list when browser storage is unavailable. */ }
    setLoaded(true);
  }, []);

  function removeFavorite(id: string) {
    const next = favoriteIds.filter((item) => item !== id);
    window.localStorage.setItem("mudmee-favorites", JSON.stringify(next));
    setFavoriteIds(next);
  }

  const favorites = patterns.filter((pattern) => favoriteIds.includes(pattern.id));
  return <main className="min-h-screen bg-[#f7f4ee] px-4 py-12 text-stone-800 sm:py-16">
    <section className="mx-auto max-w-6xl">
      <p className="text-xs font-bold tracking-[0.2em] text-orange-900">บัญชีของฉัน</p>
      <h1 className="mt-2 text-3xl font-semibold">ผลงานที่ชอบ</h1>
      <p className="mt-2 text-sm text-stone-500">ลายผ้าที่บันทึกไว้จากหน้าดูลวดลาย</p>
      {loaded && favorites.length ? <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{favorites.map((pattern) => <article key={pattern.id} className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
        <Link href={`/patterns/${pattern.id}`} className="block"><img src={pattern.image} alt={`ลายผ้า${pattern.name}`} className="aspect-square w-full object-cover" /></Link>
        <div className="p-5"><p className="text-xs text-orange-800">{pattern.category}</p><h2 className="mt-1 font-semibold">{pattern.name}</h2><div className="mt-4 flex items-center justify-between gap-2"><Link href={`/patterns/${pattern.id}`} className="text-sm font-semibold text-orange-900 hover:underline">ดูรายละเอียด</Link><button type="button" onClick={() => removeFavorite(pattern.id)} className="rounded-full border border-stone-200 px-3 py-2 text-xs text-stone-600 hover:border-red-300 hover:text-red-700">นำออก</button></div></div>
      </article>)}</div> : loaded ? <div className="mt-8 rounded-3xl border border-dashed border-stone-300 bg-white px-6 py-14 text-center"><p className="font-medium">ยังไม่มีผลงานที่ชอบ</p><p className="mt-2 text-sm text-stone-500">กดหัวใจบนลายที่ชอบเพื่อบันทึกไว้ที่นี่</p><Link href="/patterns" className="mt-5 inline-block rounded-full bg-orange-900 px-5 py-3 text-sm font-semibold text-white">ไปดูลวดลาย</Link></div> : null}
    </section>
  </main>;
}
