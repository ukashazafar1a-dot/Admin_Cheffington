'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';

export function AdminLogin() {
  const router = useRouter();
  const { login, isLoading, error: authError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login(email, password);
      router.push('/admin/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md p-8 border-2 border-blue-300">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Login</h1>
          <p className="text-gray-600">Access the Cheffington Admin Dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@cheffington.com"
              className={error ? 'border-red-500' : ''}
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className={error ? 'border-red-500' : ''}
              disabled={isLoading}
            />
          </div>

          {(error || authError) && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error || authError}
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading || !email || !password}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </Button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">
            <strong>Getting Started:</strong>
          </p>
          <p className="text-sm text-gray-600 mb-1">Make sure MongoDB is running locally</p>
          <p className="text-sm text-gray-600 mb-1">Backend should be running on port 5000</p>
          <p className="text-sm text-gray-600">You can register a new admin account here</p>
        </div>
      </Card>
    </div>
  );
}
