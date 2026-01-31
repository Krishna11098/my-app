'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';

export default function Verify() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const emailParam = searchParams.get('email');

    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (emailParam) setEmail(emailParam);
    }, [emailParam]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, otp }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Verification failed');
            }

            setSuccess(true);
            setTimeout(() => {
                router.push('/login');
            }, 2000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
            {/* Background gradients */}
            <div className="fixed inset-0 z-0">
                <div className="absolute top-[20%] left-[30%] w-[40%] h-[40%] bg-blue-900/20 rounded-full blur-[120px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full bg-gray-900/50 backdrop-blur-xl border border-gray-800 p-8 rounded-2xl relative z-10 shadow-2xl"
            >
                <h2 className="text-3xl font-bold text-center mb-2">Verify Account</h2>
                <p className="text-gray-400 text-center mb-8">
                    Enter the code sent to <span className="text-white">{email}</span>
                </p>

                {!success ? (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <input
                                type="text"
                                placeholder="Enter 6-digit OTP"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                className="w-full bg-gray-800/50 border border-gray-700 text-center text-3xl tracking-[0.5em] font-mono rounded-xl px-4 py-4 focus:outline-none focus:border-indigo-500 transition-colors placeholder-gray-600"
                                maxLength={6}
                            />
                        </div>

                        {error && <p className="text-red-500 text-center text-sm">{error}</p>}

                        <button
                            type="submit"
                            disabled={loading || otp.length < 6}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Verifying...' : 'Verify Email'}
                        </button>
                    </form>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-8"
                    >
                        <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                            ✓
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Verified!</h3>
                        <p className="text-gray-400">Redirecting to login...</p>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
}
