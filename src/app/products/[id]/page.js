'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { Calendar, ShoppingCart, Shield, Zap, Info, ArrowLeft, Plus, Minus, Check } from 'lucide-react';
import Link from 'next/link';

export default function ProductDetails() {
    const { id } = useParams();
    const router = useRouter();
    const { user } = useAuth();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [totalPrice, setTotalPrice] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [addingToCart, setAddingToCart] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        fetch(`/api/products/${id}`)
            .then(res => res.json())
            .then(data => {
                setProduct(data);
                setLoading(false);
            })
            .catch(err => setLoading(false));
    }, [id]);

    const calculateEstimate = () => {
        if (!startDate || !endDate || !product) return;

        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

        const dayConfig = product.priceConfigs.find(p => p.periodUnit === 'DAY');
        const hourConfig = product.priceConfigs.find(p => p.periodUnit === 'HOUR');

        let price = 0;
        if (dayConfig) {
            price = parseFloat(dayConfig.price) * diffDays * quantity;
        } else if (hourConfig) {
            price = parseFloat(hourConfig.price) * diffHours * quantity;
        }

        setTotalPrice(price);
    };

    useEffect(() => {
        calculateEstimate();
    }, [startDate, endDate, quantity, product]);

    const handleAction = async (type) => {
        if (!user) {
            router.push('/login');
            return;
        }

        if (type === 'RENTAL' && (totalPrice <= 0 || !startDate || !endDate)) return;

        setAddingToCart(true);
        try {
            const payload = {
                userId: user.id,
                productId: product.id,
                quantity: parseInt(quantity),
                type,
                ...(type === 'RENTAL' ? { startDate, endDate } : {})
            };

            const res = await fetch('/api/cart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setSuccessMessage(`Added to cart as ${type === 'RENTAL' ? 'Rental' : 'Purchase'}!`);
                setTimeout(() => setSuccessMessage(''), 3000);
            } else {
                const data = await res.json();
                alert('Action failed: ' + (data.error || 'Unknown error'));
            }
        } catch (err) {
            console.error(err);
            alert('Something went wrong');
        } finally {
            setAddingToCart(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-4 border-purple-500 border-t-transparent"
            />
        </div>
    );

    if (!product) return <div className="min-h-screen bg-black flex items-center justify-center text-white font-black text-2xl uppercase tracking-tighter">Product not found</div>;

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12 selection:bg-purple-500 selection:text-white">
            <div className="max-w-7xl mx-auto">
                <Link href="/dashboard" className="inline-flex items-center gap-2 mb-8 text-sm font-black uppercase tracking-widest hover:text-purple-400 transition-colors group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Browse
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Left Side: BIG BOLD IMAGE */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative group"
                    >
                        <div className="absolute inset-0 bg-purple-600 translate-x-4 translate-y-4 -z-10 border-4 border-black" />
                        <div className="bg-white border-4 border-black h-[500px] overflow-hidden flex items-center justify-center">
                            {product.imageUrls?.[0] ? (
                                <img src={product.imageUrls[0]} alt={product.name} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" />
                            ) : (
                                <Zap className="w-32 h-32 text-black" strokeWidth={3} />
                            )}
                        </div>
                    </motion.div>

                    {/* Right Side: BRUTALIST DETAILS */}
                    <div className="flex flex-col gap-8">
                        <div>
                            <div className="inline-block bg-pink-500 text-black px-4 py-1 border-4 border-black font-black uppercase text-xs tracking-widest mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                {product.category || 'Rental'}
                            </div>
                            <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none mb-4 break-words">
                                {product.name}
                            </h1>
                            <p className="text-xl text-gray-400 font-bold leading-tight max-w-xl">
                                {product.description}
                            </p>
                        </div>

                        {/* CONFIGURATION BOX */}
                        <div className="bg-white text-black border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(124,58,237,1)]">
                            <h2 className="text-3xl font-black uppercase tracking-tighter mb-6 flex items-center gap-2">
                                <Plus className="w-8 h-8" strokeWidth={4} /> Configure Your Needs
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest mb-2">From</label>
                                    <input
                                        type="datetime-local"
                                        className="w-full bg-gray-100 border-4 border-black p-4 font-black outline-none focus:bg-purple-100 transition-colors"
                                        value={startDate}
                                        min={new Date().toISOString().slice(0, 16)}
                                        onChange={e => setStartDate(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest mb-2">To</label>
                                    <input
                                        type="datetime-local"
                                        className="w-full bg-gray-100 border-4 border-black p-4 font-black outline-none focus:bg-purple-100 transition-colors"
                                        value={endDate}
                                        min={startDate || new Date().toISOString().slice(0, 16)}
                                        onChange={e => setEndDate(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="mb-8">
                                <label className="block text-xs font-black uppercase tracking-widest mb-2">Quantity</label>
                                <div className="flex items-center">
                                    <button
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="w-12 h-12 bg-black text-white flex items-center justify-center hover:bg-purple-600 transition-colors active:translate-y-1"
                                    >
                                        <Minus strokeWidth={4} />
                                    </button>
                                    <div className="w-20 h-12 border-y-4 border-black flex items-center justify-center font-black text-2xl">
                                        {quantity}
                                    </div>
                                    <button
                                        onClick={() => setQuantity(Math.min(product.quantityOnHand || 99, quantity + 1))}
                                        className="w-12 h-12 bg-black text-white flex items-center justify-center hover:bg-purple-600 transition-colors active:translate-y-1"
                                    >
                                        <Plus strokeWidth={4} />
                                    </button>
                                    <span className="ml-4 font-black text-xs uppercase text-gray-500 italic">
                                        {product.quantityOnHand} IN STOCK
                                    </span>
                                </div>
                            </div>

                            {/* RENTAL ACTION */}
                            <div className="border-t-4 border-black pt-8 mb-8">
                                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-1">Rental Total</p>
                                        <div className="text-6xl font-black tracking-tighter">
                                            {totalPrice > 0 ? `₹${totalPrice.toLocaleString()}` : '—'}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleAction('RENTAL')}
                                        disabled={addingToCart || totalPrice <= 0}
                                        className="h-16 px-12 bg-black text-white font-black uppercase text-xl border-4 border-black hover:bg-purple-600 hover:-translate-x-1 hover:-translate-y-1 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-0 active:translate-y-0 disabled:opacity-50"
                                    >
                                        {addingToCart ? 'Wait...' : 'Book Now'}
                                    </button>
                                </div>
                            </div>

                            {/* PURCHASE ACTION */}
                            <div className="bg-black text-white p-6 border-4 border-black shadow-[4px_4px_0px_0px_rgba(236,72,153,1)]">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-pink-400 mb-1 lg:mb-0">Keep it forever?</p>
                                        <div className="text-3xl font-black tracking-tighter">
                                            ₹{(parseFloat(product.salePrice) * quantity).toLocaleString()}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleAction('SALE')}
                                        className="px-8 py-3 bg-pink-500 text-black font-black uppercase text-sm border-2 border-white hover:bg-white hover:text-black transition-colors"
                                    >
                                        Buy Choice
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* SUCCESS TOAST */}
                        <AnimatePresence>
                            {successMessage && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="bg-green-500 text-black border-4 border-black p-4 font-black uppercase text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2"
                                >
                                    <Check strokeWidth={4} /> {successMessage}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* META INFO */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="border-4 border-white p-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Authenticity</p>
                                <div className="flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-purple-400" strokeWidth={3} />
                                    <span className="font-black uppercase text-sm">Verified Vendor</span>
                                </div>
                            </div>
                            <div className="border-4 border-white p-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Unique SKU</p>
                                <div className="flex items-center gap-2">
                                    <Info className="w-5 h-5 text-pink-400" strokeWidth={3} />
                                    <span className="font-black uppercase text-sm">{product.sku}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
