'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function VendorInvoices() {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/vendor/invoices')
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) setInvoices(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    return (
        <div className="min-h-screen bg-black p-8 text-white">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-4xl font-bold mb-8">Invoices</h1>

                <div className="bg-gray-900/50 border border-gray-800 rounded-2xl overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-900 border-b border-gray-800">
                            <tr>
                                <th className="p-4 font-medium text-gray-400">Invoice #</th>
                                <th className="p-4 font-medium text-gray-400">Date</th>
                                <th className="p-4 font-medium text-gray-400">Customer</th>
                                <th className="p-4 font-medium text-gray-400">Amount</th>
                                <th className="p-4 font-medium text-gray-400">Status</th>
                                <th className="p-4 font-medium text-gray-400">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.map((inv) => (
                                <tr key={inv.id} className="border-b border-gray-800 hover:bg-gray-800/20 transition-colors">
                                    <td className="p-4 font-mono text-sm text-purple-400">{inv.invoiceNumber}</td>
                                    <td className="p-4 text-sm text-gray-300">{new Date(inv.issueDate).toLocaleDateString()}</td>
                                    <td className="p-4">{inv.customer?.name}</td>
                                    <td className="p-4 font-bold">₹{inv.totalAmount}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${inv.status === 'PAID' ? 'bg-green-500/10 text-green-400' :
                                                inv.status === 'DRAFT' ? 'bg-gray-500/10 text-gray-400' :
                                                    'bg-red-500/10 text-red-400'
                                            }`}>
                                            {inv.status}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <button className="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded transition-colors">Download</button>
                                    </td>
                                </tr>
                            ))}
                            {!loading && invoices.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-gray-500">No invoices found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
