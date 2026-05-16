'use client';

import { useState, useEffect } from 'react';
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
import { ApplicationDetailsModal } from './application-details-modal';

export function AdminDashboard() {
  const router = useRouter();

  const { admin, logout, isLoading: authLoading } = useAuth();

  const [applications, setApplications] = useState<ChefApplication[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<
    ChefApplication[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');

  const [statusFilter, setStatusFilter] = useState<
    'all' | 'pending' | 'approved' | 'rejected'
  >('all');
 const [selectedApp, setSelectedApp] = useState<ChefApplication | null>(null);
  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !admin) {
      router.push('/admin');
    }
  }, [admin, authLoading, router]);

  // Fetch applications
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        if (applications.length === 0) {
          setLoading(true);
        } else {
          setIsFetching(true);
        }

        const filters = {
          status: statusFilter !== 'all' ? statusFilter : undefined,
          search: searchTerm || undefined,
        };

        const response = await APIClient.getChefApplications(filters);

        if (response.success) {
          setApplications(response.data || []);
        }
      } catch (error) {
        console.error('Error fetching applications:', error);
      } finally {
        setLoading(false);
        setIsFetching(false);
      }
    };

    if (admin) {
      fetchApplications();
    }
  }, [admin, applications.length, statusFilter, searchTerm]);

  // Filter applications
  useEffect(() => {
    let filtered = applications;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (app) =>
          `${app.firstName} ${app.lastName}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.currentRestaurant
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(
        (app) => app.status === statusFilter
      );
    }

    setFilteredApplications(filtered);
  }, [applications, searchTerm, statusFilter]);

  const handleLogout = () => {
    logout();
    router.push('/admin');
  };
  const handleApplicationUpdate = async () => {
    // Refetch applications after update
    try {
      const filters = {
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchTerm || undefined,
      };

      const response = await APIClient.getChefApplications(filters);

      if (response.success) {
        setApplications(response.data || []);
      } else {
        console.error('Failed to refresh applications after update');
      }

      setSelectedApp(null);
    } catch (error) {
      console.error('Error refetching applications:', error);
    }
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
              {applications.length}
            </p>
          </Card>

          <Card className="p-6">
            <p className="text-neutral-950 text-sm font-medium">
              Pending Review
            </p>

            <p className="text-3xl font-bold text-yellow-600 mt-2">
              {
                applications.filter(
                  (a) => a.status === 'pending'
                ).length
              }
            </p>
          </Card>

          <Card className="p-6">
            <p className="text-neutral-950 text-sm font-medium">
              Approved
            </p>

            <p className="text-3xl font-bold text-green-600 mt-2">
              {
                applications.filter(
                  (a) => a.status === 'approved'
                ).length
              }
            </p>
          </Card>

          <Card className="p-6">
            <p className="text-neutral-950 text-sm font-medium">
              Rejected
            </p>

            <p className="text-3xl font-bold text-red-600 mt-2">
              {
                applications.filter(
                  (a) => a.status === 'rejected'
                ).length
              }
            </p>
          </Card>

        </div>

        {/* Filters */}
        <Card className="p-6 mb-6">

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>

              <Input
                type="text"
                placeholder="Search by name, email, or restaurant..."
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
                  setStatusFilter(e.target.value as any)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-neutral-950 bg-white"
              >
                <option value="all">All Status</option>

                <option value="pending">Pending</option>

                <option value="approved">Approved</option>

                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Count */}
            <div className="flex items-end">
              <p className="text-sm text-neutral-950 font-medium">
                Showing {filteredApplications.length} of{' '}
                {applications.length} applications
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

                {filteredApplications.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-neutral-700"
                    >
                      No applications found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredApplications.map((app) => (
                    <TableRow key={app._id}>

                      <TableCell className="font-medium text-neutral-950">
                        {app.firstName} {app.lastName}
                      </TableCell>

                      <TableCell className="text-neutral-950">
                        {app.email}
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
          onUpdate={handleApplicationUpdate}
        />
      )}
    </div>
  );
}