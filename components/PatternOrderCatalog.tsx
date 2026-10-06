"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import PatternMixChat from "@/components/PatternMixChat";
import { categories, patterns } from "@/lib/silk-patterns";

export type { Pattern } from "@/lib/silk-patterns";
export { patterns } from "@/lib/silk-patterns";

const baht = new Intl.NumberFormat("th-TH");

export default function PatternOrderCatalog() {
  const [category, setCategory] = useState("ทั้งหมด");
  const [search, setSearch] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoritesLoaded, setFavoritesLoaded] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("mudmee-favorites");
      if (saved) setFavorites(JSON.parse(saved) as string[]);
    } catch {
      /* Ignore unavailable or invalid browser storage. */
    }
    setFavoritesLoaded(true);
  }, []);

  useEffect(() => {
    if (favoritesLoaded)
      window.localStorage.setItem(
        "mudmee-favorites",
        JSON.stringify(favorites)
      );
  }, [favorites, favoritesLoaded]);

  const visiblePatterns = useMemo(
    () =>
      patterns.filter(
        (pattern) =>
          (category === "ทั้งหมด" || pattern.category === category) &&
          `${pattern.name} ${pattern.province} ${pattern.category} ${pattern.description}`
            .toLowerCase()
            .includes(search.trim().toLowerCase())
      ),
    [category, search]
  );

  const selectedPatterns = useMemo(
    () =>
      selectedIds
        .map((id) => patterns.find((pattern) => pattern.id === id))
        .filter((pattern): pattern is (typeof patterns)[number] => Boolean(pattern)),
    [selectedIds]
  );

  function toggleFavorite(id: string) {
    setFavorites((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  function toggleSelected(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f4ee] pb-56 text-stone-800">
      <section className="relative overflow-hidden bg-[#332718] text-white">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, transparent, transparent 18px, #e8c76c 19px, transparent 21px), repeating-linear-gradient(-45deg, transparent, transparent 18px, #e8c76c 19px, transparent 21px)",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20">
          <p className="text-xs font-semibold tracking-[0.28em] text-amber-200">
            MUDMEE SILK COLLECTION
          </p>
          <h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl">
            ลายผ้าไหมมัดหมี่อีสาน 20 จังหวัด
            <br />
            เลือกผสมเป็นลายใหม่ได้
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-stone-200 sm:text-base">
            เลือกชมลายผ้าเอกลักษณ์ประจำจังหวัด หรือกดปุ่ม + เพื่อส่งลายเข้าแชทแล้วเจนลายผสมด้วย AI
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="mb-7 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-orange-900">
              เลือกชมคอลเลกชัน
            </p>
            <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">
              ลวดลายทั้งหมด{" "}
              <span className="text-base font-normal text-stone-500">
                ({visiblePatterns.length} แบบ)
              </span>
            </h2>
          </div>
          <label className="relative block w-full md:max-w-xs">
            <span className="sr-only">ค้นหาลายผ้า</span>
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone-400">
              ⌕
            </span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="ค้นหาลายผ้า หรือชื่อจังหวัด..."
              className="w-full rounded-full border border-stone-300 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-orange-800 focus:ring-2 focus:ring-orange-100"
            />
          </label>
        </div>
        <div className="mb-7 flex flex-wrap gap-2">
          {categories.map((item) => (
            <button
              key={item}
              onClick={() => setCategory(item)}
              className={`rounded-full px-5 py-2.5 text-sm font-medium transition ${
                category === item
                  ? "bg-orange-900 text-white"
                  : "border border-stone-300 bg-white text-stone-700 hover:border-orange-700 hover:text-orange-900"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
        {visiblePatterns.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {visiblePatterns.map((pattern) => {
              const favorite = favorites.includes(pattern.id);
              const picked = selectedIds.includes(pattern.id);
              return (
                <article
                  key={pattern.id}
                  className={`group overflow-hidden rounded-3xl border bg-white shadow-[0_10px_36px_-28px_rgba(48,35,20,0.55)] transition duration-300 hover:-translate-y-1 hover:shadow-xl ${
                    picked ? "border-orange-700 ring-2 ring-orange-200" : "border-stone-200"
                  }`}
                >
                  <Link
                    href={`/patterns/${pattern.id}`}
                    className="block"
                  >
                    <div className="relative aspect-[4/4.5] overflow-hidden bg-[#201a0d]">
                      <img
                        src={pattern.image}
                        alt={`ลายผ้า${pattern.name}`}
                        className="size-full object-cover transition duration-500 group-hover:scale-105"
                      />
                      <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-orange-950 backdrop-blur">
                        {pattern.tag}
                      </span>
                      <span className="absolute bottom-4 left-4 rounded-full bg-black/55 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
                        จ.{pattern.province}
                      </span>
                    </div>
                  </Link>
                  <div className="p-5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-orange-800">
                        {pattern.category}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleFavorite(pattern.id)}
                        aria-label={
                          favorite
                            ? "นำออกจากรายการโปรด"
                            : "เพิ่มในรายการโปรด"
                        }
                        aria-pressed={favorite}
                        className="grid size-9 place-items-center rounded-full text-xl text-orange-900 hover:bg-orange-50"
                      >
                        {favorite ? "♥" : "♡"}
                      </button>
                    </div>
                    <h3 className="mt-1 text-lg font-semibold">
                      {pattern.name}
                    </h3>
                    <p className="mt-2 min-h-12 text-sm leading-6 text-stone-600">
                      {pattern.description}
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="font-semibold text-[#4b2c1b]">
                        ฿{baht.format(pattern.price)}{" "}
                        <span className="text-xs font-normal text-stone-500">
                          / ผืน
                        </span>
                      </span>
                      <span className="text-xs text-stone-500">
                        คงเหลือ {pattern.stock} ผืน
                      </span>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                      <Link
                        href={`/patterns/${pattern.id}`}
                        className="block flex-1 rounded-full bg-orange-900 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-orange-950"
                      >
                        ดูลวดลาย
                      </Link>
                      <button
                        type="button"
                        onClick={() => toggleSelected(pattern.id)}
                        aria-pressed={picked}
                        title={picked ? "เอาออกจากแชท" : "เพิ่มลายนี้เข้าแชท"}
                        aria-label={
                          picked
                            ? `เอา${pattern.name}ออกจากแชท`
                            : `เพิ่ม${pattern.name}เข้าแชท`
                        }
                        className={`grid size-12 shrink-0 place-items-center rounded-full border text-xl font-semibold transition ${
                          picked
                            ? "border-emerald-700 bg-emerald-700 text-white"
                            : "border-stone-300 bg-white text-orange-900 hover:border-orange-700 hover:bg-orange-50"
                        }`}
                      >
                        {picked ? "✓" : "+"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-stone-300 bg-white/70 px-6 py-16 text-center">
            <p className="text-lg font-semibold">ยังไม่พบลวดลายที่ค้นหา</p>
            <p className="mt-2 text-sm text-stone-500">
              ลองเปลี่ยนคำค้นหรือเลือกหมวดอื่น
            </p>
            <button
              onClick={() => {
                setSearch("");
                setCategory("ทั้งหมด");
              }}
              className="mt-5 rounded-full bg-orange-900 px-5 py-2.5 text-sm font-semibold text-white"
            >
              ดูลายทั้งหมด
            </button>
          </div>
        )}
      </section>
      <PatternMixChat
        selected={selectedPatterns}
        onRemove={(id) =>
          setSelectedIds((current) => current.filter((item) => item !== id))
        }
        onClear={() => setSelectedIds([])}
      />
    </main>
  );
}
