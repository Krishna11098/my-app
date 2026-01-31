import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-4xl w-full text-center space-y-8">
        <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-pulse">
          Odoo Practice
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Experience the next generation authentication flow with a premium design.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <Link href="/login" className="px-8 py-3 bg-gray-800 border border-gray-700 hover:bg-gray-700 text-white font-medium rounded-full transition-all duration-300 hover:scale-105 shadow-lg shadow-purple-500/10">
            Login
          </Link>
          <Link href="/signup" className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-full transition-all duration-300 hover:scale-105 shadow-lg shadow-purple-500/30">
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
