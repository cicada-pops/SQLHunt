import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import localFont from "next/font/local"
import type { Metadata } from "next"
import Script from "next/script"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

const chomsky = localFont({
  src: "../public/fonts/Chomsky.otf",
  variable: "--font-chomsky",
  display: "swap",
})

const heathergreen = localFont({
  src: "../public/fonts/Heathergreen.otf",
  variable: "--font-heathergreen",
  display: "swap",
})

// Добавляем шрифты TT Rationalist
const rationalistBold = localFont({
  src: "../public/fonts/TT-Rationalist-Bold.ttf",
  variable: "--font-rationalist-bold",
  display: "swap",
})

const rationalistLight = localFont({
  src: "../public/fonts/TT-Rationalist-Light.ttf",
  variable: "--font-rationalist-light",
  display: "swap",
})

const rationalistDemiBold = localFont({
  src: "../public/fonts/TT-Rationalist-DemiBold.ttf",
  variable: "--font-rationalist-demibold",
  display: "swap",
})

export const metadata: Metadata = {
  title: "SQL Hunt",
  description: "A detective mystery game",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Предзагрузка фонового изображения */}
        <link rel="preload" href="/images/background.webp" as="image" />
      </head>
      <body className={`${inter.variable} ${chomsky.variable} ${heathergreen.variable} ${rationalistBold.variable} ${rationalistLight.variable} ${rationalistDemiBold.variable} font-sans`} suppressHydrationWarning>
        {/* Скрипт для удаления атрибутов, добавляемых расширениями Chrome, 
            которые вызывают ошибки гидратации */}
        <Script id="remove-cz-attrs" strategy="beforeInteractive">
          {`
            (function() {
              // Удаляем атрибуты, добавляемые Chrome расширениями перед гидратацией
              if (typeof window !== 'undefined') {
                // Выполняется как можно раньше, до гидратации React
                document.addEventListener('DOMContentLoaded', function() {
                  document.querySelectorAll('[cz-shortcut-listen]').forEach(el => {
                    el.removeAttribute('cz-shortcut-listen');
                  });
                });
              }
            })();
          `}
        </Script>
        {children}
      </body>
    </html>
  )
}