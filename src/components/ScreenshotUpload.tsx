import { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { uploadPrivateMedia } from '@/lib/media';
import { MediaImage } from './MediaPreview';

interface ScreenshotUploadProps {
  onUpload: (url: string) => void;
  existingUrl?: string | null;
  label?: string;
}

export function ScreenshotUpload({ onUpload, existingUrl, label }: ScreenshotUploadProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(existingUrl || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    if (!file.type.startsWith('image/')) { setError('Choose an image file.'); return; }
    if (file.size > 15 * 1024 * 1024) { setError('Images must be 15 MB or smaller.'); return; }
    setUploading(true);
    try {
      const ref = await uploadPrivateMedia(file, 'image');
      setImageUrl(ref);
      onUpload(ref);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Failed to upload screenshot. Please try again.');
    } finally { setUploading(false); }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) handleFile(file);
  };

  const removeImage = () => {
    setImageUrl(null);
    onUpload('');
    if (inputRef.current) inputRef.current.value = '';
  };

  if (imageUrl) {
    return (
      <div className="relative group rounded-xl overflow-hidden border border-themed">
        <MediaImage source={imageUrl} alt="Trade screenshot" className="w-full max-h-64 object-contain bg-secondary" />
        <button
          type="button"
          onClick={removeImage}
          className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="flex flex-col items-center justify-center gap-2 p-8 rounded-xl border-2 border-dashed border-themed cursor-pointer hover:border-brand-500 transition-colors"
      >
        {uploading ? (
          <Loader2 size={24} className="animate-spin text-muted" />
        ) : (
          <>
            <ImageIcon size={24} className="text-muted" />
            <p className="text-sm text-secondary">{label || 'Click or drag to upload a screenshot'}</p>
            <p className="text-xs text-muted">Private to your account · PNG, JPG, WebP · up to 15 MB</p>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      {error && <p className="mt-2 text-xs text-error-500">{error}</p>}
    </div>
  );
}
