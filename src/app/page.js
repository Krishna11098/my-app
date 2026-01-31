'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-purple-500 selection:text-white overflow-hidden font-sans">
      {/* Background Gradients */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/30 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/30 blur-[120px]" />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="text-2xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
          JOY JUNCTURE
        </div>
        <div className="flex gap-6 items-center">
          <Link href="/login" className="text-sm font-medium hover:text-purple-400 transition-colors">
            Login
          </Link>
          <Link
            href="/signup"
            className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-semibold hover:bg-gray-200 transition-all hover:scale-105 active:scale-95"
          >
            Sign Up
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[85vh] text-center px-4">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-6xl md:text-8xl font-bold tracking-tight mb-6"
        >
          <span className="block text-white">Experience the</span>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-indigo-500">
            Extraordinary
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="max-w-2xl text-lg md:text-xl text-gray-400 mb-10 leading-relaxed"
        >
          Join the ultimate platform where vendors and customers unite. seamless transactions, stunning interfaces, and a world of possibilities await.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <Link
            href="/signup"
            className="px-8 py-4 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg hover:shadow-lg hover:shadow-purple-500/25 transition-all hover:-translate-y-1"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="px-8 py-4 rounded-full border border-gray-700 bg-gray-900/50 backdrop-blur-sm text-white font-medium text-lg hover:bg-gray-800 transition-all hover:-translate-y-1"
          >
            Login
          </Link>
        </motion.div>
      </main>

      {/* Feature Section Preview */}
      <section className="relative z-10 py-24 border-t border-gray-800/50 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-3 gap-12">
          {[
            { title: "For Vendors", desc: "Showcase your products to a global audience with our premium tools." },
            { title: "For Customers", desc: "Discover unique items and enjoy a seamless rental experience." },
            { title: "Secure & Fast", desc: "Advanced security with OTP verification and instant processing." }
          ].map((item, i) => (
            <div key={i} className="group p-8 rounded-2xl bg-gray-900/40 border border-gray-800 hover:border-purple-500/30 transition-all hover:bg-gray-900/60">
              <h3 className="text-xl font-bold mb-3 text-white group-hover:text-purple-400 transition-colors">{item.title}</h3>
              <p className="text-gray-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
