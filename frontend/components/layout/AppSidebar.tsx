'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    MessageSquare,
    FileText,
    Settings,
    LogOut,
    Menu,
    X,
    CreditCard,
    UserCircle,
    Calculator,
    ClipboardList,
    FlaskConical
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export default function AppSidebar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(true); // Default open on desktop
    const [mobileOpen, setMobileOpen] = useState(false);

    const links = [
        { href: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/app/planner', label: 'Planner Chat', icon: MessageSquare },
        { href: '/app/calculators', label: 'Calculators', icon: Calculator },
        { href: '/app/load-test-data', label: 'Load Test Data', icon: FlaskConical },
        { href: '/app/financial-report', label: 'Financial Report', icon: ClipboardList },
        { href: '/app/report', label: 'AI Report', icon: FileText },
        { href: '/app/profile', label: 'My Profile', icon: UserCircle },
    ];

    return (
        <>
            {/* Mobile Trigger */}
            <div className="md:hidden fixed top-4 left-4 z-50">
                <Button variant="outline" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
                    {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                </Button>
            </div>

            {/* Sidebar Container */}
            <aside className={cn(
                "fixed inset-y-0 left-0 z-40 bg-white border-r border-gray-100 shadow-sm transition-all duration-300 md:translate-x-0",
                mobileOpen ? "translate-x-0 w-64" : "-translate-x-full md:w-64",
            )}>
                <div className="flex flex-col h-full">

                    {/* Header */}
                    <div className="h-16 flex items-center px-6 border-b border-gray-50">
                        <div className="font-bold text-xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            FinPlan.AI
                        </div>
                    </div>

                    {/* Nav Links */}
                    <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
                        {links.map((link) => {
                            const isActive = pathname === link.href;
                            return (
                                <Link key={link.href} href={link.href}>
                                    <div className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer mb-1",
                                        isActive
                                            ? "bg-blue-50 text-blue-700 shadow-sm border border-blue-100"
                                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                    )}>
                                        <link.icon size={18} className={cn(isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600")} />
                                        <span>{link.label}</span>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-gray-50 space-y-1">
                        <Link href="/settings">
                            <div className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer">
                                <Settings size={18} />
                                <span>Settings</span>
                            </div>
                        </Link>
                        <Link href="/login">
                            <div className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg cursor-pointer">
                                <LogOut size={18} />
                                <span>Sign Out</span>
                            </div>
                        </Link>
                    </div>

                    {/* User Mini Profile */}
                    <div className="p-4 bg-gray-50 m-4 rounded-xl flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                            AT
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium text-gray-900 truncate">Ajith Thaduri</p>
                            <p className="text-xs text-gray-500 truncate">Free Plan</p>
                        </div>
                    </div>

                </div>
            </aside>

            {/* Mobile Overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/20 z-30 md:hidden backdrop-blur-sm"
                    onClick={() => setMobileOpen(false)}
                />
            )}
        </>
    );
}
