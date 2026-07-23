'use client';
import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type DiffValue = {
  type: 'added' | 'removed' | 'changed' | 'unchanged';
  path: string;
  oldValue?: any;
  newValue?: any;
};

function diffObjects(oldObj: any, newObj: any, path = ''): DiffValue[] {
  const results: DiffValue[] = [];
  const allKeys = new Set([...Object.keys(oldObj || {}), ...Object.keys(newObj || {})]);

  for (const key of allKeys) {
    const newPath = path ? `${path}.${key}` : key;
    const oldVal = oldObj?.[key];
    const newVal = newObj?.[key];

    if (oldVal === undefined) {
      results.push({ type: 'added', path: newPath, newValue: newVal });
    } else if (newVal === undefined) {
      results.push({ type: 'removed', path: newPath, oldValue: oldVal });
    } else if (typeof oldVal === 'object' && typeof newVal === 'object' && oldVal !== null && newVal !== null) {
      results.push(...diffObjects(oldVal, newVal, newPath));
    } else if (oldVal !== newVal) {
      results.push({ type: 'changed', path: newPath, oldValue: oldVal, newValue: newVal });
    } else {
      results.push({ type: 'unchanged', path: newPath, oldValue: oldVal });
    }
  }

  return results;
}

function formatValue(val: any): string {
  if (val === null) return 'null';
  if (val === undefined) return 'undefined';
  if (typeof val === 'object') return JSON.stringify(val, null, 2);
  return String(val);
}

interface DiffViewProps {
  oldConfig: Record<string, any>;
  newConfig: Record<string, any>;
  title?: string;
}

export function DiffView({ oldConfig, newConfig, title = 'Changes' }: DiffViewProps) {
  const diffs = useMemo(() => {
    const all = diffObjects(oldConfig, newConfig);
    return all.filter((d) => d.type !== 'unchanged');
  }, [oldConfig, newConfig]);

  const added = diffs.filter((d) => d.type === 'added').length;
  const removed = diffs.filter((d) => d.type === 'removed').length;
  const changed = diffs.filter((d) => d.type === 'changed').length;

  if (diffs.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-ink/50">No differences found</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-ink">{title}</h3>
        <div className="flex gap-2">
          <Badge variant="success" className="gap-1">{added} added</Badge>
          <Badge variant="danger" className="gap-1">{removed} removed</Badge>
          <Badge variant="warning" className="gap-1">{changed} changed</Badge>
        </div>
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {diffs.map((d, i) => (
          <div key={i} className="border rounded-lg p-3 bg-white">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-ink/60">{d.path}</span>
              <Badge
                variant={d.type === 'added' ? 'success' : d.type === 'removed' ? 'danger' : 'warning'}
                size="sm"
              >
                {d.type}
              </Badge>
            </div>
            {d.type === 'changed' && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-red-50 p-2 rounded font-mono">
                  <span className="text-red-700">Old:</span> {formatValue(d.oldValue)}
                </div>
                <div className="bg-green-50 p-2 rounded font-mono">
                  <span className="text-green-700">New:</span> {formatValue(d.newValue)}
                </div>
              </div>
            )}
            {d.type === 'added' && (
              <div className="bg-green-50 p-2 rounded font-mono text-xs text-green-700">
                Added: {formatValue(d.newValue)}
              </div>
            )}
            {d.type === 'removed' && (
              <div className="bg-red-50 p-2 rounded font-mono text-xs text-red-700">
                Removed: {formatValue(d.oldValue)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}