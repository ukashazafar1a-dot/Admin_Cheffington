'use client';

import { useEffect, useState } from 'react';
import { APIClient } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const DEFAULT_SUBTITLE =
  "Restaurant reviews by chefs, not your mom's cat sitter.";

const DEFAULT_KISS_LINES = [
  'Best place for Pakistani food in Nevada City',
  'Best place for Italian food in Grass Valley',
  'Best place for Mexican food in Auburn',
  'Best place for Japanese food in Truckee',
  'Best place for Thai food in Lake Tahoe',
  'Best place for American food in Colfax',
  'Best place for Indian food in Roseville',
  'Best place for Chinese food in Sierra City',
  'Best place for Mediterranean food in Raleigh',
  'Best place for French food in Durham',
  'Best place for Italian food in Chapel Hill',
  'Best place for Mexican food in Carrboro',
  'Best place for Pakistani food in Cary',
].join('\n');

function linesToText(lines: unknown): string {
  if (Array.isArray(lines)) {
    return lines
      .map((line) => String(line || '').trim())
      .filter(Boolean)
      .join('\n');
  }
  if (typeof lines === 'string' && lines.trim()) {
    return lines.trim();
  }
  return DEFAULT_KISS_LINES;
}

export default function HomepageCopyEditor() {
  const [subtitle, setSubtitle] = useState(DEFAULT_SUBTITLE);
  const [kissLines, setKissLines] = useState(DEFAULT_KISS_LINES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await APIClient.getAdminSiteCopy();
        const value = res?.data?.homepage_subtitle;
        if (typeof value === 'string' && value.trim()) {
          setSubtitle(value.trim());
        }
        setKissLines(linesToText(res?.data?.chefs_kiss_lines));
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Failed to load homepage copy'
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    const nextSubtitle = subtitle.trim();
    const nextKissLines = kissLines
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (!nextSubtitle) {
      setError('Homepage subtitle cannot be empty');
      return;
    }
    if (nextKissLines.length === 0) {
      setError("Add at least one Chef's Kiss line");
      return;
    }

    try {
      setSaving(true);
      setError('');
      setMessage('');
      const res = await APIClient.updateAdminSiteCopy({
        homepage_subtitle: nextSubtitle,
        chefs_kiss_lines: nextKissLines,
      });
      const savedSubtitle = res?.data?.homepage_subtitle;
      if (typeof savedSubtitle === 'string' && savedSubtitle.trim()) {
        setSubtitle(savedSubtitle.trim());
      }
      setKissLines(linesToText(res?.data?.chefs_kiss_lines));
      setMessage(
        'Homepage copy saved. Public site updates within about a minute.'
      );
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Failed to save homepage copy'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-slate-900">
          Homepage copy
        </CardTitle>
        <p className="text-sm text-slate-600">
          Edit the hero subtitle and the rotating lines under &quot;The
          Chef&apos;s Kiss.&quot;
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        {loading ? (
          <p className="text-sm text-slate-600">Loading…</p>
        ) : (
          <>
            <label className="block text-sm font-medium text-slate-800">
              Hero subtitle
              <textarea
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                rows={3}
                maxLength={280}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
              />
            </label>

            <label className="block text-sm font-medium text-slate-800">
              Chef&apos;s Kiss rotating lines
              <span className="mt-1 block text-xs font-normal text-slate-500">
                One full sentence per line. The public site shows one line at a
                time and loops through them every few seconds.
              </span>
              <textarea
                value={kissLines}
                onChange={(e) => setKissLines(e.target.value)}
                rows={10}
                className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900"
                placeholder={
                  'Best place for Pakistani food in Nevada City\nBest place for Italian food in Grass Valley'
                }
              />
            </label>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="bg-[#ff8400] text-white hover:bg-[#e67600]"
              >
                {saving ? 'Saving…' : 'Save homepage copy'}
              </Button>
              <button
                type="button"
                className="text-sm text-slate-600 underline"
                onClick={() => {
                  setSubtitle(DEFAULT_SUBTITLE);
                  setKissLines(DEFAULT_KISS_LINES);
                }}
                disabled={saving}
              >
                Reset to defaults
              </button>
            </div>
            {message ? (
              <p className="text-sm text-green-700">{message}</p>
            ) : null}
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
