// // "use client";

// // import { useEffect, useState, type FormEvent } from "react";

// // type Profile = { name: string; email: string; phone: string };
// // const emptyProfile: Profile = { name: "", email: "", phone: "" };

// // export default function ProfilePage() {
// //   const [profile, setProfile] = useState(emptyProfile);
// //   const [saved, setSaved] = useState(false);

// //   useEffect(() => {
// //     try {
// //       const stored = window.localStorage.getItem("mudmee-profile");
// //       if (stored) setProfile({ ...emptyProfile, ...JSON.parse(stored) as Partial<Profile> });
// //     } catch { /* Start with a blank profile when storage is unavailable. */ }
// //   }, []);

// //   function saveProfile(event: FormEvent<HTMLFormElement>) {
// //     event.preventDefault();
// //     window.localStorage.setItem("mudmee-profile", JSON.stringify(profile));
// //     setSaved(true);
// //   }

// //   return <main className="min-h-screen bg-[#f7f4ee] px-4 py-12 text-stone-800 sm:py-16">
// //     <section className="mx-auto max-w-2xl rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-9">
// //       <p className="text-xs font-bold tracking-[0.2em] text-orange-900">บัญชีของฉัน</p>
// //       <h1 className="mt-2 text-3xl font-semibold">แก้ไขโปรไฟล์</h1>
// //       <p className="mt-2 text-sm text-stone-500">จัดการข้อมูลพื้นฐานของคุณ</p>
// //       <form onSubmit={saveProfile} className="mt-8 space-y-5">
// //         {([{ key: "name", label: "ชื่อที่แสดง", type: "text" }, { key: "email", label: "อีเมล", type: "email" }, { key: "phone", label: "เบอร์โทรศัพท์", type: "tel" }] as const).map(({ key, label, type }) => <label key={key} className="block text-sm font-medium">{label}<input type={type} value={profile[key]} onChange={(event) => { setProfile((current) => ({ ...current, [key]: event.target.value })); setSaved(false); }} className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3 outline-none transition focus:border-orange-800 focus:ring-2 focus:ring-orange-100" /></label>)}
// //         <button type="submit" className="rounded-full bg-orange-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-950">บันทึกโปรไฟล์</button>
// //         {saved && <p role="status" className="text-sm text-emerald-700">บันทึกข้อมูลแล้ว</p>}
// //       </form>
// //     </section>
// //   </main>;
// // }


// "use client";

// import { useEffect, useState, type FormEvent } from "react";
// import { createClient } from "@/utils/supabase/client";

// type Profile = { name: string; email: string; phone: string };
// const emptyProfile: Profile = { name: "", email: "", phone: "" };

// export default function ProfilePage() {
//   const supabase = createClient();
//   const [profile, setProfile] = useState<Profile>(emptyProfile);
//   const [loading, setLoading] = useState(true);
//   const [saved, setSaved] = useState(false);

//   useEffect(() => {
//     async function loadUserData() {
//       try {
//         // 1. ดึงข้อมูล User จาก Supabase Auth ที่ล็อกอินอยู่
//         const { data: { user } } = await supabase.auth.getUser();

//         let localData: Partial<Profile> = {};
//         try {
//           const stored = window.localStorage.getItem("mudmee-profile");
//           if (stored) localData = JSON.parse(stored);
//         } catch { /* ignore */ }

//         if (user) {
//           // ดึงอีเมล และชื่อ (จาก metadata หรือ local storage)
//           const userEmail = user.email || "";
//           const userName = user.user_metadata?.full_name || user.user_metadata?.name || localData.name || "";
          
//           setProfile({
//             name: userName,
//             email: userEmail,
//             phone: localData.phone || "",
//           });
//         } else {
//           setProfile({ ...emptyProfile, ...localData });
//         }
//       } catch (error) {
//         console.error("Error loading profile:", error);
//       } finally {
//         setLoading(false);
//       }
//     }

//     loadUserData();
//   }, [supabase]);

//   function saveProfile(event: FormEvent<HTMLFormElement>) {
//     event.preventDefault();
//     window.localStorage.setItem("mudmee-profile", JSON.stringify(profile));
//     setSaved(true);
//   }

//   if (loading) {
//     return (
//       <main className="grid min-h-screen place-items-center bg-[#f7f4ee] px-4 text-stone-500">
//         <p>กำลังโหลดข้อมูลโปรไฟล์...</p>
//       </main>
//     );
//   }

//   return (
//     <main className="min-h-screen bg-[#f7f4ee] px-4 py-12 text-stone-800 sm:py-16">
//       <section className="mx-auto max-w-2xl rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-9">
//         <p className="text-xs font-bold tracking-[0.2em] text-orange-900">
//           บัญชีของฉัน
//         </p>
//         <h1 className="mt-2 text-3xl font-semibold">แก้ไขโปรไฟล์</h1>
//         <p className="mt-2 text-sm text-stone-500">จัดการข้อมูลพื้นฐานของคุณ</p>
        
//         <form onSubmit={saveProfile} className="mt-8 space-y-5">
//           {/* ชื่อที่แสดง */}
//           <label className="block text-sm font-medium">
//             ชื่อที่แสดง
//             <input
//               type="text"
//               value={profile.name}
//               onChange={(e) => {
//                 setProfile((curr) => ({ ...curr, name: e.target.value }));
//                 setSaved(false);
//               }}
//               placeholder="กรอกชื่อของคุณ"
//               className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3 outline-none transition focus:border-orange-800 focus:ring-2 focus:ring-orange-100"
//             />
//           </label>

