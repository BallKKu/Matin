// "use client";

// import Link from "next/link";
// import { useParams } from "next/navigation";
// import { useState } from "react";
// import { patterns } from "@/components/PatternOrderCatalog";

// const baht = new Intl.NumberFormat("th-TH");

// export default function PatternDetailPage() {
//   const params = useParams<{ id: string }>();
//   const pattern = patterns.find((item) => item.id === params.id);
//   const [angle, setAngle] = useState(0);
//   const [quantity, setQuantity] = useState(1);
//   const [ordered, setOrdered] = useState(false);

//   if (!pattern) return <main className="grid min-h-[70vh] place-items-center bg-[#f7f4ee] px-5 text-center"><div><h1 className="text-2xl font-semibold">ไม่พบลวดลายนี้</h1><Link href="/patterns" className="mt-5 inline-flex rounded-full bg-orange-900 px-5 py-3 text-white">กลับไปดูลวดลาย</Link></div></main>;

//   return <main className="min-h-screen bg-[#f7f4ee] px-5 py-8 text-stone-800 sm:px-8 sm:py-12">
//     <div className="mx-auto max-w-6xl"><Link href="/patterns" className="text-sm font-medium text-orange-900 hover:underline">← กลับไปดูลวดลาย</Link>
//       {ordered ? <section role="status" className="mx-auto mt-12 max-w-lg rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-xl"><span className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-100 text-2xl text-emerald-800">✓</span><h1 className="mt-4 text-2xl font-semibold">รับคำสั่งซื้อแล้ว</h1><p className="mt-2 text-sm leading-6 text-stone-600">{pattern.name} จำนวน {quantity} ผืน · รวม ฿{baht.format(pattern.price * quantity)}</p><button onClick={() => setOrdered(false)} className="mt-6 rounded-full bg-[#4b2c1b] px-6 py-3 text-sm font-semibold text-white">กลับไปดูลายนี้</button></section> : <div className="mt-7 grid gap-9 lg:grid-cols-[1.1fr_.9fr] lg:items-start">
//         <section><div className="relative grid min-h-[390px] place-items-center overflow-hidden rounded-[32px] bg-[radial-gradient(ellipse_at_50%_40%,#f4e8cb,#d4c2a1_55%,#baa27c)] p-8 sm:min-h-[560px]" style={{ perspective: "1200px" }}><div className="absolute bottom-12 left-1/2 h-10 w-[62%] -translate-x-1/2 rounded-[50%] bg-stone-900/20 blur-xl" /><div className="relative aspect-[.76] w-[66%] max-w-[340px] transition-transform duration-300" style={{ transform: `rotateY(${angle}deg) rotateX(4deg) rotateZ(-4deg)`, transformStyle: "preserve-3d", boxShadow: "20px 26px 32px rgba(48,35,20,.28), inset -14px 0 20px rgba(0,0,0,.24)" }}><img src={pattern.image} alt={`ตัวอย่างผ้าลาย${pattern.name}`} className="size-full rounded-sm object-cover" /><div className="absolute inset-y-0 right-0 w-4 translate-x-3 bg-gradient-to-r from-[#8b6a43] to-[#e9d8b6]" style={{ transform: "rotateY(70deg)", transformOrigin: "left" }} /><div className="absolute inset-x-0 bottom-0 h-4 translate-y-3 bg-gradient-to-b from-[#b69668] to-[#eadabb]" style={{ transform: "rotateX(-70deg)", transformOrigin: "top" }} /></div><span className="absolute left-5 top-5 rounded-full bg-white/80 px-4 py-2 text-xs font-semibold text-stone-700 backdrop-blur">ตัวอย่างจำลอง 3D</span></div><label className="mt-4 flex items-center gap-4 rounded-2xl border border-stone-200 bg-white p-4 text-sm"><span className="shrink-0 font-medium">หมุนดูมุมผ้า</span><input type="range" min="-35" max="35" value={angle} onChange={(event) => setAngle(Number(event.target.value))} className="w-full accent-orange-900" /><span className="w-10 text-right text-stone-500">{angle}°</span></label><p className="mt-2 text-xs text-stone-500">ภาพจำลองเพื่อแสดงพื้นผิวและมิติของผ้า</p></section>
//         <section className="rounded-[30px] border border-stone-200 bg-white p-6 shadow-[0_16px_50px_-40px_rgba(40,30,20,.45)] sm:p-9"><p className="text-xs font-bold tracking-[.2em] text-orange-900">{pattern.category}</p><h1 className="mt-3 text-3xl font-semibold sm:text-4xl">{pattern.name}</h1><p className="mt-4 leading-7 text-stone-600">{pattern.description}</p><div className="mt-7 flex items-end justify-between border-b border-stone-100 pb-6"><div><p className="text-sm text-stone-500">ราคาต่อลาย / ผืน</p><p className="mt-1 text-3xl font-semibold text-[#4b2c1b]">฿{baht.format(pattern.price)}</p></div><div className="rounded-2xl bg-emerald-50 px-4 py-3 text-right"><p className="text-xs text-stone-500">สต๊อกคงเหลือ</p><p className="mt-1 font-semibold text-emerald-800">{pattern.stock} ผืน</p></div></div><div className="mt-6"><p className="text-sm font-semibold">โทนสีของลาย</p><div className="mt-3 flex gap-2">{pattern.colors.map((color) => <span key={color} className="size-8 rounded-full border border-black/10" style={{ backgroundColor: color }} />)}</div></div><form className="mt-8 border-t border-stone-100 pt-6" onSubmit={(event) => { event.preventDefault(); setOrdered(true); }}><label className="block text-sm font-semibold">จำนวนผืน<input type="number" min="1" max={pattern.stock} value={quantity} onChange={(event) => setQuantity(Math.max(1, Math.min(pattern.stock, Number(event.target.value))))} className="mt-2 block w-28 rounded-xl border border-stone-300 px-4 py-3 outline-none focus:border-orange-800" /></label><div className="mt-5 flex items-center justify-between rounded-2xl bg-[#f8f6f1] px-4 py-4"><span className="text-sm text-stone-600">ยอดรวม</span><strong className="text-xl">฿{baht.format(pattern.price * quantity)}</strong></div><button type="submit" disabled={pattern.stock < 1} className="mt-5 w-full rounded-full bg-orange-900 px-5 py-4 font-semibold text-white transition hover:bg-orange-950 disabled:cursor-not-allowed disabled:opacity-40">สั่งซื้อลายนี้</button><p className="mt-3 text-center text-xs text-stone-500">สต๊อก {pattern.stock} ผืน · ราคาตามแบบลายที่เลือก</p></form></section>
//       </div>}
//     </div>
//   </main>;
// }

