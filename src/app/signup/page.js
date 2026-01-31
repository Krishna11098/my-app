'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Signup() {
    const router = useRouter();
    const [role, setRole] = useState('CUSTOMER'); // 'CUSTOMER' or 'VENDOR'
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        companyName: '',
        gstin: '',
        productCategory: '',
        couponCode: '', // New field
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

        // Password Validation Rules
        const password = formData.password;
        if (password.length < 6 || password.length > 12) {
            setError("Password must be between 6 and 12 characters.");
            setLoading(false);
            return;
        }
        if (!/[A-Z]/.test(password)) {
            setError("Password must contain at least one uppercase letter.");
            setLoading(false);
            return;
        }
        if (!/[a-z]/.test(password)) {
            setError("Password must contain at least one lowercase letter.");
            setLoading(false);
            return;
        }
        if (!/[@$!%*?&_]/.test(password)) {
            setError("Password must contain at least one special character (@, $, &, _).");
            setLoading(false);
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords don't match");
            setLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    role,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Signup failed');
            }

            // Redirect to verify page with email in query
            router.push(`/verify?email=${encodeURIComponent(formData.email)}`);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background blobs */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/40 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/40 rounded-full blur-[100px]" />
            </div>

            <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-0 z-10 rounded-2xl overflow-hidden shadow-2xl bg-gray-900/50 backdrop-blur-md border border-gray-800">

                {/* Left Side - Info */}
                <div className="p-10 hidden md:flex flex-col justify-center bg-gradient-to-br from-purple-900/50 to-indigo-900/50 relative">
                    <div className="absolute inset-0 bg-black/20" />
                    <div className="relative z-10">
                        <h2 className="text-4xl font-bold mb-6">Join the Revolution</h2>
                        <p className="text-gray-300 text-lg mb-8">
                            Experience the future of commerce. Whether you're buying or selling, we have the perfect tools for you.
                        </p>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">✓</div>
                                <span>Earn credits with referrals</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">✓</div>
                                <span>Premium Dashboard</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">✓</div>
                                <span>24/7 Support</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className="p-8 md:p-10 bg-black/40">
                    <h2 className="text-3xl font-bold mb-2 text-center">Create Account</h2>
                    <p className="text-gray-400 text-center mb-8">Sign up to get started</p>

                    {/* Toggle */}
                    <div className="flex bg-gray-800/50 p-1 rounded-xl mb-8 relative">
                        <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-indigo-600 rounded-lg transition-all duration-300 ease-out ${role === 'VENDOR' ? 'translate-x-[100%] translate-x-[4px]' : 'translate-x-0'}`} />
                        <button
                            onClick={() => setRole('CUSTOMER')}
                            className={`flex-1 py-2 text-sm font-semibold z-10 transition-colors ${role === 'CUSTOMER' ? 'text-white' : 'text-gray-400'}`}
                        >
                            Customer
                        </button>
                        <button
                            onClick={() => setRole('VENDOR')}
                            className={`flex-1 py-2 text-sm font-semibold z-10 transition-colors ${role === 'VENDOR' ? 'text-white' : 'text-gray-400'}`}
                        >
                            Vendor
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={role}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-4"
                            >
                                <div>
                                    <input
                                        name="name"
                                        placeholder="Full Name"
                                        required
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="w-full bg-gray-800/50 border border-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors placeholder-gray-500"
                                    />
                                </div>

                                {role === 'VENDOR' && (
                                    <>
                                        <input
                                            name="companyName"
                                            placeholder="Company Name"
                                            required
                                            value={formData.companyName}
                                            onChange={handleChange}
                                            className="w-full bg-gray-800/50 border border-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors placeholder-gray-500"
                                        />
                                        <select
                                            name="productCategory"
                                            value={formData.productCategory}
                                            onChange={handleChange}
                                            required
                                            className="w-full bg-gray-800/50 border border-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors text-gray-400"
                                        >
                                            <option value="">Select Category</option>
                                            <option value="Electronics">Electronics</option>
                                            <option value="Furniture">Furniture</option>
                                            <option value="Fashion">Fashion</option>
                                            <option value="Other">Other</option>
                                        </select>
                                        <input
                                            name="gstin"
                                            placeholder="GSTIN Number"
                                            required
                                            value={formData.gstin}
                                            onChange={handleChange}
                                            className="w-full bg-gray-800/50 border border-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors placeholder-gray-500"
                                        />
                                    </>
                                )}

                                <input
                                    name="email"
                                    type="email"
                                    placeholder="Email Address"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full bg-gray-800/50 border border-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors placeholder-gray-500"
                                />

                                <div className="flex gap-4">
                                    <input
                                        name="password"
                                        type="password"
                                        placeholder="Password"
                                        required
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="w-full bg-gray-800/50 border border-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors placeholder-gray-500"
                                    />
                                    <input
                                        name="confirmPassword"
                                        type="password"
                                        placeholder="Confirm"
                                        required
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        className="w-full bg-gray-800/50 border border-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors placeholder-gray-500"
                                    />
                                </div>

                                {/* Coupon Code Field */}
                                <div>
                                    <input
                                        name="couponCode"
                                        placeholder="Coupon Code (Optional)"
                                        value={formData.couponCode}
                                        onChange={handleChange}
                                        className="w-full bg-gray-800/50 border border-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors placeholder-gray-500 border-dashed"
                                    />
                                </div>

                            </motion.div>
                        </AnimatePresence>

                        {error && <p className="text-red-500 text-sm">{error}</p>}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3 rounded-lg hover:shadow-lg hover:shadow-indigo-500/30 transition-all transform hover:-translate-y-0.5 disabled:opacity-50"
                        >
                            {loading ? 'Processing...' : 'Create Account'}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-gray-400">
                        Already have an account?{' '}
                        <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold">
                            Log in
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
