'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { LogIn, Mail, Lock, ArrowRight } from 'lucide-react';

export default function Login() {
    const router = useRouter();
    const { login: authLogin } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Login failed');
            }

            authLogin(data.user);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 relative overflow-hidden">
            {/* Animated Background Grid */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                    backgroundImage: 'linear-gradient(rgba(124, 58, 237, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(124, 58, 237, 0.3) 1px, transparent 1px)',
                    backgroundSize: '50px 50px'
                }} />
            </div>

            {/* Floating Shapes */}
            <motion.div
                animate={{ rotate: 360, x: [-20, 20, -20], y: [-20, 20, -20] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute top-20 right-20 w-32 h-32 border-4 border-purple-500/30 bg-purple-500/5 shadow-[8px_8px_0px_0px_rgba(124,58,237,0.2)]"
            />
            <motion.div
                animate={{ rotate: -360, x: [20, -20, 20], y: [20, -20, 20] }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                className="absolute bottom-20 left-20 w-24 h-24 border-4 border-pink-500/30 bg-pink-500/5 shadow-[6px_6px_0px_0px_rgba(236,72,153,0.2)]"
            />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full bg-black border-4 border-gray-800 shadow-[12px_12px_0px_0px_rgba(75,85,99,1)] p-8 md:p-12 relative z-10"
            >
                {/* Header */}
                <div className="mb-10">
                    <div className="w-16 h-16 border-4 border-purple-500 bg-purple-500 flex items-center justify-center mb-6 shadow-[4px_4px_0px_0px_rgba(168,85,247,1)]">
                        <LogIn className="w-8 h-8 text-black" strokeWidth={3} />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black uppercase mb-3" style={{ textShadow: '4px 4px 0px rgba(124, 58, 237, 0.5)' }}>
                        Welcome <span className="text-purple-400">Back</span>
                    </h1>
                    <p className="text-gray-500 font-bold uppercase tracking-wide text-sm">
                        Sign In to Your Account
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-xs font-black uppercase text-gray-500 tracking-widest mb-2">
                            <Mail className="w-3 h-3 inline mr-2 mb-0.5" strokeWidth={3} />
                            Email Address
                        </label>
                        <input
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            placeholder="you@example.com"
                            className="w-full bg-gray-900 border-4 border-gray-800 text-white px-4 py-4 focus:outline-none focus:border-purple-500 transition-colors placeholder-gray-700 font-medium"
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-xs font-black uppercase text-gray-500 tracking-widest">
                                <Lock className="w-3 h-3 inline mr-2 mb-0.5" strokeWidth={3} />
                                Password
                            </label>
                            <Link href="/forgot-password" className="text-xs text-purple-400 hover:text-purple-300 font-bold uppercase tracking-wide hover:underline">
                                Forgot?
                            </Link>
                        </div>
                        <input
                            name="password"
                            type="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            placeholder="••••••••"
                            className="w-full bg-gray-900 border-4 border-gray-800 text-white px-4 py-4 focus:outline-none focus:border-purple-500 transition-colors placeholder-gray-700 font-medium"
                        />
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 bg-red-500/10 border-4 border-red-500 text-red-400 text-sm font-bold uppercase tracking-wide text-center shadow-[3px_3px_0px_0px_rgba(239,68,68,1)]"
                        >
                            {error}
                        </motion.div>
                    )}

                    <motion.button
                        type="submit"
                        disabled={loading}
                        whileHover={{ x: -4, y: -4 }}
                        whileTap={{ x: 0, y: 0 }}
                        className="w-full bg-purple-500 text-black font-black uppercase text-sm tracking-wider px-6 py-4 border-4 border-purple-500 shadow-[6px_6px_0px_0px_rgba(168,85,247,1)] hover:shadow-[10px_10px_0px_0px_rgba(168,85,247,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Signing In...' : (
                            <>
                                Sign In
                                <ArrowRight className="w-5 h-5 inline ml-2 mb-0.5" strokeWidth={3} />
                            </>
                        )}
                    </motion.button>
                </form>

                {/* Footer */}
                <div className="mt-8 pt-8 border-t-4 border-gray-900 text-center">
                    <p className="text-sm text-gray-500 font-bold uppercase tracking-wide">
                        Don't Have an Account?{' '}
                        <Link href="/signup" className="text-purple-400 hover:text-purple-300 font-black hover:underline">
                            Sign Up
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
