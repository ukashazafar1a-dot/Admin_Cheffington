'use client';

import { useEffect, useState } from 'react';
import { APIClient } from '@/lib/api-client';
import type { AdPlacement, AdTargetRegion } from '@/lib/types';
import { Card } from '@/components/ui/card';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function localDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function defaultEndDate() {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return localDateValue(date);
}

const INITIAL_TODAY = localDateValue(new Date());
const INITIAL_END_DATE = defaultEndDate();

function dateBoundaryIso(value: string, endOfDay: boolean) {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(
    year,
    month - 1,
    day,
    endOfDay ? 23 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 999 : 0
  );
  return date.toISOString();
}

type Props = {
  onCreated: () => Promise<void> | void;
  onCancel: () => void;
};

export default function ComplimentaryAdForm({
  onCreated,
  onCancel,
}: Props) {
  const today = INITIAL_TODAY;
  const [placements, setPlacements] = useState<AdPlacement[]>([]);
  const [regions, setRegions] = useState<AdTargetRegion[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [placementKey, setPlacementKey] = useState('');
  const [targetRegionKey, setTargetRegionKey] = useState('');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(INITIAL_END_DATE);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      APIClient.getAdPlacements(),
      APIClient.getAdTargetRegions(),
    ])
      .then(([placementResponse, regionResponse]) => {
        if (cancelled) return;
        const nextPlacements =
          (placementResponse.data?.placements as AdPlacement[] | undefined) ??
          [];
        const nextRegions = (
          (regionResponse.data as AdTargetRegion[] | undefined) ?? []
        ).filter((region) => region.key !== 'sitewide');
        setPlacements(nextPlacements);
        setRegions(nextRegions);
        setPlacementKey((current) => current || nextPlacements[0]?.key || '');
        setTargetRegionKey((current) =>
          current && nextRegions.some((region) => region.key === current)
            ? current
            : nextRegions[0]?.key || ''
        );
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Failed to load ad options'
          );
        }
      })
      .finally(() => {
        if (!cancelled) setOptionsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const selectImage = (file: File | null) => {
    setError('');
    setUploadedImageUrl('');
    setPreviewUrl('');
    setImageFile(null);
    if (!file) {
      return;
    }
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setError('Use a JPEG, PNG, or WebP image');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError('Image must be 5 MB or smaller');
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setPreviewUrl(String(reader.result || ''));
    reader.readAsDataURL(file);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!imageFile && !uploadedImageUrl) {
      setError('Select an ad image');
      return;
    }
    if (!placementKey || !targetRegionKey) {
      setError('Select a placement and target area');
      return;
    }
    if (endDate < startDate) {
      setError('End date cannot be before start date');
      return;
    }

    try {
      setSubmitting(true);
      let imageUrl = uploadedImageUrl;
      if (!imageUrl && imageFile) {
        const uploadResponse =
          await APIClient.uploadComplimentaryAdAsset(imageFile, businessName);
        imageUrl = String(uploadResponse.data?.publicUrl || '');
        if (!imageUrl) {
          throw new Error('Image upload did not return a saved image URL');
        }
        setUploadedImageUrl(imageUrl);
      }

      await APIClient.createComplimentaryAd({
        businessName: businessName.trim(),
        contactEmail: contactEmail.trim() || undefined,
        imageUrl,
        linkUrl: linkUrl.trim(),
        placementKey,
        targetRegionKey,
        startDate: dateBoundaryIso(startDate, false),
        endDate: dateBoundaryIso(endDate, true),
      });

      await onCreated();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Failed to create complimentary ad'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="border-[#ff8400]/30 bg-[#fffaf4] p-5">
      <div className="mb-5">
        <h3 className="text-lg font-bold text-gray-900">
          Create complimentary ad
        </h3>
        <p className="mt-1 text-sm text-gray-600">
          Publish a free partner campaign without a payment or ad request.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium text-gray-800">
            Business name *
            <input
              required
              value={businessName}
              onChange={(event) => setBusinessName(event.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2"
            />
          </label>
          <label className="text-sm font-medium text-gray-800">
            Contact email (optional)
            <input
              type="email"
              value={contactEmail}
              onChange={(event) => setContactEmail(event.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2"
            />
          </label>
        </div>

        <label className="block text-sm font-medium text-gray-800">
          Destination link *
          <input
            required
            type="url"
            placeholder="https://partner.example.com"
            value={linkUrl}
            onChange={(event) => setLinkUrl(event.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium text-gray-800">
            Placement *
            <select
              required
              disabled={optionsLoading}
              value={placementKey}
              onChange={(event) => setPlacementKey(event.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2"
            >
              {!placements.length ? (
                <option value="">No active placements available</option>
              ) : null}
              {placements.map((placement) => (
                <option key={placement.key} value={placement.key}>
                  {placement.name}
                  {placement.sizeLabel ? ` — ${placement.sizeLabel}` : ''}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium text-gray-800">
            Target area *
            <select
              required
              disabled={optionsLoading}
              value={targetRegionKey}
              onChange={(event) => setTargetRegionKey(event.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2"
            >
              <option value="" disabled>
                Select a target area
              </option>
              {regions.map((region) => (
                <option key={region.key} value={region.key}>
                  {region.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium text-gray-800">
            Start date *
            <input
              required
              type="date"
              min={today}
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2"
            />
          </label>
          <label className="text-sm font-medium text-gray-800">
            End date *
            <input
              required
              type="date"
              min={startDate || today}
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2"
            />
          </label>
        </div>

        <label className="block text-sm font-medium text-gray-800">
          Ad image *
          <input
            required={!uploadedImageUrl}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES.join(',')}
            onChange={(event) => selectImage(event.target.files?.[0] || null)}
            className="mt-1 block w-full rounded-md border border-dashed border-gray-400 bg-white px-3 py-3 text-sm"
          />
          <span className="mt-1 block text-xs font-normal text-gray-500">
            JPEG, PNG, or WebP; maximum 5 MB.
          </span>
        </label>

        {previewUrl || uploadedImageUrl ? (
          <div className="rounded-lg border border-gray-200 bg-white p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl || uploadedImageUrl}
              alt="Complimentary ad preview"
              className="max-h-52 max-w-full rounded object-contain"
            />
            {uploadedImageUrl ? (
              <p className="mt-2 text-xs text-emerald-700">
                Image uploaded. You can retry publishing without uploading it
                again.
              </p>
            ) : null}
          </div>
        ) : null}

        {error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap justify-end gap-3">
          <button
            type="button"
            disabled={submitting}
            onClick={onCancel}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || optionsLoading}
            className="rounded-md bg-[#ff8400] px-4 py-2 text-sm font-semibold text-black hover:bg-[#e67600] disabled:opacity-50"
          >
            {submitting ? 'Publishing…' : 'Publish complimentary ad'}
          </button>
        </div>
      </form>
    </Card>
  );
}
