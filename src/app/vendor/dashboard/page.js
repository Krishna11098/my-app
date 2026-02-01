'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, TrendingUp, Clock, FileText, Plus, ArrowRight, DollarSign, Activity } from 'lucide-react';
import OrderDetailsModal from '@/components/vendor/OrderDetailsModal';

export default function VendorDashboard() {
    const [stats, setStats] = useState({ revenue: 0, activeRents: 0, totalProducts: 0, pendingOrders: 0 });
    const [recentOrders, setRecentOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        Promise.all([
            fetch('/api/vendor/stats').then(res => res.json()),
            fetch('/api/vendor/orders').then(res => res.json())
        ]).then(([statsData, ordersData]) => {
            setStats(statsData);
            if (Array.isArray(ordersData)) {
                setRecentOrders(ordersData.slice(0, 5));
            }
            setLoading(false);
        });
    }, []);

    const openOrderDetails = (order) => {
        setSelectedOrder(order);
        setIsModalOpen(true);
    };

    const statCards = [
        { label: 'Total Revenue', value: `₹${Number(stats.revenue || 0).toLocaleString()}`, icon: DollarSign, color: 'bg-green-500' },
        { label: 'Active Rents', value: stats.activeRents || 0, icon: Activity, color: 'bg-blue-500' },
        { label: 'Pending Orders', value: stats.pendingOrders || 0, icon: Clock, color: 'bg-orange-500' },
        { label: 'Total Products', value: stats.totalProducts || 0, icon: Package, color: 'bg-purple-500' },
    ];

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12">
            <div className="max-w-7xl mx-auto">
                <header className="mb-12">
                    <motion.h1
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none mb-4"
                    >
                        Vendor <span className="text-purple-500">Dashboard</span>
                    </motion.h1>
                    <p className="text-2xl font-bold text-gray-400 uppercase tracking-widest">Welcome back. Here's your performance snapshot.</p>
                </header>

                {/* Stats Grid - Brutalist style */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                    {statCards.map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            whileHover={{ scale: 1.02, x: -4, y: -4 }}
                            className="p-8 bg-white text-black border-4 border-black shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)] relative overflow-hidden group"
                        >
                            <div className={`absolute top-0 right-0 w-16 h-16 ${stat.color} translate-x-8 -translate-y-8 rotate-45 border-l-4 border-b-4 border-black`} />
                            <stat.icon className="w-8 h-8 mb-4" strokeWidth={3} />
                            <h3 className="text-sm font-black uppercase tracking-widest text-gray-500 mb-2">{stat.label}</h3>
                            <p className="text-4xl font-black tracking-tighter">{stat.value}</p>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Recent Orders - Brutalist List */}
                    <div className="lg:col-span-2">
                        <h3 className="text-3xl font-black uppercase tracking-tighter mb-8 flex items-center gap-4">
                            <TrendingUp className="w-8 h-8 text-purple-500" strokeWidth={4} />
                            Recent Activity
                        </h3>

                        <div className="space-y-4">
                            {loading ? (
                                [1, 2, 3].map(i => (
                                    <div key={i} className="h-24 bg-gray-900 border-4 border-gray-800 animate-pulse" />
                                ))
                            ) : recentOrders.length === 0 ? (
                                <div className="p-12 border-4 border-dashed border-gray-800 text-center text-gray-600 font-bold uppercase tracking-widest">
                                    No orders found yet. Time to market your products!
                                </div>
                            ) : (
                                recentOrders.map((order) => (
                                    <motion.div
                                        key={order.id}
                                        whileHover={{ x: 8 }}
                                        onClick={() => openOrderDetails(order)}
                                        className="flex justify-between items-center p-6 bg-gray-900 border-4 border-black shadow-[4px_4px_0px_0px_rgba(124,58,237,1)] group cursor-pointer"
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className="w-16 h-16 bg-white border-4 border-black flex items-center justify-center text-black font-black text-xl">
                                                {order.orderNumber?.split('-').pop()}
                                            </div>
                                            <div>
                                                <p className="text-xl font-black uppercase tracking-tighter text-white group-hover:text-purple-400 transition-colors">
                                                    {order.orderNumber}
                                                </p>
                                                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mt-1">
                                                    {order.customer?.name} • ₹{Number(order.totalAmount).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className={`px-4 py-2 border-4 border-black font-black uppercase text-xs tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${order.status === 'CONFIRMED' ? 'bg-green-500 text-black' :
                                            order.status === 'PICKED_UP' ? 'bg-blue-500 text-black' :
                                                order.status === 'RETURNED' ? 'bg-purple-500 text-white' :
                                                    'bg-yellow-500 text-black'
                                            }`}>
                                            {order.status}
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Quick Actions - BIG BUTTONS */}
                    <div className="space-y-8">
                        <h3 className="text-3xl font-black uppercase tracking-tighter mb-8 flex items-center gap-4">
                            <Plus className="w-8 h-8 text-pink-500" strokeWidth={4} />
                            Quick Actions
                        </h3>

                        <div className="grid grid-cols-1 gap-4">
                            <Link href="/vendor/products?add=true" className="group">
                                <div className="p-6 bg-purple-600 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] group-hover:translate-x-1 group-hover:translate-y-1 group-hover:shadow-none transition-all flex items-center justify-between">
                                    <span className="font-black uppercase text-xl leading-none">Add Product</span>
                                    <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" strokeWidth={4} />
                                </div>
                            </Link>

                            <Link href="/vendor/orders" className="group">
                                <div className="p-6 bg-white text-black border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] group-hover:translate-x-1 group-hover:translate-y-1 group-hover:shadow-none transition-all flex items-center justify-between">
                                    <span className="font-black uppercase text-xl leading-none text-black">Manage Orders</span>
                                    <FileText className="w-6 h-6 group-hover:rotate-12 transition-transform" strokeWidth={4} />
                                </div>
                            </Link>

                            <Link href="/vendor/reports" className="group">
                                <div className="p-6 bg-pink-500 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] group-hover:translate-x-1 group-hover:translate-y-1 group-hover:shadow-none transition-all flex items-center justify-between">
                                    <span className="font-black uppercase text-xl leading-none">Your Stats</span>
                                    <TrendingUp className="w-6 h-6 group-hover:-translate-y-2 transition-transform" strokeWidth={4} />
                                </div>
                            </Link>
                        </div>

                        {/* Tip Box */}
                        <div className="p-8 border-4 border-yellow-500 bg-yellow-500/10 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-2 bg-yellow-500 text-black font-black uppercase text-[10px]">Tip</div>
                            <h4 className="font-black uppercase text-yellow-500 mb-2">Grow your sales</h4>
                            <p className="text-sm font-bold text-gray-400">Add detailed descriptions and high-quality images to your products to increase conversion by up to 40%.</p>
                        </div>
                    </div>
                </div>
            </div>

            <OrderDetailsModal
                order={selectedOrder}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    );
}
