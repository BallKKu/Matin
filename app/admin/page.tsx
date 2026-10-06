// import Workspace from "@/components/Workspace";

// export default function AdminWorkspacePage() {
//   return <Workspace role="admin" />;
// }






"use client";

import { useState } from "react";

// ข้อมูลการ์ดสรุปตัวเลขด้านบน
const summaryStats = [
  { label: "ผู้ใช้งาน", value: "248", icon: "♟", badge: "↗ เดือนนี้", iconBg: "bg-[#f5ebd9] text-[#785328]" },
  { label: "ร้านค้าพันธมิตร", value: "18", icon: "⌂", badge: "↗ เดือนนี้", iconBg: "bg-[#f5ebd9] text-[#785328]" },
  { label: "คำสั่งซื้อรอตรวจ", value: "36", icon: "❐", badge: "↗ เดือนนี้", iconBg: "bg-[#f5ebd9] text-[#785328]" },
];

// ข้อมูลภาพรวมแพลตฟอร์ม
const platformOverview = [
  { label: "ผู้ใช้ใหม่เดือนนี้", value: "32", change: "↗ 4%" },
  { label: "คำสั่งซื้อเดือนนี้", value: "64", change: "↗ 5%" },
  { label: "ลายผ้าในระบบ", value: "128", change: "↗ 6%" },
];

// เมนู Sidebar
const sidebarMenus = [
  { id: "users", title: "จัดการผู้ใช้งาน", desc: "ดูแลบัญชีลูกค้าและสิทธิ์", icon: "♟" },
  { id: "shops", title: "จัดการข้อมูลร้านค้า", desc: "ดูแลร้านค้าและข้อมูลติดต่อ", icon: "⌂" },
  { id: "products", title: "จัดการผลิตภัณฑ์", desc: "เพิ่มและแก้ไขผลิตภัณฑ์", icon: "◇" },
  { id: "orders", title: "จัดการคำสั่งซื้อ", desc: "ตรวจสอบคำสั่งซื้อทั้งหมด", icon: "❐" },
  { id: "content", title: "เนื้อหาและความรู้ลายผ้า", desc: "เผยแพร่คลังความรู้", icon: "▤" },
  { id: "reports", title: "รายงานและสถิติ", desc: "ดูภาพรวมและยอดขาย", icon: "▥" },
  { id: "login", title: "เข้าสู่ระบบแอดมิน", desc: "เข้าพื้นที่จัดการระบบ", icon: "↗" },
  { id: "forgot", title: "ลืมรหัสผ่าน", desc: "ขอความช่วยเหลือการเข้าบัญชี", icon: "⟡" },
];

