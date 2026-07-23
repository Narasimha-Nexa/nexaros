'use client';
import { useEffect, useState, useCallback, useRef } from 'react';

interface EditMessage {
  type: 'nexaros:edit-mode';
  enabled: boolean;
}

interface EditFieldMessage {
  type: 'nexaros:field-edit';
  field: string;
  value: string;
}

interface FieldClickedMessage {
  type: 'nexaros:field-clicked';
  field: string;
}

export function useEditMode() {
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeField, setActiveField] = useState<string | null>(null);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const data = event.data;
      if (!data) return;

      if (data.type === 'nexaros:edit-mode') {
        setIsEditMode(data.enabled);
        if (!data.enabled) setActiveField(null);
      }

      if (data.type === 'nexaros:set-active-field') {
        setActiveField(data.field);
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const sendFieldEdit = useCallback((field: string, value: string) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const msg: EditFieldMessage = { type: 'nexaros:field-edit', field, value };
      window.parent.postMessage(msg, '*');
    }, 300);
  }, []);

  const sendFieldClicked = useCallback((field: string) => {
    setActiveField(field);
    const msg: FieldClickedMessage = { type: 'nexaros:field-clicked', field };
    window.parent.postMessage(msg, '*');
  }, []);

  return { isEditMode, activeField, sendFieldEdit, sendFieldClicked };
}
