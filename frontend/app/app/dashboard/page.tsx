'use client';
import SummaryDashboard from '@/components/widgets/SummaryDashboard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle, Wallet, ArrowRight, Sparkles, BarChart3 } from 'lucide-react';
import { useFinancialStore } from '../../../store/useFinancialStore';

export default function DashboardPage() {
    const hasData = useFinancialStore(state => state.user_profile.primary.name !== '');

    if (!hasData) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh]">
                <div className="bg-white p-12 rounded-3xl shadow-xl shadow-indigo-100 border border-gray-100 text-center max-w-lg w-full relative overflow-hidden group hover:shadow-2xl transition-all duration-300">
                    {/* Decorative Background Elements */}
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-50 rounded-full blur-3xl opacity-60"></div>
                    <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-50 rounded-full blur-3xl opacity-60"></div>

                    {/* Icon Composition */}
                    <div className="relative mb-8 inline-block">
                        <div className="w-24 h-24 bg-indigo-50/80 rounded-full flex items-center justify-center relative z-10 mx-auto">
                            <BarChart3 className="w-10 h-10 text-indigo-600 opacity-80" />
                        </div>
                        {/* Floating elements */}
                        <div className="absolute top-0 right-0 p-2 bg-white rounded-xl shadow-lg border border-gray-100 animate-bounce [animation-delay:-0.2s]">
                            <Sparkles className="w-4 h-4 text-amber-400" />
                        </div>
                        <div className="absolute bottom-0 left-0 p-2 bg-white rounded-xl shadow-lg border border-gray-100 animate-bounce [animation-delay:-0.5s]">
                            <Wallet className="w-4 h-4 text-emerald-500" />
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 mb-3">Your Financial Dashboard</h2>
                    <p className="text-gray-500 leading-relaxed mb-8">
                        It looks like you haven't created a plan yet. Start our AI-powered wizard to unlock insights, track net worth, and plan your retirement.
                    </p>

                    <Link href="/app/planner">
                        <Button size="lg" className="rounded-full h-12 px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/30 w-full sm:w-auto group-hover:scale-105 transition-transform">
                            <PlusCircle className="mr-2 h-5 w-5" /> Create My Plan <ArrowRight className="ml-2 h-4 w-4 opacity-70 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
                    <p className="text-gray-500">Your financial health at a glance.</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/app/report">
                        <Button variant="outline" className="bg-white shadow-sm hover:bg-gray-50">View Report</Button>
                    </Link>
                    <Link href="/app/planner">
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20">Update Plan</Button>
                    </Link>
                </div>
            </div>

            <SummaryDashboard />
        </div>
    )
}
