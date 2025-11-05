// components/layout/Footer.tsx
export function Footer() {
    return (
        <footer className="bg-gray-100 dark:bg-gray-900">
            <div className="container mx-auto max-w-7xl px-4 py-6 text-center text-gray-600 dark:text-gray-400 sm:px-6 lg:px-8">
                <p className="text-sm">
                    &copy; {new Date().getFullYear()} BloodChain. All rights reserved.
                </p>
                <p className="mt-1 text-xs">
                    Powered by AI, Blockchain, and Community Verification
                </p>
            </div>
        </footer>
    )
}