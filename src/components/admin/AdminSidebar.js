'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    ShoppingBag,
    BarChart3,
    Settings,
    LogOut,
    ShieldCheck,
    Truck,
    CreditCard
} from 'lucide-react';
import { motion } from 'framer-motion';

import { useAuth } from '@/context/AuthContext';

const NAV_ITEMS = [
    { label: 'Overview', icon: LayoutDashboard, href: '/admin/dashboard' },
    { label: 'Vendors', icon: Users, href: '/admin/vendors' },
    { label: 'Products', icon: ShoppingBag, href: '/admin/products' },
    { label: 'Orders', icon: Truck, href: '/admin/orders' },
  
    { label: 'Analytics', icon: BarChart3, href: '/admin/analytics' },
];

export default function AdminSidebar() {
    const pathname = usePathname();
    const { logout } = useAuth();

    return (
        <aside className="w-80 bg-black border-r-8 border-purple-600/20 h-screen sticky top-0 flex flex-col p-8">
            <div className="mb-12">
                <div className="flex items-center gap-3 text-white mb-2">
                    <ShieldCheck className="w-8 h-8 text-purple-500" strokeWidth={3} />
                    <span className="text-3xl font-black uppercase tracking-tighter">Admin <span className="text-purple-500">Node</span></span>
                </div>
                <div className="h-1 w-full bg-purple-600 shadow-[0_0_15px_rgba(124,58,237,0.5)]" />
            </div>

            <nav className="flex-1 space-y-4">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link key={item.href} href={item.href}>
                            <motion.div
                                whileHover={{ x: 10 }}
                                className={`flex items-center gap-4 p-4 font-black uppercase tracking-widest text-sm transition-all border-4 ${isActive
                                    ? 'bg-purple-600 border-black text-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] translate-x-3'
                                    : 'bg-transparent border-transparent text-gray-500 hover:text-white'
                                    }`}
                            >
                                <item.icon className={`w-5 h-5 ${isActive ? 'text-black' : ''}`} strokeWidth={isActive ? 4 : 2} />
                                {item.label}
                            </motion.div>
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-auto pt-8 border-t-2 border-gray-900/50">
                <button
                    onClick={logout}
                    className="flex items-center gap-4 p-4 font-black uppercase tracking-widest text-[10px] text-red-500 hover:bg-red-500/10 transition-all w-full border-2 border-transparent hover:border-red-900/30 group"
                >
                    <LogOut className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                    Terminate Session
                </button>
            </div>
        </aside>
    );
}
