'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminSidebar from '@/components/admin/AdminSidebar';
import {
    Settings,
    Save,
    Clock,
    Briefcase,
    Globe,
    Shield,
    CreditCard,
    Plus,
    X,
    CheckCircle2,
    Info
} from 'lucide-react';

export default function AdminSettings() {
    const [settings, setSettings] = useState({ system: [], periods: [], attributes: [] });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('general');
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        const res = await fetch('/api/admin/settings');
        const data = await res.json();
        setSettings(data);
        setLoading(false);
    };

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
    };

    const handleSaveSystem = async (key, value, category) => {
        setSaving(true);
        const res = await fetch('/api/admin/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'system',
                data: { key, value, category }
            })
        });
        setSaving(false);
        if (res.ok) showToast('Configuration Synced');
    };

    const tabs = [
        { id: 'general', label: 'General', icon: Globe },
        { id: 'rental', label: 'Rental Periods', icon: Clock },
        { id: 'fiscal', label: 'GST & Fiscal', icon: CreditCard },
        { id: 'security', label: 'Access Control', icon: Shield },
    ];

    if (loading) return <div className="min-h-screen bg-black" />;

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
                        System <span className="text-purple-500">Core</span>
                    </motion.h1>
                    <p className="text-gray-500 font-bold uppercase tracking-[0.2em] mt-2">Environment Configuration & Parameters</p>
                </header>

                <div className="flex gap-12">
                    {/* Tabs / Sidebar for Settings */}
                    <div className="w-64 space-y-2">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-4 p-4 font-black uppercase tracking-widest text-xs transition-all border-4 ${activeTab === tab.id
                                        ? 'bg-purple-600 border-black text-white shadow-[6px_6px_0px_0px_rgba(255,255,255,0.1)]'
                                        : 'bg-transparent border-transparent text-gray-500 hover:text-white'
                                    }`}
                            >
                                <tab.icon size={16} strokeWidth={3} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 bg-gray-900 border-8 border-black p-10 shadow-[20px_20px_0px_0px_rgba(124,58,237,0.1)]">
                        <AnimatePresence mode="wait">
                            {activeTab === 'general' && (
                                <motion.div
                                    key="general"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-10"
                                >
                                    <section>
                                        <h3 className="text-2xl font-black uppercase mb-8 border-b-4 border-black pb-2 inline-block">Company Identity</h3>
                                        <div className="grid grid-cols-1 gap-6 max-w-2xl">
                                            <SettingInput
                                                label="Organization Name"
                                                defaultValue={settings.system.find(s => s.key === 'COMPANY_NAME')?.value || 'RENT-MASTER'}
                                                onSave={(val) => handleSaveSystem('COMPANY_NAME', val, 'COMPANY')}
                                            />
                                            <SettingInput
                                                label="Support Email"
                                                defaultValue={settings.system.find(s => s.key === 'SUPPORT_EMAIL')?.value || 'support@rent.com'}
                                                onSave={(val) => handleSaveSystem('SUPPORT_EMAIL', val, 'COMPANY')}
                                            />
                                        </div>
                                    </section>
                                </motion.div>
                            )}

                            {activeTab === 'fiscal' && (
                                <motion.div
                                    key="fiscal"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-10"
                                >
                                    <section>
                                        <div className="flex items-center gap-4 mb-8">
                                            <h3 className="text-2xl font-black uppercase border-b-4 border-black pb-2">Taxation & Compliance</h3>
                                            <div className="px-2 py-0.5 bg-yellow-500 text-black text-[10px] font-black uppercase">Critical</div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <SettingInput
                                                label="Platform GSTIN"
                                                defaultValue={settings.system.find(s => s.key === 'GSTIN')?.value || 'GST00112233'}
                                                onSave={(val) => handleSaveSystem('GSTIN', val, 'FISCAL')}
                                            />
                                            <SettingInput
                                                label="Default GST Rate (%)"
                                                defaultValue={settings.system.find(s => s.key === 'DEFAULT_GST_RATE')?.value || '18'}
                                                onSave={(val) => handleSaveSystem('DEFAULT_GST_RATE', val, 'FISCAL')}
                                            />
                                        </div>
                                    </section>
                                </motion.div>
                            )}

                            {activeTab === 'rental' && (
                                <motion.div
                                    key="rental"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="space-y-8"
                                >
                                    <div className="flex justify-between items-center mb-8 border-b-4 border-black pb-4">
                                        <h3 className="text-2xl font-black uppercase">Rental Templates</h3>
                                        <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-black font-black uppercase text-xs border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                            <Plus size={16} strokeWidth={4} /> New Period
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {settings.periods.map(period => (
                                            <div key={period.id} className="p-6 bg-black border-4 border-black shadow-[6px_6px_0px_0px_rgba(255,255,255,0.05)] flex flex-col justify-between group hover:border-purple-600 transition-all">
                                                <div>
                                                    <div className="flex justify-between items-start mb-4">
                                                        <Clock className="text-purple-500" />
                                                        <input type="checkbox" checked={period.isActive} className="w-5 h-5 accent-purple-600" />
                                                    </div>
                                                    <h4 className="font-black uppercase text-xl mb-1">{period.name}</h4>
                                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{period.duration} {period.periodUnit} UNIT(S)</p>
                                                </div>
                                            </div>
                                        ))}
                                        {settings.periods.length === 0 && (
                                            [
                                                { name: 'Hourly', dur: 1, unit: 'HOUR' },
                                                { name: 'Daily', dur: 1, unit: 'DAY' },
                                                { name: 'Weekly', dur: 1, unit: 'WEEK' }
                                            ].map((p, i) => (
                                                <div key={i} className="p-6 bg-gray-800 border-4 border-black border-dashed opacity-50 text-center">
                                                    <p className="font-black uppercase italic text-gray-500">Initial Template: {p.name}</p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </main>

            {/* Toast Notification */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-12 right-12 z-50 bg-green-500 text-black border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] px-8 py-4 font-black uppercase flex items-center gap-4"
                    >
                        <CheckCircle2 strokeWidth={3} />
                        {toast}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function SettingInput({ label, defaultValue, onSave }) {
    const [value, setValue] = useState(defaultValue);
    const [hasChanged, setHasChanged] = useState(false);

    return (
        <div className="group">
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2 group-focus-within:text-purple-500 transition-colors">
                {label}
            </label>
            <div className="flex gap-2">
                <input
                    type="text"
                    value={value}
                    onChange={(e) => {
                        setValue(e.target.value);
                        setHasChanged(e.target.value !== defaultValue);
                    }}
                    className="flex-1 bg-black border-4 border-black p-4 font-bold text-white focus:outline-none focus:border-purple-600 transition-all"
                />
                <button
                    disabled={!hasChanged}
                    onClick={() => {
                        onSave(value);
                        setHasChanged(false);
                    }}
                    className={`p-4 border-4 border-black transition-all ${hasChanged
                            ? 'bg-purple-600 text-black shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] cursor-pointer'
                            : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                        }`}
                >
                    <Save size={20} strokeWidth={4} />
                </button>
            </div>
        </div>
    );
}
