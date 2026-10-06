// import Workspace from "@/components/Workspace";

// export default function ShopWorkspacePage() {
//   return <Workspace role="shop" />;
// }


"use client";

import { useState } from "react";

// เมนูหลัก แถบซ้ายสุด (สีกรมท่า)
const mainApps = [
  { id: "analytics", label: "Analytics" },
  { id: "users", label: "Users" },
  { id: "shops", label: "Shops" },
  { id: "orders", label: "Orders" },
  { id: "patterns", label: "Patterns" },
  { id: "settings", label: "Settings" },
];

// เมนูย่อย แถบที่สอง (ขาว-กรมท่า)
const subMenus = [
  { id: "dashboard", label: "Dashboard" },
  { id: "users", label: "จัดการผู้ใช้งาน" },
  { id: "shops", label: "จัดการข้อมูลร้านค้า" },
  { id: "products", label: "จัดการผลิตภัณฑ์" },
  { id: "orders", label: "จัดการคำสั่งซื้อ" },
  { id: "content", label: "คลังความรู้ลายผ้า" },
  { id: "reports", label: "รายงานและสถิติ" },
];

// ข้อมูลการ์ดสถิติ 6 ช่อง
const statsCards = [
  { title: "ผู้ใช้งานทั้งหมด", value: "248", change: "+12%", period: "จากเดือนที่แล้ว", isUp: true },
  { title: "ร้านค้าพันธมิตร", value: "18", change: "+2%", period: "จากเดือนที่แล้ว", isUp: true },
  { title: "คำสั่งซื้อรอตรวจ", value: "36", change: "-5%", period: "จากสัปดาห์ที่แล้ว", isUp: false },
  { title: "ผู้ใช้ใหม่เดือนนี้", value: "32", change: "+4%", period: "เป้าหมาย 40 คน", isUp: true },
  { title: "คำสั่งซื้อเดือนนี้", value: "64", change: "+5%", period: "ยอดรวม 128k บาท", isUp: true },
  { title: "ลายผ้าในระบบ", value: "128", change: "+6%", period: "เพิ่มขึ้น 8 ลาย", isUp: true },
];

// ข้อมูลจำลองสัดส่วนการใช้งานอุปกรณ์ (เฉดสีกรมท่า)
const deviceUsage = [
  { device: "Mobile", percent: 56, color: "#0f172a" },
  { device: "Desktop", percent: 30, color: "#2563eb" },
  { device: "Tablet", percent: 14, color: "#94a3b8" },
];

// ข้อมูลตารางการเข้าใช้งานตามเบราว์เซอร์
const browserData = [
  { browser: "Chrome", sessions: "12,492", bounceRate: "42.1%" },
  { browser: "Safari", sessions: "8,320", bounceRate: "38.5%" },
  { browser: "Edge", sessions: "3,110", bounceRate: "45.0%" },
  { browser: "Firefox", sessions: "1,840", bounceRate: "41.2%" },
];

