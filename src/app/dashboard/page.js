'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function CustomerDashboard() {
    const { user } = useAuth();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState('All');
    const [buyMode, setBuyMode] = useState({}); // {productId: true/false}
    const [quantities, setQuantities] = useState({}); // {productId: qty}

    const fetchProducts = () => {
        setLoading(true);
        const query = category !== 'All' ? `?category=${category}` : '';
        fetch(`/api/products${query}`)
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) setProducts(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchProducts();
    }, [category]);

    const handleBuyNow = (productId) => {
        setBuyMode({ ...buyMode, [productId]: true });
        setQuantities({ ...quantities, [productId]: 1 });
    };

    const addToCart = async (productId) => {
        if (!user) return alert('Login required');
        const qty = quantities[productId] || 1;

        try {
            const res = await fetch('/api/cart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, productId, quantity: qty, type: 'SALE' })
            });

            if (res.ok) {
                alert('Added to cart as Purchase!');
                setBuyMode({ ...buyMode, [productId]: false });
                setQuantities({ ...quantities, [productId]: 0 });
            } else {
                alert('Failed to add to cart');
            }
        } catch (e) { console.error(e); }
    };

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-10 text-center">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <header className="flex flex-col md:flex-row justify-between items-end mb-12 text-left">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-600 mb-2">
                            Explore Collection
                        </h1>
                        <p className="text-gray-400 text-lg">
                            Premium gear for your next adventure or project.
                        </p>
                    </div>
                    <div className="flex gap-3 mt-4 md:mt-0">
                        {['All', 'Electronics', 'Furniture', 'Tools'].map(cat => (
                            <button
                                key={cat}
                                onClick={() => setCategory(cat)}
                                className={`px-4 py-2 rounded-full border transition-colors text-sm ${category === cat
                                        ? 'bg-indigo-600 border-indigo-600 text-white'
                                        : 'bg-gray-900 border-gray-700 hover:border-indigo-500'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </header>

                {/* Products Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 text-left">
                    {loading ? (
                        [1, 2, 3, 4].map(i => (
                            <div key={i} className="h-80 bg-gray-900 rounded-2xl animate-pulse" />
                        ))
                    ) : (
                        products.map((product) => (
                            <motion.div
                                key={product.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                whileHover={{ y: -5 }}
                                className="group bg-gray-900/40 border border-gray-800 rounded-2xl overflow-hidden hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 flex flex-col"
                            >
                                {/* Image Area - Clickable */}
                                <Link href={`/products/${product.id}`} className="block h-52 bg-gray-800 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-60" />

                                    {product.imageUrls && product.imageUrls[0] ? (
                                        <img src={product.imageUrls[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-600 text-4xl font-bold opacity-20">JOY</div>
                                    )}

                                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white border border-white/10">
                                        {product.attributes?.category || 'Item'}
                                    </div>
                                </Link>

                                {/* Content Area */}
                                <div className="p-5 flex-1 flex flex-col">
                                    <h3 className="text-xl font-bold text-white mb-1 group-hover:text-indigo-400 transition-colors line-clamp-1">{product.name}</h3>
                                    <p className="text-gray-500 text-sm mb-4 line-clamp-2 min-h-[40px]">{product.description || 'No description available.'}</p>

                                    <div className="flex items-center justify-between mb-4 mt-auto">
                                        <div>
                                            <p className="text-xs text-gray-400 uppercase tracking-wider">Rent from</p>
                                            <p className="text-lg font-bold text-white">
                                                {product.priceConfigs?.[0] ? `₹${product.priceConfigs[0].price}` : 'N/A'}
                                                <span className="text-sm font-normal text-gray-500">/day</span>
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-400 uppercase tracking-wider">Buy at</p>
                                            <p className="text-lg font-bold text-white">₹{parseFloat(product.salePrice || 0).toLocaleString()}</p>
                                        </div>
                                    </div>

                                    {/* Action Area */}
                                    {buyMode[product.id] ? (
                                        <div className="space-y-2">
                                            <div className="flex items-center bg-gray-800 rounded-lg border border-gray-700">
                                                <button
                                                    onClick={() => setQuantities({ ...quantities, [product.id]: Math.max(1, (quantities[product.id] || 1) - 1) })}
                                                    className="px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                                                >
                                                    -
                                                </button>
                                                <span className="flex-1 text-center text-sm font-bold text-white">
                                                    Qty: {quantities[product.id] || 1}
                                                </span>
                                                <button
                                                    onClick={() => setQuantities({ ...quantities, [product.id]: (quantities[product.id] || 1) + 1 })}
                                                    className="px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                                                >
                                                    +
                                                </button>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => addToCart(product.id)}
                                                    className="flex-1 px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-500 transition-colors text-sm"
                                                >
                                                    Add to Cart
                                                </button>
                                                <button
                                                    onClick={() => setBuyMode({ ...buyMode, [product.id]: false })}
                                                    className="px-4 py-2 bg-gray-700 text-gray-300 font-bold rounded-lg hover:bg-gray-600 transition-colors text-sm"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleBuyNow(product.id)}
                                                className="flex-1 px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-500 transition-colors text-sm"
                                            >
                                                Buy Now
                                            </button>
                                            <Link
                                                href={`/products/${product.id}`}
                                                className="flex-1 px-4 py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-500 transition-colors text-sm text-center"
                                            >
                                                Rent
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>

                {!loading && products.length === 0 && (
                    <div className="text-center py-32">
                        <h2 className="text-2xl font-bold text-gray-600">No products available yet.</h2>
                        <p className="text-gray-500">Check back later for new arrivals.</p>
                    </div>
                )}

            </div>
        </div>
    );
}
