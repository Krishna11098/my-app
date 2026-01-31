'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, Search, Filter, X, Edit, Trash2, Plus, Eye } from 'lucide-react';

export default function VendorProducts() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [filter, setFilter] = useState({
        minPrice: '',
        maxPrice: '',
        minStock: '',
        maxStock: '',
        category: '',
        published: '',
    });

    useEffect(() => {
        fetch('/api/vendor/products')
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) {
                    setProducts(data);
                }
                setLoading(false);
            })
            .catch(() => {
                setLoading(false);
            });
    }, []);

    const filteredProducts = products.filter(p => {
        // Search
        if (searchQuery &&
            !p.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !p.sku?.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !p.description?.toLowerCase().includes(searchQuery.toLowerCase())
        ) return false;

        // Category
        if (filter.category && (p.attributes?.category || '').toLowerCase() !== filter.category.toLowerCase()) return false;

        // Published
        if (filter.published && (filter.published === 'published' ? !p.isPublished : p.isPublished)) return false;

        // Stock
        if (filter.minStock && Number(p.quantityOnHand) < Number(filter.minStock)) return false;
        if (filter.maxStock && Number(p.quantityOnHand) > Number(filter.maxStock)) return false;

        // Price (check DAY price)
        const dayPrice = p.priceConfigs?.find(pc => pc.periodUnit === 'DAY')?.price;
        if (filter.minPrice && (!dayPrice || Number(dayPrice) < Number(filter.minPrice))) return false;
        if (filter.maxPrice && (!dayPrice || Number(dayPrice) > Number(filter.maxPrice))) return false;

        return true;
    });

    const getPriceByUnit = (priceConfigs, unit) => {
        const config = priceConfigs?.find(p => p.periodUnit === unit);
        return config ? `₹${Math.floor(Number(config.price))}` : '-';
    };

    const clearFilters = () => {
        setFilter({
            minPrice: '',
            maxPrice: '',
            minStock: '',
            maxStock: '',
            category: '',
            published: '',
        });
        setSearchQuery('');
    };

    const hasActiveFilters = searchQuery || Object.values(filter).some(v => v !== '');

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-12">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                        <div>
                            <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter mb-2" style={{ textShadow: '6px 6px 0px rgba(124, 58, 237, 0.5)' }}>
                                Product <span className="text-purple-400">Inventory</span>
                            </h1>
                            <p className="text-gray-400 text-lg font-bold uppercase tracking-wide">
                                {filteredProducts.length} of {products.length} Products
                            </p>
                        </div>
                        <Link href="/vendor/products/add">
                            <motion.button
                                whileHover={{ x: -4, y: -4 }}
                                whileTap={{ x: 0, y: 0 }}
                                className="px-6 py-3 bg-purple-500 text-black font-black uppercase text-sm tracking-wider border-4 border-purple-500 shadow-[6px_6px_0px_0px_rgba(168,85,247,1)] hover:shadow-[10px_10px_0px_0px_rgba(168,85,247,1)] transition-all"
                            >
                                <Plus className="w-5 h-5 inline mr-2 mb-0.5" strokeWidth={3} />
                                Add Product
                            </motion.button>
                        </Link>
                    </div>
                </div>

                {/* Search & Filter Controls */}
                <div className="mb-8 space-y-4">
                    {/* Search Bar */}
                    <div className="flex gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" strokeWidth={3} />
                            <input
                                type="text"
                                placeholder="Search by name, SKU, or description..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full bg-gray-900 border-4 border-gray-800 text-white pl-12 pr-4 py-4 focus:outline-none focus:border-purple-500 transition-colors placeholder-gray-700 font-medium"
                            />
                        </div>
                        <motion.button
                            whileHover={{ y: -3 }}
                            onClick={() => setShowFilters(!showFilters)}
                            className={`px-6 py-4 font-black uppercase text-sm tracking-wide border-4 transition-all flex items-center gap-2 ${showFilters
                                    ? 'bg-purple-500 text-black border-purple-500 shadow-[4px_4px_0px_0px_rgba(168,85,247,1)]'
                                    : 'text-gray-400 border-gray-800 hover:text-white hover:border-purple-500'
                                }`}
                        >
                            <Filter className="w-5 h-5" strokeWidth={3} />
                            Filters
                        </motion.button>
                        {hasActiveFilters && (
                            <motion.button
                                whileHover={{ y: -3 }}
                                onClick={clearFilters}
                                className="px-6 py-4 font-black uppercase text-sm tracking-wide border-4 text-red-400 border-red-900 hover:border-red-500 transition-all flex items-center gap-2"
                            >
                                <X className="w-5 h-5" strokeWidth={3} />
                                Clear
                            </motion.button>
                        )}
                    </div>

                    {/* Filter Panel */}
                    <AnimatePresence>
                        {showFilters && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="bg-gray-900 border-4 border-gray-800 p-6">
                                    <h3 className="text-lg font-black uppercase mb-4 text-purple-400">Filter Options</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {/* Price Range */}
                                        <div>
                                            <label className="block text-xs font-black uppercase text-gray-500 tracking-widest mb-2">
                                                Min Price (₹/day)
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={filter.minPrice}
                                                onChange={e => setFilter(f => ({ ...f, minPrice: e.target.value }))}
                                                placeholder="0"
                                                className="w-full bg-black border-2 border-gray-800 text-white px-3 py-2 focus:outline-none focus:border-purple-500 transition-colors placeholder-gray-700 font-medium"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black uppercase text-gray-500 tracking-widest mb-2">
                                                Max Price (₹/day)
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={filter.maxPrice}
                                                onChange={e => setFilter(f => ({ ...f, maxPrice: e.target.value }))}
                                                placeholder="Any"
                                                className="w-full bg-black border-2 border-gray-800 text-white px-3 py-2 focus:outline-none focus:border-purple-500 transition-colors placeholder-gray-700 font-medium"
                                            />
                                        </div>

                                        {/* Stock Range */}
                                        <div>
                                            <label className="block text-xs font-black uppercase text-gray-500 tracking-widest mb-2">
                                                Min Stock
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={filter.minStock}
                                                onChange={e => setFilter(f => ({ ...f, minStock: e.target.value }))}
                                                placeholder="0"
                                                className="w-full bg-black border-2 border-gray-800 text-white px-3 py-2 focus:outline-none focus:border-purple-500 transition-colors placeholder-gray-700 font-medium"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black uppercase text-gray-500 tracking-widest mb-2">
                                                Max Stock
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={filter.maxStock}
                                                onChange={e => setFilter(f => ({ ...f, maxStock: e.target.value }))}
                                                placeholder="Any"
                                                className="w-full bg-black border-2 border-gray-800 text-white px-3 py-2 focus:outline-none focus:border-purple-500 transition-colors placeholder-gray-700 font-medium"
                                            />
                                        </div>

                                        {/* Category */}
                                        <div>
                                            <label className="block text-xs font-black uppercase text-gray-500 tracking-widest mb-2">
                                                Category
                                            </label>
                                            <select
                                                value={filter.category}
                                                onChange={e => setFilter(f => ({ ...f, category: e.target.value }))}
                                                className="w-full bg-black border-2 border-gray-800 text-white px-3 py-2 focus:outline-none focus:border-purple-500 transition-colors font-medium"
                                            >
                                                <option value="">All Categories</option>
                                                <option value="Electronics">Electronics</option>
                                                <option value="Furniture">Furniture</option>
                                                <option value="Tools">Tools</option>
                                                <option value="Photography">Photography</option>
                                                <option value="Vehicles">Vehicles</option>
                                                <option value="Fashion">Fashion</option>
                                                <option value="Outdoors">Outdoors</option>
                                                <option value="Events">Events</option>
                                                <option value="Audio/Video">Audio/Video</option>
                                            </select>
                                        </div>

                                        {/* Status */}
                                        <div>
                                            <label className="block text-xs font-black uppercase text-gray-500 tracking-widest mb-2">
                                                Status
                                            </label>
                                            <select
                                                value={filter.published}
                                                onChange={e => setFilter(f => ({ ...f, published: e.target.value }))}
                                                className="w-full bg-black border-2 border-gray-800 text-white px-3 py-2 focus:outline-none focus:border-purple-500 transition-colors font-medium"
                                            >
                                                <option value="">All Status</option>
                                                <option value="published">Published</option>
                                                <option value="draft">Draft</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Products List */}
                <div className="space-y-4">
                    {loading ? (
                        [...Array(3)].map((_, i) => (
                            <div key={i} className="h-48 bg-gray-900 border-4 border-gray-800 animate-pulse" />
                        ))
                    ) : filteredProducts.length > 0 ? (
                        filteredProducts.map((product) => (
                            <motion.div
                                key={product.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                whileHover={{ x: -4, y: -4 }}
                                className="bg-black border-4 border-gray-800 hover:border-purple-500 shadow-[6px_6px_0px_0px_rgba(75,85,99,1)] hover:shadow-[10px_10px_0px_0px_rgba(168,85,247,1)] transition-all flex overflow-hidden"
                            >
                                {/* Square Image on Left */}
                                <div className="w-48 h-48 flex-shrink-0 bg-gray-900 border-r-4 border-gray-800 flex items-center justify-center overflow-hidden">
                                    {product.imageUrls && product.imageUrls.length > 0 ? (
                                        <img
                                            src={product.imageUrls[0]}
                                            alt={product.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <Package className="w-16 h-16 text-gray-800" strokeWidth={2} />
                                    )}
                                </div>

                                {/* Details on Right */}
                                <div className="flex-1 p-6 flex flex-col">
                                    {/* Top Row: Title + Badges */}
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex-1">
                                            <h3 className="text-2xl font-black uppercase text-white mb-1">{product.name}</h3>
                                            <p className="text-sm text-gray-500 font-bold uppercase tracking-wide">
                                                SKU: {product.sku} • {product.attributes?.category || 'General'}
                                            </p>
                                        </div>
                                        <div className="flex gap-2 ml-4">
                                            <div className={`px-3 py-1 border-2 font-black uppercase text-xs ${product.isPublished
                                                    ? 'bg-green-500/10 text-green-400 border-green-500'
                                                    : 'bg-yellow-500/10 text-yellow-400 border-yellow-500'
                                                }`}>
                                                {product.isPublished ? 'Live' : 'Draft'}
                                            </div>
                                            <div className="px-3 py-1 bg-gray-900 border-2 border-gray-800">
                                                <span className="text-xs font-black text-gray-400 uppercase">
                                                    Stock: <span className="text-white">{product.quantityOnHand}</span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    {product.description && (
                                        <p className="text-gray-400 text-sm mb-4 line-clamp-2 font-medium">{product.description}</p>
                                    )}

                                    {/* Pricing Grid */}
                                    <div className="grid grid-cols-4 gap-3 mb-4">
                                        <div className="p-3 bg-gray-900 border-2 border-gray-800">
                                            <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Hour</p>
                                            <p className="text-lg font-black text-purple-400">{getPriceByUnit(product.priceConfigs, 'HOUR')}</p>
                                        </div>
                                        <div className="p-3 bg-gray-900 border-2 border-gray-800">
                                            <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Day</p>
                                            <p className="text-lg font-black text-purple-400">{getPriceByUnit(product.priceConfigs, 'DAY')}</p>
                                        </div>
                                        <div className="p-3 bg-gray-900 border-2 border-gray-800">
                                            <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Week</p>
                                            <p className="text-lg font-black text-purple-400">{getPriceByUnit(product.priceConfigs, 'WEEK')}</p>
                                        </div>
                                        <div className="p-3 bg-gray-900 border-2 border-gray-800">
                                            <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Buy</p>
                                            <p className="text-lg font-black text-green-400">₹{Math.floor(Number(product.salePrice))}</p>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-3 mt-auto">
                                        <motion.button
                                            whileHover={{ y: -2 }}
                                            onClick={() => setSelectedProduct(product)}
                                            className="px-4 py-2 bg-gray-900 text-gray-400 font-black uppercase text-xs border-2 border-gray-800 hover:border-purple-500 hover:text-white transition-all flex items-center gap-2"
                                        >
                                            <Eye className="w-4 h-4" strokeWidth={3} />
                                            View
                                        </motion.button>
                                        <Link href={`/vendor/products/${product.id}/edit`}>
                                            <motion.button
                                                whileHover={{ y: -2 }}
                                                className="px-4 py-2 bg-purple-500 text-black font-black uppercase text-xs border-2 border-purple-500 hover:bg-purple-600 transition-all flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(168,85,247,1)]"
                                            >
                                                <Edit className="w-4 h-4" strokeWidth={3} />
                                                Edit
                                            </motion.button>
                                        </Link>
                                        <motion.button
                                            whileHover={{ y: -2 }}
                                            onClick={async () => {
                                                if (!confirm('Delete this product? This action cannot be undone.')) return;
                                                await fetch(`/api/vendor/products/${product.id}`, { method: 'DELETE' });
                                                setProducts(products.filter(p => p.id !== product.id));
                                            }}
                                            className="px-4 py-2 bg-red-900/20 text-red-400 font-black uppercase text-xs border-2 border-red-900 hover:border-red-500 transition-all flex items-center gap-2"
                                        >
                                            <Trash2 className="w-4 h-4" strokeWidth={3} />
                                            Delete
                                        </motion.button>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="text-center py-24">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-32 h-32 border-4 border-gray-800 bg-gray-900 flex items-center justify-center mx-auto mb-8 shadow-[8px_8px_0px_0px_rgba(31,41,55,1)]"
                            >
                                <Package className="w-16 h-16 text-gray-700" strokeWidth={2} />
                            </motion.div>
                            <h3 className="text-4xl font-black uppercase text-gray-700 mb-4">
                                {searchQuery || hasActiveFilters ? 'No Matches' : 'No Products'}
                            </h3>
                            <p className="text-gray-600 font-bold uppercase tracking-wide mb-8">
                                {searchQuery || hasActiveFilters
                                    ? 'Try Adjusting Your Filters'
                                    : 'Start Building Your Inventory'}
                            </p>
                            {!searchQuery && !hasActiveFilters && (
                                <Link href="/vendor/products/add">
                                    <motion.button
                                        whileHover={{ x: -4, y: -4 }}
                                        whileTap={{ x: 0, y: 0 }}
                                        className="px-8 py-4 bg-purple-500 text-black font-black uppercase text-sm tracking-wider border-4 border-purple-500 shadow-[6px_6px_0px_0px_rgba(168,85,247,1)] hover:shadow-[12px_12px_0px_0px_rgba(168,85,247,1)] transition-all"
                                    >
                                        <Plus className="w-5 h-5 inline mr-2 mb-1" strokeWidth={3} />
                                        Add Your First Product
                                    </motion.button>
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Product Details Modal */}
            <AnimatePresence>
                {selectedProduct && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setSelectedProduct(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-black border-4 border-purple-500 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-[12px_12px_0px_0px_rgba(168,85,247,1)]"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="p-6 border-b-4 border-gray-900 flex justify-between items-start">
                                <div>
                                    <h2 className="text-3xl font-black uppercase text-white mb-1">{selectedProduct.name}</h2>
                                    <p className="text-gray-500 text-sm font-bold uppercase tracking-wide">SKU: {selectedProduct.sku}</p>
                                </div>
                                <motion.button
                                    whileHover={{ rotate: 90 }}
                                    onClick={() => setSelectedProduct(null)}
                                    className="w-10 h-10 border-2 border-gray-800 hover:border-red-500 flex items-center justify-center text-gray-400 hover:text-red-400 transition-all"
                                >
                                    <X className="w-6 h-6" strokeWidth={3} />
                                </motion.button>
                            </div>

                            {/* Image Gallery */}
                            {selectedProduct.imageUrls && selectedProduct.imageUrls.length > 0 && (
                                <div className="p-6 border-b-4 border-gray-900">
                                    <h3 className="text-sm font-black uppercase text-gray-500 tracking-widest mb-3">Product Images</h3>
                                    <div className="grid grid-cols-4 gap-3">
                                        {selectedProduct.imageUrls.map((url, i) => (
                                            <div key={i} className="aspect-square border-2 border-gray-800 overflow-hidden">
                                                <img
                                                    src={url}
                                                    alt={`${selectedProduct.name} ${i + 1}`}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Details */}
                            <div className="p-6 space-y-6">
                                {/* Status & Category */}
                                <div className="flex gap-3">
                                    <div className={`px-4 py-2 border-2 font-black uppercase text-xs ${selectedProduct.isPublished
                                            ? 'bg-green-500/10 text-green-400 border-green-500'
                                            : 'bg-yellow-500/10 text-yellow-400 border-yellow-500'
                                        }`}>
                                        {selectedProduct.isPublished ? 'Published' : 'Draft'}
                                    </div>
                                    <div className="px-4 py-2 bg-purple-500/10 border-2 border-purple-500">
                                        <span className="font-black uppercase text-xs text-purple-400">
                                            {selectedProduct.attributes?.category || 'General'}
                                        </span>
                                    </div>
                                </div>

                                {/* Description */}
                                {selectedProduct.description && (
                                    <div>
                                        <h3 className="text-xs font-black uppercase text-gray-500 tracking-widest mb-2">Description</h3>
                                        <p className="text-white font-medium">{selectedProduct.description}</p>
                                    </div>
                                )}

                                {/* Pricing */}
                                <div>
                                    <h3 className="text-xs font-black uppercase text-gray-500 tracking-widest mb-3">Rental Pricing</h3>
                                    <div className="grid grid-cols-3 gap-3">
                                        {['HOUR', 'DAY', 'WEEK'].map(unit => (
                                            <div key={unit} className="p-4 bg-gray-900 border-2 border-gray-800 text-center">
                                                <p className="text-xs text-gray-500 font-bold uppercase mb-1">Per {unit.toLowerCase()}</p>
                                                <p className="text-2xl font-black text-purple-400">{getPriceByUnit(selectedProduct.priceConfigs, unit)}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Inventory & Value */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <h3 className="text-xs font-black uppercase text-gray-500 tracking-widest mb-2">In Stock</h3>
                                        <p className="text-white font-black text-2xl">{selectedProduct.quantityOnHand}</p>
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-black uppercase text-gray-500 tracking-widest mb-2">Cost Price</h3>
                                        <p className="text-white font-black text-2xl">₹{Math.floor(Number(selectedProduct.costPrice))}</p>
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-black uppercase text-gray-500 tracking-widest mb-2">Sale Price</h3>
                                        <p className="text-white font-black text-2xl">₹{Math.floor(Number(selectedProduct.salePrice))}</p>
                                    </div>
                                </div>

                                {/* Attributes */}
                                {selectedProduct.attributes && Object.keys(selectedProduct.attributes).filter(k => k !== 'category').length > 0 && (
                                    <div>
                                        <h3 className="text-xs font-black uppercase text-gray-500 tracking-widest mb-3">Product Attributes</h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            {Object.entries(selectedProduct.attributes)
                                                .filter(([key]) => key !== 'category')
                                                .map(([key, value]) => (
                                                    <div key={key} className="p-3 bg-gray-900 border-2 border-gray-800">
                                                        <span className="text-xs text-gray-500 font-bold uppercase block">{key}</span>
                                                        <span className="text-white font-bold">{value}</span>
                                                    </div>
                                                ))
                                            }
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer Actions */}
                            <div className="p-6 border-t-4 border-gray-900 flex gap-3">
                                <Link
                                    href={`/vendor/products/${selectedProduct.id}/edit`}
                                    className="flex-1"
                                >
                                    <motion.button
                                        whileHover={{ y: -3 }}
                                        className="w-full px-6 py-4 bg-purple-500 text-black font-black uppercase text-sm border-4 border-purple-500 shadow-[4px_4px_0px_0px_rgba(168,85,247,1)] hover:shadow-[6px_6px_0px_0px_rgba(168,85,247,1)] transition-all"
                                    >
                                        <Edit className="w-5 h-5 inline mr-2 mb-0.5" strokeWidth={3} />
                                        Edit Product
                                    </motion.button>
                                </Link>
                                <motion.button
                                    whileHover={{ y: -3 }}
                                    onClick={() => setSelectedProduct(null)}
                                    className="px-8 py-4 border-4 border-gray-800 hover:border-purple-500 text-gray-400 hover:text-white font-black uppercase text-sm transition-all"
                                >
                                    Close
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
