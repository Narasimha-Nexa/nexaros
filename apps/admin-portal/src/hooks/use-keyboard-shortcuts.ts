'use client';
import { useEffect } from 'react';
import { useWebsiteBuilderStore } from '@/stores/website-builder.store';

interface KeyboardShortcutsOptions {
  onUndo?: () => void;
  onRedo?: () => void;
  onSave?: () => void;
}

export function useKeyboardShortcuts({ onUndo, onRedo, onSave }: KeyboardShortcutsOptions) {
  const { undo, redo, canUndo, canRedo } = useWebsiteBuilderStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrMeta = e.ctrlKey || e.metaKey;

      if (isCtrlOrMeta && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo()) undo();
        else if (onUndo) onUndo();
      }

      if (isCtrlOrMeta && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        if (canRedo()) redo();
        else if (onRedo) onRedo();
      }

      if (isCtrlOrMeta && e.key === 's') {
        e.preventDefault();
        if (onSave) onSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, canUndo, canRedo, onUndo, onRedo, onSave]);
}