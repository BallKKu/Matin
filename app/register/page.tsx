// // "use client";

// // import { useState } from "react";
// // import { useRouter } from "next/navigation";
// // import { createClient } from "@/utils/supabase/client";


// // export default function RegisterPage() {

// //   const supabase = createClient();

// //   const router = useRouter();

// //   const [email, setEmail] = useState("");

// //   const [password, setPassword] =
// //     useState("");

// //   const [confirmPassword, setConfirmPassword] =
// //     useState("");

// //   const [error, setError] =
// //     useState("");

// //   const [loading, setLoading] =
// //     useState(false);


// //   async function handleRegister(
// //     event: React.FormEvent<HTMLFormElement>
// //   ) {

// //     event.preventDefault();

// //     setError("");


// //     // -------------------------------
// //     // ตรวจสอบข้อมูล
// //     // -------------------------------

// //     if (
// //       email.trim() === "" ||
// //       password === "" ||
// //       confirmPassword === ""
// //     ) {

// //       setError(
// //         "กรุณากรอกข้อมูลให้ครบ"
// //       );

// //       return;
// //     }


// //     if (
// //       password !== confirmPassword
// //     ) {

// //       setError(
// //         "รหัสผ่านไม่ตรงกัน"
// //       );

// //       return;
// //     }


// //     setLoading(true);


// //     // -------------------------------
// //     // สมัครสมาชิก Supabase
// //     // -------------------------------

// //     const {
// //       error,
// //     } =
// //       await supabase.auth.signUp({

// //         email: email,

// //         password: password,

// //       });


// //     if (error) {

// //       console.error(
// //         error
// //       );

// //       setError(
// //         error.message
// //       );

// //       setLoading(false);

// //       return;
// //     }


// //     // -------------------------------
// //     // สมัครสำเร็จ
// //     // -------------------------------

// //     router.push("/");

// //     router.refresh();

// //   }


// //   return (

// //     <main className="flex min-h-screen items-center justify-center bg-orange-50 px-6">

// //       <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">


// //         {/* Header */}

// //         <div className="mb-8 text-center">

// //           <p className="text-sm font-medium tracking-widest text-orange-700">
// //             MUDMEE AI STUDIO
// //           </p>

// //           <h1 className="mt-2 text-3xl font-bold">
// //             สมัครสมาชิก
// //           </h1>

// //           <p className="mt-2 text-sm text-stone-500">
// //             สร้างบัญชีเพื่อเริ่มใช้งานเว็บไซต์
// //           </p>

// //         </div>


// //         {/* Form */}

// //         <form
// //           onSubmit={handleRegister}
// //           className="space-y-5"
// //         >


// //           {/* Email */}

// //           <div>

// //             <label className="mb-2 block text-sm font-medium">
// //               อีเมล
// //             </label>

// //             <input
// //               type="email"
// //               value={email}
// //               onChange={(event) =>
// //                 setEmail(
// //                   event.target.value
// //                 )
// //               }
// //               placeholder="example@email.com"
// //               className="w-full rounded-xl border border-orange-200 px-4 py-3 outline-none focus:ring-2 focus:ring-orange-300"
// //               required
// //             />

// //           </div>


// //           {/* Password */}

// //           <div>

// //             <label className="mb-2 block text-sm font-medium">
// //               รหัสผ่าน
// //             </label>

// //             <input
// //               type="password"
// //               value={password}
// //               onChange={(event) =>
// //                 setPassword(
// //                   event.target.value
// //                 )
// //               }
// //               placeholder="รหัสผ่าน"
// //               className="w-full rounded-xl border border-orange-200 px-4 py-3 outline-none focus:ring-2 focus:ring-orange-300"
// //               required
// //             />

// //           </div>


// //           {/* Confirm Password */}

// //           <div>

// //             <label className="mb-2 block text-sm font-medium">
// //               ยืนยันรหัสผ่าน
// //             </label>

