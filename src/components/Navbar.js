'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Package, ShoppingCart, FileText, LayoutDashboard, LogOut, User } from 'lucide-react';

export default function Navbar() {
    const { user, logout } = useAuth();
    const pathname = usePathname();

    // Aggressive suppression for homepage and administrative clusters
    const isAdminRoute = pathname?.startsWith('/admin') ||
        (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin'));
    const isHome = pathname === '/';

    if (isHome || isAdminRoute) {
        return null;
    }

    const isVendor = user?.role === 'VENDOR';

    if (!user) {
        return (
            <nav className="fixed top-0 w-full z-50 bg-black border-b-4 border-purple-500">
                <div className="max-w-7xl mx-auto px-6 lg:px-10 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 group">
                        <motion.div
                            whileHover={{ rotate: 180 }}
                            transition={{ duration: 0.3 }}
                            className="w-12 h-12 border-4 border-purple-500 bg-purple-500 flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(168,85,247,1)]"
                        >
                            <Package className="w-7 h-7 text-black" strokeWidth={3} />
                        </motion.div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tighter uppercase text-white">
                                RentalFlow
                            </h1>
                            <p className="text-xs font-bold uppercase tracking-widest text-purple-400">
                                Rent Everything
                            </p>
                        </div>
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link href="/login">
                            <motion.button
                                whileHover={{ x: -4, y: -4 }}
                                whileTap={{ x: 0, y: 0 }}
                                className="hidden sm:block px-5 py-2 font-bold uppercase text-sm tracking-wide text-white hover:text-purple-400 transition-colors"
                            >
                                Sign In
                            </motion.button>
                        </Link>
                        <Link href="/signup">
                            <motion.button
                                whileHover={{ x: -4, y: -4 }}
                                whileTap={{ x: 0, y: 0 }}
                                className="px-6 py-3 font-black uppercase text-sm bg-purple-500 text-black border-4 border-purple-500 shadow-[4px_4px_0px_0px_rgba(168,85,247,1)] hover:shadow-[8px_8px_0px_0px_rgba(168,85,247,1)] transition-all"
                            >
                                Get Started
                            </motion.button>
                        </Link>
                    </div>
                </div>
            </nav>
        );
    }

    // Vendor Navbar
    if (isVendor) {
        return (
            <nav className="sticky top-0 z-50 w-full bg-black border-b-4 border-purple-500">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <Link href="/vendor/dashboard" className="flex items-center gap-3 group">
                            <motion.div
                                whileHover={{ rotate: 180 }}
                                transition={{ duration: 0.3 }}
                                className="w-10 h-10 border-4 border-purple-500 bg-purple-500 flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(168,85,247,1)]"
                            >
                                <Package className="w-6 h-6 text-black" strokeWidth={3} />
                            </motion.div>
                            <div>
                                <h1 className="text-xl font-black tracking-tighter uppercase text-white">
                                    RentalFlow
                                </h1>
                                <p className="text-xs font-bold uppercase tracking-widest text-purple-400">
                                    Vendor Portal
                                </p>
                            </div>
                        </Link>

                        <div className="hidden md:flex gap-4">
                            {[
                                { name: 'Dashboard', path: '/vendor/dashboard', icon: LayoutDashboard },
                                { name: 'Products', path: '/vendor/products', icon: Package },
                                { name: 'Orders', path: '/vendor/orders', icon: ShoppingCart },
                                { name: 'Reports', path: '/vendor/reports', icon: FileText },
                            ].map((link) => (
                                <Link key={link.path} href={link.path}>
                                    <motion.button
                                        whileHover={{ y: -3 }}
                                        className={`px-4 py-2 font-bold uppercase text-xs tracking-wide border-2 transition-all flex items-center gap-2 ${pathname === link.path
                                            ? 'bg-purple-500 text-black border-purple-500 shadow-[3px_3px_0px_0px_rgba(168,85,247,1)]'
                                            : 'text-gray-400 border-gray-800 hover:text-white hover:border-purple-500'
                                            }`}
                                    >
                                        <link.icon className="w-4 h-4" strokeWidth={3} />
                                        {link.name}
                                    </motion.button>
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 border-2 border-purple-500 shadow-[2px_2px_0px_0px_rgba(168,85,247,1)]">
                            <span className="text-purple-400 text-sm font-black">₹</span>
                            <span className="text-sm font-black text-purple-400">{user.credits || 0}</span>
                        </div>

                        <Link href="/vendor/profile">
                            <motion.div
                                whileHover={{ y: -3 }}
                                className="flex items-center gap-3 px-3 py-2 border-2 border-gray-800 hover:border-purple-500 transition-all"
                            >
                                <div className="h-8 w-8 border-2 border-purple-500 bg-purple-500 flex items-center justify-center text-black font-black">
                                    {user.name?.[0] || '?'}
                                </div>
                                <div className="hidden sm:block text-left">
                                    <p className="text-sm font-bold text-white uppercase tracking-wide">{user.name}</p>
                                    <p className="text-xs text-gray-400 font-medium">{user.companyName || 'Vendor'}</p>
                                </div>
                            </motion.div>
                        </Link>

                        <motion.button
                            whileHover={{ x: -3, y: -3 }}
                            whileTap={{ x: 0, y: 0 }}
                            onClick={logout}
                            className="px-3 py-2 font-bold uppercase text-xs text-red-400 border-2 border-red-900 hover:border-red-500 hover:bg-red-900/20 transition-all shadow-[2px_2px_0px_0px_rgba(127,29,29,1)]"
                        >
                            <LogOut className="w-4 h-4" strokeWidth={3} />
                        </motion.button>
                    </div>
                </div>
            </nav>
        );
    }

    // Customer Navbar
    return (
        <nav className="sticky top-0 z-50 w-full bg-black border-b-4 border-purple-500">
            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <Link href="/dashboard" className="flex items-center gap-3 group">
                        <motion.div
                            whileHover={{ rotate: 180 }}
                            transition={{ duration: 0.3 }}
                            className="w-10 h-10 border-4 border-purple-500 bg-purple-500 flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(168,85,247,1)]"
                        >
                            <Package className="w-6 h-6 text-black" strokeWidth={3} />
                        </motion.div>
                        <h1 className="text-xl font-black tracking-tighter uppercase text-white">
                            RentalFlow
                        </h1>
                    </Link>

                    <div className="hidden md:flex gap-4">
                        {[
                            { name: 'Browse', path: '/dashboard', icon: LayoutDashboard },
                            { name: 'My Rentals', path: '/orders', icon: FileText },
                            { name: 'Cart', path: '/cart', icon: ShoppingCart },
                        ].map((link) => (
                            <Link key={link.path} href={link.path}>
                                <motion.button
                                    whileHover={{ y: -3 }}
                                    className={`px-4 py-2 font-bold uppercase text-xs tracking-wide border-2 transition-all flex items-center gap-2 ${pathname === link.path
                                        ? 'bg-purple-500 text-black border-purple-500 shadow-[3px_3px_0px_0px_rgba(168,85,247,1)]'
                                        : 'text-gray-400 border-gray-800 hover:text-white hover:border-purple-500'
                                        }`}
                                >
                                    <link.icon className="w-4 h-4" strokeWidth={3} />
                                    {link.name}
                                </motion.button>
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 border-2 border-purple-500 shadow-[2px_2px_0px_0px_rgba(168,85,247,1)]">
                        <span className="text-purple-400 text-sm font-black">₹</span>
                        <span className="text-sm font-black text-purple-400">{user.credits || 0}</span>
                    </div>

                    <Link href="/profile">
                        <motion.div
                            whileHover={{ y: -3 }}
                            className="flex items-center gap-3 px-3 py-2 border-2 border-gray-800 hover:border-purple-500 transition-all"
                        >
                            <div className="h-8 w-8 border-2 border-purple-500 bg-purple-500 flex items-center justify-center text-black font-black">
                                {user.name?.[0] || '?'}
                            </div>
                            <span className="text-sm text-white font-bold uppercase tracking-wide hidden sm:block">{user.name}</span>
                        </motion.div>
                    </Link>

                    <motion.button
                        whileHover={{ x: -3, y: -3 }}
                        whileTap={{ x: 0, y: 0 }}
                        onClick={logout}
                        className="px-3 py-2 font-bold uppercase text-xs text-red-400 border-2 border-red-900 hover:border-red-500 hover:bg-red-900/20 transition-all shadow-[2px_2px_0px_0px_rgba(127,29,29,1)]"
                    >
                        <LogOut className="w-4 h-4" strokeWidth={3} />
                    </motion.button>
                </div>
            </div>
        </nav>
    );
}
