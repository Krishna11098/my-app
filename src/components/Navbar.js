'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

export default function Navbar() {
    const { user, logout } = useAuth();
    const pathname = usePathname();

    // Don't show navbar on login/signup/verify/forgot-password pages if you prefer
    // but usually it's good to keep a minimal one. 
    // For this premium app, we might want a full navbar everywhere or specific ones.
    // I'll assume we show it, but adapt content.

    const isVendor = user?.role === 'VENDOR';

    if (!user) {
        // Public Navbar (already in Home page, but good to have a consistent one across other public pages)
        // We can reuse the one from Home or make this the global one.
        // Since Home page has a specific transparent one, we might conditionally render or just use this global one.
        // For now, let's keep this as the "App" navbar.
        return (
            <nav className="fixed top-0 w-full z-50 px-8 py-4 backdrop-blur-md bg-black/50 border-b border-white/10">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <Link href="/" className="text-2xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                        JOY JUNCTURE
                    </Link>
                    <div className="flex gap-6 items-center">
                        <Link href="/login" className="text-sm font-medium text-gray-300 hover:text-purple-400 transition-colors">
                            Login
                        </Link>
                        <Link
                            href="/signup"
                            className="px-5 py-2 rounded-full bg-white text-black text-sm font-bold hover:bg-purple-100 transition-all"
                        >
                            Sign Up
                        </Link>
                    </div>
                </div>
            </nav>
        );
    }

    // Vendor Navbar
    if (isVendor) {
        return (
            <nav className="sticky top-0 z-50 w-full bg-black/80 backdrop-blur-lg border-b border-purple-500/20">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-12">
                        <Link href="/vendor/dashboard" className="text-2xl font-bold tracking-tighter text-white">
                            <span className="text-purple-500">VENDOR</span> PORTAL
                        </Link>

                        <div className="hidden md:flex gap-6">
                            {[
                                { name: 'Dashboard', path: '/vendor/dashboard' },
                                { name: 'Inventory', path: '/vendor/products' },
                                { name: 'Orders', path: '/vendor/orders' },
                                { name: 'Invoices', path: '/vendor/invoices' },
                                { name: 'Reports', path: '/vendor/reports' },
                                { name: 'Settings', path: '/vendor/settings' },
                            ].map((link) => (
                                <Link
                                    key={link.path}
                                    href={link.path}
                                    className={`text-sm font-medium transition-colors ${pathname.startsWith(link.path)
                                        ? 'text-purple-400'
                                        : 'text-gray-400 hover:text-white'
                                        }`}
                                >
                                    {link.name}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <span className="text-sm text-gray-400 hidden sm:block">
                            {user.companyName}
                        </span>
                        <div className="h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">
                            {user.name[0]}
                        </div>
                        <button
                            onClick={logout}
                            className="text-sm text-red-400 hover:text-red-300 transition-colors font-medium border border-red-900/50 px-3 py-1 rounded-lg hover:bg-red-900/20"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </nav>
        );
    }

    // Customer Navbar
    return (
        <nav className="sticky top-0 z-50 w-full bg-black/80 backdrop-blur-lg border-b border-indigo-500/20">
            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-12">
                    <Link href="/dashboard" className="text-2xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-600">
                        JOY JUNCTURE
                    </Link>

                    <div className="hidden md:flex gap-6">
                        {[
                            { name: 'Browse', path: '/dashboard' },
                            { name: 'My Rentals', path: '/orders' },
                            { name: 'Cart', path: '/cart' },
                            // { name: 'Profile', path: '/profile' },
                        ].map((link) => (
                            <Link
                                key={link.path}
                                href={link.path}
                                className={`text-sm font-medium transition-colors ${pathname === link.path
                                    ? 'text-indigo-400'
                                    : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex flex-col text-right hidden sm:block">
                        <span className="text-sm text-white font-medium">{user.name}</span>
                        <span className="text-xs text-indigo-400">{user.credits} Credits</span>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
                        {user.name[0]}
                    </div>
                    <button
                        onClick={logout}
                        className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                        Logout
                    </button>
                </div>
            </div>
        </nav>
    );
}
