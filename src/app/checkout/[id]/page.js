'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function CheckoutPage() {
    const { id: quotationId } = useParams();
    const { user } = useAuth();
    const router = useRouter();

    const [quotation, setQuotation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [confirming, setConfirming] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!quotationId) return;
        fetch(`/api/quotations/${quotationId}`)
            .then(res => {
                if (!res.ok) throw new Error('Quotation not found');
                return res.json();
            })
            .then(data => {
                setQuotation(data);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    }, [quotationId]);

    const handleConfirmOrder = async () => {
        setConfirming(true);
        setError('');
        try {
            const res = await fetch('/api/orders/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quotationId })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to confirm order');

            // Success
            router.push(`/orders?success=true&orderId=${data.orderId}`);
        } catch (err) {
            setError(err.message);
        } finally {
            setConfirming(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-black text-white p-20 text-center">Loading Quotation...</div>;
    if (error) return <div className="min-h-screen bg-black text-white p-20 text-center text-red-500">{error}</div>;
    if (!quotation) return null;

    return (
        <div className="min-h-screen bg-black text-white p-8 pt-24">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-600">
                    Review & Confirm Order
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Quotation Details */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                            <h2 className="text-xl font-bold mb-4 text-gray-200">Rental Details</h2>
                            <div className="space-y-4">
                                <div className="flex justify-between border-b border-gray-800 pb-2">
                                    <span className="text-gray-400">Date Range</span>
                                    <span className="font-medium text-white">
                                        {new Date(quotation.rentalStart).toLocaleDateString()} - {new Date(quotation.rentalEnd).toLocaleDateString()}
                                    </span>
                                </div>

                                <div>
                                    <h3 className="text-gray-400 mb-2 text-sm">Products</h3>
                                    {quotation.lines.map((line) => (
                                        <div key={line.id} className="flex justify-between items-center bg-black/40 p-3 rounded-lg mb-2">
                                            <div>
                                                <p className="font-medium">{line.product.name}</p>
                                                <p className="text-xs text-gray-500">Qty: {line.quantity}</p>
                                            </div>
                                            <span className="font-bold">₹{line.lineTotal}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                            <h2 className="text-xl font-bold mb-4 text-gray-200">Customer Info</h2>
                            <p className="text-gray-400">{quotation.customer.name}</p>
                            <p className="text-gray-500">{quotation.customer.email}</p>
                        </div>
                    </div>

                    {/* Summary & Payment */}
                    <div className="md:col-span-1">
                        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 sticky top-24">
                            <h2 className="text-xl font-bold mb-6">Order Summary</h2>

                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-gray-400">
                                    <span>Subtotal</span>
                                    <span>₹{quotation.subtotal}</span>
                                </div>
                                <div className="flex justify-between text-gray-400">
                                    <span>Tax (18%)</span>
                                    <span>₹{quotation.taxAmount}</span>
                                </div>
                                <div className="h-px bg-gray-700 my-2"></div>
                                <div className="flex justify-between text-xl font-bold text-white">
                                    <span>Total</span>
                                    <span>₹{quotation.totalAmount}</span>
                                </div>
                            </div>

                            <button
                                onClick={handleConfirmOrder}
                                disabled={confirming}
                                className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 font-bold hover:shadow-lg hover:shadow-purple-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {confirming ? 'Processing...' : 'Confirm & Pay'}
                            </button>
                            <p className="text-xs text-center text-gray-500 mt-4">
                                By confirming, you agree to our Rental Terms & Conditions.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
