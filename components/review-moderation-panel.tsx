'use client';

import { useEffect, useState } from 'react';
import { APIClient } from '@/lib/api-client';
import type { BannedPhrase } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type ToastItem = {
  id: number;
  type: 'success' | 'error';
  message: string;
};

function getPhraseId(item: BannedPhrase) {
  return item._id;
}

export default function ReviewModerationPanel() {
  const [phrases, setPhrases] = useState<BannedPhrase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newPhrase, setNewPhrase] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingPhrase, setEditingPhrase] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const pushToast = (type: ToastItem['type'], message: string) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev, { id, type, message }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const loadPhrases = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await APIClient.getBannedPhrases();
      setPhrases(Array.isArray(res.data) ? res.data : []);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Failed to load banned phrases'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPhrases();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newPhrase.trim();
    if (!trimmed) return;

    try {
      setSaving(true);
      await APIClient.createBannedPhrase(trimmed);
      setNewPhrase('');
      pushToast('success', 'Banned phrase added');
      await loadPhrases();
    } catch (addError) {
      pushToast(
        'error',
        addError instanceof Error ? addError.message : 'Failed to add phrase'
      );
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item: BannedPhrase) => {
    setEditingId(getPhraseId(item));
    setEditingPhrase(item.phrase);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingPhrase('');
  };

  const handleUpdate = async (id: string) => {
    const trimmed = editingPhrase.trim();
    if (!trimmed) {
      pushToast('error', 'Phrase cannot be empty');
      return;
    }

    try {
      setUpdatingId(id);
      await APIClient.updateBannedPhrase(id, trimmed);
      pushToast('success', 'Banned phrase updated');
      cancelEdit();
      await loadPhrases();
    } catch (updateError) {
      pushToast(
        'error',
        updateError instanceof Error ? updateError.message : 'Failed to update phrase'
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('Remove this banned phrase?');
    if (!confirmed) return;

    try {
      setDeletingId(id);
      await APIClient.deleteBannedPhrase(id);
      if (editingId === id) cancelEdit();
      pushToast('success', 'Banned phrase removed');
      await loadPhrases();
    } catch (deleteError) {
      pushToast(
        'error',
        deleteError instanceof Error ? deleteError.message : 'Failed to delete phrase'
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600 max-w-3xl">
        Manage platform-wide banned words and phrases. Chef reviews containing
        these terms are automatically flagged and will not be published or
        counted on restaurant pages.
      </p>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Add banned phrase
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Examples: not recommended, terrible, waste of money
        </p>
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3">
          <Input
            value={newPhrase}
            onChange={(e) => setNewPhrase(e.target.value)}
            placeholder="Enter a word or phrase to ban"
            maxLength={80}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={saving || !newPhrase.trim()}
            className="bg-[#ff8400] text-white hover:bg-[#e67600]"
          >
            {saving ? 'Adding...' : 'Add phrase'}
          </Button>
        </form>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Banned phrases ({phrases.length})
          </h2>
        </div>

        {loading ? (
          <p className="text-gray-500">Loading banned phrases...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : phrases.length === 0 ? (
          <p className="text-gray-500">No banned phrases yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500">
                  <th className="py-3 pr-4 font-medium">Phrase</th>
                  <th className="py-3 pr-4 font-medium">Added</th>
                  <th className="py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {phrases.map((item) => {
                  const id = getPhraseId(item);
                  const isEditing = editingId === id;

                  return (
                    <tr key={id} className="border-b border-gray-100">
                      <td className="py-3 pr-4 font-medium text-gray-900">
                        {isEditing ? (
                          <Input
                            value={editingPhrase}
                            onChange={(e) => setEditingPhrase(e.target.value)}
                            maxLength={80}
                            className="max-w-md"
                            autoFocus
                          />
                        ) : (
                          item.phrase
                        )}
                      </td>
                      <td className="py-3 pr-4 text-gray-500">
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleDateString()
                          : '-'}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isEditing ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleUpdate(id)}
                                disabled={updatingId === id || !editingPhrase.trim()}
                                className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                              >
                                {updatingId === id ? 'Saving...' : 'Save'}
                              </button>
                              <button
                                type="button"
                                onClick={cancelEdit}
                                disabled={updatingId === id}
                                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => startEdit(item)}
                                disabled={deletingId === id || editingId !== null}
                                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(id)}
                                disabled={deletingId === id || editingId !== null}
                                className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                              >
                                {deletingId === id ? 'Deleting...' : 'Delete'}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {toasts.length > 0 ? (
        <div className="fixed bottom-6 right-6 z-50 space-y-2">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`rounded-lg px-4 py-3 text-sm shadow-lg ${
                toast.type === 'success'
                  ? 'bg-green-600 text-white'
                  : 'bg-red-600 text-white'
              }`}
            >
              {toast.message}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
