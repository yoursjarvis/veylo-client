// import { Geist, Geist_Mono, Inter } from "next/font/google"
import { Geist_Mono, Merriweather, Poppins } from "next/font/google"

import { QueryProvider } from "@/components/query-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { ThemeToggle } from "@/components/theme-toggle"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Metadata } from "next"
import NextTopLoader from "nextjs-toploader"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import "./globals.css"

const fontSans = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-sans",
})

const fontSerif = Merriweather({
  subsets: ["latin"],
  variable: "--font-serif",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME,
  description: "Project Management Tool",
  icons: {
    icon: [
      {
        url: "/logos/orbiq-logo-icon-black.svg",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/logos/orbiq-logo-icon-white.svg",
        media: "(prefers-color-scheme: dark)",
      },
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fontSans.variable} ${fontSerif.variable} ${fontMono.variable} antialiased`}
    >
      <body className="overflow-x-hidden antialiased">
        <ThemeProvider>
          <ThemeToggle />
          <NextTopLoader
            color="var(--primary)"
            height={3}
            showSpinner={false}
            shadow="0 0 10px var(--primary),0 0 5px var(--primary)"
          />
          <QueryProvider>
            <TooltipProvider>
              <NuqsAdapter>
                {children}
                <Toaster />
              </NuqsAdapter>
            </TooltipProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
