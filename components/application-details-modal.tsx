'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

import { ChefApplication } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { APIClient } from '@/lib/api-client';

interface ApplicationDetailsModalProps {
  application: ChefApplication;
  onClose: () => void;
  onUpdate: () => void;
}

export function ApplicationDetailsModal({
  application,
  onClose,
  onUpdate,
}: ApplicationDetailsModalProps) {
  const { admin } = useAuth();

  const [loading, setLoading] = useState(false);

  const [adminNotes, setAdminNotes] = useState(
    application.adminNotes || ''
  );

  const [error, setError] = useState('');

  const isPending =
    application.status?.trim().toLowerCase() === 'pending';

  const handleApprove = async () => {
    setError('');
    setLoading(true);

    try {
      const response =
        await APIClient.updateApplicationStatus(
          application._id || application.id!,
          'approved',
          adminNotes
        );

      if (response.success) {
        const warningMessage =
          typeof response.message === 'string' &&
          response.message !== 'Status updated successfully'
            ? response.message
            : '';
        if (warningMessage) {
          window.alert(warningMessage);
        }
        onUpdate();
        onClose();
      } else {
        setError('Failed to approve application');
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Error updating application'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!adminNotes.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response =
        await APIClient.updateApplicationStatus(
          application._id || application.id!,
          'rejected',
          adminNotes
        );

      if (response.success) {
        const warningMessage =
          typeof response.message === 'string' &&
          response.message !== 'Status updated successfully'
            ? response.message
            : '';
        if (warningMessage) {
          window.alert(warningMessage);
        }
        onUpdate();
        onClose();
      } else {
        setError('Failed to reject application');
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Error updating application'
      );
    } finally {
      setLoading(false);
    }
  };

  const DetailSection = ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">
        {title}
      </h3>

      <div className="bg-gray-50 p-4 rounded-lg">
        {children}
      </div>
    </div>
  );

  const DetailRow = ({
    label,
    value,
  }: {
    label: string;
    value: string | React.ReactNode;
  }) => (
    <div className="mb-4 last:mb-0">
      <p className="text-sm text-gray-600 font-medium mb-1">
        {label}
      </p>

      <div className="text-gray-900 wrap-break-word">
        {value || '-'}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">

      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-xl p-6 relative max-h-[95vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">

          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Application Details
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Review chef application information
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-gray-500 hover:text-black text-3xl leading-none"
          >
            ×
          </button>

        </div>

        {/* Personal Information */}
        <DetailSection title="Personal Information">

          <DetailRow
            label="Application Type"
            value={
              application.applicationType === 'business_owner'
                ? 'Business Owner'
                : application.applicationType === 'public'
                  ? 'Individual'
                  : 'Chef'
            }
          />

          <DetailRow
            label="Full Name"
            value={`${application.firstName} ${application.lastName}`}
          />

          <DetailRow
            label="Email"
            value={application.email}
          />

          <DetailRow
            label="Phone"
            value={application.phone}
          />

        </DetailSection>

        {/* Address Information */}
        <DetailSection title="Address Information">

          <DetailRow
            label="Address Line 1"
            value={application.addressLine1}
          />

          {application.addressLine2 && (
            <DetailRow
              label="Address Line 2"
              value={application.addressLine2}
            />
          )}

          <DetailRow
            label="City"
            value={application.city}
          />

          <DetailRow
            label="State"
            value={application.state}
          />

          <DetailRow
            label="Zip Code"
            value={application.zipCode}
          />

          <DetailRow
            label="Country"
            value={application.country}
          />

        </DetailSection>

        {/* Professional / profile Information */}
        <DetailSection
          title={
            application.applicationType === 'public'
              ? 'Profile Information'
              : 'Professional Information'
          }
        >

          <DetailRow
            label={
              application.applicationType === 'business_owner'
                ? 'Business / Restaurant'
                : application.applicationType === 'public'
                  ? 'Organization'
                  : 'Current Restaurant'
            }
            value={application.currentRestaurant || '-'}
          />

          {application.applicationType !== 'public' ? (
            <DetailRow
              label="Job Title"
              value={application.jobTitle || '-'}
            />
          ) : null}

          <DetailRow
            label="Website"
            value={
              application.website ? (
                <a
                  href={application.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  {application.website}
                </a>
              ) : (
                '-'
              )
            }
          />

          {application.applicationType !== 'public' ? (
            <DetailRow
              label="Professional Email"
              value={application.professionalEmail || '-'}
            />
          ) : null}

          {(application.applicationType === 'chef' ||
            application.applicationType === 'public' ||
            !application.applicationType) &&
          application.chefAdPromoCode ? (
            <DetailRow
              label="Promo Code"
              value={
                <span>
                  <code className="rounded bg-gray-100 px-2 py-0.5 text-sm">
                    {application.chefAdPromoCode}
                  </code>
                  {application.chefAdPromoRedeemedAt
                    ? ' (redeemed)'
                    : ' (not redeemed)'}
                </span>
              }
            />
          ) : null}

        </DetailSection>

        {/* Documents */}
        <DetailSection title="Documents">

          {application.applicationType === 'public' ? (
            <DetailRow
              label="Verification"
              value="Not required for Individual applications"
            />
          ) : (
            <DetailRow
              label="Professional Proof"
              value={(() => {
                const docUrls =
                  application.applicationDocuments?.length
                    ? application.applicationDocuments
                    : application.professionalProof
                      ? [application.professionalProof]
                      : [];

                if (docUrls.length === 0) return '-';

                return (
                  <ul className="space-y-2">
                    {docUrls.map((url, index) => (
                      <li key={`${url}-${index}`}>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline"
                        >
                          View document {docUrls.length > 1 ? index + 1 : ''}
                        </a>
                      </li>
                    ))}
                  </ul>
                );
              })()}
            />
          )}

          <DetailRow
            label="Signature"
            value={
              application.signature ? (
                <img
                  src={application.signature}
                  alt="Signature"
                  className="h-24 border rounded-md bg-white p-2"
                />
              ) : (
                '-'
              )
            }
          />

        </DetailSection>

        {/* Status */}
        <DetailSection title="Application Status">

          <DetailRow
            label="Status"
            value={
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  application.status === 'approved'
                    ? 'bg-green-100 text-green-700'
                    : application.status === 'rejected'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}
              >
                {application.status
                  .charAt(0)
                  .toUpperCase() +
                  application.status.slice(1)}
              </span>
            }
          />

          <DetailRow
            label="Applied Date"
            value={
              application.createdAt
                ? new Date(
                    application.createdAt
                  ).toLocaleDateString()
                : '-'
            }
          />

          {application.statusUpdatedAt && (
            <DetailRow
              label="Status Updated"
              value={new Date(
                application.statusUpdatedAt
              ).toLocaleDateString()}
            />
          )}

          {application.approvedBy && (
            <DetailRow
              label="Approved By"
              value={application.approvedBy}
            />
          )}

        </DetailSection>

        {/* Existing Admin Notes */}
        {application.adminNotes && (
          <DetailSection title="Existing Admin Notes">

            <p className="text-gray-700 whitespace-pre-line">
              {application.adminNotes}
            </p>

          </DetailSection>
        )}

        {/* Review Section */}
        <div className="border-t border-gray-200 pt-6">

          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Review Application
          </h3>

          {!isPending ? (
            <div className="mb-4 text-sm text-gray-600">
              This application has already been reviewed as{' '}
              <strong>{application.status}</strong>.
            </div>
          ) : (
            <div className="mb-4">

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Notes
              </label>

              <Textarea
                value={adminNotes}
                onChange={(e) =>
                  setAdminNotes(e.target.value)
                }
                placeholder="Add notes about this application..."
                rows={5}
              />

            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4">

            <Button
              onClick={handleApprove}
              disabled={!isPending || loading}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              {loading
                ? 'Processing...'
                : 'Approve Application'}
            </Button>

            <Button 
              onClick={handleReject}
              disabled={!isPending || loading}
              variant="destructive"
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {loading
                ? 'Processing...'
                : 'Reject Application'}
            </Button>

          </div>

        </div>

        {/* Close Button */}
        <div className="pt-6">

          <Button
            onClick={onClose}
            variant="outline"
            className="w-full"
          >
            Close
          </Button>

        </div>

      </div>

    </div>
  );
}