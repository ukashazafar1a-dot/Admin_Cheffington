'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { APIClient } from '@/lib/api-client';

type DashboardData = {
  applications: { total: number; pending: number; approved: number; rejected: number };
  restaurants: { total: number; published: number; draft: number; archived: number };
  claims: { total: number; pending: number; approved: number; rejected: number };
  recentApplications: Array<{ name: string; email: string; status: string; createdAt?: string }>;
  recentClaims: Array<{ restaurant: string; claimantEmail: string; status: string; createdAt?: string }>;
};

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<DashboardData>({
    applications: { total: 0, pending: 0, approved: 0, rejected: 0 },
    restaurants: { total: 0, published: 0, draft: 0, archived: 0 },
    claims: { total: 0, pending: 0, approved: 0, rejected: 0 },
    recentApplications: [],
    recentClaims: [],
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const [
          appStatsRes,
          appListRes,
          restaurantRes,
          claimPendingRes,
          claimApprovedRes,
          claimRejectedRes,
          claimRecentRes,
        ] = await Promise.all([
          APIClient.getDashboardStats(),
          APIClient.getChefApplications({ sortBy: 'createdAt', order: 'desc' }),
          APIClient.getAdminRestaurants({ limit: 1 }),
          APIClient.getRestaurantClaims({ status: 'pending', limit: 1 }),
          APIClient.getRestaurantClaims({ status: 'approved', limit: 1 }),
          APIClient.getRestaurantClaims({ status: 'rejected', limit: 1 }),
          APIClient.getRestaurantClaims({ page: 1, limit: 5 }),
        ]);

        const pending = claimPendingRes.count ?? 0;
        const approved = claimApprovedRes.count ?? 0;
        const rejected = claimRejectedRes.count ?? 0;

        setData({
          applications: {
            total: appStatsRes?.data?.total ?? 0,
            pending: appStatsRes?.data?.pending ?? 0,
            approved: appStatsRes?.data?.approved ?? 0,
            rejected: appStatsRes?.data?.rejected ?? 0,
          },
          restaurants: {
            total: restaurantRes?.stats?.total ?? 0,
            published: restaurantRes?.stats?.published ?? 0,
            draft: restaurantRes?.stats?.draft ?? 0,
            archived: restaurantRes?.stats?.archived ?? 0,
          },
          claims: {
            total: pending + approved + rejected,
            pending,
            approved,
            rejected,
          },
          recentApplications: (appListRes?.data || []).slice(0, 5).map((app: any) => ({
            name: `${app.firstName || ''} ${app.lastName || ''}`.trim() || '-',
            email: app.email || '-',
            status: app.status || '-',
            createdAt: app.createdAt,
          })),
          recentClaims: (claimRecentRes?.data || []).slice(0, 5).map((claim: any) => ({
            restaurant: claim.restaurantId?.name || '-',
            claimantEmail: claim.claimantEmail || '-',
            status: claim.status || '-',
            createdAt: claim.createdAt,
          })),
        });
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Failed to load dashboard data'
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const formatDate = (value?: string) => {
    if (!value) return '-';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString();
  };

  if (loading) {
    return <p className="text-neutral-800">Loading dashboard data...</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-2 text-slate-600">Live overview from real backend data.</p>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Applications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{data.applications.total}</div>
            <p className="mt-1 text-xs text-slate-500">
              Pending {data.applications.pending} • Approved {data.applications.approved} •
              Rejected {data.applications.rejected}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Restaurants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{data.restaurants.total}</div>
            <p className="mt-1 text-xs text-slate-500">
              Published {data.restaurants.published} • Draft {data.restaurants.draft} •
              Archived {data.restaurants.archived}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Restaurant Claims
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{data.claims.total}</div>
            <p className="mt-1 text-xs text-slate-500">
              Pending {data.claims.pending} • Approved {data.claims.approved} •
              Rejected {data.claims.rejected}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recentApplications.length ? (
                data.recentApplications.map((app, index) => (
                  <div key={`${app.email}-${index}`} className="flex justify-between gap-4 text-sm">
                    <div>
                      <p className="font-medium text-slate-900">{app.name}</p>
                      <p className="text-slate-600">{app.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="capitalize text-slate-800">{app.status}</p>
                      <p className="text-slate-500">{formatDate(app.createdAt)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-600">No recent applications.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Claim Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recentClaims.length ? (
                data.recentClaims.map((claim, index) => (
                  <div
                    key={`${claim.restaurant}-${claim.claimantEmail}-${index}`}
                    className="flex justify-between gap-4 text-sm"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{claim.restaurant}</p>
                      <p className="text-slate-600">{claim.claimantEmail}</p>
                    </div>
                    <div className="text-right">
                      <p className="capitalize text-slate-800">{claim.status}</p>
                      <p className="text-slate-500">{formatDate(claim.createdAt)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-600">No recent claim requests.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
