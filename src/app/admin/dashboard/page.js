'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminSidebar from '@/components/admin/AdminSidebar';
import {
    DollarSign,
    Users,
    Package,
    ShoppingCart,
    TrendingUp,
    ArrowUpRight,
    Activity,
    AlertCircle,
    X,
    ExternalLink,
    Mail,
    Phone,
    Building2,
    Calendar,
    Receipt
} from 'lucide-react';

export default function AdminDashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [selectedNode, setSelectedNode] = useState(null);

    useEffect(() => {
        fetch('/api/admin/stats')
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    console.error('Core Sync Failure:', data.error);
                    if (data.error === 'Unauthorized') window.location.href = '/admin';
                    return;
                }
                setData(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Critical Network Failure:', err);
            });
    }, []);

    if (loading || !data || !data.stats) return (
        <div className="flex h-screen bg-black items-center justify-center">
            <div className="text-center">
                <div className="w-20 h-20 border-8 border-purple-600 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-xs font-black uppercase tracking-widest text-gray-500 animate-pulse">Syncing System Matrix...</p>
            </div>
        </div>
    );

    const statsCards = [
        { label: 'Platform Revenue', value: `₹${(data.stats.revenue || 0).toLocaleString()}`, icon: DollarSign, color: 'text-green-400', bg: 'bg-green-500/10' },
        { label: 'Active Vendors', value: data.stats.vendors || 0, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
        { label: 'Total Orders', value: data.stats.orders || 0, icon: ShoppingCart, color: 'text-purple-400', bg: 'bg-purple-500/10' },
        { label: 'Catalog Size', value: data.stats.products || 0, icon: Package, color: 'text-pink-400', bg: 'bg-pink-500/10' },
    ];

    const handleExportInvoice = async (order) => {
        try {
            const { default: jsPDF } = await import('jspdf');
            const { default: autoTable } = await import('jspdf-autotable');

            const doc = new jsPDF();

            // Design Elements
            doc.setFillColor(20, 20, 20);
            doc.rect(0, 0, 210, 50, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(28);
            doc.setFont(undefined, 'bold');
            doc.text('INVOICE', 14, 30);

            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            doc.text(`ORDER REF: ${order.orderNumber}`, 14, 40);
            doc.text(`DATE: ${new Date(order.createdAt).toLocaleDateString()}`, 14, 45);

            // Participants
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text('VENDOR (OWNER)', 14, 70);
            doc.setFont(undefined, 'normal');
            doc.setFontSize(10);
            doc.text(order.vendor.companyName || order.vendor.name, 14, 78);
            doc.text(order.vendor.email, 14, 84);
            if (order.vendor.gstin) doc.text(`GST: ${order.vendor.gstin}`, 14, 90);

            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text('CUSTOMER (BORROWER)', 120, 70);
            doc.setFont(undefined, 'normal');
            doc.setFontSize(10);
            doc.text(order.customer.name, 120, 78);
            doc.text(order.customer.email, 120, 84);
            if (order.customer.phone) doc.text(`PHONE: ${order.customer.phone}`, 120, 90);

            // Asset Table
            const columns = ["ASSET DESCRIPTION", "QTY", "UNIT PRICE", "TOTAL"];
            const rows = order.lines.map(line => [
                line.product.name.toUpperCase(),
                line.quantity,
                `Rs. ${Number(line.unitPrice).toLocaleString()}`,
                `Rs. ${Number(line.lineTotal).toLocaleString()}`
            ]);

            autoTable(doc, {
                head: [columns],
                body: rows,
                startY: 110,
                theme: 'grid',
                headStyles: {
                    fillColor: [124, 58, 237],
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    halign: 'center'
                },
                columnStyles: {
                    0: { cellWidth: 80 },
                    1: { halign: 'center' },
                    2: { halign: 'right' },
                    3: { halign: 'right' }
                },
                styles: {
                    font: 'helvetica',
                    fontSize: 9
                }
            });

            // Financial Summary
            const finalY = doc.lastAutoTable.finalY + 15;
            doc.setDrawColor(0, 0, 0);
            doc.setLineWidth(0.5);
            doc.line(120, finalY, 195, finalY);

            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.text('GRAND TOTAL:', 120, finalY + 10);
            doc.text(`Rs. ${Number(order.totalAmount).toLocaleString()}`, 195, finalY + 10, { align: 'right' });

            // Footer
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text('This is a system-generated invoice from the Global Control ERM.', 105, 285, { align: 'center' });

            doc.save(`INVOICE_${order.orderNumber}.pdf`);
        } catch (error) {
            console.error('Invoice Export Failed:', error);
            alert('Failed to generate secure invoice document.');
        }
    };

    return (
        <div className="flex min-h-screen bg-black text-white">
            <AdminSidebar />

            <main className="flex-1 p-12 overflow-y-auto">
                <header className="mb-12 flex justify-between items-end">
                    <div>
                        <motion.h1
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            className="text-7xl font-black uppercase tracking-tighter"
                        >
                            Global <span className="text-purple-500">Control</span>
                        </motion.h1>
                        <p className="text-gray-500 font-bold uppercase tracking-[0.2em] mt-2">Enterprise Resource Management System</p>
                    </div>
                    <div className="text-right">
                        <div className="inline-block bg-purple-600 text-black px-4 py-1 font-black uppercase text-xs mb-2 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]">System Online</div>
                        <p className="text-xs font-mono text-purple-400">SESSION_ID: 0x82...3F2</p>
                    </div>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
                    {statsCards.map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: i * 0.1 }}
                            whileHover={{ y: -8, scale: 1.02 }}
                            className="p-8 bg-gray-900 border-4 border-black shadow-[10px_10px_0px_0px_rgba(124,58,237,0.1)] relative group overflow-hidden"
                        >
                            <div className={`absolute top-0 right-0 w-24 h-24 ${stat.bg} -rotate-45 translate-x-12 -translate-y-12 transition-transform group-hover:scale-150`} />
                            <stat.icon className={`w-10 h-10 mb-4 ${stat.color}`} strokeWidth={3} />
                            <h3 className="text-gray-500 text-xs font-black uppercase tracking-widest mb-1">{stat.label}</h3>
                            <p className="text-4xl font-black tracking-tighter">{stat.value}</p>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Recent Global Orders */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="flex justify-between items-center">
                            <h2 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-4">
                                <Activity className="text-purple-600" /> Recent Network Activity
                            </h2>
                            <button className="text-xs font-bold uppercase tracking-widest text-purple-400 hover:text-white transition-colors">View All Orders →</button>
                        </div>

                        <div className="space-y-4">
                            {(data?.recentOrders || []).map((order, i) => (
                                <motion.div
                                    key={order.id}
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: i * 0.05 }}
                                    onClick={() => setSelectedOrder(order)}
                                    className="p-6 bg-gray-900/50 border-4 border-black hover:border-purple-600 transition-all cursor-pointer flex items-center justify-between group shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
                                >
                                    <div className="flex items-center gap-6">
                                        <div className="w-14 h-14 bg-white border-4 border-black flex items-center justify-center text-black font-black text-xl shadow-[4px_4px_0px_0px_rgba(124,58,237,1)] group-hover:scale-110 transition-transform">
                                            {order.orderNumber?.split('-').pop()}
                                        </div>
                                        <div>
                                            <p className="font-black uppercase text-xl group-hover:text-purple-500 transition-colors">{order.orderNumber}</p>
                                            <p className="text-xs text-gray-500 font-bold uppercase mt-1">
                                                {order.customer?.name} → {order.vendor?.name}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-black tracking-tighter group-hover:scale-105 transition-transform">₹{Number(order.totalAmount).toLocaleString()}</p>
                                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 border-2 border-black ${order.status === 'CONFIRMED' ? 'bg-green-500 text-black' :
                                            order.status === 'RETURNED' ? 'bg-purple-600 text-white' :
                                                'bg-gray-800 text-gray-400'
                                            }`}>
                                            {order.status}
                                        </span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Top Performers / Vendors & Products */}
                    <div className="space-y-12">
                        {/* Top Vendors */}
                        <div className="space-y-8">
                            <h2 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-4">
                                <TrendingUp className="text-pink-600" /> Top Nodes
                            </h2>

                            <div className="bg-gray-900 border-4 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
                                <div className="space-y-8">
                                    {(data?.topVendors || []).map((vendor) => (
                                        <div
                                            key={vendor.id}
                                            className="relative cursor-pointer group"
                                            onClick={() => setSelectedNode(vendor)}
                                        >
                                            <div className="flex justify-between mb-2">
                                                <span className="font-black uppercase tracking-tight text-lg truncate w-32 group-hover:text-pink-500 transition-colors">{vendor.companyName || vendor.name}</span>
                                                <span className="text-purple-500 font-black tracking-tighter">{vendor.ordersCount} ORDERS</span>
                                            </div>
                                            <div className="h-4 w-full bg-black border-2 border-gray-800 group-hover:border-pink-600/50 transition-colors">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${(vendor.ordersCount / (data.stats.orders || 1)) * 100}%` }}
                                                    className="h-full bg-purple-600 shadow-[0_0_10px_rgba(168,85,247,0.5)] group-hover:bg-pink-600 transition-colors"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Top Products */}
                        <div className="space-y-8">
                            <h2 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-4">
                                <Package className="text-blue-600" /> Top Assets
                            </h2>

                            <div className="bg-gray-900 border-4 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
                                <div className="space-y-8">
                                    {(data?.topProducts || []).map((product, i) => (
                                        <div key={i} className="flex justify-between items-center group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-8 h-8 bg-black border-2 border-blue-600 flex items-center justify-center font-black text-xs text-blue-500">
                                                    #{i + 1}
                                                </div>
                                                <span className="font-black uppercase tracking-tight text-sm truncate w-40 group-hover:text-blue-400 transition-colors">{product.name}</span>
                                            </div>
                                            <span className="font-black text-xs bg-blue-600/10 text-blue-400 px-2 py-1 border border-blue-600/20">{product.count} Rented</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Network Advisory Tip */}
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.8 }}
                            className="p-8 bg-purple-600/10 border-4 border-dashed border-purple-500/30 relative overflow-hidden group"
                        >
                            <div className="flex items-start gap-4">
                                <AlertCircle className="w-8 h-8 text-purple-500 shrink-0" strokeWidth={3} />
                                <div>
                                    <h3 className="text-sm font-black uppercase tracking-widest text-purple-400 mb-2">Network Advisory</h3>
                                    <p className="text-xs font-bold text-gray-500 leading-relaxed uppercase">
                                        Node health is optimal. Encryption protocols active.
                                        High demand detected in <span className="text-white">Electronics</span> cluster.
                                    </p>
                                </div>
                            </div>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 -rotate-45 translate-x-16 -translate-y-16 group-hover:bg-purple-500/10 transition-colors" />
                        </motion.div>
                    </div>
                </div>
            </main>

            {/* Order Detail Modal */}
            <AnimatePresence>
                {selectedOrder && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-gray-900 border-8 border-black w-full max-w-2xl relative shadow-[20px_20px_0px_0px_rgba(124,58,237,0.3)]"
                        >
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="absolute -top-6 -right-6 bg-white text-black p-2 border-4 border-black hover:bg-purple-600 hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                            >
                                <X size={24} strokeWidth={4} />
                            </button>

                            <div className="p-10">
                                <div className="flex justify-between items-start mb-10 border-b-4 border-black pb-6">
                                    <div>
                                        <h2 className="text-4xl font-black uppercase tracking-tighter leading-none mb-2">{selectedOrder.orderNumber}</h2>
                                        <div className="flex gap-4">
                                            <span className="text-[10px] font-black uppercase bg-purple-600 text-black px-2 py-0.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                                {selectedOrder.status}
                                            </span>
                                            <span className="text-[10px] font-black uppercase text-gray-500 flex items-center gap-1">
                                                <Calendar size={12} /> {new Date(selectedOrder.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black uppercase text-gray-500 mb-1">Total Impact</p>
                                        <p className="text-4xl font-black tracking-tighter text-purple-500">₹{Number(selectedOrder.totalAmount).toLocaleString()}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-10 mb-10">
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-black uppercase tracking-widest text-gray-600">Participant: Customer</h3>
                                        <div className="p-4 bg-black border-2 border-gray-800">
                                            <p className="font-black uppercase text-lg">{selectedOrder.customer.name}</p>
                                            <p className="text-xs font-bold text-gray-500 mt-1 flex items-center gap-2"><Mail size={12} /> {selectedOrder.customer.email}</p>
                                            <p className="text-xs font-bold text-gray-500 mt-1 flex items-center gap-2"><Phone size={12} /> {selectedOrder.customer.phone || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-black uppercase tracking-widest text-gray-600">Participant: Vendor</h3>
                                        <div className="p-4 bg-black border-2 border-gray-800">
                                            <p className="font-black uppercase text-lg">{selectedOrder.vendor.companyName || selectedOrder.vendor.name}</p>
                                            <p className="text-xs font-bold text-gray-500 mt-1 flex items-center gap-2"><Building2 size={12} /> {selectedOrder.vendor.name}</p>
                                            <p className="text-xs font-bold text-gray-500 mt-1 flex items-center gap-2"><Mail size={12} /> {selectedOrder.vendor.email}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-600">Asset Breakdown</h3>
                                    <div className="bg-black border-2 border-gray-800 overflow-hidden">
                                        {selectedOrder.lines.map((line, i) => (
                                            <div key={i} className="flex justify-between p-4 border-b border-gray-900 last:border-0 hover:bg-gray-900 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <span className="text-gray-700 font-mono text-xs">x{line.quantity}</span>
                                                    <span className="font-black uppercase text-sm">{line.product.name}</span>
                                                </div>
                                                <span className="font-black text-purple-400">₹{Number(line.lineTotal).toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="mt-10 pt-6 border-t-4 border-black flex gap-4">
                                    <button
                                        onClick={() => handleExportInvoice(selectedOrder)}
                                        className="flex-1 bg-white text-black py-4 font-black uppercase tracking-widest text-xs border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-purple-600 hover:text-white hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Receipt size={16} /> Export Invoice
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Node Detail Modal */}
            <AnimatePresence>
                {selectedNode && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
                        <motion.div
                            initial={{ x: 100, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 100, opacity: 0 }}
                            className="bg-gray-900 border-8 border-black w-full max-w-lg relative shadow-[-20px_20px_0px_0px_rgba(236,72,153,0.3)]"
                        >
                            <button
                                onClick={() => setSelectedNode(null)}
                                className="absolute -top-6 -left-6 bg-white text-black p-2 border-4 border-black hover:bg-pink-600 hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                            >
                                <X size={24} strokeWidth={4} />
                            </button>

                            <div className="p-10">
                                <div className="text-center mb-10">
                                    <div className="w-24 h-24 bg-white border-4 border-black mx-auto mb-6 flex items-center justify-center text-black font-black text-4xl shadow-[8px_8px_0px_0px_rgba(236,72,153,1)]">
                                        {selectedNode.companyName?.charAt(0) || selectedNode.name.charAt(0)}
                                    </div>
                                    <h2 className="text-4xl font-black uppercase tracking-tighter leading-none mb-2">{selectedNode.companyName || selectedNode.name}</h2>
                                    <p className="text-xs font-black uppercase text-pink-500 tracking-widest italic">Verified Network Node</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-black border-2 border-gray-800">
                                            <p className="text-[10px] font-black uppercase text-gray-600 mb-1">Productivity</p>
                                            <p className="text-2xl font-black">{selectedNode.ordersCount} <span className="text-xs text-gray-500 tracking-tighter font-bold uppercase">Orders</span></p>
                                        </div>
                                        <div className="p-4 bg-black border-2 border-gray-800">
                                            <p className="text-[10px] font-black uppercase text-gray-600 mb-1">Inventory</p>
                                            <p className="text-2xl font-black text-pink-500">{selectedNode.productsCount} <span className="text-xs text-gray-500 tracking-tighter font-bold uppercase">Assets</span></p>
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-6 border-t-2 border-black">
                                        <div className="flex justify-between items-center group">
                                            <span className="text-[10px] font-black uppercase text-gray-500 group-hover:text-pink-500 transition-colors">Admin Contact</span>
                                            <span className="font-bold text-sm uppercase">{selectedNode.name}</span>
                                        </div>
                                        <div className="flex justify-between items-center group">
                                            <span className="text-[10px] font-black uppercase text-gray-500 group-hover:text-pink-500 transition-colors">Network Mail</span>
                                            <span className="font-bold text-sm">{selectedNode.email}</span>
                                        </div>
                                        <div className="flex justify-between items-center group">
                                            <span className="text-[10px] font-black uppercase text-gray-500 group-hover:text-pink-500 transition-colors">Secured Line</span>
                                            <span className="font-bold text-sm">{selectedNode.phone || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between items-center group">
                                            <span className="text-[10px] font-black uppercase text-gray-500 group-hover:text-pink-500 transition-colors">Fiscal ID</span>
                                            <span className="font-black text-sm uppercase text-white bg-pink-600/20 px-2 border border-pink-600/30 font-mono">{selectedNode.gstin || 'UNREGISTERED'}</span>
                                        </div>
                                    </div>

                                    <div className="mt-10 pt-6">
                                        <button className="w-full bg-pink-600 text-black py-4 font-black uppercase tracking-widest text-xs border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all">
                                            Open Full Node Directory
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
