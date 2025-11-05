'use client'

import React from "react";
import Link from 'next/link'
import {usePathname} from 'next/navigation'
import {cn} from '@/lib/utils'
// Define your navigation links here
const routes = [
    {href: '/dashboard', label: 'Dashboard'},
    {href: '/donors', label: 'Find Donors'},
    {href: '/requests', label: 'Blood Requests'},
]

interface MainNavProps extends React.HTMLAttributes<HTMLElement> {
    onClick?: () => void
}

export function MainNav({
                            className,
                            onClick,
                            ...props
                        }: MainNavProps) {
    const pathname = usePathname()

    return (
        <nav
            className={cn('flex items-center space-x-4 lg:space-x-6', className)}
            {...props}
        >
            {routes.map((route) => (
                <Link
                    key={route.href}
                    href={route.href}
                    className={cn(
                        'text-sm font-medium transition-colors hover:text-primary',
                        pathname === route.href
                            ? 'text-black dark:text-white'
                            : 'text-muted-foreground'
                    )}
                    onClick={onClick}
                >
                    {route.label}
                </Link>
            ))}
        </nav>
    )
}