//           {/* อีเมล (Read-only เพราะมาจากบัญชีที่ล็อกอิน) */}
//           <label className="block text-sm font-medium text-stone-700">
//             อีเมล
//             <input
//               type="email"
//               value={profile.email}
//               readOnly
//               disabled
//               className="mt-2 w-full rounded-xl border border-stone-200 bg-stone-100 px-4 py-3 text-stone-500 cursor-not-allowed outline-none"
//             />
//             <span className="mt-1 block text-xs text-stone-400">
//               อีเมลถูกผูกกับบัญชีผู้ใช้ ไม่สามารถแก้ไขได้
//             </span>
//           </label>

//           {/* เบอร์โทรศัพท์ */}
//           <label className="block text-sm font-medium">
//             เบอร์โทรศัพท์
//             <input
//               type="tel"
//               value={profile.phone}
//               onChange={(e) => {
//                 setProfile((curr) => ({ ...curr, phone: e.target.value }));
//                 setSaved(false);
//               }}
//               placeholder="08X-XXX-XXXX"
//               className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3 outline-none transition focus:border-orange-800 focus:ring-2 focus:ring-orange-100"
//             />
//           </label>

//           <div className="flex items-center gap-4 pt-2">
//             <button
//               type="submit"
//               className="rounded-full bg-orange-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-950"
//             >
//               บันทึกโปรไฟล์
//             </button>
//             {saved && (
//               <p role="status" className="text-sm font-medium text-emerald-700">
//                 ✓ บันทึกข้อมูลแล้ว
//               </p>
//             )}
//           </div>
//         </form>
//       </section>
//     </main>
//   );
// }

"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createClient } from "@/utils/supabase/client";

type Profile = { name: string; email: string; phone: string };
const emptyProfile: Profile = { name: "", email: "", phone: "" };

export default function ProfilePage() {
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function loadUserData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        let localData: Partial<Profile> = {};
        try {
          const stored = window.localStorage.getItem("mudmee-profile");
          if (stored) localData = JSON.parse(stored);
        } catch { /* ignore */ }

        if (user) {
          const userEmail = user.email || "";
          const userName = localData.name || user.user_metadata?.full_name || user.user_metadata?.name || "";
          
          setProfile({
            name: userName,
            email: userEmail,
            phone: localData.phone || "",
          });
        } else {
          setProfile({ ...emptyProfile, ...localData });
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setLoading(false);
      }
    }

    loadUserData();
  }, [supabase]);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    
    // 1. เซฟลง LocalStorage
    window.localStorage.setItem("mudmee-profile", JSON.stringify(profile));

    // 2. เซฟลง Supabase Auth User Metadata
    try {
      await supabase.auth.updateUser({
        data: { full_name: profile.name, name: profile.name }
      });
    } catch (e) {
      console.error(e);
    }

    // 3. ยิง Event ให้ Navbar รู้ตัวแล้วอัปเดตชื่อทันที
    window.dispatchEvent(new Event("mudmee-profile-updated"));

    setSaved(true);
  }

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f7f4ee] px-4 text-stone-500">
        <p>กำลังโหลดข้อมูลโปรไฟล์...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f4ee] px-4 py-12 text-stone-800 sm:py-16">
      <section className="mx-auto max-w-2xl rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-9">
        <p className="text-xs font-bold tracking-[0.2em] text-orange-900">
          บัญชีของฉัน
        </p>
        <h1 className="mt-2 text-3xl font-semibold">แก้ไขโปรไฟล์</h1>
        <p className="mt-2 text-sm text-stone-500">จัดการข้อมูลพื้นฐานของคุณ</p>
        
        <form onSubmit={saveProfile} className="mt-8 space-y-5">
          <label className="block text-sm font-medium">
            ชื่อที่แสดง
            <input
              type="text"
              value={profile.name}
              onChange={(e) => {
                setProfile((curr) => ({ ...curr, name: e.target.value }));
                setSaved(false);
              }}
              placeholder="กรอกชื่อของคุณ"
              className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3 outline-none transition focus:border-orange-800 focus:ring-2 focus:ring-orange-100"
            />
          </label>

          <label className="block text-sm font-medium text-stone-700">
            อีเมล
            <input
              type="email"
              value={profile.email}
              readOnly
              disabled
              className="mt-2 w-full rounded-xl border border-stone-200 bg-stone-100 px-4 py-3 text-stone-500 cursor-not-allowed outline-none"
            />
            <span className="mt-1 block text-xs text-stone-400">
              อีเมลถูกผูกกับบัญชีผู้ใช้ ไม่สามารถแก้ไขได้
            </span>
          </label>

          <label className="block text-sm font-medium">
            เบอร์โทรศัพท์
            <input
              type="tel"
              value={profile.phone}
              onChange={(e) => {
                setProfile((curr) => ({ ...curr, phone: e.target.value }));
                setSaved(false);
              }}
              placeholder="08X-XXX-XXXX"
              className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3 outline-none transition focus:border-orange-800 focus:ring-2 focus:ring-orange-100"
            />
          </label>

          <div className="flex items-center gap-4 pt-2">
            <button
              type="submit"
              className="rounded-full bg-orange-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-950"
            >
              บันทึกโปรไฟล์
            </button>
            {saved && (
              <p role="status" className="text-sm font-medium text-emerald-700">
                ✓ บันทึกข้อมูลแล้ว
              </p>
            )}
          </div>
        </form>
      </section>
    </main>
  );
}