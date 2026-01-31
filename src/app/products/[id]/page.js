'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';

export default function ProductDetails() {
    const { id } = useParams();
    const router = useRouter();
    const { user } = useAuth();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [totalPrice, setTotalPrice] = useState(0);

    useEffect(() => {
        fetch(`/api/products/${id}`)
            .then(res => res.json())
            .then(data => {
                setProduct(data);
                setLoading(false);
            })
            .catch(err => setLoading(false));
    }, [id]);

    // Simple price calculation logic
    const calculateEstimate = () => {
        if (!startDate || !endDate || !product) return;

        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Find best pricing scheme (Naive approach: check Day first)
        const dayConfig = product.priceConfigs.find(p => p.periodUnit === 'DAY');
        const hourConfig = product.priceConfigs.find(p => p.periodUnit === 'HOUR');

        let price = 0;

        if (dayConfig) {
            price = parseFloat(dayConfig.price) * diffDays;
        } else if (hourConfig) {
            price = parseFloat(hourConfig.price) * diffHours;
        }

        setTotalPrice(price);
    };

    useEffect(() => {
        calculateEstimate();
    }, [startDate, endDate]);

    const handleRent = async () => {
        if (!user) {
            router.push('/login');
            return;
        }

        if (totalPrice <= 0 || !startDate || !endDate) return;

        try {
            const payload = {
                userId: user.id,
                productId: product.id,
                quantity: 1,
                type: 'RENTAL',
                startDate,
                endDate
            };
            console.log('[BOOK NOW] Sending payload:', payload);

            // Add to Cart (Rental) with specific dates
            const res = await fetch('/api/cart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert('Added to cart as Rental!');
                router.push('/cart');
            } else {
                const data = await res.json();
                alert('Failed to book: ' + (data.error || 'Unknown error'));
            }
        } catch (err) {
            console.error(err);
            alert('Something went wrong');
        }
    };

    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>;
    if (!product) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Product not found</div>;

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-10">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">

                {/* Left: Images */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-gray-900/50 rounded-3xl overflow-hidden h-[500px] border border-gray-800"
                >
                    {product.imageUrls && product.imageUrls[0] ? (
                        <img src={product.imageUrls[0]} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-700 text-5xl font-bold">JOY</div>
                    )}
                </motion.div>

                {/* Right: Details */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-8"
                >
                    <div>
                        <span className="bg-purple-600/20 text-purple-400 px-3 py-1 rounded-full text-sm font-semibold mb-4 inline-block">
                            {product.attributes?.category || 'Rental'}
                        </span>
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">{product.name}</h1>
                        <p className="text-gray-400 text-lg leading-relaxed">{product.description}</p>
                    </div>

                    <div className="border-t border-gray-800 pt-8">
                        <h3 className="text-xl font-bold mb-6">Configuration</h3>

                        <div className="grid grid-cols-2 gap-6 mb-6">
                            <div>
                                <label className="block text-sm text-gray-500 mb-2">Start Date</label>
                                <input
                                    type="datetime-local"
                                    className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white outline-none focus:border-purple-500"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-500 mb-2">End Date</label>
                                <input
                                    type="datetime-local"
                                    className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white outline-none focus:border-purple-500"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="bg-gray-900/40 p-6 rounded-2xl border border-gray-800 space-y-4">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-gray-400 text-sm">Rental Estimate</p>
                                    <div className="text-3xl font-bold text-white">
                                        {totalPrice > 0 ? `₹${totalPrice.toLocaleString()}` : '—'}
                                    </div>
                                </div>
                                <button
                                    onClick={handleRent}
                                    disabled={totalPrice <= 0}
                                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-1"
                                >
                                    Book Now
                                </button>
                            </div>

                            {/* Buy Option */}
                            <div className="pt-4 border-t border-gray-800 flex justify-between items-center">
                                <div>
                                    <p className="text-gray-400 text-sm">Buy Outright</p>
                                    <div className="text-xl font-bold text-white">
                                        ₹{parseFloat(product.salePrice || 0).toLocaleString()}
                                    </div>
                                </div>
                                <button
                                    onClick={async () => {
                                        if (!user) return router.push('/login');
                                        try {
                                            const payload = { userId: user.id, productId: product.id, quantity: 1, type: 'SALE' };
                                            console.log('[BUY NOW] Sending payload:', payload);
                                            const res = await fetch('/api/cart', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify(payload)
                                            });
                                            if (res.ok) {
                                                alert('Added to cart as Purchase!');
                                                router.push('/cart');
                                            }
                                        } catch (e) { console.error(e); }
                                    }}
                                    className="px-6 py-2 bg-gray-800 text-white font-semibold rounded-xl hover:bg-gray-700 transition-colors border border-gray-700 hover:border-gray-600"
                                >
                                    Buy Now
                                </button>
                            </div>
                        </div>

                        <p className="mt-4 text-xs text-center text-gray-500">
                            *Includes taxes and fees. Security deposit may apply.
                        </p>
                    </div>

                    {/* Specs / Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-900/30 rounded-xl border border-gray-800">
                            <p className="text-xs text-gray-500">Condition</p>
                            <p className="font-semibold text-white">Excellent</p>
                        </div>
                        <div className="p-4 bg-gray-900/30 rounded-xl border border-gray-800">
                            <p className="text-xs text-gray-500">SKU</p>
                            <p className="font-semibold text-white">{product.sku}</p>
                        </div>
                    </div>

                </motion.div>
            </div>
        </div>
    );
}
