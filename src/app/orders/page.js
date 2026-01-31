'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

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
        <div className="min-h-screen bg-black text-white p-8 pt-24">
            <div className="max-w-5xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-600">My Rentals</h1>
                    <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors">Browse More</Link>
                </div>

                {success && (
                    <div className="mb-8 p-4 bg-green-500/10 border border-green-500/50 rounded-xl text-green-400 flex items-center justify-between">
                        <span>Order Confirmed Successfully! Check your email for details.</span>
                        <button onClick={() => window.history.replaceState({}, '', '/orders')} className="text-xs hover:underline">Dismiss</button>
                    </div>
                )}

                <div className="space-y-4">
                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2].map(i => <div key={i} className="h-32 bg-gray-900/50 animate-pulse rounded-2xl" />)}
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="text-gray-500 bg-gray-900/30 border border-gray-800 p-12 rounded-2xl text-center">
                            <h3 className="text-xl font-bold mb-2">No rentals yet</h3>
                            <p className="mb-6">Start your journey by browsing our premium collection.</p>
                            <Link href="/dashboard" className="px-6 py-3 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors">
                                Browse Products
                            </Link>
                        </div>
                    ) : (
                        orders.map(order => (
                            <motion.div
                                key={order.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-gray-900/40 border border-gray-800 p-6 rounded-2xl hover:border-gray-700 transition-all group relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <span className="text-9xl font-bold text-gray-700">#</span>
                                </div>

                                <div className="flex flex-col md:flex-row justify-between md:items-center gap-6 relative z-10">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            <span className="font-mono text-xs text-purple-300 bg-purple-900/30 px-2 py-1 rounded border border-purple-500/20">
                                                {order.referenceNumber}
                                            </span>
                                            <span className={`text-xs font-bold px-2 py-1 rounded border ${order.status === 'CONFIRMED' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                order.status === 'DRAFT' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                    order.status === 'RETURNED' ? 'bg-gray-500/10 text-gray-400 border-gray-500/20' :
                                                        'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                                }`}>
                                                {order.status}
                                            </span>
                                        </div>

                                        <div className="space-y-1">
                                            {order.items.map((item, idx) => (
                                                <div key={idx} className="flex items-center gap-2 text-gray-300">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                                    <span className="font-medium">{item.name}</span>
                                                    <span className="text-xs text-gray-500">x{item.qty}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex md:flex-col items-center md:items-end justify-between gap-2">
                                        <div className="text-right">
                                            <p className="text-sm text-gray-500">Rental Period</p>
                                            <p className="font-medium text-gray-300 text-sm">
                                                {order.rentalStart ? new Date(order.rentalStart).toLocaleDateString() : 'N/A'} &rarr; {order.rentalEnd ? new Date(order.rentalEnd).toLocaleDateString() : 'N/A'}
                                            </p>
                                        </div>
                                        <div className="text-right mt-2">
                                            <p className="text-2xl font-bold text-white">₹{Number(order.totalAmount).toLocaleString()}</p>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="md:border-l md:border-gray-800 md:pl-6 flex flex-col justify-center gap-2">
                                        {order.status === 'DRAFT' && (
                                            <Link href={`/checkout/${order.id}`} className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg text-sm font-bold hover:shadow-lg hover:shadow-purple-500/20 transition-all text-center">
                                                Continue Booking
                                            </Link>
                                        )}
                                        {order.isOrder && (
                                            <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors text-gray-300">
                                                Invoice
                                            </button>
                                        )}
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
        <Suspense fallback={<div className="min-h-screen bg-black text-white p-8 pt-24 text-center">Loading orders...</div>}>
            <OrdersContent />
        </Suspense>
    );
}
