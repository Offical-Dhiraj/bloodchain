import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { DashboardContent } from './DashboardContent'

// This is now a Server Component
export default async function DashboardPage() {
    // Check session on the server
    const session = await getServerSession(authOptions)

    // Redirect immediately if no session
    if (!session) {
        redirect('/signin')
    }

    // Pass the session down to the client component
    return <DashboardContent session={session} />
}