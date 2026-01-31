'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function Reports() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    useEffect(() => {
        let query = '';
        if (dateRange.start && dateRange.end) {
            query = `?startDate=${dateRange.start}&endDate=${dateRange.end}`;
        }

        fetch(`/api/vendor/stats${query}`)
            .then(res => res.json())
            .then(data => {
                setStats(data);
                setLoading(false);
            });
    }, [dateRange.start, dateRange.end]);

    const handleExport = (format) => {
        // Generate REAL data for export
        // Since we don't have a dedicated report line-item API, we'll mock granular data based on aggregates or use what we have.
        // For a hackathon, let's create a report of "Recent Orders" logic or simulated granular list matching the total revenue.

        // Simulate fetching report data (or use a new API endpoint if strict)
        // Let's use the stats we have and maybe fetch orders list for detailed report.
        // For now, I'll fetch orders to generate a real report.

        fetch('/api/vendor/orders')
            .then(res => res.json())
            .then(orders => {
                if (format === 'PDF') {
                    const doc = new jsPDF();
                    doc.setFontSize(18);
                    doc.text('Vendor Sales Report', 14, 22);
                    doc.setFontSize(11);
                    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);

                    // Table
                    const tableColumn = ["Order ID", "Date", "Customer", "Status", "Amount"];
                    const tableRows = [];

                    orders.forEach(order => {
                        const orderData = [
                            order.quotationNumber || order.id,
                            new Date(order.createdAt).toLocaleDateString(),
                            order.customer?.name || 'N/A',
                            order.status,
                            `Rs. ${order.totalAmount}`
                        ];
                        tableRows.push(orderData);
                    });

                    doc.autoTable({
                        head: [tableColumn],
                        body: tableRows,
                        startY: 40
                    });
                    doc.save('vendor_report.pdf');
                } else {
                    // CSV
                    let csvContent = "data:text/csv;charset=utf-8,Order ID,Date,Customer,Status,Amount\n";
                    orders.forEach(order => {
                        const row = `${order.quotationNumber},${new Date(order.createdAt).toLocaleDateString()},${order.customer?.name || 'N/A'},${order.status},${order.totalAmount}`;
                        csvContent += row + "\n";
                    });
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", "vendor_report.csv");
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
            });
    };

    if (loading) return <div className="min-h-screen bg-black text-white p-8">Loading reports...</div>;

    return (
        <div className="min-h-screen bg-black p-8 text-white">
            <div className="max-w-7xl mx-auto">
                <header className="mb-10 flex flex-col md:flex-row justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-bold mb-2">Reports & Analytics</h1>
                        <p className="text-gray-400">Deep dive into your business performance.</p>
                    </div>

                    <div className="flex gap-4 mt-4 md:mt-0">
                        <input type="date" className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 outline-none"
                            value={dateRange.start} onChange={e => setDateRange({ ...dateRange, start: e.target.value })} />
                        <span className="text-gray-500 self-center">to</span>
                        <input type="date" className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 outline-none"
                            value={dateRange.end} onChange={e => setDateRange({ ...dateRange, end: e.target.value })} />
                    </div>
                </header>

                {/* Export Buttons */}
                <div className="flex gap-4 mb-8">
                    <button onClick={() => handleExport('CSV')} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2">
                        Download CSV
                    </button>
                    <button onClick={() => handleExport('PDF')} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2">
                        Download PDF
                    </button>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="p-6 rounded-2xl bg-gray-900/40 border border-gray-800">
                        <h3 className="text-gray-400 mb-2">Total Revenue</h3>
                        <p className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-600">
                            ₹{stats?.revenue?.toLocaleString() || 0}
                        </p>
                    </div>
                    <div className="p-6 rounded-2xl bg-gray-900/40 border border-gray-800">
                        <h3 className="text-gray-400 mb-2">Orders Processed</h3>
                        <p className="text-3xl font-bold text-white">{stats?.ordersProcessed || 0}</p>
                    </div>
                    <div className="p-6 rounded-2xl bg-gray-900/40 border border-gray-800">
                        <h3 className="text-gray-400 mb-2">Avg. Order Value</h3>
                        <p className="text-3xl font-bold text-blue-400">₹{Math.round(stats?.avgOrderValue || 0).toLocaleString()}</p>
                    </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="p-6 rounded-2xl bg-gray-900/40 border border-gray-800 h-80 flex flex-col justify-center items-center relative">
                        <h3 className="absolute top-6 left-6 font-bold">
                            {dateRange.start && dateRange.end
                                ? `Revenue Trend (${new Date(dateRange.start).toLocaleDateString()} - ${new Date(dateRange.end).toLocaleDateString()})`
                                : 'Revenue Trend (Last 7 Days)'}
                        </h3>
                        <div className="flex items-end gap-2 h-40 w-full px-6 mt-8 border-b border-gray-800 pb-2">
                            {stats?.trends?.length > 0 ? (
                                stats.trends.map((val, i) => {
                                    const maxVal = Math.max(...stats.trends) || 1;
                                    const heightPercent = (val / maxVal) * 100;
                                    return (
                                        <div key={i} className="flex-1 flex flex-col justify-end group relative">
                                            <div
                                                style={{ height: `${heightPercent || 1}%` }}
                                                className="w-full bg-gradient-to-t from-purple-900 to-purple-500 rounded-t-sm opacity-80 hover:opacity-100 transition-all"
                                            />
                                            {/* Tooltip */}
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 border border-gray-700">
                                                ₹{val}
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="w-full text-center text-gray-600 self-center">No trend data available</div>
                            )}
                        </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-gray-900/40 border border-gray-800 h-80 overflow-y-auto">
                        <h3 className="font-bold mb-6 sticky top-0 bg-black/0 backdrop-blur-sm">Top Rented Products</h3>
                        <div className="space-y-4">
                            {stats?.topProducts?.length > 0 ? (
                                stats.topProducts.map((item, i) => (
                                    <div key={i}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-medium">{item.name}</span>
                                            <span className="text-gray-400">{item.count} rentals</span>
                                        </div>
                                        <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                                            <div style={{ width: item.percent }} className="h-full bg-indigo-500 rounded-full" />
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500 text-center py-8">No rental data yet.</p>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
