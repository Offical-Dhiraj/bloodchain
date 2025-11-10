'use client'

import { useRouter } from 'next/navigation'

interface QuickActionsProps {
    role: string | undefined
}

// This is a Client Component because it uses hooks (useRouter) and event handlers (onClick)
export function QuickActions({ role }: QuickActionsProps) {
    const router = useRouter()

    const handleNavigate = (path: string) => {
        router.push(path)
    }

    return (
        <div className="grid md:grid-cols-2 gap-6">
            {role === 'RECIPIENT' && (
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                    <h2 className="text-2xl font-bold mb-4 text-gray-800">New Request</h2>
                    <p className="text-gray-600 mb-4">Need blood? Create a new request to find donors near you.</p>
                    <button
                        onClick={() => handleNavigate('/requests/new')}
                        className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                    >
                        Create Blood Request
                    </button>
                </div>
            )}

            {role === 'DONOR' && (
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                    <h2 className="text-2xl font-bold mb-4 text-gray-800">Donate Blood</h2>
                    <p className="text-gray-600 mb-4">View active requests and find opportunities to save a life.</p>
                    <button
                        onClick={() => handleNavigate('/requests/matching')}
                        className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                    >
                        View Matching Requests
                    </button>
                </div>
            )}

            {/* Profile Settings card - visible to all roles */}
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Profile Settings</h2>
                <p className="text-gray-600 mb-4">Keep your contact information and blood type up to date.</p>
                <button
                    onClick={() => handleNavigate('/settings/profile')}
                    className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
                >
                    Update Profile
                </button>
            </div>
        </div>
    )
}