// //             <input
// //               type="password"
// //               value={confirmPassword}
// //               onChange={(event) =>
// //                 setConfirmPassword(
// //                   event.target.value
// //                 )
// //               }
// //               placeholder="กรอกรหัสผ่านอีกครั้ง"
// //               className="w-full rounded-xl border border-orange-200 px-4 py-3 outline-none focus:ring-2 focus:ring-orange-300"
// //               required
// //             />

// //           </div>


// //           {/* Error */}

// //           {error && (

// //             <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">
// //               {error}
// //             </div>

// //           )}


// //           {/* Register Button */}

// //           <button
// //             type="submit"
// //             disabled={loading}
// //             className="w-full rounded-xl bg-orange-700 py-3 font-semibold text-white transition hover:bg-orange-800 disabled:cursor-not-allowed disabled:opacity-50"
// //           >

// //             {loading
// //               ? "กำลังสมัครสมาชิก..."
// //               : "สมัครสมาชิก"}

// //           </button>


// //         </form>


// //         {/* Login */}

// //         <div className="mt-6 text-center text-sm text-stone-500">

// //           มีบัญชีอยู่แล้ว?

// //           {" "}

// //           <a
// //             href="/login"
// //             className="font-semibold text-orange-700 hover:underline"
// //           >
// //             เข้าสู่ระบบ
// //           </a>

// //         </div>


// //       </div>

// //     </main>

// //   );
// // }

// "use client";

// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import { createClient } from "@/utils/supabase/client";

// export default function RegisterPage() {
//   const supabase = createClient();
//   const router = useRouter();

//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [confirmPassword, setConfirmPassword] = useState("");
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(false);

//   async function handleRegister(event: React.FormEvent<HTMLFormElement>) {
//     event.preventDefault();
//     setError("");

//     if (email.trim() === "" || password === "" || confirmPassword === "") {
//       setError("กรุณากรอกข้อมูลให้ครบ");
//       return;
//     }

//     if (password !== confirmPassword) {
//       setError("รหัสผ่านไม่ตรงกัน");
//       return;
//     }

//     setLoading(true);

//     const { error } = await supabase.auth.signUp({
//       email: email,
//       password: password,
//     });

//     if (error) {
//       console.error(error);
//       setError(error.message);
//       setLoading(false);
//       return;
//     }

//     // สมัครสมาชิกสำเร็จ -> ให้ผู้ใช้ไปเข้าสู่ระบบ
//     alert("สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ");
//     router.push("/login");
//   }

//   return (
//     <main className="flex min-h-screen items-center justify-center bg-orange-50 px-6">
//       <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
//         {/* Header */}
//         <div className="mb-8 text-center">
//           <p className="text-sm font-medium tracking-widest text-orange-700">
//             MUDMEE AI STUDIO
//           </p>
//           <h1 className="mt-2 text-3xl font-bold">สมัครสมาชิก</h1>
//           <p className="mt-2 text-sm text-stone-500">
//             สร้างบัญชีเพื่อเริ่มใช้งานเว็บไซต์
//           </p>
//         </div>

//         {/* Form */}
//         <form onSubmit={handleRegister} className="space-y-5">
//           {/* Email */}
//           <div>
//             <label className="mb-2 block text-sm font-medium">อีเมล</label>
//             <input
//               type="email"
//               value={email}
//               onChange={(event) => setEmail(event.target.value)}
//               placeholder="example@email.com"
//               className="w-full rounded-xl border border-orange-200 px-4 py-3 outline-none focus:ring-2 focus:ring-orange-300"
//               required
//             />
//           </div>

//           {/* Password */}
//           <div>
//             <label className="mb-2 block text-sm font-medium">รหัสผ่าน</label>
//             <input
//               type="password"
//               value={password}
//               onChange={(event) => setPassword(event.target.value)}
//               placeholder="รหัสผ่าน"
//               className="w-full rounded-xl border border-orange-200 px-4 py-3 outline-none focus:ring-2 focus:ring-orange-300"
//               required
//             />
//           </div>

