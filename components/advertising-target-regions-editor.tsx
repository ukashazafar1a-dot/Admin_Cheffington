'use client';

import { useEffect, useMemo, useState } from 'react';
import { APIClient } from '@/lib/api-client';
import type { AdTargetRegionRow, AdTargetRegionsTable } from '@/lib/types';
import { Card } from '@/components/ui/card';

function createRowId() {
  return `region_${Math.random().toString(36).slice(2, 10)}`;
}

function slugifyKey(label: string) {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 64);
}

function sortRows(rows: AdTargetRegionRow[]) {
  return [...rows].sort((a, b) => a.order - b.order);
}

function formatCities(cities: string[]) {
  return cities.join(', ');
}

function parseCities(value: string) {
  return value
    .split(/[,;\n]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function AdvertisingTargetRegionsEditor() {
  const [table, setTable] = useState<AdTargetRegionsTable | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const rows = useMemo(() => sortRows(table?.rows ?? []), [table?.rows]);

  const loadTable = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await APIClient.getAdminTargetRegions();
      if (response.success) {
        setTable(response.data as AdTargetRegionsTable);
        if (response.message) {
          setSuccess(response.message);
        }
      }
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Failed to load target areas'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTable();
  }, []);

  const updateRow = (
    rowId: string,
    field: keyof AdTargetRegionRow,
    value: string | boolean | string[]
  ) => {
    setTable((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        rows: prev.rows.map((row) =>
          row.id === rowId ? { ...row, [field]: value } : row
        ),
      };
    });
  };

  const addRow = () => {
    setTable((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        rows: [
          ...prev.rows,
          {
            id: createRowId(),
            key: '',
            label: '',
            state: '',
            cities: [],
            publicSelectable: true,
            isActive: true,
            order: prev.rows.length,
          },
        ],
      };
    });
  };

  const removeRow = (rowId: string) => {
    setTable((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        rows: prev.rows
          .filter((item) => item.id !== rowId)
          .map((item, index) => ({ ...item, order: index })),
      };
    });
  };

  const save = async () => {
    if (!table) return;

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const payload = {
        ...table,
        rows: sortRows(table.rows)
          .filter((row) => row.key !== 'sitewide')
          .map((row, index) => ({
            ...row,
            key: row.key.trim() || slugifyKey(row.label),
            order: index,
            publicSelectable: row.publicSelectable !== false,
          })),
      };

      const response = await APIClient.updateAdminTargetRegions(payload);
      if (response.success) {
        setTable(response.data as AdTargetRegionsTable);
        setSuccess(response.message || 'Target areas saved successfully.');
      }
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Failed to save target areas'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-neutral-800">Loading target areas...</p>;
  }

  if (!table) {
    return <p className="text-red-600">Could not load target areas.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Target areas</h2>
          <p className="mt-1 max-w-2xl text-sm text-gray-600">
            Manage the locations advertisers can choose on the public advertise
            page. City aliases are used to match restaurant pages for
            geo-targeted ads.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={addRow}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Add target area
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="rounded-md bg-[#ff8400] px-4 py-2 text-sm font-semibold text-black hover:bg-[#e67600] disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save target areas'}
          </button>
        </div>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {success ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
          {success}
        </p>
      ) : null}

      <Card className="overflow-x-auto p-0">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[#fff1e1]">
            <tr>
              <th className="p-3 font-semibold">Label</th>
              <th className="p-3 font-semibold">Key</th>
              <th className="p-3 font-semibold">State</th>
              <th className="p-3 font-semibold">City aliases</th>
              <th className="p-3 font-semibold">Public form</th>
              <th className="p-3 font-semibold">Active</th>
              <th className="p-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows
              .filter((row) => row.key !== 'sitewide')
              .map((row) => (
                <tr key={row.id} className="border-t border-gray-100 align-top">
                  <td className="p-3">
                    <input
                      type="text"
                      value={row.label}
                      onChange={(e) => updateRow(row.id, 'label', e.target.value)}
                      className="w-full min-w-[220px] rounded-md border border-gray-300 px-3 py-2"
                      placeholder="Nevada County, CA"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="text"
                      value={row.key}
                      onChange={(e) => updateRow(row.id, 'key', e.target.value)}
                      className="w-full min-w-[180px] rounded-md border border-gray-300 px-3 py-2"
                      placeholder="nevada_county_ca"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="text"
                      value={row.state || ''}
                      onChange={(e) =>
                        updateRow(row.id, 'state', e.target.value.toUpperCase())
                      }
                      className="w-24 rounded-md border border-gray-300 px-3 py-2"
                      placeholder="CA"
                    />
                  </td>
                  <td className="p-3">
                    <textarea
                      value={formatCities(row.cities || [])}
                      onChange={(e) =>
                        updateRow(row.id, 'cities', parseCities(e.target.value))
                      }
                      rows={3}
                      className="w-full min-w-[260px] rounded-md border border-gray-300 px-3 py-2"
                      placeholder="nevada city, grass valley, truckee"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={row.publicSelectable !== false}
                      onChange={(e) =>
                        updateRow(row.id, 'publicSelectable', e.target.checked)
                      }
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={row.isActive !== false}
                      onChange={(e) =>
                        updateRow(row.id, 'isActive', e.target.checked)
                      }
                    />
                  </td>
                  <td className="p-3">
                    <button
                      type="button"
                      onClick={() => removeRow(row.id)}
                      className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
