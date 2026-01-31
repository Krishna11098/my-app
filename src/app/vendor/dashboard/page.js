'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function VendorDashboard() {
    const [stats, setStats] = useState({ revenue: 0, activeRents: 0, totalProducts: 0, pendingOrders: 0 });
    const [recentOrders, setRecentOrders] = useState([]);
    const [loading, setLoading] = useState(true);

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

    return (
        <div className="min-h-screen bg-black p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-10">
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600 mb-2">
                        Vendor Dashboard
                    </h1>
                    <p className="text-gray-400">Welcome back. Here's what's happening today.</p>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {[
                        { label: 'Total Revenue', value: `₹${stats.revenue.toLocaleString()}`, change: '+12%', color: 'from-green-500 to-emerald-700' },
                        { label: 'Active Rents', value: stats.activeRents, change: '+2', color: 'from-blue-500 to-indigo-700' },
                        { label: 'Pending Orders', value: stats.pendingOrders, change: 'Action Needed', color: 'from-orange-500 to-red-700' },
                        { label: 'Total Products', value: stats.totalProducts, change: '+5', color: 'from-purple-500 to-pink-700' },
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="p-6 rounded-2xl bg-gray-900/50 border border-gray-800 backdrop-blur-sm relative overflow-hidden group"
                        >
                            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-5 group-hover:opacity-10 transition-opacity`} />
                            <h3 className="text-gray-400 text-sm font-medium mb-2">{stat.label}</h3>
                            <p className="text-3xl font-bold text-white mb-2">{stat.value}</p>
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${stat.change.startsWith('+') ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                {stat.change} this week
                            </span>
                        </motion.div>
                    ))}
                </div>

                {/* Recent Activity / Quick Actions */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 p-6 rounded-2xl bg-gray-900/50 border border-gray-800">
                        <h3 className="text-xl font-bold text-white mb-6">Recent Orders</h3>
                        <div className="space-y-4">
                            {loading ? (
                                <div className="text-gray-500 text-center py-4">Loading orders...</div>
                            ) : recentOrders.length === 0 ? (
                                <div className="text-gray-500 text-center py-4">No recent orders found.</div>
                            ) : (
                                recentOrders.map((order) => (
                                    <div key={order.id} className="flex justify-between items-center p-4 rounded-xl bg-black/40 border border-gray-800 hover:border-gray-700 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 font-mono text-xs">
                                                {order.quotationNumber?.split('-').pop() || '#'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-white">Order {order.quotationNumber}</p>
                                                <p className="text-xs text-gray-500">
                                                    {order.customer?.name ? `Rented by ${order.customer.name}` : `Amount: ₹${order.totalAmount}`}
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`text-sm font-medium px-3 py-1 rounded-full ${order.status === 'CONFIRMED' ? 'text-green-400 bg-green-400/10' :
                                                order.status === 'DRAFT' ? 'text-blue-400 bg-blue-400/10' :
                                                    'text-orange-400 bg-orange-400/10'
                                            }`}>
                                            {order.status}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-gray-900/50 border border-gray-800">
                        <h3 className="text-xl font-bold text-white mb-6">Quick Actions</h3>
                        <div className="space-y-3">
                            <Link href="/vendor/products/add" className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors text-left flex items-center justify-between group">
                                Add New Product
                                <span className="group-hover:translate-x-1 transition-transform">→</span>
                            </Link>
                            <Link href="/vendor/orders" className="w-full py-3 px-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-medium transition-colors text-left flex items-center justify-between group">
                                Manage Orders (Invoices)
                                <span className="group-hover:translate-x-1 transition-transform">→</span>
                            </Link>
                            <Link href="/vendor/reports" className="w-full py-3 px-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-medium transition-colors text-left flex items-center justify-between group">
                                View Analytics
                                <span className="group-hover:translate-x-1 transition-transform">→</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
