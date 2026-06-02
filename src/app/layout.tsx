import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ZipKart Analytics — E-commerce Marketplace Intelligence",
    template: "%s | ZipKart Analytics",
  },
  description:
    "ZipKart Analytics is an enterprise-grade e-commerce BI platform. Track GMV, orders, seller performance, campaign ROI, and marketplace health in real time.",
  keywords: ["e-commerce", "marketplace analytics", "BI dashboard", "GMV", "India"],
  authors: [{ name: "ZipKart Analytics Team" }],
  creator: "ZipKart",
  robots: "noindex, nofollow",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0f" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body suppressHydrationWarning>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            classNames: {
              toast:
                "!bg-card !border-border !text-foreground !shadow-lg",
              title: "!font-medium !text-sm",
              description: "!text-muted-foreground !text-xs",
              actionButton: "!bg-primary !text-primary-foreground",
              cancelButton: "!bg-muted !text-muted-foreground",
              closeButton: "!bg-card !border-border",
            },
          }}
        />
      </body>
    </html>
  );
}
