'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import AdminSidebar from '@/components/admin/AdminSidebar';
import {
    PieChart,
    TrendingUp,
    Zap,
    Globe,
    Users,
    AlertCircle
} from 'lucide-react';

export default function AdminAnalytics() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const res = await fetch('/api/admin/analytics');
            const json = await res.json();

            if (json?.error) {
                console.error('Analytics API Error:', json.error);
                if (json.error === 'Unauthorized') window.location.href = '/admin';
                return;
            }

            setData(json);
        } catch (err) {
            console.error('Analytics Sync Error:', err);
        } finally {
            setLoading(false);
        }
    };

    /* ============================
       PRECOMPUTE REVENUE SCALING
    ============================ */
    const revenueStats = useMemo(() => {
        const revs = data?.monthlyRevenue?.map(r => r.revenue) ?? [];
        const max = Math.max(...revs, 0);
        const min = Math.min(...revs, max);
        return { max, min };
    }, [data]);

    if (loading || !data) {
        return (
            <div className="flex h-screen bg-black items-center justify-center">
                <div className="text-center">
                    <div className="w-20 h-20 border-8 border-purple-600 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-xs font-black uppercase tracking-widest text-gray-500 animate-pulse">
                        Aggregating Global Intel...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-black text-white">
            <AdminSidebar />

            <main className="flex-1 p-12 overflow-y-auto">
                {/* HEADER */}
                <header className="mb-12">
                    <motion.h1
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="text-6xl font-black uppercase tracking-tighter"
                    >
                        Intelligence <span className="text-purple-500">Center</span>
                    </motion.h1>
                    <p className="text-gray-500 font-bold uppercase tracking-widest mt-2">
                        Platform Performance & Network Trends
                    </p>
                </header>

                {/* CHARTS */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">

                    {/* REVENUE FLOW */}
                    <div className="bg-gray-900 border-8 border-black p-10 shadow-[20px_20px_0px_0px_rgba(124,58,237,0.1)]">
                        <div className="flex justify-between items-center mb-10">
                            <h2 className="text-2xl font-black uppercase flex items-center gap-3">
                                <TrendingUp className="text-purple-500" /> Revenue Flow
                            </h2>
                            <span className="text-[10px] font-black uppercase text-gray-500 bg-black px-3 py-1 border border-gray-800">
                                Global Pulse ({new Date().getFullYear()})
                            </span>
                        </div>

                        <div className="h-64 flex items-end gap-3 px-4">
                            {(data.monthlyRevenue ?? []).map((m, i) => {
                                const normalized =
                                    (m.revenue - revenueStats.min) /
                                    (revenueStats.max - revenueStats.min || 1);

                                const heightPercent = 25 + normalized * 75;

                                return (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                        <div className="w-full relative">
                                            <motion.div
                                                initial={{ height: 0 }}
                                                animate={{ height: `${heightPercent}%` }}
                                                transition={{ duration: 0.6, ease: 'easeOut' }}
                                                className="w-full bg-purple-600 rounded-t-md border-2 border-black min-h-[10px] shadow-[0_0_15px_rgba(168,85,247,0.35)]"
                                            >
                                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] font-black px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                                    ₹{m.revenue.toLocaleString()}
                                                </div>
                                            </motion.div>
                                        </div>

                                        <span className="text-[10px] font-black uppercase text-gray-600">
                                            {m.month}
                                            {m.month === 'Jan' && (
                                                <span className="block text-[8px] opacity-50">{m.year}</span>
                                            )}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* ASSET DISTRIBUTION */}
                    <div className="bg-gray-900 border-8 border-black p-10 shadow-[20px_20px_0px_0px_rgba(236,72,153,0.1)]">
                        <div className="flex justify-between items-center mb-10">
                            <h2 className="text-2xl font-black uppercase flex items-center gap-3">
                                <PieChart className="text-pink-500" /> Asset Distribution
                            </h2>
                            <Zap className="text-yellow-500 animate-pulse" />
                        </div>

                        <div className="space-y-6">
                            {(data.categoryMix ?? []).map((c, i) => {
                                const total = data.categoryMix.reduce((a, b) => a + b.count, 0);
                                const widthPercent = (c.count / (total || 1)) * 100;

                                return (
                                    <div key={i} className="space-y-2">
                                        <div className="flex justify-between font-black uppercase text-xs">
                                            <span className="text-gray-400 tracking-widest">{c.label}</span>
                                            <span className="text-pink-500">{c.count} Assets</span>
                                        </div>

                                        <div className="h-3 w-full bg-black border-2 border-gray-800">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${widthPercent}%` }}
                                                transition={{ duration: 0.6 }}
                                                className="h-full bg-pink-600 shadow-[0_0_10px_rgba(236,72,153,0.5)]"
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* ADVISORY */}
                <div className="p-8 bg-purple-600/10 border-4 border-dashed border-purple-500/30 mb-12">
                    <div className="flex gap-4">
                        <AlertCircle className="w-8 h-8 text-purple-500" strokeWidth={3} />
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-purple-400 mb-2">
                                Network Advisory
                            </h3>
                            <p className="text-xs font-bold uppercase text-gray-500">
                                {data.advisories?.[1]?.message || "Node health is optimal. Monitoring platform trends."}
                            </p>
                        </div>
                    </div>
                </div>

                {/* STATS */}
                {/* STATS */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <Stat
                        icon={<Users />}
                        title="Network Growth"
                        value={`${data.userGrowth.reduce((acc, curr) => acc + curr.count, 0)} Nodes`}
                    />
                    <Stat icon={<Globe />} title="Global Reach" value="PAN India" />
                    <Stat icon={<Zap />} title="System Pulse" value="99.9% Uptime" />
                    <Stat
                        icon={<AlertCircle />}
                        title="Advisory Tip"
                        value={data.advisories?.[0]?.impact || "Analyzed"}
                        highlight
                    />
                </div>
            </main>
        </div>
    );
}

/* ============================
   SMALL STAT COMPONENT
============================ */
function Stat({ icon, title, value, highlight }) {
    return (
        <div className={`border-4 border-black p-8 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]
            ${highlight ? 'bg-purple-600 text-black' : 'bg-gray-900 text-white'}`}>
            <div className="flex flex-col items-center text-center">
                <div className="mb-4">{icon}</div>
                <h3 className="text-[10px] font-black uppercase tracking-widest mb-2">{title}</h3>
                <p className="text-xl font-black uppercase">{value}</p>
            </div>
        </div>
    );
}
