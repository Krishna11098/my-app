'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function ForgotPassword() {
    const [step, setStep] = useState(1); // 1: Email, 2: OTP + New Password
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');
    const [error, setError] = useState('');

    const handleSendCode = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed');

            setStep(2);
            setMsg('Reset code sent to your email.');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp, newPassword }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed');

            setMsg('Password reset successful! Redirecting...');
            setTimeout(() => {
                window.location.href = '/login';
            }, 2000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
            {/* Background */}
            <div className="fixed inset-0 z-0">
                <div className="absolute bottom-[-10%] right-[10%] w-[30%] h-[30%] bg-pink-900/20 rounded-full blur-[100px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl relative z-10"
            >
                <h2 className="text-2xl font-bold mb-2 text-center">Reset Password</h2>
                <p className="text-gray-400 text-center mb-6">
                    {step === 1 ? "Enter your email to receive a code" : "Enter the code and new password"}
                </p>

                {msg && <p className="mb-4 text-green-400 text-center text-sm bg-green-900/20 p-2 rounded">{msg}</p>}

                {step === 1 ? (
                    <form onSubmit={handleSendCode} className="space-y-6">
                        <input
                            type="email"
                            placeholder="Email Address"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-gray-800/50 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-pink-500 transition-colors"
                        />
                        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50"
                        >
                            {loading ? 'Sending...' : 'Send Code'}
                        </button>
                        <div className="text-center">
                            <Link href="/login" className="text-sm text-gray-400 hover:text-white">Back to Login</Link>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={handleReset} className="space-y-4">
                        <input
                            type="text"
                            placeholder="Enter 6-digit Code"
                            required
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            className="w-full bg-gray-800/50 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-pink-500 transition-colors text-center tracking-widest"
                        />
                        <input
                            type="password"
                            placeholder="New Password"
                            required
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full bg-gray-800/50 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-pink-500 transition-colors"
                        />
                        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50"
                        >
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </form>
                )}
            </motion.div>
        </div>
    );
}
