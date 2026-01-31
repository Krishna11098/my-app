'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function VendorProducts() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/vendor/products')
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) setProducts(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    return (
        <div className="min-h-screen bg-black p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">Inventory</h1>
                        <p className="text-gray-400">Manage your rental products and pricing.</p>
                    </div>
                    <Link href="/vendor/products/add" className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-full transition-all shadow-lg shadow-purple-900/20">
                        + Add Product
                    </Link>
                </div>

                {/* Filters / Search Bar - Placeholder */}
                <div className="mb-8 flex gap-4">
                    <input placeholder="Search products..." className="bg-gray-900 border border-gray-800 text-white px-4 py-2 rounded-lg w-full max-w-md focus:outline-none focus:border-purple-500" />
                </div>

                {/* Products List */}
                <div className="grid grid-cols-1 gap-4">
                    {loading ? (
                        <div className="text-white text-center">Loading inventory...</div>
                    ) : (
                        products.map((product) => (
                            <motion.div
                                key={product.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="p-5 rounded-2xl bg-gray-900/40 border border-gray-800 hover:border-gray-700 transition-all flex items-center justify-between group"
                            >
                                <div className="flex items-center gap-6">
                                    {/* Image Placeholder or real image */}
                                    <div className="w-16 h-16 rounded-lg bg-gray-800 flex items-center justify-center text-gray-500 text-xs overflow-hidden">
                                        {product.imageUrls && product.imageUrls.length > 0 ? (
                                            <img src={product.imageUrls[0]} alt={product.name} className="w-full h-full object-cover" />
                                        ) : (
                                            "IMG"
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors">{product.name}</h3>
                                        <p className="text-sm text-gray-400">{product.attributes?.category || 'General'} • {product.quantityOnHand} in stock</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-8">
                                    <div className="text-right">
                                        {/* Display first price config as default */}
                                        <p className="text-white font-bold">
                                            {product.priceConfigs && product.priceConfigs.length > 0
                                                ? `₹${product.priceConfigs[0].price}/${product.priceConfigs[0].periodUnit}`
                                                : 'Price N/A'}
                                        </p>
                                        <p className={`text-xs ${product.isPublished ? 'text-green-400' : 'text-yellow-400'}`}>
                                            {product.isPublished ? 'Published' : 'Draft'}
                                        </p>
                                    </div>
                                    <Link href={`/vendor/products/${product.id}/edit`} className="px-3 py-1.5 rounded-lg bg-gray-800 text-xs font-semibold text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
                                        Edit
                                    </Link>
                                    <button
                                        onClick={async () => {
                                            if (!confirm('Delete this product?')) return;
                                            await fetch(`/api/vendor/products/${product.id}`, { method: 'DELETE' });
                                            // Optimistic update or refetch
                                            setProducts(products.filter(p => p.id !== product.id));
                                        }}
                                        className="px-3 py-1.5 rounded-lg bg-red-900/20 text-xs font-semibold text-red-400 hover:bg-red-900/40 transition-colors"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    )}
                    {!loading && products.length === 0 && (
                        <div className="text-center py-20 bg-gray-900/20 rounded-2xl border border-gray-800 border-dashed text-gray-500">
                            No products found. Start by adding one.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
