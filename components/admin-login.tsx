'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';

export function AdminLogin() {
  const router = useRouter();
  const { login, error: authError } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(email, password);
      router.push('/Admin/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md p-8 border-2 border-blue-300">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Login</h1>
          <p className="text-gray-600">Access the Cheffington Admin Dashboard</p>
        </div>

        {!mounted ? (
          <p className="text-gray-500 text-sm">Loading...</p>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-6"
            suppressHydrationWarning
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@cheffington.com"
                className={error ? 'border-red-500' : ''}
                disabled={isSubmitting}
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className={error ? 'border-red-500' : ''}
                disabled={isSubmitting}
                autoComplete="current-password"
              />
            </div>

            {(error || authError) && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error || authError}
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting || !email || !password}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
