import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "FeatureKit Next + Supabase fixture",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <div className="banner" role="note">
          Local reference host for the Import Center. It talks only to a local Supabase stack and holds
          development-only seed data. It is not an installer output or a production deployment.
        </div>
        {children}
      </body>
    </html>
  );
}