export default function AdminDashboardPage() {
  const [activePrimary, setActivePrimary] = useState("analytics");
  const [activeSub, setActiveSub] = useState("dashboard");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleMenuClick = (name: string) => {
    setToastMessage(`กำลังเลือก "${name}" (Demo Mode Only)`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  return (
    <div className="relative flex min-h-screen bg-[#f8fafc] text-slate-800 font-sans selection:bg-slate-200">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-[#0f172a] px-4 py-3 text-xs text-slate-100 shadow-2xl animate-bounce border border-slate-700">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Primary Left Sidebar (สีกรมท่าเข้ม Deep Navy) */}
      <aside className="hidden lg:flex w-20 flex-col items-center py-6 bg-[#0f172a] text-white shrink-0 justify-between select-none">
        <div className="flex flex-col items-center gap-6 w-full">
          <div className="size-10 rounded-xl bg-white text-[#0f172a] font-bold grid place-items-center text-sm shadow-sm">
            M
          </div>
          <nav className="flex flex-col gap-2 w-full px-2">
            {mainApps.map((app) => (
              <button
                key={app.id}
                type="button"
                onClick={() => {
                  setActivePrimary(app.id);
                  handleMenuClick(app.label);
                }}
                className={`flex flex-col items-center justify-center py-3 rounded-xl transition text-[11px] font-medium active:scale-95 ${
                  activePrimary === app.id
                    ? "bg-blue-600 text-white shadow-md font-semibold"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <span>{app.label}</span>
              </button>
            ))}
          </nav>
        </div>
        <button
          type="button"
          onClick={() => handleMenuClick("Logout")}
          className="text-xs text-slate-400 hover:text-white active:scale-95 font-medium"
        >
          Logout
        </button>
      </aside>

      {/* 2. Secondary Sidebar (ขาว-สีกรมท่า) */}
      <aside className="hidden md:flex w-60 flex-col border-r border-slate-200 bg-white p-5 shrink-0 select-none">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
            MENU
          </p>
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-600">
            DEMO
          </span>
        </div>
        <nav className="space-y-1">
          {subMenus.map((item) => {
            const isActive = activeSub === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveSub(item.id);
                  handleMenuClick(item.label);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition active:scale-95 ${
                  isActive
                    ? "bg-[#1e293b] text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span>{item.label}</span>
                {isActive && <span className="text-xs text-slate-400">•</span>}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* 3. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Top Header Bar */}
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4">
          <div>
            <p className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase">
              MUDMEE AI STUDIO / ผู้ดูแลระบบ
            </p>
            <h1 className="text-xl font-bold text-[#0f172a]">Analytics Dashboard</h1>
          </div>

          <div className="flex items-center gap-4 ml-auto">
            <div className="relative w-full max-w-xs hidden sm:block">
              <input
                type="text"
                placeholder="ค้นหาเมนูหรือรายการ..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 px-4 text-xs focus:bg-white focus:border-slate-400 focus:outline-none transition"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-[10px] font-bold text-slate-700">
                DEMO WORKSPACE
              </span>
              <div className="flex size-9 items-center justify-center rounded-lg bg-[#0f172a] text-xs font-bold text-white">
                ผ
              </div>
            </div>
          </div>
        </header>

        {/* Main Body */}
        <main className="p-6 space-y-6 max-w-7xl">
          
          {/* Subheader Title & Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <p className="text-xs text-slate-500">จัดการข้อมูลและสถิติภาพรวมของแพลตฟอร์ม</p>
            </div>
            <select className="self-start sm:self-auto rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 focus:outline-none shadow-sm">
              <option>Show: Weekly analytics</option>
              <option>Show: Monthly analytics</option>
            </select>
          </div>

          {/* 6 Stat Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {statsCards.map((card, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-slate-500 font-medium">{card.title}</p>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-[#0f172a]">{card.value}</span>
                      <span className={`text-xs font-semibold ${card.isUp ? "text-emerald-600" : "text-rose-600"}`}>
                        ({card.change})
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">{card.period}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Section: Doughnut Chart & Table */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Box: Device Usage Donut Chart */}
            <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase">
                  SESSIONS DEVICE
                </p>
                <h2 className="text-base font-bold text-[#0f172a] mt-0.5">ประเภทอุปกรณ์ของผู้ใช้งาน</h2>
              </div>

              {/* SVG Donut Visual */}
              <div className="my-6 flex justify-center items-center relative">
                <svg className="size-44 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f1f5f9" strokeWidth="3.8" />
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#0f172a" strokeWidth="3.8" strokeDasharray="56 100" />
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#2563eb" strokeWidth="3.8" strokeDasharray="30 100" strokeDashoffset="-56" />
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#94a3b8" strokeWidth="3.8" strokeDasharray="14 100" strokeDashoffset="-86" />
                </svg>
                <div className="absolute text-center">
                  <p className="text-xl font-bold text-[#0f172a]">100%</p>
                  <p className="text-[10px] text-slate-400">Total Visits</p>
                </div>
              </div>

              {/* Legend */}
              <div className="flex justify-around border-t border-slate-100 pt-4 text-xs">
                {deviceUsage.map((d, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-slate-600 font-medium">{d.device} ({d.percent}%)</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Box: Browser Usage Table */}
            <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase">
                    BROWSER USAGE
                  </p>
                  <h2 className="text-base font-bold text-[#0f172a] mt-0.5">สถิติเบราว์เซอร์</h2>
                </div>
                <button
                  type="button"
                  onClick={() => handleMenuClick("View All Browsers")}
                  className="text-xs text-blue-600 font-semibold hover:underline"
                >
                  View All
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[10px]">
                      <th className="pb-3">Browser</th>
                      <th className="pb-3 text-right">Sessions</th>
                      <th className="pb-3 text-right">Bounce Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {browserData.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="py-3 font-semibold text-[#0f172a]">
                          {row.browser}
                        </td>
                        <td className="py-3 text-right text-slate-600">{row.sessions}</td>
                        <td className="py-3 text-right text-slate-600">{row.bounceRate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

        </main>
      </div>

    </div>
  );
}