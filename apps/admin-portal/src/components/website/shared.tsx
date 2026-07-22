'use client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogFooter } from '@/components/ui/dialog';

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-medium text-ink/60 mb-1">{label}</label>
      {children}
    </div>
  );
}

export function ConfirmDeleteDialog({ open, onClose, onConfirm, title, isLoading }: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  isLoading?: boolean;
}) {
  if (!open) return null;
  return (
    <Dialog open onClose={onClose} title="Confirm Delete" size="sm">
      <p className="text-body text-sm">Are you sure you want to delete <strong>{title}</strong>? This action cannot be undone.</p>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button variant="danger" onClick={onConfirm} isLoading={isLoading}>Delete</Button>
      </DialogFooter>
    </Dialog>
  );
}
