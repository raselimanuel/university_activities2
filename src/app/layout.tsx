import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "UNSRAT E-Organization",
  description: "Ruang digital ORMAWA Universitas Sam Ratulangi untuk organisasi, kegiatan, pengumuman, dan prestasi mahasiswa.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${inter.variable} h-100`} data-scroll-behavior="smooth">
      <body className="d-flex flex-column min-vh-100 bg-light">
        {children}
      </body>
    </html>
  );
}
