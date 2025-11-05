'use client'

import * as React from 'react'
import Link from 'next/link'
import {Menu} from 'lucide-react'
import {Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,} from '@/components/ui/sheet'
import {Button} from '@/components/ui/button'
import {MainNav} from '@/components/layout/MainNav' // We reuse the main nav

export function MobileNav() {
    // State to control if the sheet is open or closed
    const [isOpen, setIsOpen] = React.useState(false)

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden" // Only show on mobile
                >
                    <Menu className="h-5 w-5"/>
                    <span className="sr-only">Toggle Menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left">
                <SheetHeader>
                    <SheetTitle>
                        {/* Logo inside the menu */}
                        <Link
                            href="/"
                            className="flex items-center gap-2"
                            onClick={() => setIsOpen(false)} // Close menu on click
                        >
                            <span className="text-2xl font-bold text-red-600">🩸</span>
                            <span className="text-xl font-bold tracking-tight">BloodChain</span>
                        </Link>
                    </SheetTitle>
                </SheetHeader>

                {/* Reuse the MainNav component, but style it for mobile */}
                <div className="mt-8 flex flex-col space-y-4">
                    <MainNav
                        className="flex-col items-start space-x-0 space-y-4"
                        // Pass a click handler to close the sheet when a link is clicked
                        onClick={() => setIsOpen(false)}
                    />
                </div>
            </SheetContent>
        </Sheet>
    )
}