import type { Metadata } from 'next'
import { getServerSession } from 'next-auth/next'
import './globals.css'
import React, {JSX} from "react";
import Providers from "@/app/providers";
import {authOptions} from "@/lib/auth";

export const metadata: Metadata = {
    title: 'BloodChain - Decentralized Blood Donation',
    description:
        'AI-powered, blockchain-verified, fully autonomous blood donation platform',
    keywords: [
        'blood donation',
        'decentralized',
        'blockchain',
        'AI matching',
        'p2p',
    ],
    openGraph: {
        title: 'BloodChain',
        description: 'Decentralized Blood Donation Platform',
        type: 'website',
    },
}

interface RootLayoutProps {
    children: React.ReactNode
}

// 3. Make the layout async
export default async function RootLayout({ children }: RootLayoutProps): Promise<JSX.Element> {
    // 4. Fetch the session on the server
    const session = await getServerSession(authOptions);

    return (
        <html lang="en" suppressHydrationWarning>
        <head>
            <meta charSet="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <link rel="manifest" href="/manifest.json" />
            <meta name="theme-color" content="#DC143C" />
            <meta name="apple-mobile-web-app-capable" content="yes" />
            <meta
                name="apple-mobile-web-app-status-bar-style"
                content="black-translucent"
            />
            <title>
                BloodChain - Decentralized Blood Donation
            </title>
        </head>
        <body className="bg-white text-gray-900">
        {/* 5. Pass the session as a prop */}
        <Providers session={session}>
            <div className="min-h-screen flex flex-col">
                <header className="bg-gradient-to-r from-red-600 to-red-800 text-white py-4 px-6 shadow-lg">
                    <h1 className="text-3xl font-bold">🩸 BloodChain</h1>
                    <p className="text-sm text-red-100">
                        Decentralized • Autonomous • Verified
                    </p>
                </header>

                <main className="flex-1">
                    {children}
                </main>

                <footer className="bg-gray-900 text-white py-6 px-6 text-center">
                    <p>&copy; 2025 BloodChain. All rights reserved.</p>
                    <p className="text-sm text-gray-400">
                        Powered by AI, Blockchain, and Community Verification
                    </p>
                </footer>
            </div>
        </Providers>
        </body>
        </html>
    )
}
