import { useState } from 'react';
import { Mic, X } from 'lucide-react';
import type { Trade } from '@/lib/types';
import { MediaAudioPlayer, MediaImage } from './MediaPreview';

type TradeMedia = Pick<
  Trade,
  'screenshot_url' | 'voice_note_url' | 'entry_screenshot_url' |
  'entry_voice_note_url' | 'closure_screenshot_url' | 'closure_voice_note_url'
>;

function uniqueSources(items: Array<[string, string | null | undefined]>) {
  const seen = new Set<string>();
  return items.flatMap(([label, source]) => {
    if (!source || seen.has(source)) return [];
    seen.add(source);
    return [{ label, source }];
  });
}

export function TradeAttachments({ trade }: { trade: TradeMedia }) {
  const [preview, setPreview] = useState<{ label: string; source: string } | null>(null);
  const images = uniqueSources([
    ['Trade screenshot', trade.screenshot_url],
    ['Entry screenshot', trade.entry_screenshot_url],
    ['Closure screenshot', trade.closure_screenshot_url],
  ]);
  const recordings = uniqueSources([
    ['Trade voice note', trade.voice_note_url],
    ['Entry voice note', trade.entry_voice_note_url],
    ['Closure voice note', trade.closure_voice_note_url],
  ]);

  if (!images.length && !recordings.length) return null;

  return (
    <div className="space-y-3">
      {images.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {images.map(image => (
            <div key={image.source} className="space-y-1.5">
              <p className="text-xs font-medium text-secondary">{image.label}</p>
              <MediaImage
                source={image.source}
                alt={image.label}
                className="w-full max-h-64 object-contain rounded-lg border border-themed bg-secondary cursor-zoom-in"
                onClick={() => setPreview(image)}
              />
            </div>
          ))}
        </div>
      )}
      {recordings.map(recording => (
        <div key={recording.source} className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-secondary">
            <Mic size={14} /> {recording.label}
          </span>
          <MediaAudioPlayer source={recording.source} className="h-8 max-w-full" />
        </div>
      ))}
      {preview && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={preview.label}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setPreview(null)}
          onKeyDown={event => {
            if (event.key === 'Escape') setPreview(null);
          }}
        >
          <button
            type="button"
            aria-label="Close image preview"
            className="absolute right-4 top-4 rounded-full bg-black/60 p-2 text-white hover:bg-black"
            onClick={() => setPreview(null)}
          >
            <X size={22} />
          </button>
          <MediaImage
            source={preview.source}
            alt={preview.label}
            className="max-h-[90vh] max-w-full object-contain"
          />
        </div>
      )}
    </div>
  );
}
