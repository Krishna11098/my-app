'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Package, ShoppingCart, Filter, X } from 'lucide-react';

export default function CustomerDashboard() {
    const { user } = useAuth();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState('All');
    const [buyMode, setBuyMode] = useState({});
    const [quantities, setQuantities] = useState({});

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
        <div className="min-h-screen bg-black text-white p-6 md:p-10">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <header className="mb-12">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                        <div>
                            <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter mb-3" style={{ textShadow: '6px 6px 0px rgba(124, 58, 237, 0.5)' }}>
                                Explore <span className="text-purple-400">Collection</span>
                            </h1>
                            <p className="text-gray-400 text-lg font-bold uppercase tracking-wide">
                                Premium Gear for Your Next Adventure
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter className="w-5 h-5 text-purple-400" strokeWidth={3} />
                            <span className="text-sm font-bold uppercase text-gray-500 tracking-wide">Filter:</span>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3 mt-6">
                        {['All', 'Electronics', 'Furniture', 'Tools', 'Photography', 'Vehicles'].map(cat => (
                            <motion.button
                                key={cat}
                                onClick={() => setCategory(cat)}
                                whileHover={{ y: -3 }}
                                className={`px-5 py-2 font-black uppercase text-sm tracking-wide border-4 transition-all ${category === cat
                                        ? 'bg-purple-500 text-black border-purple-500 shadow-[4px_4px_0px_0px_rgba(168,85,247,1)]'
                                        : 'text-gray-400 border-gray-800 hover:text-white hover:border-purple-500'
                                    }`}
                            >
                                {cat}
                            </motion.button>
                        ))}
                    </div>
                </header>

                {/* Products Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {loading ? (
                        [...Array(8)].map((_, i) => (
                            <div key={i} className="h-96 bg-gray-900 border-4 border-gray-800 animate-pulse" />
                        ))
                    ) : (
                        products.map((product) => (
                            <motion.div
                                key={product.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                whileHover={{ y: -8, x: -4 }}
                                className="group bg-black border-4 border-gray-800 hover:border-purple-500 shadow-[6px_6px_0px_0px_rgba(75,85,99,1)] hover:shadow-[12px_12px_0px_0px_rgba(168,85,247,1)] transition-all flex flex-col"
                            >
                                {/* Image Area - Clickable */}
                                <Link href={`/products/${product.id}`} className="block h-52 bg-gray-900 relative overflow-hidden border-b-4 border-gray-800 group-hover:border-purple-500">
                                    {product.imageUrls && product.imageUrls[0] ? (
                                        <img src={product.imageUrls[0]} alt={product.name} className="w-full h-full object-cover transition-transform duration-500" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Package className="w-16 h-16 text-gray-800" strokeWidth={2} />
                                        </div>
                                    )}

                                    <div className="absolute top-3 right-3 bg-black border-2 border-purple-500 px-3 py-1 text-xs font-black uppercase text-purple-400 shadow-[2px_2px_0px_0px_rgba(168,85,247,1)]">
                                        {product.attributes?.category || product.category || 'Item'}
                                    </div>
                                </Link>

                                {/* Content Area */}
                                <div className="p-5 flex-1 flex flex-col">
                                    <h3 className="text-xl font-black uppercase text-white mb-2 line-clamp-1">{product.name}</h3>
                                    <p className="text-gray-500 text-sm mb-4 line-clamp-2 min-h-[40px] font-medium">{product.description || 'No description available.'}</p>

                                    <div className="grid grid-cols-2 gap-3 mb-4 mt-auto">
                                        <div className="p-3 bg-gray-900 border-2 border-gray-800">
                                            <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Rent</p>
                                            <p className="text-lg font-black text-purple-400">
                                                ₹{product.priceConfigs?.[0] ? product.priceConfigs[0].price : 'N/A'}
                                                <span className="text-xs font-normal text-gray-600">/day</span>
                                            </p>
                                        </div>
                                        <div className="p-3 bg-gray-900 border-2 border-gray-800">
                                            <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Buy</p>
                                            <p className="text-lg font-black text-white">₹{parseFloat(product.salePrice || 0).toLocaleString()}</p>
                                        </div>
                                    </div>

                                    {/* Action Area */}
                                    {buyMode[product.id] ? (
                                        <div className="space-y-3">
                                            <div className="flex items-center bg-gray-900 border-2 border-gray-800">
                                                <button
                                                    onClick={() => setQuantities({ ...quantities, [product.id]: Math.max(1, (quantities[product.id] || 1) - 1) })}
                                                    className="px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors font-black text-lg border-r-2 border-gray-800"
                                                >
                                                    -
                                                </button>
                                                <span className="flex-1 text-center text-sm font-black text-white uppercase">
                                                    Qty: {quantities[product.id] || 1}
                                                </span>
                                                <button
                                                    onClick={() => setQuantities({ ...quantities, [product.id]: (quantities[product.id] || 1) + 1 })}
                                                    className="px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors font-black text-lg border-l-2 border-gray-800"
                                                >
                                                    +
                                                </button>
                                            </div>
                                            <div className="flex gap-2">
                                                <motion.button
                                                    whileHover={{ y: -3 }}
                                                    onClick={() => addToCart(product.id)}
                                                    className="flex-1 px-4 py-2 bg-purple-500 text-black font-black uppercase text-sm border-4 border-purple-500 shadow-[3px_3px_0px_0px_rgba(168,85,247,1)] hover:shadow-[6px_6px_0px_0px_rgba(168,85,247,1)] transition-all"
                                                >
                                                    <ShoppingCart className="w-4 h-4 inline mr-2" strokeWidth={3} />
                                                    Add
                                                </motion.button>
                                                <motion.button
                                                    whileHover={{ y: -3 }}
                                                    onClick={() => setBuyMode({ ...buyMode, [product.id]: false })}
                                                    className="px-4 py-2 bg-gray-900 text-gray-400 font-black uppercase text-sm border-2 border-gray-700 hover:border-red-500 hover:text-red-400 transition-all"
                                                >
                                                    <X className="w-4 h-4" strokeWidth={3} />
                                                </motion.button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
                                            <motion.button
                                                whileHover={{ y: -3 }}
                                                onClick={() => handleBuyNow(product.id)}
                                                className="flex-1 px-4 py-3 bg-blue-600 text-white font-black uppercase text-sm border-4 border-blue-600 shadow-[3px_3px_0px_0px_rgba(37,99,235,1)] hover:shadow-[6px_6px_0px_0px_rgba(37,99,235,1)] transition-all"
                                            >
                                                Buy Now
                                            </motion.button>
                                            <Link href={`/products/${product.id}`} className="flex-1">
                                                <motion.button
                                                    whileHover={{ y: -3 }}
                                                    className="w-full px-4 py-3 bg-purple-500 text-black font-black uppercase text-sm border-4 border-purple-500 shadow-[3px_3px_0px_0px_rgba(168,85,247,1)] hover:shadow-[6px_6px_0px_0px_rgba(168,85,247,1)] transition-all"
                                                >
                                                    Rent
                                                </motion.button>
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
                        <h2 className="text-4xl font-black uppercase text-gray-700 mb-4">No Products Available</h2>
                        <p className="text-gray-600 font-bold uppercase tracking-wide">Check Back Later for New Arrivals</p>
                    </div>
                )}
            </div>
        </div>
    );
}
