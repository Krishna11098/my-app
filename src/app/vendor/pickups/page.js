'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function VendorPickupsPage() {
    const { user } = useAuth();
    const [pickups, setPickups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');

    useEffect(() => {
        if (user?.id) fetchPickups();
    }, [user]);

    const fetchPickups = async () => {
        try {
            const res = await fetch(`/api/pickups?vendorId=${user.id}`);
            const data = await res.json();
            if (Array.isArray(data)) setPickups(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (pickupId, status) => {
        try {
            const res = await fetch('/api/pickups', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pickupId, status })
            });
            if (res.ok) fetchPickups();
        } catch (e) {
            console.error(e);
        }
    };

    const filteredPickups = filter === 'ALL' ? pickups : pickups.filter(p => p.status === filter);

    const getStatusColor = (status) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-500/20 text-yellow-400';
            case 'READY': return 'bg-blue-500/20 text-blue-400';
            case 'COMPLETED': return 'bg-green-500/20 text-green-400';
            default: return 'bg-gray-500/20 text-gray-400';
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-8 pt-24">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-600">
                        Pickup Management
                    </h1>
                    <Link href="/vendor/dashboard" className="text-sm text-gray-400 hover:text-white">
                        &larr; Back to Dashboard
                    </Link>
                </div>

                {/* Filters */}
                <div className="flex gap-2 mb-6">
                    {['ALL', 'PENDING', 'READY', 'COMPLETED'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                filter === status 
                                    ? 'bg-purple-600 text-white' 
                                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                            }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-900/50 animate-pulse rounded-2xl" />)}
                    </div>
                ) : filteredPickups.length === 0 ? (
                    <div className="text-center py-16 text-gray-500">
                        <p className="text-xl mb-2">No pickups found</p>
                        <p className="text-sm">Pickups will appear here when customers place orders.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredPickups.map(pickup => (
                            <div key={pickup.id} className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-all">
                                <div className="flex flex-col md:flex-row justify-between gap-6">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            <span className="font-mono text-sm text-purple-300 bg-purple-900/30 px-2 py-1 rounded">
                                                {pickup.pickupNumber}
                                            </span>
                                            <span className={`text-xs font-bold px-2 py-1 rounded ${getStatusColor(pickup.status)}`}>
                                                {pickup.status}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Customer</p>
                                                <p className="font-medium">{pickup.order.customer.name}</p>
                                                <p className="text-sm text-gray-400">{pickup.order.customer.email}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Pickup Date</p>
                                                <p className="font-medium">{new Date(pickup.pickupDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
                                            </div>
                                        </div>

                                        <div className="mt-4">
                                            <p className="text-xs text-gray-500 mb-2">Items</p>
                                            <div className="flex flex-wrap gap-2">
                                                {pickup.items.map((item, idx) => (
                                                    <span key={idx} className="text-sm bg-gray-800 px-3 py-1 rounded-full">
                                                        {item.product.name} x{item.quantity}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        {pickup.instructions && (
                                            <p className="mt-3 text-sm text-gray-400 italic">{pickup.instructions}</p>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-2 min-w-[140px]">
                                        {pickup.status === 'PENDING' && (
                                            <button
                                                onClick={() => handleStatusUpdate(pickup.id, 'READY')}
                                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium"
                                            >
                                                Mark Ready
                                            </button>
                                        )}
                                        {pickup.status === 'READY' && (
                                            <button
                                                onClick={() => handleStatusUpdate(pickup.id, 'COMPLETED')}
                                                className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-sm font-medium"
                                            >
                                                Complete Pickup
                                            </button>
                                        )}
                                        <Link
                                            href={`/vendor/orders/${pickup.order.id}`}
                                            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium text-center"
                                        >
                                            View Order
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
