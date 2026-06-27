// import { Geist, Geist_Mono, Inter } from "next/font/google"
import { Inter, JetBrains_Mono } from "next/font/google"

import { QueryProvider } from "@/components/query-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { ThemeToggle } from "@/components/theme-toggle"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { Metadata } from "next"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import "./globals.css"

// const geistHeading = Geist({ subsets: ["latin"], variable: "--font-heading" })

// const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

// const fontMono = Geist_Mono({
//   subsets: ["latin"],
//   variable: "--font-mono",
// })

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})



const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME,
  description: "Project Management Tool",
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
      className={cn("antialiased", fontSans.variable, fontMono.variable)}
    >
      <body className="antialiased">
        <ThemeProvider>
          <ThemeToggle />
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
