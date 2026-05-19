'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { useAuth } from '@/lib/auth-context';
import { ChefApplication } from '@/lib/types';
import { APIClient } from '@/lib/api-client';
import {
  buildApplicationQueryFilters,
  type StatusFilter,
  type TypeFilter,
} from '@/lib/application-filters';
import { ApplicationDetailsModal } from './application-details-modal';

type DashboardStats = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
};

const SEARCH_DEBOUNCE_MS = 350;

export function AdminDashboard() {
  const router = useRouter();

  const { admin, logout, isLoading: authLoading } = useAuth();

  const [applications, setApplications] = useState<ChefApplication[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');

  const [selectedApp, setSelectedApp] = useState<ChefApplication | null>(null);

  const fetchRequestId = useRef(0);
  const hasLoadedOnce = useRef(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !admin) {
      router.push('/admin');
    }
  }, [admin, authLoading, router]);

  // Debounce search input
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  const queryFilters = buildApplicationQueryFilters({
    search: debouncedSearch,
    status: statusFilter,
    type: typeFilter,
  });

  const fetchApplications = useCallback(async () => {
    const requestId = ++fetchRequestId.current;

    try {
      if (!hasLoadedOnce.current) {
        setLoading(true);
      } else {
        setIsFetching(true);
      }

      const response = await APIClient.getChefApplications(queryFilters);

      if (requestId !== fetchRequestId.current) return;

      if (response.success) {
        setApplications(response.data || []);
        hasLoadedOnce.current = true;
      }
    } catch (error) {
      if (requestId === fetchRequestId.current) {
        console.error('Error fetching applications:', error);
      }
    } finally {
      if (requestId === fetchRequestId.current) {
        setLoading(false);
        setIsFetching(false);
      }
    }
  }, [queryFilters.search, queryFilters.status, queryFilters.applicationType]);

  // Load global stats once
  useEffect(() => {
    if (!admin) return;

    const loadStats = async () => {
      try {
        const response = await APIClient.getDashboardStats();
        if (response.success && response.data) {
          setStats({
            total: response.data.total ?? 0,
            pending: response.data.pending ?? 0,
            approved: response.data.approved ?? 0,
            rejected: response.data.rejected ?? 0,
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      }
    };

    loadStats();
  }, [admin]);

  // Fetch filtered applications when filters change
  useEffect(() => {
    if (admin) {
      fetchApplications();
    }
  }, [admin, fetchApplications]);

  const refreshAfterUpdate = async () => {
    try {
      const [appsResponse, statsResponse] = await Promise.all([
        APIClient.getChefApplications(queryFilters),
        APIClient.getDashboardStats(),
      ]);

      if (appsResponse.success) {
        setApplications(appsResponse.data || []);
      }

      if (statsResponse.success && statsResponse.data) {
        setStats({
          total: statsResponse.data.total ?? 0,
          pending: statsResponse.data.pending ?? 0,
          approved: statsResponse.data.approved ?? 0,
          rejected: statsResponse.data.rejected ?? 0,
        });
      }

      setSelectedApp(null);
    } catch (error) {
      console.error('Error refetching applications:', error);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/admin');
  };

  const getTypeLabel = (app: ChefApplication) => {
    return app.applicationType === 'business_owner' ? 'Business Owner' : 'Chef';
  };

  const getTypeBadgeColor = (app: ChefApplication) => {
    return app.applicationType === 'business_owner'
      ? 'bg-orange-100 text-orange-800'
      : 'bg-blue-100 text-blue-800';
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';

      case 'rejected':
        return 'bg-red-100 text-red-800';

      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const hasActiveFilters =
    Boolean(debouncedSearch) || statusFilter !== 'all' || typeFilter !== 'all';

  // Loading Screen
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>

          <p className="text-neutral-800">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">

          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Admin Dashboard
            </h1>

            <p className="text-neutral-800 mt-1">
              Welcome, {admin?.name}
            </p>
          </div>

          <Button
            onClick={handleLogout}
            variant="outline"
            className="border-red-300 text-red-600 hover:bg-red-50"
          >
            Logout
          </Button>

        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">

          <Card className="p-6">
            <p className="text-neutral-950 text-sm font-medium">
              Total Applications
            </p>

            <p className="text-3xl font-bold text-gray-900 mt-2">
              {stats.total}
            </p>
          </Card>

          <Card className="p-6">
            <p className="text-neutral-950 text-sm font-medium">
              Pending Review
            </p>

            <p className="text-3xl font-bold text-yellow-600 mt-2">
              {stats.pending}
            </p>
          </Card>

          <Card className="p-6">
            <p className="text-neutral-950 text-sm font-medium">
              Approved
            </p>

            <p className="text-3xl font-bold text-green-600 mt-2">
              {stats.approved}
            </p>
          </Card>

          <Card className="p-6">
            <p className="text-neutral-950 text-sm font-medium">
              Rejected
            </p>

            <p className="text-3xl font-bold text-red-600 mt-2">
              {stats.rejected}
            </p>
          </Card>

        </div>

        {/* Filters */}
        <Card className="p-6 mb-6">

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>

              <Input
                type="text"
                placeholder="Search name, email, restaurant, job title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-neutral-950 placeholder:text-neutral-600"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-neutral-950 mb-2">
                Status
              </label>

              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as StatusFilter)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-neutral-950 bg-white"
              >
                <option value="all">All Status</option>

                <option value="pending">Pending</option>

                <option value="approved">Approved</option>

                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-950 mb-2">
                Type
              </label>
              <select
                value={typeFilter}
                onChange={(e) =>
                  setTypeFilter(e.target.value as TypeFilter)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-neutral-950 bg-white"
              >
                <option value="all">All Types</option>
                <option value="chef">Chef</option>
                <option value="business_owner">Business Owner</option>
              </select>
            </div>

            {/* Count */}
            <div className="flex items-end">
              <p className="text-sm text-neutral-950 font-medium">
                {isFetching ? (
                  'Updating results...'
                ) : (
                  <>
                    Showing {applications.length} of {stats.total} applications
                    {hasActiveFilters ? ' (filtered)' : ''}
                  </>
                )}
              </p>
            </div>

          </div>
        </Card>

        {/* Table */}
        <Card>

          <div className="overflow-x-auto">

            <Table>

              <TableHeader>
                <TableRow>

                  <TableHead className="text-neutral-950 font-semibold">
                    Name
                  </TableHead>

                  <TableHead className="text-neutral-950 font-semibold">
                    Email
                  </TableHead>

                  <TableHead className="text-neutral-950 font-semibold">
                    Type
                  </TableHead>

                  <TableHead className="text-neutral-950 font-semibold">
                    Restaurant
                  </TableHead>

                  <TableHead className="text-neutral-950 font-semibold">
                    Job Title
                  </TableHead>

                  <TableHead className="text-neutral-950 font-semibold">
                    Status
                  </TableHead>

                  <TableHead className="text-neutral-950 font-semibold">
                    Applied
                  </TableHead>

                   <TableHead className="text-neutral-950 font-semibold">
                     Action
                   </TableHead>



                </TableRow>
              </TableHeader>

              <TableBody>

                {applications.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 text-neutral-700"
                    >
                      No applications found
                    </TableCell>
                  </TableRow>
                ) : (
                  applications.map((app) => (
                    <TableRow key={app._id}>

                      <TableCell className="font-medium text-neutral-950">
                        {app.firstName} {app.lastName}
                      </TableCell>

                      <TableCell className="text-neutral-950">
                        {app.email}
                      </TableCell>

                      <TableCell>
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getTypeBadgeColor(app)}`}
                        >
                          {getTypeLabel(app)}
                        </span>
                      </TableCell>

                      <TableCell className="text-neutral-950">
                        {app.currentRestaurant}
                      </TableCell>

                      <TableCell className="text-neutral-950">
                        {app.jobTitle}
                      </TableCell>

                      <TableCell>
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(
                            app.status
                          )}`}
                        >
                          {app.status.charAt(0).toUpperCase() +
                            app.status.slice(1)}
                        </span>
                      </TableCell>

                      <TableCell className="text-sm text-neutral-950">
                        {app.createdAt
                          ? new Date(
                              app.createdAt
                            ).toLocaleDateString()
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <Button
                          onClick={() => setSelectedApp(app)}
                          variant="outline"
                          size="sm"
                          className="text-blue-600 hover:bg-blue-50"
                        >
                          View Details
                        </Button>
                      </TableCell>

                      <TableCell className="text-neutral-950" aria-label="Actions" />
                    </TableRow>
                  ))
                )}

              </TableBody>

            </Table>

          </div>

        </Card>

      </div>
      {/* Details Modal */}
      {selectedApp && (
        <ApplicationDetailsModal
          application={selectedApp}
          onClose={() => setSelectedApp(null)}
          onUpdate={refreshAfterUpdate}
        />
      )}
    </div>
  );
}
