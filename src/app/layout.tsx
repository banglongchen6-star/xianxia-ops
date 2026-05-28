import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "线下运营管理系统",
  description: "音乐密码线下活动运营跟踪平台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full">
      <body className="min-h-full bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
