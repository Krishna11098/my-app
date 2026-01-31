'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Calendar, FileText, Package, ArrowRight, Download, CheckCircle } from 'lucide-react';

function OrdersContent() {
    const { user } = useAuth();
    const searchParams = useSearchParams();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const success = searchParams.get('success');

    useEffect(() => {
        if (user?.email) {
            fetch(`/api/orders?email=${user.email}`)
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) setOrders(data);
                    setLoading(false);
                })
                .catch(err => setLoading(false));
        }
    }, [user]);

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <header className="mb-12">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                        <div>
                            <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter mb-2" style={{ textShadow: '6px 6px 0px rgba(124, 58, 237, 0.5)' }}>
                                My <span className="text-purple-400">Rentals</span>
                            </h1>
                            <p className="text-gray-400 text-lg font-bold uppercase tracking-wide">
                                Track Your Orders and Bookings
                            </p>
                        </div>
                        <Link href="/dashboard">
                            <motion.button
                                whileHover={{ y: -3 }}
                                className="px-5 py-3 bg-gray-900 text-gray-400 font-black uppercase text-xs tracking-wide border-2 border-gray-800 hover:border-purple-500 hover:text-white transition-all"
                            >
                                <Package className="w-4 h-4 inline mr-2 mb-0.5" strokeWidth={3} />
                                Browse More
                            </motion.button>
                        </Link>
                    </div>
                </header>

                {/* Success Message */}
                {success && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 p-5 bg-green-500/10 border-4 border-green-500 shadow-[6px_6px_0px_0px_rgba(34,197,94,1)] flex items-center justify-between"
                    >
                        <div className="flex items-center gap-3">
                            <CheckCircle className="w-6 h-6 text-green-400" strokeWidth={3} />
                            <span className="font-bold uppercase text-sm tracking-wide text-green-400">
                                Order Confirmed! Check your email for details.
                            </span>
                        </div>
                        <button
                            onClick={() => window.history.replaceState({}, '', '/orders')}
                            className="text-xs hover:underline font-bold text-green-400"
                        >
                            Dismiss
                        </button>
                    </motion.div>
                )}

                {/* Orders List */}
                <div className="space-y-6">
                    {loading ? (
                        [...Array(3)].map((_, i) => (
                            <div key={i} className="h-64 bg-gray-900 border-4 border-gray-800 animate-pulse" />
                        ))
                    ) : orders.length === 0 ? (
                        <div className="text-center py-24">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-32 h-32 border-4 border-gray-800 bg-gray-900 flex items-center justify-center mx-auto mb-8 shadow-[8px_8px_0px_0px_rgba(31,41,55,1)]"
                            >
                                <FileText className="w-16 h-16 text-gray-700" strokeWidth={2} />
                            </motion.div>
                            <h3 className="text-4xl font-black uppercase text-gray-700 mb-4">No Rentals Yet</h3>
                            <p className="text-gray-600 font-bold uppercase tracking-wide mb-8">
                                Start Renting Premium Equipment Today
                            </p>
                            <Link href="/dashboard">
                                <motion.button
                                    whileHover={{ x: -4, y: -4 }}
                                    whileTap={{ x: 0, y: 0 }}
                                    className="px-8 py-4 bg-purple-500 text-black font-black uppercase text-sm tracking-wider border-4 border-purple-500 shadow-[6px_6px_0px_0px_rgba(168,85,247,1)] hover:shadow-[12px_12px_0px_0px_rgba(168,85,247,1)] transition-all"
                                >
                                    <Package className="w-5 h-5 inline mr-2 mb-1" strokeWidth={3} />
                                    Browse Products
                                </motion.button>
                            </Link>
                        </div>
                    ) : (
                        orders.map(order => (
                            <motion.div
                                key={order.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                whileHover={{ x: -4, y: -4 }}
                                className="bg-black border-4 border-gray-800 hover:border-purple-500 shadow-[8px_8px_0px_0px_rgba(75,85,99,1)] hover:shadow-[12px_12px_0px_0px_rgba(168,85,247,1)] transition-all p-6 md:p-8"
                            >
                                {/* Header Row */}
                                <div className="flex flex-wrap items-center gap-3 mb-6 pb-6 border-b-4 border-gray-900">
                                    <div className="px-3 py-2 bg-purple-500/10 border-2 border-purple-500 shadow-[2px_2px_0px_0px_rgba(168,85,247,1)]">
                                        <span className="text-xs font-black uppercase tracking-widest text-purple-400">
                                            {order.referenceNumber}
                                        </span>
                                    </div>
                                    <div className={`px-3 py-2 border-2 font-black uppercase text-xs shadow-[2px_2px_0px_0px_rgba(75,85,99,1)] ${order.status === 'CONFIRMED' ? 'bg-green-500/10 text-green-400 border-green-500' :
                                        order.status === 'DRAFT' ? 'bg-blue-500/10 text-blue-400 border-blue-500' :
                                            order.status === 'RETURNED' ? 'bg-gray-500/10 text-gray-400 border-gray-500' :
                                                'bg-yellow-500/10 text-yellow-400 border-yellow-500'
                                        }`}>
                                        {order.status}
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-3 gap-6">
                                    {/* Items Column */}
                                    <div className="md:col-span-2 space-y-3">
                                        <h3 className="text-sm font-black uppercase text-gray-500 tracking-wider mb-4">Order Items</h3>
                                        {order.items.map((item, idx) => (
                                            <div key={idx} className="flex items-center gap-3 p-3 bg-gray-900 border-2 border-gray-800">
                                                <div className="w-2 h-2 bg-purple-500 border-2 border-purple-500"></div>
                                                <span className="text-white font-bold flex-1">{item.name}</span>
                                                <span className="text-gray-500 font-black text-sm uppercase">x{item.qty}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Info Column */}
                                    <div className="space-y-4">
                                        {/* Rental Period */}
                                        {order.rentalStart && order.rentalEnd && (
                                            <div className="p-4 bg-gray-900 border-2 border-gray-800">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Calendar className="w-4 h-4 text-purple-400" strokeWidth={3} />
                                                    <p className="text-xs font-black uppercase text-gray-500 tracking-wider">Rental Period</p>
                                                </div>
                                                <p className="text-sm font-bold text-white">
                                                    {new Date(order.rentalStart).toLocaleDateString()}
                                                </p>
                                                <p className="text-xs text-gray-600 font-bold my-1">TO</p>
                                                <p className="text-sm font-bold text-white">
                                                    {new Date(order.rentalEnd).toLocaleDateString()}
                                                </p>
                                            </div>
                                        )}

                                        {/* Total */}
                                        <div className="p-4 bg-purple-500/10 border-2 border-purple-500 shadow-[3px_3px_0px_0px_rgba(168,85,247,1)]">
                                            <p className="text-xs font-black uppercase text-purple-400 tracking-wider mb-2">Total Amount</p>
                                            <p className="text-3xl font-black text-purple-400">₹{Number(order.totalAmount).toLocaleString()}</p>
                                        </div>

                                        {/* Actions */}
                                        <div className="space-y-2">
                                            {order.status === 'DRAFT' && (
                                                <Link href={`/checkout/${order.id}`}>
                                                    <motion.button
                                                        whileHover={{ y: -3 }}
                                                        className="w-full px-4 py-3 bg-purple-500 text-black font-black uppercase text-xs border-4 border-purple-500 shadow-[3px_3px_0px_0px_rgba(168,85,247,1)] hover:shadow-[6px_6px_0px_0px_rgba(168,85,247,1)] transition-all"
                                                    >
                                                        Continue Booking
                                                        <ArrowRight className="w-4 h-4 inline ml-2 mb-0.5" strokeWidth={3} />
                                                    </motion.button>
                                                </Link>
                                            )}
                                            {(order.isOrder || order.status === 'CONFIRMED') && (
                                                <>
                                                    <Link href={`/orders/${order.id}`}>
                                                        <motion.button
                                                            whileHover={{ y: -3 }}
                                                            className="w-full px-4 py-3 bg-purple-500 text-black font-black uppercase text-xs border-4 border-purple-500 shadow-[3px_3px_0px_0px_rgba(168,85,247,1)] hover:shadow-[6px_6px_0px_0px_rgba(168,85,247,1)] transition-all"
                                                        >
                                                            View Details
                                                            <ArrowRight className="w-4 h-4 inline ml-2 mb-0.5" strokeWidth={3} />
                                                        </motion.button>
                                                    </Link>
                                                    <motion.button
                                                        whileHover={{ y: -3 }}
                                                        onClick={() => window.open(`/api/orders/${order.id}/invoice`, '_blank')}
                                                        className="w-full px-4 py-3 bg-gray-900 text-gray-400 font-black uppercase text-xs border-2 border-gray-800 hover:border-purple-500 hover:text-white transition-all"
                                                    >
                                                        <Download className="w-4 h-4 inline mr-2 mb-0.5" strokeWidth={3} />
                                                        Download Invoice
                                                    </motion.button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

export default function MyOrders() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="text-center">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-16 h-16 border-4 border-purple-500 border-t-transparent mx-auto mb-4"
                    />
                    <p className="font-black uppercase text-gray-500 tracking-widest">Loading Orders...</p>
                </div>
            </div>
        }>
            <OrdersContent />
        </Suspense>
    );
}
