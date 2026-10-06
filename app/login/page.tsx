// "use client";

// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import { createClient } from "@/utils/supabase/client";


// export default function LoginPage() {

//     const supabase = createClient();

//     const router = useRouter();

//     const [email, setEmail] = useState("");

//     const [password, setPassword] =
//         useState("");

//     const [error, setError] =
//         useState("");

//     const [loading, setLoading] =
//         useState(false);


//     async function handleLogin(
//         event: React.FormEvent<HTMLFormElement>
//     ) {

//         event.preventDefault();

//         setError("");

//         setLoading(true);


//         const { error } =
//             await supabase.auth.signInWithPassword({

//                 email: email,

//                 password: password,

//             });


//         if (error) {

//             setError(
//                 "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
//             );

//             setLoading(false);

//             return;
//         }


//         router.push("/");

//         router.refresh();

//     }


//     return (

//         <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">

//             <div className="absolute inset-0 bg-[url('/bg.png')] bg-cover bg-center bg-no-repeat blur-sm scale-105" />

//             <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">


//                 {/* Header */}

//                 <div className="mb-8 text-center">


//                     <h1 className="mt-2 text-3xl font-bold">
//                         ยินดีต้อนรับเข้าสู่ระบบ
//                     </h1>

//                     <p className="mt-2 text-sm text-stone-500">
//                         สั่งซื้อผ้าไหมมัดหมี่ตรงตามที่คุณต้องการ
//                     </p>

//                 </div>


//                 {/* Form */}

//                 <form
//                     onSubmit={handleLogin}
//                     className="space-y-5"
//                 >


//                     {/* Email */}

//                     <div className="relative">

//                         <label className="absolute -top-3 left-4 bg-white px-2 text-sm text-stone-600">บัญชีผู้ใช้</label>

//                         <img src="/user.png"alt=""className="pointer-events-none absolute left-6 top-1/2 h-4 w-4 -translate-y-1/2 z-10"/>

//                         <input
//                             type="email"
//                             value={email}
//                             onChange={(event) =>
//                                 setEmail(
//                                     event.target.value
//                                 )
//                             }
//                             className="w-full rounded-4xl border-2 border-[#4F1E0C] px-4 py-3 pl-12 outline-none focus:border-2 focus:border-[#D97706]"
//                             required
//                         />

//                     </div>


//                     {/* Password */}

//                     <div className="relative">

//                         <label className="absolute -top-3 left-4 bg-white px-2 text-sm text-stone-600">รหัสผ่าน</label>

//                         <img src="/password.png"alt=""className="absolute left-6 top-1/2 h-4 w-4 -translate-y-1/2"/>

//                         <input
//                             type="password"
//                             value={password}
//                             onChange={(event) =>
//                                 setPassword(
//                                     event.target.value
//                                 )
//                             }
//                             className="w-full rounded-4xl border-2 border-[#4F1E0C] px-4 py-3 pl-12 outline-none focus:border-2 focus:border-[#D97706]"
//                             required
//                         />

//                     </div>


//                     {/* Error */}

//                     {error && (

//                         <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">
//                             {error}
//                         </div>

//                     )}


//                     {/* Login Button */}

//                     <button
//                         type="submit"
//                         disabled={loading}
//                         className="w-full rounded-4xl bg-[#4F1E0C] py-3 font-semibold text-white transition hover:bg-orange-800 disabled:cursor-not-allowed disabled:opacity-50"
//                     >

//                         {loading
//                             ? "กำลังเข้าสู่ระบบ..."
//                             : "เข้าสู่ระบบ"}

//                     </button>


//                 </form>

//                 <div className="mt-4 text-right text-sm">
//                     <a href="/forgot-password" className="font-medium text-orange-800 hover:underline">ลืมรหัสผ่าน?</a>
//                 </div>


//                 {/* Register */}

//                 <div className="mt-6 text-center text-sm text-stone-500">

//                     ยังไม่มีบัญชี?

//                     {" "}

//                     <a
//                         href="/register"
//                         className="font-semibold text-orange-700 hover:underline"
//                     >
//                         สมัครสมาชิก
//                     </a>

//                 </div>

//                 <div className="flex items-center gap-4 mt-4">
//                     <div className="h-px flex-1 bg-stone-300" />

//                     <span className="text-sm text-stone-500">
//                         หรือ
//                     </span>

//                     <div className="h-px flex-1 bg-stone-300" />
//                 </div>

//                 <div>

//                 </div>
//             </div>

//         </main>

//     );
 
// }
  
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      setLoading(false);
      return;
    }

    // ล็อกอินสำเร็จ -> ย้ายไปหน้าหลักและสั่งรีเฟรชอัปเดต State Navbar
    router.push("/home");
    router.refresh();
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
      <div className="absolute inset-0 bg-[url('/bg.png')] bg-cover bg-center bg-no-repeat blur-sm scale-105" />

      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mt-2 text-3xl font-bold">ยินดีต้อนรับเข้าสู่ระบบ</h1>
          <p className="mt-2 text-sm text-stone-500">
            สั่งซื้อผ้าไหมมัดหมี่ตรงตามที่คุณต้องการ
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          {/* Email */}
          <div className="relative">
            <label className="absolute -top-3 left-4 bg-white px-2 text-sm text-stone-600">บัญชีผู้ใช้</label>
            <img src="/user.png" alt="" className="pointer-events-none absolute left-6 top-1/2 h-4 w-4 -translate-y-1/2 z-10"/>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-4xl border-2 border-[#4F1E0C] px-4 py-3 pl-12 outline-none focus:border-2 focus:border-[#D97706]"
              required
            />
          </div>

          {/* Password */}
          <div className="relative">
            <label className="absolute -top-3 left-4 bg-white px-2 text-sm text-stone-600">รหัสผ่าน</label>
            <img src="/password.png" alt="" className="absolute left-6 top-1/2 h-4 w-4 -translate-y-1/2"/>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-4xl border-2 border-[#4F1E0C] px-4 py-3 pl-12 outline-none focus:border-2 focus:border-[#D97706]"
              required
            />
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-4xl bg-[#4F1E0C] py-3 font-semibold text-white transition hover:bg-orange-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>

        <div className="mt-4 text-right text-sm">
          <a href="/forgot-password" className="font-medium text-orange-800 hover:underline">ลืมรหัสผ่าน?</a>
        </div>

        {/* Register Link */}
        <div className="mt-6 text-center text-sm text-stone-500">
          ยังไม่มีบัญชี?{" "}
          <a href="/register" className="font-semibold text-orange-700 hover:underline">
            สมัครสมาชิก
          </a>
        </div>

        <div className="flex items-center gap-4 mt-4">
          <div className="h-px flex-1 bg-stone-300" />
          <span className="text-sm text-stone-500">หรือ</span>
          <div className="h-px flex-1 bg-stone-300" />
        </div>
      </div>
    </main>
  );
}