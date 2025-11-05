import Link from 'next/link'
import {getServerSession} from 'next-auth'
import {authOptions} from '@/lib/auth'
import {UserNav} from '@/components/auth/UserNav'
import {ThemeToggle} from '@/components/layout/ThemeToggle'
import {MainNav} from '@/components/layout/MainNav'
import {MobileNav} from "@/components/layout/MobileNav";


export async function Header() {
    const session = await getServerSession(authOptions)

    return (
        <header
            className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 lg:px-8">

                {/* Logo and Main Nav (Desktop) */}
                <div className="flex items-center gap-6">
                    <Link href="/" className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-red-600">🩸</span>
                        <span className="hidden text-xl font-bold tracking-tight sm:inline-block">
              BloodChain
            </span>
                    </Link>

                    {/* MainNav is hidden on mobile, visible on medium screens and up */}
                    <MainNav className="hidden md:flex"/>
                </div>

                {/* Right Side: Theme Toggle, User Menu, and Mobile Menu */}
                <div className="flex flex-1 items-center justify-end space-x-2">
                    <MobileNav/>
                    <ThemeToggle/>

                    <UserNav session={session}/>
                </div>
            </div>
        </header>
    )
}