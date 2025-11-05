import type {Metadata, Viewport} from 'next'
import {Inter} from 'next/font/google';
import './globals.css'
import React, {JSX} from "react";
import Providers from "@/app/providers";
import {Header} from "@/components/layout/Header";
import {Footer} from '@/components/layout/Footer';

// Set up the font
const inter = Inter({
    subsets: ['latin'],
    variable: '--font-sans', // CSS variable for Tailwind
})

export const metadata: Metadata = {
    title: 'BloodChain - Decentralized Blood Donation',
    description: 'AI-powered, blockchain-verified, fully autonomous blood donation platform',
    keywords: ['blood donation', 'decentralized', 'blockchain', 'AI matching', 'p2p'],
    openGraph: {
        title: 'BloodChain',
        description: 'Decentralized Blood Donation Platform',
        type: 'website',
    },
    // manifest: '/manifest.json', // Uncomment if you have one
}

//  Viewport metadata for theme-color and mobile settings
export const viewport: Viewport = {
    themeColor: '#DC143C',
    width: 'device-width',
    initialScale: 1,
}


interface RootLayoutProps {
    children: React.ReactNode
}

// 3. Make the layout async
export default function RootLayout({children}: RootLayoutProps): JSX.Element {
    return (
        <html lang="en" className={inter.variable} suppressHydrationWarning>
        <body className="bg-background text-foreground font-sans antialiased">
        {/* 5. Pass the session as a prop */}
        <Providers session={null}>
            <div className="relative flex min-h-screen flex-col">
                <Header/>
                <main className="flex-1">
                    {children}
                </main>
                <Footer/>
            </div>
        </Providers>
        </body>
        </html>
    )
}
