// import type { Metadata } from "next";
// import { Kanit } from "next/font/google";
// import CustomerNavbar from "@/components/CustomerNavbar";
// import "./globals.css";

// const kanit = Kanit({
//   variable: "--font-kanit",
//   subsets: ["thai"],
//   weight: ["400", "500", "600", "700"],
// });

// export const metadata: Metadata = {
//   title: "Mudmee AI Studio",
//   description: "เว็บไซต์ออกแบบลายผ้าไหมมัดหมี่ด้วย Generative AI",
// };

// export default function RootLayout({ children }: LayoutProps<"/">) {
//   return (
//     <html
//       lang="th"
//       className={`${kanit.variable} h-full antialiased`}
//     >
//       <body className="min-h-full flex flex-col">
//         <CustomerNavbar />
//         {children}
//       </body>
//     </html>
//   );
// }


import type { Metadata, Viewport } from "next";
import { Kanit } from "next/font/google";
import CustomerNavbar from "@/components/CustomerNavbar";
import "./globals.css";

const kanit = Kanit({
  variable: "--font-kanit",
  subsets: ["thai"],
  weight: ["400", "500", "600", "700"],
});

// กำหนด Viewport เพื่อรองรับอุปกรณ์มือถือโดยเฉพาะ
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // ป้องกันหน้าจอเด้งขยายหรือเสียอัตราส่วนเวลากด Input บนมือถือ
};

export const metadata: Metadata = {
  title: "Mudmee AI Studio",
  description: "เว็บไซต์ออกแบบลายผ้าไหมมัดหมี่ด้วย Generative AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="th"
      className={`${kanit.variable} h-full antialiased selection:bg-orange-200 selection:text-orange-950`}
    >
      <body className="flex min-h-screen flex-col bg-[#f7f5f0] text-[#2e261f] font-sans overflow-x-hidden">
        <CustomerNavbar />
        <main className="flex-1 w-full max-w-full overflow-x-hidden">
          {children}
        </main>
      </body>
    </html>
  );
}