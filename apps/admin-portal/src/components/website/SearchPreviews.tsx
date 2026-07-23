'use client';
import React from 'react';

interface GoogleSearchPreviewProps {
  title: string;
  description: string;
  url: string;
}

export function GoogleSearchPreview({ title, description, url }: GoogleSearchPreviewProps) {
  const displayTitle = title || 'Your Restaurant Name';
  const displayDescription = description || 'Welcome to our restaurant. Discover our menu, make reservations, and enjoy delicious food.';
  const displayUrl = url || 'example.com';

  return (
    <div className="bg-white border border-ink/10 rounded-lg p-4">
      <h4 className="font-semibold text-ink mb-3">Google Search Preview</h4>
      <div className="font-sans text-sm">
        <div className="text-green-600 mb-1 truncate max-w-xs">{displayUrl}</div>
        <div className="text-blue-600 mb-1 truncate max-w-xs font-medium">{displayTitle}</div>
        <div className="text-gray-600 truncate max-w-xs line-clamp-2">{displayDescription}</div>
      </div>
      <div className="mt-3 pt-3 border-t border-ink/10 text-xs text-ink/50">
        <span className="text-green-600">{displayTitle.length}</span>/60 title ·{' '}
        <span className="text-green-600">{displayDescription.length}</span>/160 description
      </div>
    </div>
  );
}

interface SocialCardPreviewProps {
  title: string;
  description: string;
  image?: string;
  url: string;
}

export function SocialCardPreview({ title, description, image, url }: SocialCardPreviewProps) {
  const displayTitle = title || 'Your Restaurant Name';
  const displayDescription = description || 'Welcome to our restaurant. Discover our menu and enjoy delicious food.';
  const displayImage = image || 'https://via.placeholder.com/1200x630';
  const displayUrl = url || 'example.com';

  return (
    <div className="bg-white border border-ink/10 rounded-lg p-4">
      <h4 className="font-semibold text-ink mb-3">Social Card Preview (Twitter/Facebook/LinkedIn)</h4>
      <div className="bg-white border border-ink/10 rounded-lg overflow-hidden max-w-md">
        <div className="aspect-video bg-ink/5 relative overflow-hidden">
          {displayImage && (
            <img
              src={displayImage}
              alt={displayTitle}
              className="w-full h-full object-cover"
            />
          )}
        </div>
        <div className="p-3">
          <div className="text-ink/50 text-xs mb-1">{displayUrl}</div>
          <div className="font-semibold text-ink text-sm truncate">{displayTitle}</div>
          <div className="text-ink/60 text-sm line-clamp-2 mt-1">{displayDescription}</div>
        </div>
      </div>
    </div>
  );
}