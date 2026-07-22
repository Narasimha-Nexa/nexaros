'use client';

export function PreviewTab({ draft }: any) {
  return (
    <div className="space-y-3">
      <p className="text-body">This is a quick themed preview. Use "Open Live Site" for the full customer experience. Changes are pushed live instantly after Publish via real-time sync.</p>
      <pre className="text-xs bg-canvas border border-ink/10 rounded-lg p-3 overflow-auto max-h-64">
        {JSON.stringify({ restaurantName: draft.restaurantName, primaryColor: draft.primaryColor, features: draft.features, homeSections: draft.homeSections }, null, 2)}
      </pre>
    </div>
  );
}
