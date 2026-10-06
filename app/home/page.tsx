export default function HomeMain() {
  return (
    <>
      <main className="relative flex min-h-screen items-center justify-center bg-[url('/bg.png')] bg-cover bg-center bg-no-repeat px-6">
        
        <div className="absolute inset-0 bg-black/50" />

        <div className="relative z-10 text-center">

          <h1 className="mt-3 text-6xl font-bold text-white">
            ผ้าไหมมัดหมี่
          </h1>

          <p className="mt-3 text-2xl text-white">
            สร้างลายผ้าไหมมัดหมี่ ในแบบที่เป็นคุณ
          </p>

          <a
            href="/design"
            className="mt-8 inline-block rounded-xl bg-orange-700 px-8 py-3 font-semibold text-white transition hover:bg-orange-800">
            ออกแบบด้วย AI
          </a>
          <a
            href="/patterns"
            className="ml-3 mt-8 inline-block rounded-xl border border-white/80 bg-white/15 px-8 py-3 font-semibold text-white backdrop-blur transition hover:bg-white/25">
            ดูลายผ้า
          </a>
        </div>

      </main>
    </>
  );
}
