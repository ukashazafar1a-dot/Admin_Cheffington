'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export function AdminLogin() {
  const router = useRouter();
  const { login, error: authError, isLoading, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/Admin/dashboard');
    }
  }, [isLoading, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(email, password);
      router.replace('/Admin/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fff1e1] flex items-center justify-center px-4">
        <div className="w-full max-w-md p-8 border-2 border-black rounded-lg bg-white text-center">
          <p className="text-gray-500 text-sm">Checking session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fff1e1] flex items-center justify-center px-4">
      <div className="w-full max-w-md p-8 border-2 border-black rounded-lg bg-white">
        <h1 className="text-3xl font-bold mb-2">Admin Login</h1>
        <p className="text-gray-600 mb-8">Access the Cheffington Admin Dashboard</p>

        <form onSubmit={handleSubmit} className="space-y-4" suppressHydrationWarning>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@cheffington.com"
              className="w-full border border-gray-300 rounded px-3 py-2"
              required
              disabled={isSubmitting}
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full border border-gray-300 rounded px-3 py-2"
              required
              disabled={isSubmitting}
              autoComplete="current-password"
            />
          </div>

          {(error || authError) && (
            <p className="text-red-600 text-sm">{error || authError}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#ff8400] text-black font-semibold py-2 rounded hover:opacity-90 disabled:opacity-50"
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