"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { patterns } from "@/components/PatternOrderCatalog";
import { createClient } from "@/utils/supabase/client";

const baht = new Intl.NumberFormat("th-TH");

export default function PatternDetailPage() {
  const supabase = createClient();
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const pattern = patterns.find((item) => item.id === params.id);
  const [angle, setAngle] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [ordered, setOrdered] = useState(false);
  const [user, setUser] = useState<any>(null);

  // ดึงข้อมูล User เมื่อโหลดหน้าเพื่อเช็กสถานะการล็อกอิน
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, [supabase]);

  // ฟังก์ชันจัดการเมื่อกดสั่งซื้อ
  const handleOrderSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    // หากยังไม่ได้เข้าสู่ระบบ ให้แจ้งเตือนและพาไปหน้า Login
    if (!user) {
      alert("กรุณาเข้าสู่ระบบ หรือสมัครสมาชิกก่อนทำการสั่งซื้อ");
      router.push("/login");
      return;
    }

    // หากเข้าสู่ระบบแล้ว ให้ทำรายการสั่งซื้อ
    setOrdered(true);
  };

  if (!pattern)
    return (
      <main className="grid min-h-[70vh] place-items-center bg-[#f7f4ee] px-5 text-center">
        <div>
          <h1 className="text-2xl font-semibold">ไม่พบลวดลายนี้</h1>
          <Link
            href="/patterns"
            className="mt-5 inline-flex rounded-full bg-orange-900 px-5 py-3 text-white"
          >
            กลับไปดูลวดลาย
          </Link>
        </div>
      </main>
    );

  return (
    <main className="min-h-screen bg-[#f7f4ee] px-5 py-8 text-stone-800 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/patterns"
          className="text-sm font-medium text-orange-900 hover:underline"
        >
          ← กลับไปดูลวดลาย
        </Link>
        {ordered ? (
          <section
            role="status"
            className="mx-auto mt-12 max-w-lg rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-xl"
          >
            <span className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-100 text-2xl text-emerald-800">
              ✓
            </span>
            <h1 className="mt-4 text-2xl font-semibold">รับคำสั่งซื้อแล้ว</h1>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              {pattern.name} จำนวน {quantity} ผืน · รวม ฿
              {baht.format(pattern.price * quantity)}
            </p>
            <button
              onClick={() => setOrdered(false)}
              className="mt-6 rounded-full bg-[#4b2c1b] px-6 py-3 text-sm font-semibold text-white"
            >
              กลับไปดูลายนี้
            </button>
          </section>
        ) : (
          <div className="mt-7 grid gap-9 lg:grid-cols-[1.1fr_.9fr] lg:items-start">
            <section>
              <div
                className="relative grid min-h-[390px] place-items-center overflow-hidden rounded-[32px] bg-[radial-gradient(ellipse_at_50%_40%,#f4e8cb,#d4c2a1_55%,#baa27c)] p-8 sm:min-h-[560px]"
                style={{ perspective: "1200px" }}
              >
                <div className="absolute bottom-12 left-1/2 h-10 w-[62%] -translate-x-1/2 rounded-[50%] bg-stone-900/20 blur-xl" />
                <div
                  className="relative aspect-[.76] w-[66%] max-w-[340px] transition-transform duration-300"
                  style={{
                    transform: `rotateY(${angle}deg) rotateX(4deg) rotateZ(-4deg)`,
                    transformStyle: "preserve-3d",
                    boxShadow:
                      "20px 26px 32px rgba(48,35,20,.28), inset -14px 0 20px rgba(0,0,0,.24)",
                  }}
                >
                  <img
                    src={pattern.image}
                    alt={`ตัวอย่างผ้าลาย${pattern.name}`}
                    className="size-full rounded-sm object-cover"
                  />
                  <div
                    className="absolute inset-y-0 right-0 w-4 translate-x-3 bg-gradient-to-r from-[#8b6a43] to-[#e9d8b6]"
                    style={{
                      transform: "rotateY(70deg)",
                      transformOrigin: "left",
                    }}
                  />
                  <div
                    className="absolute inset-x-0 bottom-0 h-4 translate-y-3 bg-gradient-to-b from-[#b69668] to-[#eadabb]"
                    style={{
                      transform: "rotateX(-70deg)",
                      transformOrigin: "top",
                    }}
                  />
                </div>
                <span className="absolute left-5 top-5 rounded-full bg-white/80 px-4 py-2 text-xs font-semibold text-stone-700 backdrop-blur">
                  ตัวอย่างจำลอง 3D
                </span>
              </div>
              <label className="mt-4 flex items-center gap-4 rounded-2xl border border-stone-200 bg-white p-4 text-sm">
                <span className="shrink-0 font-medium">หมุนดูมุมผ้า</span>
                <input
                  type="range"
                  min="-35"
                  max="35"
                  value={angle}
                  onChange={(event) => setAngle(Number(event.target.value))}
                  className="w-full accent-orange-900"
                />
                <span className="w-10 text-right text-stone-500">{angle}°</span>
              </label>
              <p className="mt-2 text-xs text-stone-500">
                ภาพจำลองเพื่อแสดงพื้นผิวและมิติของผ้า
              </p>
            </section>

            <section className="rounded-[30px] border border-stone-200 bg-white p-6 shadow-[0_16px_50px_-40px_rgba(40,30,20,.45)] sm:p-9">
              <p className="text-xs font-bold tracking-[.2em] text-orange-900">
                {pattern.category}
              </p>
              <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
                {pattern.name}
              </h1>
              <p className="mt-4 leading-7 text-stone-600">
                {pattern.description}
              </p>
              <div className="mt-7 flex items-end justify-between border-b border-stone-100 pb-6">
                <div>
                  <p className="text-sm text-stone-500">ราคาต่อลาย / ผืน</p>
                  <p className="mt-1 text-3xl font-semibold text-[#4b2c1b]">
                    ฿{baht.format(pattern.price)}
                  </p>
                </div>
                <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-right">
                  <p className="text-xs text-stone-500">สต๊อกคงเหลือ</p>
                  <p className="mt-1 font-semibold text-emerald-800">
                    {pattern.stock} ผืน
                  </p>
                </div>
              </div>
              <div className="mt-6">
                <p className="text-sm font-semibold">โทนสีของลาย</p>
                <div className="mt-3 flex gap-2">
                  {pattern.colors.map((color) => (
                    <span
                      key={color}
                      className="size-8 rounded-full border border-black/10"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Form สั่งซื้อ */}
              <form
                className="mt-8 border-t border-stone-100 pt-6"
                onSubmit={handleOrderSubmit}
              >
                <label className="block text-sm font-semibold">
                  จำนวนผืน
                  <input
                    type="number"
                    min="1"
                    max={pattern.stock}
                    value={quantity}
                    onChange={(event) =>
                      setQuantity(
                        Math.max(
                          1,
                          Math.min(pattern.stock, Number(event.target.value))
                        )
                      )
                    }
                    className="mt-2 block w-28 rounded-xl border border-stone-300 px-4 py-3 outline-none focus:border-orange-800"
                  />
                </label>
                <div className="mt-5 flex items-center justify-between rounded-2xl bg-[#f8f6f1] px-4 py-4">
                  <span className="text-sm text-stone-600">ยอดรวม</span>
                  <strong className="text-xl">
                    ฿{baht.format(pattern.price * quantity)}
                  </strong>
                </div>
                <button
                  type="submit"
                  disabled={pattern.stock < 1}
                  className="mt-5 w-full rounded-full bg-orange-900 px-5 py-4 font-semibold text-white transition hover:bg-orange-950 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  สั่งซื้อลายนี้
                </button>
                <p className="mt-3 text-center text-xs text-stone-500">
                  สต๊อก {pattern.stock} ผืน · ราคาตามแบบลายที่เลือก
                </p>
              </form>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}