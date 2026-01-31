'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';

export default function VendorSettings() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        companyName: '',
        gstin: '',
        address: '',
        phone: '' // Assuming we might want phone, but schema doesn't have it explicitly on User? Let's check User model. 
        // User model has name, companyName, gstin. Address is a relation.
        // For MVP simple update, let's stick to user fields. address might need separate handling or assumed single address.
    });

    useEffect(() => {
        // Fetch current profile details
        if (user?.email) {
            fetch('/api/vendor/settings')
                .then(res => res.json())
                .then(data => {
                    if (data) {
                        setFormData({
                            name: data.name || '',
                            companyName: data.companyName || '',
                            gstin: data.gstin || '',
                            // Flattened address for simplicity or fetched
                            address: data.addresses?.[0]?.street || ''
                        });
                    }
                });
        }
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMsg('');

        try {
            const res = await fetch('/api/vendor/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setMsg('Profile updated successfully!');
            } else {
                setMsg('Failed to update.');
            }
        } catch (err) {
            setMsg('Error saving settings.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black p-8 text-white">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-4xl font-bold mb-8">Settings</h1>

                <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8">
                    <h2 className="text-xl font-bold text-purple-400 mb-6">Company Profile</h2>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="col-span-2 md:col-span-1">
                                <label className="block text-sm text-gray-400 mb-2">Contact Name</label>
                                <input className="w-full bg-black border border-gray-700 rounded-lg p-3 outline-none focus:border-purple-500"
                                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div className="col-span-2 md:col-span-1">
                                <label className="block text-sm text-gray-400 mb-2">Company Name</label>
                                <input className="w-full bg-black border border-gray-700 rounded-lg p-3 outline-none focus:border-purple-500"
                                    value={formData.companyName} onChange={e => setFormData({ ...formData, companyName: e.target.value })} />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm text-gray-400 mb-2">GSTIN (Tax ID)</label>
                                <input className="w-full bg-black border border-gray-700 rounded-lg p-3 outline-none focus:border-purple-500"
                                    value={formData.gstin} onChange={e => setFormData({ ...formData, gstin: e.target.value })} placeholder="Required for Invoices" />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm text-gray-400 mb-2">Address</label>
                                <textarea className="w-full bg-black border border-gray-700 rounded-lg p-3 outline-none focus:border-purple-500 h-24"
                                    value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder="Official Business Address" />
                            </div>
                        </div>

                        {msg && <p className={`text-center ${msg.includes('success') ? 'text-green-400' : 'text-red-400'}`}>{msg}</p>}

                        <div className="pt-4 border-t border-gray-800">
                            <button type="submit" disabled={loading} className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-bold transition-all w-full md:w-auto">
                                {loading ? 'Saving...' : 'Save Settings'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Placeholder for Attribute Config if needed */}
                <div className="mt-8 bg-gray-900/50 border border-gray-800 rounded-2xl p-8 opacity-50 cursor-not-allowed">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-400">Global Attributes (Admin Only)</h2>
                        <span className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-500">Locked</span>
                    </div>
                    <p className="text-gray-500">Contact administrator to request new global product attributes.</p>
                </div>

            </div>
        </div>
    );
}
