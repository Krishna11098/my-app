'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminSidebar from '@/components/admin/AdminSidebar';
import {
    Users,
    Search,
    MoreVertical,
    CheckCircle,
    XCircle,
    Building2,
    ExternalLink,
    Filter,
    Mail,
    Phone
} from 'lucide-react';

export default function AdminVendors() {
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchVendors();
    }, []);

    const fetchVendors = async () => {
        try {
            const res = await fetch('/api/admin/vendors');
            const data = await res.json();
            if (data.error) {
                console.error('Node Directory Sync Failure:', data.error);
                if (data.error === 'Unauthorized') window.location.href = '/admin';
                return;
            }
            setVendors(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Critical Proxy Failure:', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleVerification = async (id, currentStatus) => {
        const res = await fetch('/api/admin/vendors', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, isVerified: !currentStatus })
        });
        if (res.ok) fetchVendors();
    };

    const filteredVendors = (Array.isArray(vendors) ? vendors : []).filter(v =>
        v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex min-h-screen bg-black text-white">
            <AdminSidebar />

            <main className="flex-1 p-12 overflow-y-auto">
                <header className="mb-12">
                    <div className="flex justify-between items-end mb-8">
                        <div>
                            <motion.h1
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                className="text-6xl font-black uppercase tracking-tighter"
                            >
                                Vendor <span className="text-purple-500">Directory</span>
                            </motion.h1>
                            <p className="text-gray-500 font-bold uppercase tracking-widest mt-2">{vendors.length} Total Registered Nodes</p>
                        </div>

                        <div className="flex gap-4">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search nodes..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="bg-gray-900 border-4 border-black p-4 pl-12 w-80 font-bold focus:outline-none focus:border-purple-600 transition-all placeholder:text-gray-700"
                                />
                            </div>
                            <button className="bg-gray-900 border-4 border-black p-4 font-black uppercase tracking-widest hover:bg-purple-600 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                <Filter />
                            </button>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 gap-6">
                    {loading ? (
                        [1, 2, 3].map(i => (
                            <div key={i} className="h-40 bg-gray-900 border-4 border-gray-800 animate-pulse" />
                        ))
                    ) : filteredVendors.map((vendor, i) => (
                        <motion.div
                            key={vendor.id}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: i * 0.05 }}
                            className="bg-gray-900 border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(124,58,237,0.1)] hover:shadow-[8px_8px_0px_0px_rgba(124,58,237,0.3)] transition-all flex flex-col md:flex-row md:items-center gap-12 group"
                        >
                            {/* Vendor Profile */}
                            <div className="flex items-center gap-6 flex-1">
                                <div className="w-24 h-24 bg-white border-4 border-black flex items-center justify-center text-black font-black text-3xl shadow-[6px_6px_0px_0px_rgba(124,58,237,1)] group-hover:scale-105 transition-transform">
                                    {vendor.companyName?.charAt(0) || vendor.name.charAt(0)}
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h2 className="text-2xl font-black uppercase tracking-tighter group-hover:text-purple-500 transition-colors">{vendor.companyName || vendor.name}</h2>
                                        {vendor.isVerified ? (
                                            <CheckCircle className="text-green-500 w-5 h-5" fill="currentColor" />
                                        ) : (
                                            <XCircle className="text-red-500 w-5 h-5" />
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-4 text-xs font-bold text-gray-500 uppercase tracking-widest">
                                        <span className="flex items-center gap-1"><Building2 size={12} /> {vendor.name}</span>
                                        <span className="text-gray-800">•</span>
                                        <span className="flex items-center gap-1"><Mail size={12} /> {vendor.email}</span>
                                        <span className="text-gray-800">•</span>
                                        <span className="text-purple-400">GSTIN: {vendor.gstin || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Performance Stats */}
                            <div className="flex gap-12 bg-black/40 border-l-4 border-black p-4 px-12">
                                <div className="text-center">
                                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Products</p>
                                    <p className="text-2xl font-black">{vendor._count.products}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Orders</p>
                                    <p className="text-2xl font-black text-purple-500">{vendor._count.vendorOrders}</p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-4">
                                <button
                                    onClick={() => toggleVerification(vendor.id, vendor.isVerified)}
                                    className={`px-6 py-3 font-black uppercase tracking-tighter text-sm border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none ${vendor.isVerified
                                        ? 'bg-red-500 text-black'
                                        : 'bg-green-500 text-black'
                                        }`}
                                >
                                    {vendor.isVerified ? 'Suspend Node' : 'Verify Node'}
                                </button>
                                <button className="p-4 bg-white text-black border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
                                    <ExternalLink size={20} strokeWidth={3} />
                                </button>
                            </div>
                        </motion.div>
                    ))}

                    {!loading && filteredVendors.length === 0 && (
                        <div className="p-20 border-8 border-dashed border-gray-900 flex flex-col items-center justify-center text-gray-700">
                            <Users size={64} className="mb-4 opacity-20" />
                            <p className="text-2xl font-black uppercase tracking-tighter italic">No matching nodes found in directory</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
