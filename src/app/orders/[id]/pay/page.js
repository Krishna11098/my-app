'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Script from 'next/script';
import Link from 'next/link';

export default function PaymentPage() {
    const { id: orderId } = useParams();
    const { user } = useAuth();
    const router = useRouter();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');
    const [paymentAmount, setPaymentAmount] = useState(0);
    const [paymentType, setPaymentType] = useState('full'); // 'full' or 'partial'

    useEffect(() => {
        if (!orderId) return;
        fetch(`/api/orders/${orderId}`)
            .then(res => res.json())
            .then(data => {
                setOrder(data);
                const balanceDue = Number(data.totalAmount) - Number(data.amountPaid);
                setPaymentAmount(balanceDue);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    }, [orderId]);

    const handlePayment = async () => {
        if (paymentAmount <= 0) {
            setError('Invalid payment amount');
            return;
        }

        setProcessing(true);
        setError('');

        try {
            // Create Razorpay order
            const res = await fetch('/api/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId,
                    invoiceId: order.invoice?.id,
                    amount: paymentAmount
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            // Open Razorpay checkout
            const options = {
                key: data.key,
                amount: data.amount,
                currency: data.currency,
                name: 'Joy Juncture',
                description: `Payment for Order ${order.orderNumber}`,
                order_id: data.id,
                handler: async function (response) {
                    // Verify payment
                    const verifyRes = await fetch('/api/payments', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            orderId,
                            invoiceId: order.invoice?.id,
                            amount: data.amount
                        })
                    });

                    const verifyData = await verifyRes.json();
                    if (verifyRes.ok) {
                        router.push(`/orders/${orderId}?payment=success`);
                    } else {
                        setError(verifyData.error || 'Payment verification failed');
                    }
                },
                prefill: {
                    name: user?.name || '',
                    email: user?.email || ''
                },
                theme: {
                    color: '#9333ea'
                },
                modal: {
                    ondismiss: function () {
                        setProcessing(false);
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (err) {
            setError(err.message);
            setProcessing(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-black text-white p-20 pt-32 text-center">Loading...</div>;
    if (error && !order) return <div className="min-h-screen bg-black text-white p-20 pt-32 text-center text-red-500">{error}</div>;
    if (!order) return null;

    const balanceDue = Number(order.totalAmount) - Number(order.amountPaid);

    if (balanceDue <= 0) {
        return (
            <div className="min-h-screen bg-black text-white p-8 pt-32 text-center">
                <div className="max-w-md mx-auto bg-gray-900/50 border border-gray-800 rounded-2xl p-8">
                    <div className="text-6xl mb-4">✅</div>
                    <h1 className="text-2xl font-bold mb-2">Fully Paid!</h1>
                    <p className="text-gray-400 mb-6">This order has been fully paid.</p>
                    <Link href={`/orders/${orderId}`} className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full font-bold">
                        View Order
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <>
            <Script src="https://checkout.razorpay.com/v1/checkout.js" />
            
            <div className="min-h-screen bg-black text-white p-8 pt-24">
                <div className="max-w-lg mx-auto">
                    <Link href={`/orders/${orderId}`} className="text-sm text-gray-400 hover:text-white mb-4 inline-block">
                        &larr; Back to Order
                    </Link>

                    <h1 className="text-3xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-600">
                        Complete Payment
                    </h1>

                    <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 mb-6">
                        <h2 className="text-lg font-bold mb-4">Order Summary</h2>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-400">Order Number</span>
                                <span className="font-mono">{order.orderNumber}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Total Amount</span>
                                <span>₹{Number(order.totalAmount).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-green-400">
                                <span>Already Paid</span>
                                <span>₹{Number(order.amountPaid).toLocaleString()}</span>
                            </div>
                            <div className="h-px bg-gray-700 my-2" />
                            <div className="flex justify-between text-xl font-bold">
                                <span>Balance Due</span>
                                <span className="text-red-400">₹{balanceDue.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 mb-6">
                        <h2 className="text-lg font-bold mb-4">Payment Amount</h2>
                        
                        <div className="space-y-3 mb-4">
                            <label className="flex items-center gap-3 p-3 bg-black/40 rounded-lg cursor-pointer hover:bg-black/60">
                                <input
                                    type="radio"
                                    name="paymentType"
                                    value="full"
                                    checked={paymentType === 'full'}
                                    onChange={() => {
                                        setPaymentType('full');
                                        setPaymentAmount(balanceDue);
                                    }}
                                    className="w-4 h-4 accent-purple-500"
                                />
                                <div className="flex-1">
                                    <p className="font-medium">Pay Full Balance</p>
                                    <p className="text-sm text-gray-400">₹{balanceDue.toLocaleString()}</p>
                                </div>
                            </label>

                            <label className="flex items-center gap-3 p-3 bg-black/40 rounded-lg cursor-pointer hover:bg-black/60">
                                <input
                                    type="radio"
                                    name="paymentType"
                                    value="partial"
                                    checked={paymentType === 'partial'}
                                    onChange={() => setPaymentType('partial')}
                                    className="w-4 h-4 accent-purple-500"
                                />
                                <div className="flex-1">
                                    <p className="font-medium">Pay Partial Amount</p>
                                    <p className="text-sm text-gray-400">Choose custom amount</p>
                                </div>
                            </label>
                        </div>

                        {paymentType === 'partial' && (
                            <div className="mt-4">
                                <label className="block text-sm text-gray-400 mb-2">Enter Amount (₹)</label>
                                <input
                                    type="number"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(Math.min(Number(e.target.value), balanceDue))}
                                    min={1}
                                    max={balanceDue}
                                    className="w-full px-4 py-3 bg-black border border-gray-700 rounded-xl focus:border-purple-500 focus:outline-none text-xl font-bold"
                                />
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <button
                        onClick={handlePayment}
                        disabled={processing || paymentAmount <= 0}
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 font-bold text-lg hover:shadow-lg hover:shadow-purple-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {processing ? (
                            <>
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Processing...
                            </>
                        ) : (
                            <>💳 Pay ₹{paymentAmount.toLocaleString()}</>
                        )}
                    </button>

                    <p className="text-center text-xs text-gray-500 mt-4">
                        Powered by Razorpay. Your payment is secure.
                    </p>
                </div>
            </div>
        </>
    );
}