export default function AdminDashboardPage() {
  const [activeMenu, setActiveMenu] = useState("users");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // ฟังก์ชันเมื่อกดปุ่มเมนู
  const handleMenuClick = (title: string, id: string) => {
    setActiveMenu(id);
    setToastMessage(`กำลังเลือกเมนู "${title}" (Demo Mode Only)`);
    
    // ซ่อน Toast แจ้งเตือนหลังจาก 2.5 วินาที
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  return (
    <div className="relative flex min-h-screen bg-[#f7f4ed] text-[#2e261f]">
      
      {/* Toast Notification ป๊อปอัปแจ้งเตือนเวลากดปุ่ม */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl bg-[#2a1e17] px-4 py-3 text-xs text-amber-200 shadow-xl transition-all animate-bounce">
          <span>✨</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ----------------- SIDEBAR (Interactive Demo) ----------------- */}
      <aside className="hidden md:flex w-72 flex-col border-r border-[#ece4d8] bg-[#f2ebd9]/50 p-5 shrink-0 select-none">
        
        {/* Brand / Header */}
        <div className="mb-6 pb-4 border-b border-[#ece4d8]">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold tracking-[0.2em] text-[#a07844] uppercase">
              QUICK ACCESS
            </p>
            <span className="rounded-md bg-[#e6d8be] px-2 py-0.5 text-[9px] font-bold text-[#634828]">
              DEMO ONLY
            </span>
          </div>
          <h2 className="mt-1 text-lg font-bold text-[#2a1e17]">เมนูทั้งหมด</h2>
          <p className="text-[11px] text-stone-500">⚙ จัดการระบบ (8 รายการ)</p>
        </div>

        {/* Menu Items List */}
        <div className="space-y-2">
          {sidebarMenus.map((menu) => {
            const isActive = activeMenu === menu.id;
            return (
              <button
                key={menu.id}
                type="button"
                onClick={() => handleMenuClick(menu.title, menu.id)}
                className={`w-full text-left flex items-center justify-between rounded-xl p-3 transition-all duration-150 active:scale-95 ${
                  isActive
                    ? "bg-white border-2 border-[#a07844] shadow-md text-[#2a1e17] -translate-y-0.5"
                    : "bg-white/70 border border-[#ece4d8] text-stone-600 hover:bg-white hover:border-[#caa875] hover:shadow-sm"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`flex size-8 shrink-0 items-center justify-center rounded-lg text-sm transition-colors ${
                      isActive
                        ? "bg-[#a07844] text-white"
                        : "bg-[#f5ebd9] text-[#785328]"
                    }`}
                  >
                    {menu.icon}
                  </div>
                  <div className="truncate">
                    <h3 className="text-xs font-bold text-[#2a1e17] truncate">
                      {menu.title}
                    </h3>
                    <p className="text-[10px] text-stone-400 truncate">{menu.desc}</p>
                  </div>
                </div>
                <span
                  className={`text-xs ml-1 transition-transform ${
                    isActive ? "translate-x-1 text-[#a07844] font-bold" : "text-stone-300"
                  }`}
                >
                  →
                </span>
              </button>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="mt-auto pt-6 text-center">
          <p className="text-[10px] text-stone-400">
            * ปุ่มกดทำงานได้ แต่จะไม่เปลี่ยนหน้า (Demo Mode)
          </p>
        </div>
      </aside>

      {/* ----------------- MAIN CONTENT AREA ----------------- */}
      <div className="flex-1 p-4 sm:p-8 space-y-6 max-w-6xl min-w-0">
        
        {/* Top Header Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-bold tracking-[0.2em] text-[#a07844] uppercase">
              MUDMEE AI STUDIO / ผู้ดูแลระบบ
            </p>
            <h1 className="mt-1 text-3xl font-bold sm:text-4xl text-[#2a1e17] flex items-center gap-2">
              สวัสดี, ผู้ดูแลระบบ <span className="text-xl">✦</span>
            </h1>
            <p className="mt-1 text-sm text-[#786b5e]">
              จัดการข้อมูลและภาพรวมของแพลตฟอร์ม
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-60">
              <span className="absolute inset-y-0 left-3 flex items-center text-xs text-stone-400">
                🔍
              </span>
              <input
                type="text"
                placeholder="ค้นหาเมนูหรือรายการ..."
                className="w-full rounded-full border border-stone-200 bg-white py-2 pl-9 pr-4 text-xs shadow-sm focus:border-[#a07844] focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[#eee6d8] px-3 py-1.5 text-[10px] font-bold text-[#634828]">
                DEMO WORKSPACE
              </span>
              <div className="flex size-8 items-center justify-center rounded-full bg-[#eee6d8] text-xs font-bold text-[#634828]">
                ผ
              </div>
            </div>
          </div>
        </div>

        {/* Top Summary Cards (3 Cards) */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {summaryStats.map((stat, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between rounded-2xl border border-[#ece4d8] bg-white p-5 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`flex size-12 items-center justify-center rounded-2xl text-xl ${stat.iconBg}`}
                >
                  {stat.icon}
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#2a1e17]">{stat.value}</div>
                  <div className="text-xs text-stone-500">{stat.label}</div>
                </div>
              </div>
              <span className="text-[11px] font-medium text-stone-400">
                {stat.badge}
              </span>
            </div>
          ))}
        </div>

        {/* Platform Overview Box */}
        <div className="rounded-3xl border border-[#ece4d8] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] font-bold tracking-[0.2em] text-[#a07844] uppercase">
                OVERVIEW
              </p>
              <h2 className="text-xl font-bold text-[#2a1e17]">ภาพรวมแพลตฟอร์ม</h2>
            </div>
            <button
              type="button"
              onClick={() => handleMenuClick("รีเฟรชข้อมูล", "refresh")}
              className="flex items-center gap-1 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-50 active:scale-95 transition"
            >
              ↻ รีเฟรช
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {platformOverview.map((item, idx) => (
              <div
                key={idx}
                className="rounded-2xl bg-[#f8f6f0] p-5 border border-[#f0eafe]/20"
              >
                <p className="text-xs text-stone-500">{item.label}</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-[#2a1e17]">{item.value}</span>
                  <span className="text-xs font-semibold text-emerald-600">
                    {item.change}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}