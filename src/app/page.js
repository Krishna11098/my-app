'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useRef } from 'react';
import {
    Package, ShoppingCart, TrendingUp, Shield,
    Zap, Users, Clock, Award, ArrowRight,
    CreditCard, Truck, BarChart3
} from 'lucide-react';

export default function Home() {
    const heroRef = useRef(null);

    const features = [
        {
            icon: Package,
            title: "Vast Inventory",
            desc: "50,000+ products across electronics, furniture, vehicles, and more"
        },
        {
            icon: Shield,
            title: "Verified Vendors",
            desc: "Every vendor undergoes strict background checks and verification"
        },
        {
            icon: Truck,
            title: "Free Delivery",
            desc: "Complimentary doorstep delivery and pickup for all rental orders"
        },
        {
            icon: CreditCard,
            title: "Secure Payments",
            desc: "Bank-grade encryption with Razorpay integration for safety"
        },
        {
            icon: Clock,
            title: "Flexible Rentals",
            desc: "Rent by hour, day, week, or month - you choose the duration"
        },
        {
            icon: Award,
            title: "Quality Assured",
            desc: "All items are inspected, sanitized, and maintained to standards"
        }
    ];

    const categories = [
        { name: 'Electronics', icon: Zap, count: '5,000+' },
        { name: 'Furniture', icon: Package, count: '3,200+' },
        { name: 'Vehicles', icon: Truck, count: '1,800+' },
        { name: 'Photography', icon: Award, count: '2,500+' },
        { name: 'Tools', icon: Shield, count: '4,100+' },
        { name: 'Events', icon: Users, count: '2,900+' },
    ];

    const stats = [
        { value: '50K+', label: 'Products Listed' },
        { value: '10K+', label: 'Active Users' },
        { value: '2.5K+', label: 'Trusted Vendors' },
        { value: '99%', label: 'Satisfaction Rate' }
    ];

    return (
        <div className="min-h-screen bg-black text-white overflow-hidden font-sans">
            {/* Animated Grid Background */}
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(124,58,237,0.03)_2px,transparent_2px),linear-gradient(90deg,rgba(124,58,237,0.03)_2px,transparent_2px)] bg-[size:80px_80px]" />
                <motion.div
                    animate={{
                        backgroundPosition: ['0% 0%', '100% 100%'],
                    }}
                    transition={{ duration: 20, repeat: Infinity, repeatType: 'reverse' }}
                    className="absolute inset-0 opacity-30"
                    style={{
                        backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(124, 58, 237, 0.1) 0%, transparent 50%)',
                        backgroundSize: '100px 100px'
                    }}
                />
            </div>

            {/* Navigation */}
            <nav className="relative z-50 border-b-4 border-purple-500 bg-black">
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

            {/* Hero Section */}
            <section ref={heroRef} className="relative z-10 min-h-[90vh] flex flex-col items-center justify-center px-4 py-20">
                {/* Floating 3D Elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {[...Array(3)].map((_, i) => (
                        <motion.div
                            key={i}
                            animate={{
                                y: [0, -30, 0],
                                rotate: [0, 180, 360],
                                x: [0, 20, 0]
                            }}
                            transition={{
                                duration: 8 + i * 2,
                                repeat: Infinity,
                                delay: i * 2
                            }}
                            className="absolute"
                            style={{
                                top: `${20 + i * 25}%`,
                                left: `${10 + i * 30}%`,
                            }}
                        >
                            <div className="w-16 h-16 border-4 border-purple-500/30 bg-purple-500/5" />
                        </motion.div>
                    ))}
                </div>

                <div className="max-w-6xl mx-auto text-center relative z-10">
                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-3 px-5 py-2 mb-8 border-4 border-purple-500 bg-black shadow-[6px_6px_0px_0px_rgba(168,85,247,1)]"
                    >
                        <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="w-3 h-3 bg-green-500 border-2 border-green-400"
                        />
                        <span className="text-sm font-black uppercase tracking-widest text-white">
                            Trusted by 10,000+ Users Across India
                        </span>
                    </motion.div>

                    {/* Main Heading */}
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-6xl sm:text-8xl md:text-9xl font-black tracking-tighter uppercase mb-6"
                    >
                        <span className="block text-white" style={{ textShadow: '8px 8px 0px rgba(124, 58, 237, 0.5)' }}>
                            RENT
                        </span>
                        <motion.span
                            animate={{
                                textShadow: [
                                    '8px 8px 0px rgba(236, 72, 153, 0.5)',
                                    '12px 12px 0px rgba(236, 72, 153, 0.7)',
                                    '8px 8px 0px rgba(236, 72, 153, 0.5)'
                                ]
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="block text-purple-400 border-b-8 border-purple-500 inline-block px-4"
                        >
                            ANYTHING
                        </motion.span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-xl sm:text-2xl md:text-3xl max-w-3xl mx-auto mb-12 font-bold text-gray-400 uppercase tracking-wide"
                    >
                        India's Premier Rental Marketplace
                        <span className="block mt-2 text-white">From Cameras to Cars • Furniture to Fashion</span>
                    </motion.p>

                    {/* CTA Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex flex-col sm:flex-row gap-6 justify-center items-center"
                    >
                        <Link href="/signup">
                            <motion.button
                                whileHover={{ x: -8, y: -8 }}
                                whileTap={{ x: 0, y: 0 }}
                                className="group relative px-10 py-5 bg-purple-500 text-black font-black text-xl uppercase border-4 border-purple-500 shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] hover:shadow-[16px_16px_0px_0px_rgba(255,255,255,1)] transition-all overflow-hidden"
                            >
                                <span className="relative z-10 flex items-center gap-3">
                                    Start Renting Now
                                    <motion.div
                                        animate={{ x: [0, 5, 0] }}
                                        transition={{ duration: 1, repeat: Infinity }}
                                    >
                                        <ArrowRight className="w-6 h-6" strokeWidth={3} />
                                    </motion.div>
                                </span>
                            </motion.button>
                        </Link>
                        <Link href="/login">
                            <motion.button
                                whileHover={{ x: -8, y: -8 }}
                                whileTap={{ x: 0, y: 0 }}
                                className="px-10 py-5 bg-black text-white font-black text-xl uppercase border-4 border-white shadow-[8px_8px_0px_0px_rgba(124,58,237,1)] hover:shadow-[16px_16px_0px_0px_rgba(124,58,237,1)] transition-all"
                            >
                                Login to Dashboard
                            </motion.button>
                        </Link>
                    </motion.div>

                    {/* Stats */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto"
                    >
                        {stats.map((stat, i) => (
                            <motion.div
                                key={i}
                                whileHover={{ y: -8, x: -4 }}
                                className="p-6 bg-black border-4 border-gray-800 hover:border-purple-500 shadow-[4px_4px_0px_0px_rgba(75,85,99,1)] hover:shadow-[8px_8px_0px_0px_rgba(168,85,247,1)] transition-all"
                            >
                                <div className="text-4xl md:text-5xl font-black text-purple-400 mb-2" style={{ textShadow: '4px 4px 0px rgba(0,0,0,0.5)' }}>
                                    {stat.value}
                                </div>
                                <div className="text-xs font-bold uppercase tracking-widest text-gray-500">
                                    {stat.label}
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Categories Section */}
            <section className="relative z-10 py-24 px-4 border-t-4 border-purple-500/30">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <motion.h2
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            className="text-5xl md:text-7xl font-black uppercase mb-4"
                        >
                            Explore <span className="bg-purple-500 text-black px-4 inline-block -skew-x-12 border-4 border-purple-500">Categories</span>
                        </motion.h2>
                        <p className="text-gray-400 text-xl font-bold uppercase tracking-wide">
                            Thousands of Items • Every Category
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                        {categories.map((cat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                whileHover={{ y: -8, x: -4 }}
                                className="group relative p-6 bg-black border-4 border-gray-800 hover:border-purple-500 shadow-[4px_4px_0px_0px_rgba(75,85,99,1)] hover:shadow-[8px_8px_0px_0px_rgba(168,85,247,1)] transition-all cursor-pointer"
                            >
                                <motion.div
                                    whileHover={{ rotate: 360 }}
                                    transition={{ duration: 0.5 }}
                                    className="w-16 h-16 border-4 border-purple-500/30 group-hover:border-purple-500 bg-purple-500/10 group-hover:bg-purple-500 flex items-center justify-center mb-4 mx-auto transition-all"
                                >
                                    <cat.icon className="w-8 h-8 text-purple-400 group-hover:text-black transition-colors" strokeWidth={3} />
                                </motion.div>
                                <h3 className="font-black text-white group-hover:text-purple-400 transition-colors uppercase text-center">
                                    {cat.name}
                                </h3>
                                <p className="text-sm text-gray-600 font-bold text-center mt-1">{cat.count}</p>
                            </motion.div>
                        ))}
                    </div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="text-center mt-12"
                    >
                        <Link href="/dashboard">
                            <motion.button
                                whileHover={{ x: -4, y: -4 }}
                                className="px-8 py-4 border-4 border-purple-500 text-purple-400 font-black uppercase shadow-[4px_4px_0px_0px_rgba(168,85,247,1)] hover:shadow-[8px_8px_0px_0px_rgba(168,85,247,1)] hover:bg-purple-500 hover:text-black transition-all"
                            >
                                Browse All Categories →
                            </motion.button>
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* Features Section */}
            <section className="relative z-10 py-24 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20">
                        <motion.h2
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            className="text-5xl md:text-7xl font-black uppercase mb-4"
                        >
                            Why Choose <span className="text-purple-400 border-b-8 border-purple-500">RentalFlow</span>
                        </motion.h2>
                        <p className="text-gray-400 text-xl font-bold uppercase tracking-wide">
                            Built for Renters • Optimized for Vendors
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                whileHover={{ y: -8, x: -4 }}
                                className="group p-8 bg-black border-4 border-gray-800 hover:border-purple-500 shadow-[6px_6px_0px_0px_rgba(75,85,99,1)] hover:shadow-[12px_12px_0px_0px_rgba(168,85,247,1)] transition-all"
                            >
                                <motion.div
                                    whileHover={{ scale: 1.2, rotate: 10 }}
                                    className="w-16 h-16 border-4 border-gray-700 group-hover:border-purple-500 bg-gray-900 group-hover:bg-purple-500 flex items-center justify-center mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] transition-all"
                                >
                                    <feature.icon className="w-8 h-8 text-gray-400 group-hover:text-black transition-colors" strokeWidth={3} />
                                </motion.div>
                                <h3 className="text-2xl font-black mb-4 uppercase text-white group-hover:text-purple-400 transition-colors">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-400 leading-relaxed font-medium">
                                    {feature.desc}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="relative z-10 py-24 px-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="max-w-5xl mx-auto"
                >
                    <div className="p-16 md:p-24 bg-purple-500 border-8 border-black shadow-[20px_20px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
                        {/* Animated background pattern */}
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                            className="absolute -top-20 -right-20 w-60 h-60 border-8 border-black/20"
                        />
                        <motion.div
                            animate={{ rotate: -360 }}
                            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                            className="absolute -bottom-20 -left-20 w-80 h-80 border-8 border-black/20"
                        />

                        <div className="relative z-10 text-center">
                            <motion.h2
                                className="text-4xl md:text-7xl font-black mb-6 uppercase text-black"
                                style={{ textShadow: '6px 6px 0px rgba(255,255,255,0.3)' }}
                            >
                                Ready to Start<br />
                                Your Rental Journey?
                            </motion.h2>
                            <p className="text-black/80 text-xl font-bold mb-12 max-w-2xl mx-auto uppercase tracking-wide">
                                Join Thousands of Smart Renters • Get 100 Credits Free
                            </p>
                            <div className="flex flex-col sm:flex-row gap-6 justify-center">
                                <Link href="/signup">
                                    <motion.button
                                        whileHover={{ x: -6, y: -6 }}
                                        whileTap={{ x: 0, y: 0 }}
                                        className="px-12 py-5 bg-black text-white font-black text-xl uppercase border-4 border-black shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] hover:shadow-[16px_16px_0px_0px_rgba(255,255,255,1)] transition-all"
                                    >
                                        Create Free Account
                                    </motion.button>
                                </Link>
                                <Link href="/signup?role=vendor">
                                    <motion.button
                                        whileHover={{ x: -6, y: -6 }}
                                        whileTap={{ x: 0, y: 0 }}
                                        className="px-12 py-5 bg-white text-black font-black text-xl uppercase border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] transition-all"
                                    >
                                        Become a Vendor
                                    </motion.button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 py-16 px-4 border-t-4 border-purple-500 bg-black">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
                        <div className="col-span-2 md:col-span-1">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 border-4 border-purple-500 bg-purple-500 flex items-center justify-center">
                                    <Package className="w-7 h-7 text-black" strokeWidth={3} />
                                </div>
                                <h3 className="text-2xl font-black tracking-tighter uppercase text-white">
                                    RentalFlow
                                </h3>
                            </div>
                            <p className="text-gray-500 text-sm font-bold uppercase tracking-wide">
                                India's Leading Rental Marketplace
                            </p>
                        </div>
                        <div>
                            <h4 className="font-black text-white mb-4 uppercase tracking-wide">For Renters</h4>
                            <ul className="space-y-2 text-sm text-gray-500 font-medium">
                                <li><Link href="/dashboard" className="hover:text-purple-400 transition-colors">Browse Products</Link></li>
                                <li><Link href="/orders" className="hover:text-purple-400 transition-colors">My Rentals</Link></li>
                                <li><Link href="/cart" className="hover:text-purple-400 transition-colors">Shopping Cart</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-black text-white mb-4 uppercase tracking-wide">For Vendors</h4>
                            <ul className="space-y-2 text-sm text-gray-500 font-medium">
                                <li><Link href="/signup?role=vendor" className="hover:text-purple-400 transition-colors">Become Vendor</Link></li>
                                <li><Link href="/vendor/dashboard" className="hover:text-purple-400 transition-colors">Vendor Dashboard</Link></li>
                                <li><Link href="/vendor/products" className="hover:text-purple-400 transition-colors">Manage Products</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-black text-white mb-4 uppercase tracking-wide">Company</h4>
                            <ul className="space-y-2 text-sm text-gray-500 font-medium">
                                <li><a href="#" className="hover:text-purple-400 transition-colors">About Us</a></li>
                                <li><a href="#" className="hover:text-purple-400 transition-colors">Terms of Service</a></li>
                                <li><a href="#" className="hover:text-purple-400 transition-colors">Privacy Policy</a></li>
                                <li><a href="#" className="hover:text-purple-400 transition-colors">Contact</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="pt-8 border-t-4 border-gray-900 flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-sm text-gray-600 font-bold uppercase tracking-widest">
                            © 2026 RentalFlow. All Rights Reserved.
                        </p>
                        <div className="flex gap-6">
                            {['Twitter', 'Instagram', 'LinkedIn'].map((social) => (
                                <motion.a
                                    key={social}
                                    whileHover={{ y: -4 }}
                                    href="#"
                                    className="text-gray-600 hover:text-purple-400 transition-colors font-bold text-sm uppercase"
                                >
                                    {social}
                                </motion.a>
                            ))}
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
