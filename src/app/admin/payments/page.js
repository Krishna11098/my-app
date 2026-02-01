'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AdminSidebar from '@/components/admin/AdminSidebar';
import {
    CreditCard,
    Search,
    Download,
    CheckCircle2,
    Clock,
    XCircle,
    SearchX
} from 'lucide-react';

export default function AdminPayments() {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        try {
            const res = await fetch('/api/admin/payments');
            const data = await res.json();

            if (data?.error === 'Unauthorized') {
                window.location.href = '/admin';
                return;
            }

            setPayments(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Payment Sync Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const term = searchTerm.toLowerCase();

    const filteredPayments = (Array.isArray(payments) ? payments : []).filter(p =>
        p.paymentNumber?.toLowerCase().includes(term) ||
        p.order?.orderNumber?.toLowerCase().includes(term) ||
        p.order?.customer?.name?.toLowerCase().includes(term)
    );

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
                            Payment <span className="text-purple-500">Ledger</span>
                        </motion.h1>
                        <p className="text-gray-500 font-bold uppercase tracking-widest mt-2">
                            Global Financial Settlement Records
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Txn ID, Order #, Name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-gray-900 border-4 border-black p-4 pl-12 w-80 font-bold focus:outline-none focus:border-purple-600 transition-all placeholder:text-gray-700"
                            />
                        </div>

                        <button className="bg-white text-black p-4 border-4 border-black font-black uppercase tracking-widest hover:bg-purple-600 hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none">
                            <Download size={20} strokeWidth={3} />
                        </button>
                    </div>
                </header>

                <div className="bg-gray-900 border-8 border-black shadow-[15px_15px_0px_0px_rgba(124,58,237,0.1)] overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b-8 border-black bg-black/40">
                                <th className="p-6 text-xs font-black uppercase tracking-[0.2em] text-gray-500">
                                    Txn Identifier
                                </th>
                                <th className="p-6 text-xs font-black uppercase tracking-[0.2em] text-gray-500">
                                    Order Context
                                </th>
                                <th className="p-6 text-xs font-black uppercase tracking-[0.2em] text-gray-500">
                                    Amount
                                </th>
                                <th className="p-6 text-xs font-black uppercase tracking-[0.2em] text-gray-500">
                                    Method
                                </th>
                                <th className="p-6 text-xs font-black uppercase tracking-[0.2em] text-gray-500 text-right">
                                    Status
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                [1, 2, 3, 4, 5].map(i => (
                                    <tr key={i} className="border-b-4 border-black animate-pulse opacity-50">
                                        <td colSpan="5" className="p-12 h-20 bg-gray-800/10" />
                                    </tr>
                                ))
                            ) : (
                                filteredPayments.map((p, i) => (
                                    <motion.tr
                                        key={p.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="border-b-4 border-black hover:bg-purple-600/5 transition-colors group"
                                    >
                                        <td className="p-6">
                                            <p className="font-black uppercase text-sm group-hover:text-purple-500 transition-colors">
                                                {p.paymentNumber}
                                            </p>
                                            <p className="text-[10px] font-mono text-gray-600 mt-1 uppercase">
                                                Ref: {p.transactionId || 'INTERNAL'}
                                            </p>
                                        </td>

                                        <td className="p-6">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs font-black uppercase flex items-center gap-2">
                                                    <CreditCard size={12} className="text-gray-500" />
                                                    {p.order?.orderNumber}
                                                </span>
                                                <span className="text-[10px] font-black uppercase text-gray-500 italic">
                                                    By: {p.order?.customer?.name}
                                                </span>
                                            </div>
                                        </td>

                                        <td className="p-6">
                                            <p className="text-xl font-black tracking-tighter">
                                                ₹{Number(p.amount).toLocaleString()}
                                            </p>
                                        </td>

                                        <td className="p-6">
                                            <span className="text-[10px] font-black uppercase bg-black px-2 py-1 border border-gray-800">
                                                {p.method}
                                            </span>
                                        </td>

                                        <td className="p-6 text-right">
                                            <span
                                                className={`inline-flex items-center gap-2 px-3 py-1 border-2 border-black font-black uppercase text-[10px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                                                ${p.status === 'COMPLETED'
                                                    ? 'bg-green-500 text-black'
                                                    : p.status === 'PENDING'
                                                    ? 'bg-orange-500 text-black'
                                                    : 'bg-red-500 text-black'
                                                }`}
                                            >
                                                {p.status === 'COMPLETED' && <CheckCircle2 size={12} />}
                                                {p.status === 'PENDING' && <Clock size={12} />}
                                                {p.status === 'FAILED' && <XCircle size={12} />}
                                                {p.status}
                                            </span>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    {!loading && filteredPayments.length === 0 && (
                        <div className="p-20 text-center text-gray-700 flex flex-col items-center">
                            <SearchX size={64} className="mb-4 opacity-20" />
                            <p className="text-2xl font-black uppercase tracking-tighter italic">
                                No financial matches found
                            </p>
                            <button
                                onClick={() => setSearchTerm('')}
                                className="mt-4 text-xs font-black uppercase tracking-widest text-purple-500 hover:text-white underline underline-offset-4"
                            >
                                Clear Query
                            </button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
