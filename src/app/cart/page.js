'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Trash2, Calendar, ArrowRight, Package } from 'lucide-react';

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

    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="text-center">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-16 h-16 border-4 border-purple-500 border-t-transparent mx-auto mb-4"
                    />
                    <p className="font-black uppercase text-gray-500 tracking-widest">Loading Cart...</p>
                </div>
            </div>
        );
    }

    if (!cart || cart.lines.length === 0) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
                <div className="text-center max-w-md">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-32 h-32 border-4 border-gray-800 bg-gray-900 flex items-center justify-center mx-auto mb-8 shadow-[8px_8px_0px_0px_rgba(31,41,55,1)]"
                    >
                        <ShoppingCart className="w-16 h-16 text-gray-700" strokeWidth={2} />
                    </motion.div>
                    <h1 className="text-5xl font-black uppercase mb-4" style={{ textShadow: '4px 4px 0px rgba(124, 58, 237, 0.3)' }}>
                        Cart is <span className="text-purple-400">Empty</span>
                    </h1>
                    <p className="text-gray-500 font-bold uppercase tracking-wide mb-8">
                        Add Some Gear to Your Collection
                    </p>
                    <Link href="/dashboard">
                        <motion.button
                            whileHover={{ x: -4, y: -4 }}
                            whileTap={{ x: 0, y: 0 }}
                            className="px-8 py-4 bg-purple-500 text-black font-black uppercase text-sm tracking-wider border-4 border-purple-500 shadow-[6px_6px_0px_0px_rgba(168,85,247,1)] hover:shadow-[12px_12px_0px_0px_rgba(168,85,247,1)] transition-all"
                        >
                            <Package className="w-5 h-5 inline mr-2 mb-1" strokeWidth={3} />
                            Browse Products
                        </motion.button>
                    </Link>
                </div>
            </div>
        );
    }

    // Use line.lineTotal from API, fallback to 0 if missing
    const total = cart.lines.reduce((sum, line) => sum + parseFloat(line.lineTotal || 0), 0);

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <header className="mb-12">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter mb-2" style={{ textShadow: '6px 6px 0px rgba(124, 58, 237, 0.5)' }}>
                                Your <span className="text-purple-400">Cart</span>
                            </h1>
                            <p className="text-gray-400 text-lg font-bold uppercase tracking-wide">
                                {cart.lines.length} {cart.lines.length === 1 ? 'Item' : 'Items'} Ready to Checkout
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <motion.button
                                whileHover={{ y: -3 }}
                                onClick={handleClearCart}
                                className="px-5 py-3 bg-red-900/20 text-red-400 font-black uppercase text-xs tracking-wide border-2 border-red-900 hover:border-red-500 transition-all shadow-[3px_3px_0px_0px_rgba(127,29,29,1)]"
                            >
                                <Trash2 className="w-4 h-4 inline mr-2" strokeWidth={3} />
                                Clear All
                            </motion.button>
                            <Link href="/dashboard">
                                <motion.button
                                    whileHover={{ y: -3 }}
                                    className="px-5 py-3 bg-gray-900 text-gray-400 font-black uppercase text-xs tracking-wide border-2 border-gray-800 hover:border-purple-500 hover:text-white transition-all"
                                >
                                    Continue Shopping
                                </motion.button>
                            </Link>
                        </div>
                    </div>
                </header>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Cart Items */}
                    <div className="lg:col-span-2 space-y-4">
                        <AnimatePresence>
                            {cart.lines.map((line) => {
                                const product = line.product || {};
                                const rentalDays = line.rentalStart && line.rentalEnd
                                    ? Math.ceil((new Date(line.rentalEnd) - new Date(line.rentalStart)) / (1000 * 60 * 60 * 24))
                                    : 0;

                                return (
                                    <motion.div
                                        key={line.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="bg-black border-4 border-gray-800 hover:border-purple-500 shadow-[6px_6px_0px_0px_rgba(75,85,99,1)] hover:shadow-[8px_8px_0px_0px_rgba(168,85,247,1)] transition-all p-6"
                                    >
                                        <div className="flex flex-col sm:flex-row gap-6">
                                            {/* Image */}
                                            <div className="w-full sm:w-32 h-32 bg-gray-900 border-4 border-gray-800 flex items-center justify-center flex-shrink-0">
                                                {product.imageUrls?.[0] ? (
                                                    <img src={product.imageUrls[0]} alt={product.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Package className="w-12 h-12 text-gray-700" strokeWidth={2} />
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1">
                                                <h3 className="text-xl font-black uppercase text-white mb-2">{product.name}</h3>

                                                {line.type === 'RENTAL' && line.rentalStart && line.rentalEnd && (
                                                    <div className="flex flex-wrap items-center gap-3 mb-3">
                                                        <div className="flex items-center gap-2 px-3 py-1 bg-purple-500/10 border-2 border-purple-500">
                                                            <Calendar className="w-4 h-4 text-purple-400" strokeWidth={3} />
                                                            <span className="text-xs font-bold text-purple-400 uppercase">
                                                                {new Date(line.rentalStart).toLocaleDateString()} - {new Date(line.rentalEnd).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                        <div className="px-3 py-1 bg-gray-900 border-2 border-gray-800">
                                                            <span className="text-xs font-bold text-gray-400 uppercase">{rentalDays} Days</span>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex flex-wrap items-center gap-4 mb-4">
                                                    <div className={`px-3 py-1 font-black text-xs uppercase border-2 ${line.type === 'RENTAL'
                                                            ? 'bg-purple-500/10 text-purple-400 border-purple-500'
                                                            : 'bg-blue-500/10 text-blue-400 border-blue-500'
                                                        }`}>
                                                        {line.type === 'RENTAL' ? 'Rental' : 'Purchase'}
                                                    </div>
                                                    <div className="text-sm font-bold text-gray-500 uppercase">
                                                        Qty: <span className="text-white">{line.quantity}</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm text-gray-500 uppercase font-bold tracking-wide mb-1">Subtotal</p>
                                                        <p className="text-2xl font-black text-purple-400">₹{parseFloat(line.lineTotal || 0).toLocaleString()}</p>
                                                    </div>
                                                    <motion.button
                                                        whileHover={{ y: -3 }}
                                                        onClick={() => handleRemove(line.id)}
                                                        className="px-4 py-2 bg-red-900/20 text-red-400 font-black uppercase text-xs border-2 border-red-900 hover:border-red-500 transition-all shadow-[2px_2px_0px_0px_rgba(127,29,29,1)]"
                                                    >
                                                        <Trash2 className="w-4 h-4" strokeWidth={3} />
                                                    </motion.button>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 bg-black border-4 border-purple-500 shadow-[8px_8px_0px_0px_rgba(168,85,247,1)] p-6">
                            <h2 className="text-2xl font-black uppercase mb-6 text-purple-400">Order Summary</h2>

                            <div className="space-y-4 mb-6 pb-6 border-b-4 border-gray-900">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-bold uppercase text-gray-500 tracking-wide">Subtotal</span>
                                    <span className="text-lg font-black text-white">₹{total.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-bold uppercase text-gray-500 tracking-wide">Tax (Estimated)</span>
                                    <span className="text-lg font-black text-white">₹{(total * 0.18).toFixed(0)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-bold uppercase text-gray-500 tracking-wide">Delivery</span>
                                    <span className="text-lg font-black text-green-400">FREE</span>
                                </div>
                            </div>

                            <div className="flex justify-between items-center mb-6 pb-6 border-b-4 border-gray-900">
                                <span className="text-lg font-black uppercase text-white tracking-wide">Total</span>
                                <span className="text-3xl font-black text-purple-400">₹{(total * 1.18).toFixed(0)}</span>
                            </div>

                            <motion.button
                                whileHover={{ x: -4, y: -4 }}
                                whileTap={{ x: 0, y: 0 }}
                                onClick={handleCheckout}
                                className="w-full px-6 py-4 bg-purple-500 text-black font-black uppercase text-sm tracking-wider border-4 border-purple-500 shadow-[6px_6px_0px_0px_rgba(168,85,247,1)] hover:shadow-[10px_10px_0px_0px_rgba(168,85,247,1)] transition-all"
                            >
                                Proceed to Checkout
                                <ArrowRight className="w-5 h-5 inline ml-2 mb-1" strokeWidth={3} />
                            </motion.button>

                            <p className="text-xs text-gray-600 uppercase font-bold text-center mt-4 tracking-wide">
                                Secure Checkout • Free Returns
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
