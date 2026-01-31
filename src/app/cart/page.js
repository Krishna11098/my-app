'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function CartPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [cart, setCart] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchCart = async () => {
        if (!user || !user.id) return;
        try {
            const res = await fetch(`/api/cart?userId=${user.id}`);
            if (res.ok) {
                const data = await res.json();
                setCart(data);
            } else {
                setCart(null);
            }
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    useEffect(() => {
        if (user) fetchCart();
    }, [user]);

    const handleRemove = async (lineId) => {
        try {
            const res = await fetch(`/api/cart?lineId=${lineId}`, { method: 'DELETE' });
            if (res.ok) fetchCart();
        } catch (e) { console.error(e); }
    };

    const handleCheckout = () => {
        if (cart?.id) router.push(`/checkout/${cart.id}`);
    };

    const handleClearCart = async () => {
        if (!confirm('Clear entire cart?')) return;
        try {
            const res = await fetch(`/api/cart/clear?userId=${user.id}`, { method: 'DELETE' });
            if (res.ok) fetchCart();
        } catch (e) { console.error(e); }
    };

    if (loading) return <div className="min-h-screen bg-black text-white p-20 flex justify-center pt-32">Loading Cart...</div>;

    if (!cart || cart.lines.length === 0) {
        return (
            <div className="min-h-screen bg-black text-white p-8 pt-32 text-center flex flex-col items-center">
                <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center mb-6">
                    <svg className="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                </div>
                <h1 className="text-3xl font-bold mb-4">Your Cart is Empty</h1>
                <p className="text-gray-400 mb-8 max-w-md">Looks like you haven't added any gear to your adventure list yet.</p>
                <Link href="/dashboard" className="px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors">
                    Browse Collection
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12 pt-32">
            <div className="max-w-5xl mx-auto">
                <header className="flex justify-between items-center mb-10">
                    <h1 className="text-4xl font-bold">Shopping Cart <span className="text-xl text-gray-500 font-normal">({cart.lines.length} items)</span></h1>
                    <div className="flex gap-4">
                        <button onClick={handleClearCart} className="text-red-400 hover:text-red-300 transition-colors text-sm">
                            Clear Cart
                        </button>
                        <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors">
                            Continue Shopping
                        </Link>
                    </div>
                </header>

                <div className="flex flex-col lg:flex-row gap-12">
                    {/* Cart Items */}
                    <div className="flex-1 space-y-4">
                        <AnimatePresence>
                            {cart.lines.map(line => (
                                <motion.div
                                    key={line.id}
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6 flex items-center gap-6 group hover:border-gray-700 transition-colors"
                                >
                                    {/* Image Placeholder */}
                                    <div className="w-24 h-24 bg-gray-800 rounded-xl overflow-hidden flex-shrink-0">
                                        {line.product.imageUrls && line.product.imageUrls[0] ? (
                                            <img src={line.product.imageUrls[0]} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-600 font-bold">JOY</div>
                                        )}
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className="font-bold text-xl">{line.product?.name}</h3>
                                            <p className="font-bold text-xl text-white">₹{Number(line.lineTotal).toLocaleString()}</p>
                                        </div>

                                        <div className="flex items-center gap-2 mb-4">
                                            <span className={`text-xs px-2 py-0.5 rounded border ${line.type === 'SALE'
                                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                                : 'bg-purple-500/10 text-purple-400 border-purple-500/20'}`}>
                                                {line.type === 'SALE' ? 'Purchase' : 'Rental'}
                                            </span>
                                            <p className="text-gray-500 text-sm">₹{Number(line.unitPrice)} x {line.quantity}</p>
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-4">
                                                <button
                                                    onClick={() => handleRemove(line.id)}
                                                    className="text-sm text-red-500 hover:text-red-400 font-medium transition-colors"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {/* Summary */}
                    <div className="lg:w-96">
                        <div className="bg-gray-900/80 border border-gray-800 rounded-3xl p-8 sticky top-32">
                            <h3 className="text-2xl font-bold mb-6">Order Summary</h3>

                            <div className="space-y-4 mb-8">
                                <div className="flex justify-between text-gray-400">
                                    <span>Subtotal</span>
                                    <span className="text-white font-medium">₹{Number(cart.subtotal).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-gray-400">
                                    <span>Taxes (Est.)</span>
                                    <span className="text-white font-medium">₹0.00</span>
                                </div>
                                <div className="border-t border-gray-700 pt-4 flex justify-between text-xl font-bold">
                                    <span>Total</span>
                                    <span>₹{Number(cart.totalAmount).toLocaleString()}</span>
                                </div>
                            </div>

                            <button
                                onClick={handleCheckout}
                                className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-purple-500/20 transition-all transform hover:-translate-y-1 block text-center"
                            >
                                Checkout
                            </button>

                            <p className="text-center text-xs text-gray-500 mt-4">
                                By proceeding, you agree to our rental terms.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