//           {/* Confirm Password */}
//           <div>
//             <label className="mb-2 block text-sm font-medium">ยืนยันรหัสผ่าน</label>
//             <input
//               type="password"
//               value={confirmPassword}
//               onChange={(event) => setConfirmPassword(event.target.value)}
//               placeholder="กรอกรหัสผ่านอีกครั้ง"
//               className="w-full rounded-xl border border-orange-200 px-4 py-3 outline-none focus:ring-2 focus:ring-orange-300"
//               required
//             />
//           </div>

//           {/* Error */}
//           {error && (
//             <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">
//               {error}
//             </div>
//           )}

//           {/* Register Button */}
//           <button
//             type="submit"
//             disabled={loading}
//             className="w-full rounded-xl bg-orange-700 py-3 font-semibold text-white transition hover:bg-orange-800 disabled:cursor-not-allowed disabled:opacity-50"
//           >
//             {loading ? "กำลังสมัครสมาชิก..." : "สมัครสมาชิก"}
//           </button>
//         </form>

//         {/* Login Link */}
//         <div className="mt-6 text-center text-sm text-stone-500">
//           มีบัญชีอยู่แล้ว?{" "}
//           <a href="/login" className="font-semibold text-orange-700 hover:underline">
//             เข้าสู่ระบบ
//           </a>
//         </div>
//       </div>
//     </main>
//   );
// }

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function RegisterPage() {
  const supabase = createClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (email.trim() === "" || password === "" || confirmPassword === "") {
      setError("กรุณากรอกข้อมูลให้ครบ");
      return;
    }

    if (password !== confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน");
      return;
    }

    setLoading(true);

    try {
      // ระบุ emailRedirectTo ชัดเจนเพื่อป้องกัน Error: Invalid path specified in request URL
      const redirectUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/login`
          : undefined;

      const { error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) {
        console.error("Supabase SignUp Error:", error);
        setError(error.message);
        setLoading(false);
        return;
      }

      // สมัครสมาชิกสำเร็จ -> แจ้งเตือนผู้ใช้แล้วพาไปหน้าเข้าสู่ระบบ
      alert("สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ");
      router.push("/login");
    } catch (err) {
      console.error("Unexpected Error:", err);
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง");
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-orange-50 px-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        {/* Header */}
        <div className="mb-8 text-center">
          <p className="text-sm font-medium tracking-widest text-orange-700">
            MUDMEE AI STUDIO
          </p>
          <h1 className="mt-2 text-3xl font-bold">สมัครสมาชิก</h1>
          <p className="mt-2 text-sm text-stone-500">
            สร้างบัญชีเพื่อเริ่มใช้งานเว็บไซต์
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleRegister} className="space-y-5">
          {/* Email */}
          <div>
            <label className="mb-2 block text-sm font-medium">อีเมล</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="example@email.com"
              className="w-full rounded-xl border border-orange-200 px-4 py-3 outline-none focus:ring-2 focus:ring-orange-300"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="mb-2 block text-sm font-medium">รหัสผ่าน</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="รหัสผ่าน"
              className="w-full rounded-xl border border-orange-200 px-4 py-3 outline-none focus:ring-2 focus:ring-orange-300"
              required
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="mb-2 block text-sm font-medium">
              ยืนยันรหัสผ่าน
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="กรอกรหัสผ่านอีกครั้ง"
              className="w-full rounded-xl border border-orange-200 px-4 py-3 outline-none focus:ring-2 focus:ring-orange-300"
              required
            />
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Register Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-orange-700 py-3 font-semibold text-white transition hover:bg-orange-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "กำลังสมัครสมาชิก..." : "สมัครสมาชิก"}
          </button>
        </form>

        {/* Login Link */}
        <div className="mt-6 text-center text-sm text-stone-500">
          มีบัญชีอยู่แล้ว?{" "}
          <a
            href="/login"
            className="font-semibold text-orange-700 hover:underline"
          >
            เข้าสู่ระบบ
          </a>
        </div>
      </div>
    </main>
  );
}