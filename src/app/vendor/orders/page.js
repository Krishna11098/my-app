'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export default function VendorOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

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

    const updateStatus = async (id, status) => {
        if (!confirm(`Mark order as ${status}?`)) return;
        try {
            await fetch('/api/vendor/orders', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status })
            });
            fetchOrders(); // Refresh
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="min-h-screen bg-black p-8 text-white">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-4xl font-bold mb-8">Order Management</h1>

                <div className="bg-gray-900/50 border border-gray-800 rounded-2xl overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-900 border-b border-gray-800">
                            <tr>
                                <th className="p-4 font-medium text-gray-400">Order #</th>
                                <th className="p-4 font-medium text-gray-400">Date Range</th>
                                <th className="p-4 font-medium text-gray-400">Customer</th>
                                <th className="p-4 font-medium text-gray-400">Status</th>
                                <th className="p-4 font-medium text-gray-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order) => (
                                <tr key={order.id} className="border-b border-gray-800 hover:bg-gray-800/20 transition-colors">
                                    <td className="p-4 font-mono text-sm text-purple-400">{order.orderNumber || order.quotationNumber}</td>
                                    <td className="p-4 text-sm text-gray-300">
                                        {new Date(order.rentalStart).toLocaleDateString()} - {new Date(order.rentalEnd).toLocaleDateString()}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <span className="font-medium">{order.customer?.name || 'Unknown'}</span>
                                            <span className="text-xs text-gray-500">{order.customer?.companyName}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${order.status === 'CONFIRMED' ? 'bg-green-500/10 text-green-400' :
                                            order.status === 'PICKED_UP' ? 'bg-blue-500/10 text-blue-400' :
                                                order.status === 'RETURNED' ? 'bg-gray-500/10 text-gray-400' :
                                                    'bg-yellow-500/10 text-yellow-400'
                                            }`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex gap-2">
                                            {order.status === 'CONFIRMED' && (
                                                <button
                                                    onClick={() => updateStatus(order.id, 'PICKED_UP')}
                                                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 rounded text-xs font-bold transition-colors"
                                                >
                                                    Dispatch / Pickup
                                                </button>
                                            )}
                                            {order.status === 'PICKED_UP' && (
                                                <button
                                                    onClick={() => updateStatus(order.id, 'RETURNED')}
                                                    className="px-3 py-1 bg-orange-600 hover:bg-orange-700 rounded text-xs font-bold transition-colors"
                                                >
                                                    Receive Return
                                                </button>
                                            )}
                                            <button
                                                onClick={() => window.open(`/api/orders/${order.id}/invoice`, '_blank')}
                                                className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded text-xs font-bold text-gray-300 transition-colors"
                                            >
                                                Invoice
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {orders.length === 0 && !loading && (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-500">No active orders found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
