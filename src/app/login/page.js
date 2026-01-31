'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

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

            // Successful login
            // router.push('/dashboard'); // Handled by context
            authLogin(data.user);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 overflow-hidden relative">
            {/* Background Effect */}
            <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-900/30 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-900/30 rounded-full blur-[120px]" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full bg-gray-900/40 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl relative z-10"
            >
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600 mb-2">
                        Welcome Back
                    </h1>
                    <p className="text-gray-400">Sign in to your account</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1.5 ml-1">Email Address</label>
                        <input
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="you@example.com"
                            className="w-full bg-gray-800/50 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 transition-colors placeholder-gray-600"
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-1.5 ml-1">
                            <label className="block text-sm font-medium text-gray-400">Password</label>
                            <Link href="/forgot-password" className="text-xs text-purple-400 hover:text-purple-300 font-medium">
                                Forgot Password?
                            </Link>
                        </div>
                        <input
                            name="password"
                            type="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                            className="w-full bg-gray-800/50 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 transition-colors placeholder-gray-600"
                        />
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3.5 rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all transform hover:-translate-y-0.5 disabled:opacity-50"
                    >
                        {loading ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-gray-800 text-center text-sm text-gray-400">
                    Don't have an account?{' '}
                    <Link href="/signup" className="text-purple-400 hover:text-purple-300 font-bold">
                        Sign Up
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
