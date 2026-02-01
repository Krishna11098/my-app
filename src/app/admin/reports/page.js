'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import AdminSidebar from '@/components/admin/AdminSidebar';
import {
    BarChart3,
    Download,
    Calendar,
    Filter,
    FileText,
    Table,
    FileSpreadsheet,
    ArrowRight,
    TrendingUp
} from 'lucide-react';

export default function AdminReports() {
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [generating, setGenerating] = useState(false);

    const reportTypes = [
        { id: 'revenue', label: 'Platform Revenue Analysis', icon: TrendingUp, color: 'text-green-500' },
        { id: 'vendors', label: 'Vendor Performance Matrix', icon: BarChart3, color: 'text-purple-500' },
        { id: 'products', label: 'Most Rented Inventory', icon: Table, color: 'text-blue-500' },
        { id: 'tax', label: 'GST & Fiscal Compliance', icon: FileSpreadsheet, color: 'text-yellow-500' },
    ];

    const handleGenerate = (type) => {
        setGenerating(true);
        // Simulate generation
        setTimeout(() => {
            setGenerating(false);
            alert(`Report [${type}] generated and ready for download.`);
        }, 1500);
    };

    return (
        <div className="flex min-h-screen bg-black text-white">
            <AdminSidebar />

            <main className="flex-1 p-12 overflow-y-auto">
                <header className="mb-12">
                    <motion.h1
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="text-6xl font-black uppercase tracking-tighter"
                    >
                        Intelligence <span className="text-purple-500">Center</span>
                    </motion.h1>
                    <p className="text-gray-500 font-bold uppercase tracking-[0.2em] mt-2">Global Data Export & Performance Auditing</p>
                </header>

                <div className="max-w-6xl space-y-12">
                    {/* Control Panel */}
                    <div className="bg-gray-900 border-8 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
                        <div className="flex flex-wrap items-end gap-8">
                            <div className="flex-1 min-w-[300px]">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Analysis Period</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="relative">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                                        <input type="date" className="w-full bg-black border-4 border-black p-3 pl-12 font-bold focus:border-purple-600 outline-none" />
                                    </div>
                                    <div className="relative">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                                        <input type="date" className="w-full bg-black border-4 border-black p-3 pl-12 font-bold focus:border-purple-600 outline-none" />
                                    </div>
                                </div>
                            </div>

                            <div className="w-64">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Scope Filter</label>
                                <select className="w-full bg-black border-4 border-black p-3 font-bold focus:border-purple-600 outline-none uppercase text-sm">
                                    <option>Global Platform</option>
                                    <option>Specific Vendor</option>
                                    <option>By Category</option>
                                </select>
                            </div>

                            <button className="h-14 px-8 bg-purple-600 text-black font-black uppercase tracking-widest border-4 border-black shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
                                Apply Parameters
                            </button>
                        </div>
                    </div>

                    {/* Report Catalog */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {reportTypes.map((report, i) => (
                            <motion.div
                                key={report.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.1 }}
                                className="group bg-gray-900 border-4 border-black p-8 flex flex-col justify-between hover:border-purple-600 transition-all relative overflow-hidden"
                            >
                                <report.icon className={`absolute -right-8 -bottom-8 w-40 h-40 opacity-5 transition-transform group-hover:scale-125 ${report.color}`} />

                                <div>
                                    <div className={`p-4 bg-black border-4 border-black inline-block mb-6 shadow-[4px_4px_0px_0px_rgba(124,58,237,1)]`}>
                                        <report.icon size={32} className={report.color} />
                                    </div>
                                    <h3 className="text-3xl font-black uppercase tracking-tighter mb-2 leading-none">{report.label}</h3>
                                    <p className="text-gray-500 font-bold text-xs uppercase tracking-widest mb-8">Generated: System Auto (Daily)</p>
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        onClick={() => handleGenerate(report.id)}
                                        disabled={generating}
                                        className="flex-1 bg-white text-black py-4 font-black uppercase tracking-widest text-xs border-4 border-black hover:bg-purple-600 transition-all flex items-center justify-center gap-2 group-hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                                    >
                                        <Download size={16} strokeWidth={3} /> {generating ? 'Processing...' : 'Export PDF'}
                                    </button>
                                    <button className="flex-1 bg-black text-white py-4 font-black uppercase tracking-widest text-xs border-4 border-black hover:bg-gray-800 transition-all flex items-center justify-center gap-2">
                                        <FileSpreadsheet size={16} /> Export XLSX
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Audit Logs Quick View */}
                    <div className="border-t-8 border-purple-600/20 pt-12">
                        <div className="flex justify-between items-end mb-8">
                            <h2 className="text-4xl font-black uppercase tracking-tighter">System Audit</h2>
                            <button className="text-xs font-black uppercase tracking-widest text-purple-400">View Full Ledger →</button>
                        </div>
                        <div className="space-y-4">
                            {[1, 2, 3].map(id => (
                                <div key={id} className="p-6 bg-gray-900/50 border-4 border-black flex items-center gap-8 group">
                                    <div className="text-gray-600 font-mono text-xs">02/01/26 14:22:45</div>
                                    <div className="flex-1">
                                        <p className="font-bold uppercase tracking-widest text-sm">ADMIN: CONFIG_UPDATE</p>
                                        <p className="text-xs text-gray-500 font-black">Modified Platform GST Rate from 12% to 18%</p>
                                    </div>
                                    <div className="text-xs font-black uppercase bg-green-500/10 text-green-500 px-3 py-1 border-2 border-green-500/20">Success</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
