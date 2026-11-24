import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Arizona — A clearer view of medicine",
  description:
    "Explore conditions, clinical trials, drug labels, research and medical imaging, linked to public sources.",
  icons: {
    icon: "/images/favicon.png",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-mode="light">
      <body>{children}</body>
    </html>
  );
}
