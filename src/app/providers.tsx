// app/providers.tsx
"use client";

import type {Session} from "next-auth";
import {SessionProvider} from "next-auth/react";
import React from "react";
import {ThemeProvider} from 'next-themes'

export default function Providers({
                                      session,
                                      children,
                                  }: {
    session: Session | null;
    children: React.ReactNode;
}) {
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            <SessionProvider session={session}>{children}</SessionProvider>;)
        </ThemeProvider>
    )
}