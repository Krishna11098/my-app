'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

export default function Reports() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    useEffect(() => {
        let query = '';
        if (dateRange.start && dateRange.end) {
            query = `?startDate=${dateRange.start}&endDate=${dateRange.end}`;
        }

        fetch(`/api/vendor/stats${query}`, { credentials: 'include' })
            .then(res => res.json())
            .then(data => {
                setStats(data);
                setLoading(false);
            });
    }, [dateRange.start, dateRange.end]);

    const chartData = {
        labels: stats?.trends?.map(t => new Date(t.label).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })) || [],
        datasets: [
            {
                label: 'Revenue',
                data: stats?.trends?.map(t => t.value) || [],
                fill: true,
                backgroundColor: 'rgba(124, 58, 237, 0.1)',
                borderColor: 'rgba(124, 58, 237, 1)',
                borderWidth: 4,
                pointBackgroundColor: 'rgba(124, 58, 237, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(124, 58, 237, 1)',
                tension: 0.4,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                backgroundColor: '#111',
                titleColor: '#888',
                bodyColor: '#fff',
                bodyFont: { weight: 'bold' },
                padding: 12,
                borderColor: '#333',
                borderWidth: 1,
                displayColors: false,
                callbacks: {
                    label: (context) => ` ₹${context.parsed.y.toLocaleString()}`,
                }
            },
        },
        scales: {
            x: {
                grid: {
                    display: false,
                    drawBorder: false,
                },
                ticks: {
                    color: '#666',
                    font: { size: 10, weight: 'bold' },
                },
            },
            y: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.05)',
                    drawBorder: false,
                },
                ticks: {
                    color: '#666',
                    font: { size: 10 },
                    callback: (value) => `₹${value.toLocaleString()}`,
                },
            },
        },
    };

    const handleExport = async (format) => {
        try {
            const res = await fetch('/api/vendor/orders', { credentials: 'include' });
            const orders = await res.json();

            if (format === 'PDF') {
                const { default: jsPDF } = await import('jspdf');
                const { default: autoTable } = await import('jspdf-autotable');

                const doc = new jsPDF();
                doc.setFontSize(18);
                doc.text('Vendor Sales Report', 14, 22);
                doc.setFontSize(11);
                doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);

                doc.setFontSize(10);
                doc.text(`Total Revenue: Rs. ${stats?.revenue?.toLocaleString() || 0}`, 14, 40);
                doc.text(`Orders Processed: ${stats?.ordersProcessed || 0}`, 14, 46);
                doc.text(`Avg. Order Value: Rs. ${Math.round(stats?.avgOrderValue || 0).toLocaleString()}`, 14, 52);

                const tableColumn = ["Order #", "Date", "Customer", "Status", "Amount"];
                const tableRows = orders.map(order => [
                    order.orderNumber || order.id?.slice(-8) || 'N/A',
                    new Date(order.createdAt).toLocaleDateString(),
                    order.customer?.name || 'N/A',
                    order.status,
                    `Rs. ${Number(order.totalAmount).toLocaleString()}`
                ]);

                autoTable(doc, {
                    head: [tableColumn],
                    body: tableRows,
                    startY: 60,
                    theme: 'striped',
                    headStyles: { fillColor: [124, 58, 237] }
                });

                doc.save('vendor_report.pdf');
            } else {
                // Header
                const headers = ["Order Number", "Date", "Customer", "Status", "Amount"];
                const csvRows = [headers.join(",")];

                orders.forEach(order => {
                    const row = [
                        `"${order.orderNumber || order.id}"`,
                        `" ${new Date(order.createdAt).toISOString().split('T')[0]}"`,
                        `"${(order.customer?.name || 'N/A').replace(/"/g, '""')}"`,
                        `"${order.status}"`,
                        `"${Number(order.totalAmount).toFixed(2)}"`
                    ];
                    csvRows.push(row.join(","));
                });

                const csvString = csvRows.join("\n");
                const BOM = '\uFEFF';
                const blob = new Blob([BOM + csvString], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.setAttribute("href", url);
                link.setAttribute("download", `vendor_report_${new Date().toISOString().split('T')[0]}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }
        } catch (err) {
            console.error('Export error:', err);
            alert('Failed to export: ' + err.message);
        }
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
                        <input type="date" className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 outline-none focus:border-purple-500 transition-colors"
                            value={dateRange.start} onChange={e => setDateRange({ ...dateRange, start: e.target.value })} />
                        <span className="text-gray-500 self-center font-bold">to</span>
                        <input type="date" className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 outline-none focus:border-purple-500 transition-colors"
                            value={dateRange.end} onChange={e => setDateRange({ ...dateRange, end: e.target.value })} />
                    </div>
                </header>

                <div className="flex gap-4 mb-8">
                    <button onClick={() => handleExport('CSV')} className="px-6 py-2 bg-gray-900 border-2 border-black shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all text-sm font-bold uppercase tracking-widest">
                        Download CSV
                    </button>
                    <button onClick={() => handleExport('PDF')} className="px-6 py-2 bg-purple-600 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all text-sm font-bold uppercase tracking-widest">
                        Download PDF
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="p-8 rounded-2xl bg-gray-900/40 border-4 border-black shadow-[8px_8px_0px_0px_rgba(124,58,237,0.1)]">
                        <h3 className="text-gray-500 uppercase text-xs font-black tracking-widest mb-2">Total Revenue</h3>
                        <p className="text-4xl font-black text-green-400 tracking-tighter">
                            ₹{stats?.revenue?.toLocaleString() || 0}
                        </p>
                    </div>
                    <div className="p-8 rounded-2xl bg-gray-900/40 border-4 border-black shadow-[8px_8px_0px_0px_rgba(255,255,255,0.05)]">
                        <h3 className="text-gray-500 uppercase text-xs font-black tracking-widest mb-2">Orders Processed</h3>
                        <p className="text-4xl font-black text-white tracking-tighter">{stats?.ordersProcessed || 0}</p>
                    </div>
                    <div className="p-8 rounded-2xl bg-gray-900/40 border-4 border-black shadow-[8px_8px_0px_0px_rgba(59,130,246,0.1)]">
                        <h3 className="text-gray-500 uppercase text-xs font-black tracking-widest mb-2">Avg. Order Value</h3>
                        <p className="text-4xl font-black text-blue-400 tracking-tighter">₹{Math.round(stats?.avgOrderValue || 0).toLocaleString()}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                    <div className="lg:col-span-2 p-8 rounded-2xl bg-gray-900 border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative min-h-[400px]">
                        <h3 className="text-xl font-black uppercase mb-8 border-b-4 border-black pb-2 inline-block">
                            {dateRange.start && dateRange.end
                                ? `Revenue Trend (${new Date(dateRange.start).toLocaleDateString()} - ${new Date(dateRange.end).toLocaleDateString()})`
                                : 'Revenue Trend (Last 7 Days)'}
                        </h3>
                        <div className="h-[300px] w-full">
                            {stats?.trends?.length > 0 ? (
                                <Line data={chartData} options={chartOptions} />
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-600 font-bold uppercase tracking-widest italic">
                                    No trend data available for this range
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-8 rounded-2xl bg-gray-900 border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] flex flex-col">
                        <h3 className="text-xl font-black uppercase mb-8 border-b-4 border-black pb-2 inline-block">Top Rented Products</h3>
                        <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            {stats?.topProducts?.length > 0 ? (
                                stats.topProducts.map((item, i) => (
                                    <div key={i} className="group">
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="font-black uppercase tracking-tight group-hover:text-purple-400 transition-colors">{item.name}</span>
                                            <span className="text-gray-500 font-bold">{item.count} rentals</span>
                                        </div>
                                        <div className="h-4 w-full bg-black border-2 border-gray-800 rounded-none overflow-hidden p-0.5">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: item.percent }}
                                                transition={{ duration: 1, ease: "easeOut" }}
                                                className="h-full bg-gradient-to-r from-purple-600 to-indigo-500"
                                            />
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-600 text-center py-12 font-bold uppercase tracking-widest italic">No product data found</p>
                            )}
                        </div>
                    </div>
                </div>

                <style jsx>{`
                    .custom-scrollbar::-webkit-scrollbar {
                        width: 4px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                        background: transparent;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                        background: #333;
                        border-radius: 10px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                        background: #444;
                    }
                `}</style>
            </div>
        </div>
    );
}

