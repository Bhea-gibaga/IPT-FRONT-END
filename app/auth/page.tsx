'use client';

import React, { useEffect, useState } from 'react';
import { useAppContext } from '@/context/AppProvider';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { BookOpenIcon } from '@heroicons/react/24/outline';

interface FormData {
  name?: string;
  email: string;
  password: string;
  password_confirmation?: string;
}

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    password_confirmation: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasRedirected, setHasRedirected] = useState(false); // Prevent double redirect
  const router = useRouter();
  const { login, register, authToken, isLoading, user } = useAppContext();

  // Redirect if already authenticated
  useEffect(() => {
    if (!hasRedirected && authToken && !isLoading && user?.role) {
      if (user.role === 'admin') {
        router.push('/dashboard'); // Admin
      } else {
        router.push('/user'); // Regular user
      }
      setHasRedirected(true);
    }
  }, [authToken, isLoading, user?.role, hasRedirected, router]);

  // Handle input change
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value
    });
  };

  // Submit login or register
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
        toast.success("Logged in successfully!");
      } else {
        if (formData.password !== formData.password_confirmation) {
          toast.error("Passwords don't match!");
          setIsSubmitting(false);
          return;
        }
        await register(
          formData.name!,
          formData.email,
          formData.password,
          formData.password_confirmation!
        );
        toast.success("Registered successfully! Please login.");
        setIsLogin(true); // Switch to login form
      }
    } catch (error: any) {
      console.error("Authentication error:", error);
      toast.error(error?.response?.data?.message || "Authentication failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || authToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 to-purple-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white/10 backdrop-blur-sm p-8 rounded-xl shadow-2xl border border-purple-500/20">
        <div>
          <div className="flex justify-center">
            <BookOpenIcon className="h-12 w-12 text-white" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            {isLogin ? "Welcome Back" : "Join Our Library"}
          </h2>
          <p className="mt-2 text-center text-sm text-purple-200">
            {isLogin ? "Sign in to access your account" : "Create your account to start borrowing"}
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            {!isLogin && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-purple-200 mb-1">Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-purple-500/30 bg-purple-900/50 placeholder-purple-300 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-purple-200 mb-1">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-purple-500/30 bg-purple-900/50 placeholder-purple-300 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-purple-200 mb-1">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-purple-500/30 bg-purple-900/50 placeholder-purple-300 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleInputChange}
              />
            </div>

            {!isLogin && (
              <div>
                <label htmlFor="password_confirmation" className="block text-sm font-medium text-purple-200 mb-1">Confirm Password</label>
                <input
                  id="password_confirmation"
                  name="password_confirmation"
                  type="password"
                  required
                  minLength={8}
                  className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-purple-500/30 bg-purple-900/50 placeholder-purple-300 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                  placeholder="Confirm your password"
                  value={formData.password_confirmation}
                  onChange={handleInputChange}
                />
              </div>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-purple-500/20"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
              ) : (
                isLogin ? "Sign in" : "Create Account"
              )}
            </button>
          </div>
        </form>

        <div className="text-center">
          <p className="text-sm text-purple-200">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button
              onClick={() => setIsLogin(!isLogin)}
              disabled={isSubmitting}
              className="ml-1 font-medium text-purple-300 hover:text-white focus:outline-none focus:underline transition-colors duration-200"
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
