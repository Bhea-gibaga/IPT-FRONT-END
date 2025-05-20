"use client";
import Link from "next/link";
import { ArrowRightIcon } from '@heroicons/react/24/outline';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-purple-50 to-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-purple-600 to-purple-700 text-white py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:60px_60px]"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-purple-600/50 to-purple-700/50"></div>
        <div className="container mx-auto px-4 text-center relative">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight opacity-0 animate-[fadeIn_0.8s_ease-out_forwards]">
              Welcome to Library System
            </h1>
            <p className="text-xl md:text-2xl mb-10 text-purple-100 max-w-2xl mx-auto opacity-0 animate-[fadeIn_0.8s_ease-out_0.2s_forwards]">
              A modern solution for managing your library
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center opacity-0 animate-[fadeIn_0.8s_ease-out_0.4s_forwards]">
              <Link 
                href="/auth" 
                className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-lg text-purple-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                aria-label="Get started with Library Management System"
              >
                Get Started
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-purple-900 text-white py-8 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <p className="text-purple-200">© {new Date().getFullYear()} Library Management System</p>
        </div>
      </footer>
    </div>
  );
}
