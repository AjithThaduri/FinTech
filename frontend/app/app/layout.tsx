import AppSidebar from '@/components/layout/AppSidebar';

export default function AppLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-blue-50/20">
            <AppSidebar />
            <main className="md:ml-64 min-h-screen transition-all duration-300">
                <div className="container mx-auto p-4 md:p-8 pt-20 md:pt-8 max-w-7xl animate-in fade-in duration-500">
                    {children}
                </div>
            </main>
        </div>
    )
}
