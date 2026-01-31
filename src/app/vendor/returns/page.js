'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function VendorReturnsPage() {
    const { user } = useAuth();
    const [returns, setReturns] = useState([]);
    const [pendingReturns, setPendingReturns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingReturn, setProcessingReturn] = useState(null);

    useEffect(() => {
        if (user?.id) {
            fetchReturns();
            fetchPendingReturns();
        }
    }, [user]);

    const fetchReturns = async () => {
        try {
            const res = await fetch(`/api/returns?vendorId=${user.id}`);
            const data = await res.json();
            if (Array.isArray(data)) setReturns(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchPendingReturns = async () => {
        try {
            // Fetch orders that are due for return (status = PICKED_UP and rentalEnd <= today)
            const res = await fetch(`/api/vendor/orders?vendorId=${user.id}&status=PICKED_UP`);
            const data = await res.json();
            if (Array.isArray(data)) {
                const today = new Date();
                const pending = data.filter(o => new Date(o.rentalEnd) <= today);
                setPendingReturns(pending);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleProcessReturn = async (orderId, items) => {
        setProcessingReturn(orderId);
        try {
            const res = await fetch('/api/returns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId,
                    items: items.map(item => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        condition: 'GOOD'
                    }))
                })
            });

            if (res.ok) {
                fetchReturns();
                fetchPendingReturns();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setProcessingReturn(null);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-8 pt-24">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-600">
                        Returns Management
                    </h1>
                    <Link href="/vendor/dashboard" className="text-sm text-gray-400 hover:text-white">
                        &larr; Back to Dashboard
                    </Link>
                </div>

                {/* Pending Returns Section */}
                {pendingReturns.length > 0 && (
                    <div className="mb-10">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <span className="text-yellow-400">⏳</span> Pending Returns
                        </h2>
                        <div className="space-y-4">
                            {pendingReturns.map(order => {
                                const lateDays = Math.ceil((new Date() - new Date(order.rentalEnd)) / (1000 * 60 * 60 * 24));
                                return (
                                    <div key={order.id} className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-6">
                                        <div className="flex flex-col md:flex-row justify-between gap-4">
                                            <div>
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="font-mono text-sm">{order.orderNumber}</span>
                                                    {lateDays > 0 && (
                                                        <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">
                                                            {lateDays} days overdue
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-400">
                                                    Customer: {order.customer?.name} | Due: {new Date(order.rentalEnd).toLocaleDateString()}
                                                </p>
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {order.lines?.map((line, idx) => (
                                                        <span key={idx} className="text-xs bg-gray-800 px-2 py-1 rounded">
                                                            {line.product?.name} x{line.quantity}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleProcessReturn(order.id, order.lines)}
                                                disabled={processingReturn === order.id}
                                                className="px-6 py-3 bg-green-600 hover:bg-green-500 rounded-lg font-medium disabled:opacity-50"
                                            >
                                                {processingReturn === order.id ? 'Processing...' : 'Process Return'}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Completed Returns */}
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <span className="text-green-400">✅</span> Completed Returns
                </h2>

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2].map(i => <div key={i} className="h-24 bg-gray-900/50 animate-pulse rounded-2xl" />)}
                    </div>
                ) : returns.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 bg-gray-900/30 rounded-2xl">
                        <p>No completed returns yet</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {returns.map(ret => (
                            <div key={ret.id} className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                                <div className="flex flex-col md:flex-row justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="font-mono text-sm text-green-400">{ret.returnNumber}</span>
                                            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                                                {ret.status}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-400">
                                            Order: {ret.order.orderNumber} | Returned: {new Date(ret.returnDate).toLocaleDateString()}
                                        </p>
                                        
                                        <div className="flex gap-4 mt-2 text-sm">
                                            {ret.lateDays > 0 && (
                                                <span className="text-red-400">Late Fee: ₹{Number(ret.lateFee).toFixed(2)}</span>
                                            )}
                                            {Number(ret.damageFee) > 0 && (
                                                <span className="text-orange-400">Damage Fee: ₹{Number(ret.damageFee).toFixed(2)}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-400">Items</p>
                                        {ret.items.map((item, idx) => (
                                            <p key={idx} className="text-sm">
                                                {item.product.name} x{item.quantity}
                                                <span className={`ml-2 text-xs ${item.condition === 'GOOD' ? 'text-green-400' : 'text-red-400'}`}>
                                                    ({item.condition})
                                                </span>
                                            </p>
                                        ))}
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
