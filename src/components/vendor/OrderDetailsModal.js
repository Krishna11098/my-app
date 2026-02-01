'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Package, Clock, MapPin, Phone, Mail, User, Info, FileText } from 'lucide-react';

export default function OrderDetailsModal({ order, isOpen, onClose }) {
    if (!isOpen || !order) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-4xl bg-gray-900 border-4 border-black shadow-[12px_12px_0px_0px_rgba(124,58,237,1)] overflow-hidden flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="p-6 bg-purple-600 border-b-4 border-black flex justify-between items-center text-white">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white border-4 border-black flex items-center justify-center text-black font-black text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                {order.orderNumber?.split('-').pop()}
                            </div>
                            <div>
                                <h2 className="text-2xl font-black uppercase tracking-tighter leading-none">{order.orderNumber}</h2>
                                <p className="text-purple-200 font-bold uppercase text-xs tracking-widest mt-1">Confirmed on {new Date(order.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-black/20 transition-colors rounded-lg border-2 border-transparent hover:border-black"
                        >
                            <X className="w-8 h-8 font-black" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="overflow-y-auto p-8 space-y-8 bg-gray-900 text-white">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Customer Info */}
                            <div className="p-6 bg-gray-800 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                <h3 className="text-xl font-black uppercase mb-4 flex items-center gap-2 border-b-4 border-black pb-2">
                                    <User className="w-5 h-5" /> Customer details
                                </h3>
                                <div className="space-y-3">
                                    <p className="flex justify-between font-bold">
                                        <span className="text-gray-500 uppercase text-xs">Name</span>
                                        <span className="uppercase">{order.customer?.name}</span>
                                    </p>
                                    <p className="flex justify-between font-bold">
                                        <span className="text-gray-500 uppercase text-xs">Email</span>
                                        <span>{order.customer?.email}</span>
                                    </p>
                                    <p className="flex justify-between font-bold">
                                        <span className="text-gray-500 uppercase text-xs">Status</span>
                                        <span className="px-2 bg-green-500 text-black text-xs uppercase font-black">{order.status}</span>
                                    </p>
                                </div>
                            </div>

                            {/* Rental Period */}
                            <div className="p-6 bg-white text-black border-4 border-black shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]">
                                <h3 className="text-xl font-black uppercase mb-4 flex items-center gap-2 border-b-4 border-black pb-2 text-black">
                                    <Clock className="w-5 h-5" /> Rental timeline
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between font-black items-center">
                                        <div className="text-center flex-1">
                                            <p className="text-[10px] text-gray-500 uppercase">From</p>
                                            <p className="text-lg">{new Date(order.rentalStart).toLocaleDateString()}</p>
                                        </div>
                                        <div className="px-4 text-purple-600">→</div>
                                        <div className="text-center flex-1">
                                            <p className="text-[10px] text-gray-500 uppercase">To</p>
                                            <p className="text-lg">{new Date(order.rentalEnd).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="pt-2 border-t-2 border-black/10 flex justify-between font-bold">
                                        <span className="text-gray-500 uppercase text-xs">Duration</span>
                                        <span className="uppercase">
                                            {Math.ceil(Math.abs(new Date(order.rentalEnd) - new Date(order.rentalStart)) / (1000 * 60 * 60 * 24))} Days
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Order Items */}
                        <div className="p-6 bg-gray-800 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            <h3 className="text-xl font-black uppercase mb-4 flex items-center gap-2 border-b-4 border-black pb-2">
                                <Package className="w-5 h-5" /> Items ordered
                            </h3>
                            <div className="space-y-4">
                                {order.lines?.map((line, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-4 bg-gray-900 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-gray-800 border-2 border-black overflow-hidden">
                                                {line.product?.imageUrls?.[0] && (
                                                    <img src={line.product.imageUrls[0]} alt={line.product.name} className="w-full h-full object-cover" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-black uppercase text-sm leading-tight">{line.product?.name}</p>
                                                <p className="text-xs text-gray-500 font-bold uppercase mt-1">Qty: {line.quantity} × ₹{Number(line.unitPrice).toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-purple-400">₹{Number(line.lineTotal).toLocaleString()}</p>
                                            <span className="text-[10px] bg-purple-900/50 text-purple-300 px-1 font-bold uppercase">{line.type}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8 border-t-4 border-black pt-4 flex justify-between items-end">
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase">Subtotal: ₹{Number(order.subtotal).toLocaleString()}</p>
                                    <p className="text-xs font-bold text-gray-500 uppercase">Tax: ₹{Number(order.taxAmount).toLocaleString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-bold text-gray-500 uppercase leading-none">Total Payment</p>
                                    <p className="text-4xl font-black text-green-400">₹{Number(order.totalAmount).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        {/* Delivery Info if available */}
                        {order.deliveryMethod && (
                            <div className="p-6 bg-indigo-600/20 border-4 border-indigo-600/50">
                                <h3 className="text-xl font-black uppercase mb-4 flex items-center gap-2 border-b-4 border-indigo-600/30 pb-2 text-indigo-400">
                                    <MapPin className="w-5 h-5" /> Delivery Method
                                </h3>
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-indigo-600 text-white rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                        {order.deliveryMethod === 'PICKUP_FROM_STORE' ? <Package strokeWidth={3} /> : <MapPin strokeWidth={3} />}
                                    </div>
                                    <div>
                                        <p className="font-black uppercase text-white">{order.deliveryMethod === 'PICKUP_FROM_STORE' ? 'Store Pickup' : 'Standard Delivery'}</p>
                                        <p className="text-xs font-bold text-indigo-300 uppercase">Expected according to customer request</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 bg-gray-800 border-t-4 border-black flex flex-wrap gap-4 justify-end">
                        <button
                            onClick={onClose}
                            className="px-6 py-3 bg-white text-black font-black uppercase tracking-tighter border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
                        >
                            Close Details
                        </button>
                        <a
                            href={`/api/orders/${order.id}/invoice`}
                            target="_blank"
                            className="px-6 py-3 bg-green-500 text-black font-black uppercase tracking-tighter border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center gap-2"
                        >
                            <FileText className="w-5 h-5" /> View Invoice
                        </a>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
