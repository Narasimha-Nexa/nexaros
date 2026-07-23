'use client';
import React, { useRef, useEffect } from 'react';

interface EditableTextProps {
  field: string;
  value: string;
  isEditMode: boolean;
  isActive: boolean;
  onEdit: (field: string, value: string) => void;
  onClick: (field: string) => void;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export function EditableText({
  field, value, isEditMode, isActive, onEdit, onClick,
  className = '', style, children,
}: EditableTextProps) {
  const ref = useRef<HTMLElement>(null);
  const lastValueRef = useRef(value);

  useEffect(() => {
    if (!ref.current) return;
    if (isEditMode) {
      ref.current.setAttribute('contenteditable', 'true');
      ref.current.setAttribute('data-field', field);
    } else {
      ref.current.removeAttribute('contenteditable');
      ref.current.removeAttribute('data-field');
    }
  }, [isEditMode, field]);

  useEffect(() => {
    if (!ref.current || !isEditMode) return;
    if (ref.current.textContent !== value) {
      ref.current.textContent = value;
      lastValueRef.current = value;
    }
  }, [value, isEditMode]);

  const handleBlur = () => {
    if (!ref.current) return;
    const newValue = ref.current.textContent || '';
    if (newValue !== lastValueRef.current) {
      lastValueRef.current = newValue;
      onEdit(field, newValue);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isEditMode) {
      e.preventDefault();
      e.stopPropagation();
      onClick(field);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      ref.current?.blur();
    }
  };

  const editStyles = isEditMode ? {
    outline: isActive ? '2px solid #E51A24' : '1px dashed rgba(229, 26, 36, 0.3)',
    outlineOffset: '2px',
    borderRadius: '2px',
    cursor: 'text',
    minHeight: '1em',
    ...style,
  } : style;

  return (
    <span
      ref={ref as React.RefObject<HTMLSpanElement>}
      className={`${className} ${isEditMode ? 'editable-field' : ''}`}
      style={editStyles}
      onBlur={handleBlur}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      suppressContentEditableWarning
    >
      {children || value}
    </span>
  );
}
