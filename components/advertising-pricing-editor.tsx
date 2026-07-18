'use client';

import { useEffect, useMemo, useState } from 'react';
import { APIClient } from '@/lib/api-client';
import type { AdPricingColumn, AdPricingRow, AdPricingTable } from '@/lib/types';
import { Card } from '@/components/ui/card';

function createColumnId() {
  return `col_${Math.random().toString(36).slice(2, 10)}`;
}

function createRowId() {
  return `row_${Math.random().toString(36).slice(2, 10)}`;
}

function sortColumns(columns: AdPricingColumn[]) {
  return [...columns].sort((a, b) => a.order - b.order);
}

function sortRows(rows: AdPricingRow[]) {
  return [...rows].sort((a, b) => a.order - b.order);
}

export default function AdvertisingPricingEditor() {
  const [table, setTable] = useState<AdPricingTable | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pricePerDayDrafts, setPricePerDayDrafts] = useState<
    Record<string, string>
  >({});

  const columns = useMemo(
    () => sortColumns(table?.columns ?? []),
    [table?.columns]
  );
  const rows = useMemo(() => sortRows(table?.rows ?? []), [table?.rows]);

  const loadTable = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await APIClient.getAdvertisingPricingTable();
      if (response.success) {
        setTable(response.data as AdPricingTable);
        if (response.message) {
          setSuccess(response.message);
        }
      }
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Failed to load pricing table'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTable();
  }, []);

  const updateColumnLabel = (columnId: string, label: string) => {
    setTable((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        columns: prev.columns.map((column) =>
          column.id === columnId ? { ...column, label } : column
        ),
      };
    });
  };

  const addColumn = () => {
    setTable((prev) => {
      if (!prev) return prev;
      const id = createColumnId();
      const nextColumns = [
        ...prev.columns,
        { id, label: 'New column', order: prev.columns.length },
      ];
      return {
        ...prev,
        columns: nextColumns,
        rows: prev.rows.map((row) => ({
          ...row,
          cells: { ...row.cells, [id]: row.cells[id] ?? '' },
        })),
      };
    });
  };

  const removeColumn = (columnId: string) => {
    setTable((prev) => {
      if (!prev || prev.columns.length <= 1) return prev;
      return {
        ...prev,
        columns: prev.columns
          .filter((column) => column.id !== columnId)
          .map((column, index) => ({ ...column, order: index })),
        rows: prev.rows.map((row) => {
          const nextCells = { ...row.cells };
          delete nextCells[columnId];
          return { ...row, cells: nextCells };
        }),
      };
    });
  };

  const addRow = () => {
    setTable((prev) => {
      if (!prev) return prev;
      const cells: Record<string, string> = {};
      for (const column of prev.columns) {
        cells[column.id] = '';
      }
      return {
        ...prev,
        rows: [
          ...prev.rows,
          {
            id: createRowId(),
            slotKey: `slot_${prev.rows.length + 1}`,
            cells,
            pricePerDay: 0,
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
          .filter((row) => row.id !== rowId)
          .map((row, index) => ({ ...row, order: index })),
      };
    });
  };

  const updateRowCell = (rowId: string, columnId: string, value: string) => {
    setTable((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        rows: prev.rows.map((row) =>
          row.id === rowId
            ? { ...row, cells: { ...row.cells, [columnId]: value } }
            : row
        ),
      };
    });
  };

  const updateRowMeta = (
    rowId: string,
    field: 'slotKey' | 'pricePerDay' | 'isActive',
    value: string | number | boolean
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

  const getPricePerDayDisplay = (row: AdPricingRow) => {
    if (row.id in pricePerDayDrafts) return pricePerDayDrafts[row.id];
    return row.pricePerDay === 0 ? '' : String(row.pricePerDay);
  };

  const handlePricePerDayChange = (rowId: string, raw: string) => {
    if (raw !== '' && !/^\d*\.?\d*$/.test(raw)) return;

    setPricePerDayDrafts((prev) => ({ ...prev, [rowId]: raw }));

    const parsed =
      raw === '' || raw === '.' ? 0 : Number.parseFloat(raw);
    updateRowMeta(
      rowId,
      'pricePerDay',
      Number.isFinite(parsed) ? parsed : 0
    );
  };

  const handlePricePerDayBlur = (rowId: string, raw: string) => {
    const trimmed = raw.trim();
    const parsed = trimmed === '' ? 0 : Number.parseFloat(trimmed) || 0;
    updateRowMeta(rowId, 'pricePerDay', parsed);
    setPricePerDayDrafts((prev) => {
      const next = { ...prev };
      delete next[rowId];
      return next;
    });
  };

  const saveTable = async () => {
    if (!table) return;
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      const response = await APIClient.updateAdvertisingPricingTable({
        columns: sortColumns(table.columns).map((column, index) => ({
          ...column,
          order: index,
        })),
        rows: sortRows(table.rows).map((row, index) => ({
          ...row,
          order: index,
        })),
      });
      setTable(response.data as AdPricingTable);
      setPricePerDayDrafts({});
      setSuccess(response.message || 'Pricing table saved');
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : 'Failed to save pricing table'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-neutral-800">Loading pricing table...</p>;
  }

  if (!table) {
    return <p className="text-red-600">Could not load pricing table.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Pricing table</h2>
          <p className="mt-1 text-sm text-gray-600">
            Use pixel sizes (e.g. 728×90, 300×250) so ads match the on-site boxes.
            Each row needs a unique slot key. Uncheck &quot;Show on public page&quot; to
            hide a row, then click Save changes.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={addColumn}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Add column
          </button>
          <button
            type="button"
            onClick={addRow}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Add row
          </button>
          <button
            type="button"
            onClick={saveTable}
            disabled={saving}
            className="rounded-md bg-[#ff8400] px-4 py-2 text-sm font-semibold text-white hover:bg-[#e67600] disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">
          {success}
        </p>
      ) : null}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#fff1e1]">
              <tr>
                {columns.map((column) => (
                  <th key={column.id} className="min-w-[160px] border-b border-gray-200 p-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={column.label}
                        onChange={(e) => updateColumnLabel(column.id, e.target.value)}
                        className="w-full rounded border border-gray-300 px-2 py-1 text-sm font-semibold"
                      />
                      <button
                        type="button"
                        onClick={() => removeColumn(column.id)}
                        disabled={columns.length <= 1}
                        className="shrink-0 text-xs text-red-600 hover:underline disabled:opacity-40"
                        title="Remove column"
                      >
                        Remove
                      </button>
                    </div>
                  </th>
                ))}
                <th className="min-w-[220px] border-b border-gray-200 p-3 font-semibold">
                  Slot settings
                </th>
                <th className="border-b border-gray-200 p-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + 2}
                    className="p-6 text-center text-gray-500"
                  >
                    No rows yet. Click &quot;Add row&quot; to create one.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="border-b border-gray-100 align-top">
                    {columns.map((column) => (
                      <td key={`${row.id}-${column.id}`} className="p-3">
                        <input
                          type="text"
                          value={row.cells?.[column.id] ?? ''}
                          onChange={(e) =>
                            updateRowCell(row.id, column.id, e.target.value)
                          }
                          className="w-full rounded border border-gray-300 px-2 py-1.5"
                        />
                      </td>
                    ))}
                    <td className="space-y-2 p-3">
                      <input
                        type="text"
                        value={row.slotKey}
                        onChange={(e) =>
                          updateRowMeta(row.id, 'slotKey', e.target.value)
                        }
                        placeholder="slot_key"
                        className="w-full rounded border border-gray-300 px-2 py-1.5"
                      />
                      <input
                        type="text"
                        inputMode="decimal"
                        value={getPricePerDayDisplay(row)}
                        onChange={(e) =>
                          handlePricePerDayChange(row.id, e.target.value)
                        }
                        onBlur={(e) =>
                          handlePricePerDayBlur(row.id, e.target.value)
                        }
                        className="w-full rounded border border-gray-300 px-2 py-1.5"
                        placeholder="Price per day"
                      />
                      <p className="text-xs text-gray-500">Price per day ($)</p>
                      <label className="flex items-center gap-2 text-xs text-gray-600">
                        <input
                          type="checkbox"
                          checked={row.isActive}
                          onChange={(e) =>
                            updateRowMeta(row.id, 'isActive', e.target.checked)
                          }
                        />
                        Show on public page
                      </label>
                    </td>
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => removeRow(row.id)}
                        className="text-sm text-red-600 hover:underline"
                      >
                        Remove row
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="text-xs text-gray-500">
        <strong>Site slot keys</strong> (must match code):{' '}
        <code>header_banner</code>, <code>footer_banner</code>,{' '}
        <code>homepage_featured</code>, <code>restaurant_sidebar</code>,{' '}
        <code>restaurant_top</code>, <code>restaurant_right_rail</code>,{' '}
        <code>restaurant_reviews_top</code>, <code>chef_sidebar</code>,{' '}
        <code>restaurants_top</code>, <code>restaurants_list</code>,{' '}
        <code>about_banner</code>. Size column =
        live box pixels (<code>300×250</code>) or presets (Large banner, Medium).
        New custom positions still need a developer to add <code>AdSlot</code> in
        code.
      </p>
    </div>
  );
}
