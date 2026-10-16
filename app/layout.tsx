import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { DashboardProvider } from "@/lib/DashboardContext";

export const metadata: Metadata = {
  title: "PetroTwin — Digital Twin Dashboard",
  description: "Real-time monitoring fleet for petrol tanker trucks",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="w-screen h-screen overflow-hidden">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <DashboardProvider>
            {children}
          </DashboardProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
