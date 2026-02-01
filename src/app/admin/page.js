'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, User, ArrowRight, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();

            if (res.ok) {
                router.push('/admin/dashboard');
            } else {
                setError(data.error || 'Invalid credentials');
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md"
            >
                <div className="text-center mb-12">
                    <motion.div
                        initial={{ y: -20 }}
                        animate={{ y: 0 }}
                        className="inline-block p-4 bg-purple-600 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-6"
                    >
                        <Shield className="w-12 h-12 text-white" strokeWidth={3} />
                    </motion.div>
                    <h1 className="text-6xl font-black text-white uppercase tracking-tighter leading-none">
                        System <span className="text-purple-500">Admin</span>
                    </h1>
                    <p className="text-gray-500 font-bold uppercase tracking-widest mt-4">Authorized Personnel Only</p>
                </div>

                <div className="bg-white border-8 border-black shadow-[16px_16px_0px_0px_rgba(124,58,237,1)] p-8">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Username</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-gray-100 border-4 border-black p-4 pl-12 font-bold text-black focus:outline-none focus:bg-purple-50 transition-colors"
                                    placeholder="ADMIN"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Access Key</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-gray-100 border-4 border-black p-4 pl-12 font-bold text-black focus:outline-none focus:bg-purple-50 transition-colors"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-center gap-2 p-4 bg-red-100 border-4 border-red-600 text-red-600 font-bold text-sm"
                            >
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                {error}
                            </motion.div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="group w-full bg-black text-white p-5 font-black uppercase tracking-tighter text-xl flex items-center justify-between border-4 border-transparent hover:bg-purple-600 transition-all disabled:opacity-50"
                        >
                            <span>{loading ? 'Authenticating...' : 'Enter Dashboard'}</span>
                            <ArrowRight className="group-hover:translate-x-2 transition-transform" strokeWidth={4} />
                        </button>
                    </form>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-gray-600 text-xs font-black uppercase tracking-widest">
                        Node Identity: <span className="text-purple-500/50">SECURE-ALPHA-01</span>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
