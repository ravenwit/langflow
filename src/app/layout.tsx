import "./globals.css";
import React from "react";

export const metadata = {
  title: "LanFlow — AI-Driven German Acquisition Engine",
  description: "Accelerated German acquisition platform powered by Universal Design for Learning (UDL) and Multisensory Structured Language Teaching (MSLT).",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
