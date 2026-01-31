'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserPlus, User, Building2, Mail, Lock, Ticket, Shield, Zap, Award } from 'lucide-react';

export default function Signup() {
    const router = useRouter();
    const [role, setRole] = useState('CUSTOMER');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        companyName: '',
        gstin: '',
        productCategory: '',
        couponCode: '',
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

            router.push(`/verify?email=${encodeURIComponent(formData.email)}`);
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
                animate={{ rotate: 360, x: [-30, 30, -30], y: [-30, 30, -30] }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                className="absolute top-10 right-10 w-40 h-40 border-4 border-purple-500/30 bg-purple-500/5 shadow-[10px_10px_0px_0px_rgba(124,58,237,0.2)]"
            />
            <motion.div
                animate={{ rotate: -360, x: [30, -30, 30], y: [30, -30, 30] }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                className="absolute bottom-10 left-10 w-32 h-32 border-4 border-pink-500/30 bg-pink-500/5 shadow-[8px_8px_0px_0px_rgba(236,72,153,0.2)]"
            />

            <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-5 gap-0 bg-black border-4 border-gray-800 shadow-[16px_16px_0px_0px_rgba(75,85,99,1)] relative z-10">
                {/* Left Side - Info */}
                <div className="md:col-span-2 p-8 md:p-10 border-b-4 md:border-b-0 md:border-r-4 border-gray-800 bg-gray-900/50">
                    <div className="h-full flex flex-col justify-center">
                        <div className="w-16 h-16 border-4 border-purple-500 bg-purple-500 flex items-center justify-center mb-6 shadow-[4px_4px_0px_0px_rgba(168,85,247,1)]">
                            <UserPlus className="w-8 h-8 text-black" strokeWidth={3} />
                        </div>

                        <h2 className="text-3xl md:text-4xl font-black uppercase mb-4" style={{ textShadow: '3px 3px 0px rgba(124, 58, 237, 0.5)' }}>
                            Join the <span className="text-purple-400">Revolution</span>
                        </h2>
                        <p className="text-gray-400 font-bold uppercase text-sm tracking-wide mb-8">
                            Premium Features for All Users
                        </p>

                        <div className="space-y-4">
                            {[
                                { icon: Zap, text: 'Earn Credits with Referrals' },
                                { icon: Shield, text: 'Secure & Protected' },
                                { icon: Award, text: '24/7 Support' }
                            ].map((item, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="flex items-center gap-4 p-3 border-2 border-gray-800 hover:border-purple-500 transition-all"
                                >
                                    <div className="w-8 h-8 border-2 border-purple-500 bg-purple-500/10 flex items-center justify-center">
                                        <item.icon className="w-4 h-4 text-purple-400" strokeWidth={3} />
                                    </div>
                                    <span className="font-bold uppercase text-xs tracking-wide text-gray-300">{item.text}</span>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className="md:col-span-3 p-8 md:p-10">
                    <h2 className="text-3xl md:text-4xl font-black uppercase mb-2">Create <span className="text-purple-400">Account</span></h2>
                    <p className="text-gray-500 font-bold uppercase text-sm tracking-wide mb-6">Sign Up to Get Started</p>

                    {/* Role Toggle */}
                    <div className="flex bg-gray-900 border-4 border-gray-800 mb-8 relative">
                        <motion.div
                            animate={{ x: role === 'VENDOR' ? '100%' : '0%' }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="absolute inset-y-0 w-1/2 bg-purple-500 border-4 border-purple-500 shadow-[4px_4px_0px_0px_rgba(168,85,247,1)]"
                        />
                        <button
                            type="button"
                            onClick={() => setRole('CUSTOMER')}
                            className={`flex-1 py-3 text-sm font-black uppercase z-10 transition-colors flex items-center justify-center gap-2 ${role === 'CUSTOMER' ? 'text-black' : 'text-gray-500'
                                }`}
                        >
                            <User className="w-4 h-4" strokeWidth={3} />
                            Customer
                        </button>
                        <button
                            type="button"
                            onClick={() => setRole('VENDOR')}
                            className={`flex-1 py-3 text-sm font-black uppercase z-10 transition-colors flex items-center justify-center gap-2 ${role === 'VENDOR' ? 'text-black' : 'text-gray-500'
                                }`}
                        >
                            <Building2 className="w-4 h-4" strokeWidth={3} />
                            Vendor
                        </button>
                    </div>

                    {/* Form */}
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
                                <input
                                    name="name"
                                    placeholder="Full Name"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full bg-gray-900 border-4 border-gray-800 text-white px-4 py-3 focus:outline-none focus:border-purple-500 transition-colors placeholder-gray-700 font-medium"
                                />

                                {role === 'VENDOR' && (
                                    <>
                                        <input
                                            name="companyName"
                                            placeholder="Company Name"
                                            required
                                            value={formData.companyName}
                                            onChange={handleChange}
                                            className="w-full bg-gray-900 border-4 border-gray-800 text-white px-4 py-3 focus:outline-none focus:border-purple-500 transition-colors placeholder-gray-700 font-medium"
                                        />
                                        <select
                                            name="productCategory"
                                            value={formData.productCategory}
                                            onChange={handleChange}
                                            required
                                            className="w-full bg-gray-900 border-4 border-gray-800 text-white px-4 py-3 focus:outline-none focus:border-purple-500 transition-colors font-medium"
                                        >
                                            <option value="" className="text-gray-700">Select Category</option>
                                            <option value="Electronics">Electronics</option>
                                            <option value="Furniture">Furniture</option>
                                            <option value="Fashion">Fashion</option>
                                            <option value="Tools">Tools</option>
                                            <option value="Photography">Photography</option>
                                            <option value="Other">Other</option>
                                        </select>
                                        <input
                                            name="gstin"
                                            placeholder="GSTIN Number"
                                            required
                                            value={formData.gstin}
                                            onChange={handleChange}
                                            className="w-full bg-gray-900 border-4 border-gray-800 text-white px-4 py-3 focus:outline-none focus:border-purple-500 transition-colors placeholder-gray-700 font-medium"
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
                                    className="w-full bg-gray-900 border-4 border-gray-800 text-white px-4 py-3 focus:outline-none focus:border-purple-500 transition-colors placeholder-gray-700 font-medium"
                                />

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <input
                                        name="password"
                                        type="password"
                                        placeholder="Password"
                                        required
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="w-full bg-gray-900 border-4 border-gray-800 text-white px-4 py-3 focus:outline-none focus:border-purple-500 transition-colors placeholder-gray-700 font-medium"
                                    />
                                    <input
                                        name="confirmPassword"
                                        type="password"
                                        placeholder="Confirm"
                                        required
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        className="w-full bg-gray-900 border-4 border-gray-800 text-white px-4 py-3 focus:outline-none focus:border-purple-500 transition-colors placeholder-gray-700 font-medium"
                                    />
                                </div>

                                <input
                                    name="couponCode"
                                    placeholder="Coupon Code (Optional)"
                                    value={formData.couponCode}
                                    onChange={handleChange}
                                    className="w-full bg-gray-900 border-4 border-gray-800 border-dashed text-white px-4 py-3 focus:outline-none focus:border-purple-500 transition-colors placeholder-gray-700 font-medium"
                                />
                            </motion.div>
                        </AnimatePresence>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-4 bg-red-500/10 border-4 border-red-500 text-red-400 text-xs font-bold uppercase tracking-wide shadow-[3px_3px_0px_0px_rgba(239,68,68,1)]"
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
                            {loading ? 'Processing...' : 'Create Account'}
                        </motion.button>
                    </form>

                    <div className="mt-6 pt-6 border-t-4 border-gray-900 text-center">
                        <p className="text-sm text-gray-500 font-bold uppercase tracking-wide">
                            Already Have an Account?{' '}
                            <Link href="/login" className="text-purple-400 hover:text-purple-300 font-black hover:underline">
                                Log In
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
