'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { FileText, Package, Check, ArrowUpRight, Search, Filter, MoreVertical, Eye, AlertTriangle, X } from 'lucide-react';
import OrderDetailsModal from '@/components/vendor/OrderDetailsModal';

export default function VendorOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [filterStatus, setFilterStatus] = useState('ALL');

    const fetchOrders = () => {
        fetch('/api/vendor/orders')
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) setOrders(data);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const [lateFeeInfo, setLateFeeInfo] = useState(null);

    const updateStatus = async (id, status) => {
        if (!confirm(`Mark order as ${status}?`)) return;
        try {
            const res = await fetch('/api/vendor/orders', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status })
            });
            const data = await res.json();

            if (data.lateInfo && data.lateInfo.lateFee > 0) {
                setLateFeeInfo(data.lateInfo);
            }

            fetchOrders(); // Refresh
        } catch (err) {
            console.error(err);
        }
    };

    const openOrderDetails = (order) => {
        setSelectedOrder(order);
        setIsModalOpen(true);
    };

    const filteredOrders = filterStatus === 'ALL'
        ? orders
        : orders.filter(o => o.status === filterStatus);

    return (
        <div className="min-h-screen bg-black p-8 text-white">
            <div className="max-w-7xl mx-auto">
                <header className="mb-12">
                    <motion.h1
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-6xl font-black uppercase tracking-tighter mb-4"
                    >
                        Order <span className="text-purple-500">Logistics</span>
                    </motion.h1>
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <p className="text-xl font-bold text-gray-500 uppercase tracking-widest">Track and manage every rental transaction</p>

                        <div className="flex gap-2">
                            {['ALL', 'CONFIRMED', 'PICKED_UP', 'RETURNED'].map(status => (
                                <button
                                    key={status}
                                    onClick={() => setFilterStatus(status)}
                                    className={`px-4 py-1 text-[10px] font-black uppercase tracking-widest border-2 border-black shadow-[2px_2px_0px_0px_rgba(255,255,255,0.1)] transition-all ${filterStatus === status ? 'bg-purple-600 border-white' : 'bg-gray-900 border-gray-800 text-gray-400'
                                        }`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>
                </header>

                <div className="space-y-4">
                    {loading ? (
                        [1, 2, 3, 4].map(i => (
                            <div key={i} className="h-24 bg-gray-900 border-4 border-gray-800 animate-pulse" />
                        ))
                    ) : filteredOrders.length === 0 ? (
                        <div className="p-20 border-4 border-dashed border-gray-800 text-center text-gray-600 font-bold uppercase tracking-widest text-2xl italic">
                            No orders found under "{filterStatus}"
                        </div>
                    ) : (
                        filteredOrders.map((order) => (
                            <motion.div
                                key={order.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="group relative bg-gray-900 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(124,58,237,1)] transition-all p-6 flex flex-col md:flex-row md:items-center gap-6"
                            >
                                <div className="flex items-center gap-6 flex-1">
                                    <div className="w-20 h-20 bg-white border-4 border-black flex items-center justify-center text-black font-black text-2xl shadow-[4px_4px_0px_0px_rgba(124,58,237,1)]">
                                        {order.orderNumber?.split('-').pop()}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-2xl font-black uppercase tracking-tighter leading-none group-hover:text-purple-400 transition-colors">
                                                {order.orderNumber}
                                            </span>
                                            <span className={`px-2 py-0.5 border-2 border-black text-[10px] font-black uppercase ${order.status === 'CONFIRMED' ? 'bg-green-500 text-black' :
                                                order.status === 'PICKED_UP' ? 'bg-blue-500 text-black' :
                                                    order.status === 'RETURNED' ? 'bg-purple-500 text-white' :
                                                        'bg-yellow-500 text-black'
                                                }`}>
                                                {order.status}
                                            </span>
                                        </div>
                                        <p className="font-bold text-gray-400 flex items-center gap-4 uppercase text-xs tracking-widest">
                                            <span>{order.customer?.name}</span>
                                            <span className="text-gray-700">•</span>
                                            <span>₹{Number(order.totalAmount).toLocaleString()}</span>
                                            <span className="text-gray-700">•</span>
                                            <span className="text-purple-500">{new Date(order.rentalStart).toLocaleDateString()} - {new Date(order.rentalEnd).toLocaleDateString()}</span>
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-3">
                                    <button
                                        onClick={() => openOrderDetails(order)}
                                        className="h-12 px-6 bg-white text-black font-black uppercase text-sm border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center gap-2"
                                    >
                                        <Eye size={18} strokeWidth={3} /> Details
                                    </button>

                                    {order.status === 'CONFIRMED' && (
                                        <button
                                            onClick={() => updateStatus(order.id, 'PICKED_UP')}
                                            className="h-12 px-6 bg-indigo-600 text-white font-black uppercase text-sm border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center gap-2"
                                        >
                                            <Package size={18} strokeWidth={3} /> Dispatch
                                        </button>
                                    )}

                                    {order.status === 'PICKED_UP' && (
                                        <button
                                            onClick={() => updateStatus(order.id, 'RETURNED')}
                                            className="h-12 px-6 bg-orange-600 text-white font-black uppercase text-sm border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center gap-2"
                                        >
                                            <Check size={18} strokeWidth={3} /> Receive
                                        </button>
                                    )}

                                    <button
                                        onClick={() => window.open(`/api/orders/${order.id}/invoice`, '_blank')}
                                        className="h-12 w-12 bg-gray-800 text-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center p-0"
                                        title="View Invoice"
                                    >
                                        <FileText size={20} strokeWidth={3} />
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>

            <OrderDetailsModal
                order={selectedOrder}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />

            {/* Late Fee Alert Modal */}
            <AnimatePresence>
                {lateFeeInfo && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-gray-900 border-4 border-yellow-500 p-8 max-w-md w-full shadow-[10px_10px_0px_0px_rgba(234,179,8,1)]"
                        >
                            <div className="flex items-center gap-4 mb-6 text-yellow-500">
                                <AlertTriangle size={48} strokeWidth={3} />
                                <h2 className="text-3xl font-black uppercase tracking-tighter leading-tight">Late Return Alert</h2>
                            </div>

                            <div className="space-y-4 mb-8">
                                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Penalty Summary</p>
                                <div className="p-4 bg-yellow-500/10 border-2 border-yellow-500/30">
                                    <div className="flex justify-between items-center py-2 border-b border-yellow-500/20">
                                        <span className="font-bold text-gray-400 uppercase text-xs">Late Days</span>
                                        <span className="text-xl font-black text-white">{lateFeeInfo.lateDays} Days</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2">
                                        <span className="font-bold text-gray-400 uppercase text-xs">Late Fee Rate</span>
                                        <span className="font-black text-white">₹10 / Day</span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-end pt-4">
                                    <p className="font-black uppercase text-gray-500 leading-none">Total to Collect</p>
                                    <p className="text-5xl font-black text-yellow-500 leading-none">₹{lateFeeInfo.lateFee}</p>
                                </div>
                            </div>

                            <button
                                onClick={() => setLateFeeInfo(null)}
                                className="w-full py-4 bg-yellow-500 text-black font-black uppercase tracking-widest border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-2"
                            >
                                <Check size={20} strokeWidth={4} /> Acknowledged
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
