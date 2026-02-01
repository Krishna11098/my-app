'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminSidebar from '@/components/admin/AdminSidebar';
import {
    Truck,
    Search,
    Filter,
    FileText,
    ChevronRight,
    MoreVertical,
    Clock,
    CheckCircle2,
    AlertCircle,
    User,
    Store,
    CreditCard
} from 'lucide-react';

export default function AdminOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetch('/api/admin/orders')
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    console.error('Traffic Sync Failure:', data.error);
                    if (data.error === 'Unauthorized') window.location.href = '/admin';
                    return;
                }
                setOrders(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(err => console.error('Central Flow Error:', err));
    }, []);

    const filteredOrders = Array.isArray(orders) ? orders.filter(o =>
        o.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.vendor?.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) : [];

    return (
        <div className="flex min-h-screen bg-black text-white">
            <AdminSidebar />

            <main className="flex-1 p-12 overflow-y-auto">
                <header className="mb-12 flex justify-between items-end">
                    <div>
                        <motion.h1
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            className="text-6xl font-black uppercase tracking-tighter"
                        >
                            Traffic <span className="text-purple-500">Monitor</span>
                        </motion.h1>
                        <p className="text-gray-500 font-bold uppercase tracking-widest mt-2">{orders.length} Global Transactions in Flow</p>
                    </div>

                    <div className="flex gap-4">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Locate transaction..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-gray-900 border-4 border-black p-4 pl-12 w-80 font-bold focus:outline-none focus:border-purple-600 transition-all placeholder:text-gray-700"
                            />
                        </div>
                    </div>
                </header>

                <div className="bg-gray-900 border-8 border-black shadow-[15px_15px_0px_0px_rgba(124,58,237,0.1)]">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b-8 border-black">
                                <th className="p-6 text-xs font-black uppercase tracking-[0.2em] text-gray-500">Identifier</th>
                                <th className="p-6 text-xs font-black uppercase tracking-[0.2em] text-gray-500">Participants</th>
                                <th className="p-6 text-xs font-black uppercase tracking-[0.2em] text-gray-500">Financials</th>
                                <th className="p-6 text-xs font-black uppercase tracking-[0.2em] text-gray-500">Status</th>
                                <th className="p-6 text-xs font-black uppercase tracking-[0.2em] text-gray-500 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                [1, 2, 3, 4, 5].map(i => (
                                    <tr key={i} className="border-b-4 border-black animate-pulse bg-gray-900/50">
                                        <td colSpan="5" className="h-16" />
                                    </tr>
                                ))
                            ) : filteredOrders.map((order, i) => (
                                <motion.tr
                                    key={order.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="border-b-4 border-black hover:bg-black/40 transition-colors group"
                                >
                                    <td className="p-6">
                                        <p className="font-black uppercase text-lg group-hover:text-purple-500 transition-all">{order.orderNumber}</p>
                                        <p className="text-[10px] font-mono text-gray-600 uppercase mt-1">ID: {order.id.slice(-8)}</p>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex flex-col gap-1">
                                            <span className="flex items-center gap-2 text-xs font-black uppercase">
                                                <User size={12} className="text-gray-500" /> {order.customer?.name}
                                            </span>
                                            <span className="flex items-center gap-2 text-[10px] font-black uppercase text-purple-400">
                                                <Store size={12} /> {order.vendor?.name}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex flex-col">
                                            <span className="text-xl font-black">₹{Number(order.totalAmount).toLocaleString()}</span>
                                            <span className="text-[10px] font-bold text-gray-500 uppercase italic">INC. DEPOSIT & TAX</span>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <div className={`inline-flex items-center gap-2 px-3 py-1 border-2 border-black font-black uppercase text-[10px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${order.status === 'CONFIRMED' ? 'bg-green-500 text-black' :
                                            order.status === 'PICKED_UP' ? 'bg-blue-500 text-black' :
                                                order.status === 'RETURNED' ? 'bg-purple-600 text-white' :
                                                    'bg-gray-800 text-gray-400'
                                            }`}>
                                            {order.status === 'CONFIRMED' && <CheckCircle2 size={12} />}
                                            {order.status}
                                        </div>
                                    </td>
                                    <td className="p-6 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button className="p-3 bg-white text-black border-4 border-black hover:bg-purple-600 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none">
                                                <FileText size={18} strokeWidth={3} />
                                            </button>
                                            <button className="p-3 bg-black text-white border-4 border-black hover:bg-gray-800 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none">
                                                <MoreVertical size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
}
