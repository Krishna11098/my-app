'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminSidebar from '@/components/admin/AdminSidebar';
import {
    ShoppingBag,
    Search,
    Tag,
    Trash2,
    Eye,
    EyeOff,
    Store,
    LayoutGrid,
    List,
    AlertTriangle,
    Check
} from 'lucide-react';

export default function AdminProducts() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('grid');

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        const res = await fetch('/api/admin/products');
        const data = await res.json();
        setProducts(data);
        setLoading(false);
    };

    const toggleStatus = async (id, currentStatus) => {
        const res = await fetch('/api/admin/products', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, isPublished: !currentStatus })
        });
        if (res.ok) fetchProducts();
    };

    const deleteProduct = async (id) => {
        if (!confirm('TERMINATE RESOURCE: This will permanently remove this item from the public catalog. Proceed?')) return;
        const res = await fetch(`/api/admin/products?id=${id}`, { method: 'DELETE' });
        if (res.ok) fetchProducts();
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.vendor?.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex min-h-screen bg-black text-white">
            <AdminSidebar />

            <main className="flex-1 p-12 overflow-y-auto">
                <header className="mb-12">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-12">
                        <div>
                            <motion.h1
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                className="text-6xl font-black uppercase tracking-tighter"
                            >
                                Global <span className="text-purple-500">Catalog</span>
                            </motion.h1>
                            <p className="text-gray-500 font-bold uppercase tracking-[0.2em] mt-2">Managing {products.length} System-Wide Resources</p>
                        </div>

                        <div className="flex flex-wrap gap-4 w-full md:w-auto">
                            <div className="relative flex-1 md:flex-none md:w-96 group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Filter catalog..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="bg-gray-900 border-4 border-black p-4 pl-12 w-full font-bold focus:outline-none focus:border-purple-600 transition-all placeholder:text-gray-700"
                                />
                            </div>
                            <div className="flex border-4 border-black bg-gray-900 overflow-hidden">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-4 transition-all ${viewMode === 'grid' ? 'bg-purple-600 text-white' : 'text-gray-500 hover:text-white'}`}
                                >
                                    <LayoutGrid size={24} />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-4 transition-all ${viewMode === 'list' ? 'bg-purple-600 text-white' : 'text-gray-500 hover:text-white'}`}
                                >
                                    <List size={24} />
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8' : 'space-y-4'}>
                    {loading ? (
                        [1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-96 bg-gray-900 border-4 border-gray-800 animate-pulse rounded" />
                        ))
                    ) : filteredProducts.map((product, i) => (
                        <motion.div
                            key={product.id}
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: i * 0.05 }}
                            className={`group bg-gray-900 border-4 border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] hover:shadow-[10px_10px_0px_0px_rgba(124,58,237,1)] transition-all overflow-hidden relative ${viewMode === 'list' ? 'flex items-center p-4 gap-8' : ''
                                }`}
                        >
                            {/* Product Image */}
                            <div className={`${viewMode === 'list' ? 'w-24 h-24 shrink-0' : 'h-64'} relative border-b-4 border-black bg-white group-hover:bg-purple-50 transition-colors overflow-hidden`}>
                                {product.imageUrls?.[0] ? (
                                    <img src={product.imageUrls[0]} alt={product.name} className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-500" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-200"><ShoppingBag size={48} /></div>
                                )}
                                <div className="absolute top-4 right-4 flex flex-col gap-2">
                                    <div className={`px-2 py-1 text-[10px] font-black uppercase text-black italic shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${product.isPublished ? 'bg-green-500' : 'bg-red-500'}`}>
                                        {product.isPublished ? 'Live' : 'Hidden'}
                                    </div>
                                </div>
                            </div>

                            {/* Product Info */}
                            <div className={`p-6 flex-1 flex flex-col ${viewMode === 'list' ? 'bg-transparent' : ''}`}>
                                <div className="mb-4">
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="text-2xl font-black uppercase tracking-tighter truncate">{product.name}</h3>
                                        <div className="text-xl font-bold text-purple-400">₹{Number(product.basePrice).toLocaleString()}</div>
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 flex items-center gap-1">
                                        <Store size={12} className="text-purple-600" /> {product.vendor?.companyName || 'SOLO VENDOR'}
                                    </p>
                                </div>

                                <div className="mt-auto pt-6 border-t-4 border-black/20 flex gap-2">
                                    <button
                                        onClick={() => toggleStatus(product.id, product.isPublished)}
                                        className="flex-1 py-3 bg-black text-white font-black uppercase text-xs tracking-widest border-4 border-transparent hover:bg-purple-600 hover:border-black transition-all flex items-center justify-center gap-2"
                                    >
                                        {product.isPublished ? <><EyeOff size={16} /> Hide Item</> : <><Eye size={16} /> Publish</>}
                                    </button>
                                    <button
                                        onClick={() => deleteProduct(product.id)}
                                        className="p-3 bg-red-600 text-black border-4 border-transparent hover:bg-red-700 hover:border-black transition-all"
                                        title="Delete Permanently"
                                    >
                                        <Trash2 size={16} strokeWidth={3} />
                                    </button>
                                </div>
                            </div>

                            {/* Overlay Badge for List View */}
                            {viewMode === 'list' && !product.isPublished && (
                                <div className="absolute inset-0 bg-red-500/5 pointer-events-none" />
                            )}
                        </motion.div>
                    ))}

                    {!loading && filteredProducts.length === 0 && (
                        <div className="col-span-full p-20 border-8 border-dashed border-gray-900 flex flex-col items-center justify-center text-gray-700">
                            <AlertTriangle size={64} className="mb-4 opacity-20" />
                            <p className="text-2xl font-black uppercase tracking-tighter italic">No entries found in system catalog</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
