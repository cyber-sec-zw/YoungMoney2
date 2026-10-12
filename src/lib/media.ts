import { supabase } from '@/lib/supabase';

const REF_PREFIX = 'private-media://';

export function privateMediaRef(bucket: string, path: string): string {
  return `${REF_PREFIX}${bucket}/${path}`;
}

export function parsePrivateMediaRef(value: string): { bucket: string; path: string } | null {
  if (!value.startsWith(REF_PREFIX)) return null;
  const remainder = value.slice(REF_PREFIX.length);
  const slash = remainder.indexOf('/');
  if (slash < 1) return null;
  return { bucket: remainder.slice(0, slash), path: remainder.slice(slash + 1) };
}

export async function resolveMediaUrl(value: string): Promise<string> {
  const ref = parsePrivateMediaRef(value);
  if (!ref) return value;
  const { data, error } = await supabase.storage.from(ref.bucket).createSignedUrl(ref.path, 3600);
  if (error || !data?.signedUrl) throw error || new Error('Could not create media link');
  return data.signedUrl;
}

export async function uploadPrivateMedia(file: File | Blob, kind: 'image' | 'audio'): Promise<string> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) throw new Error('Sign in before uploading media.');
  const ext = file instanceof File ? file.name.split('.').pop() || (kind === 'image' ? 'png' : 'webm') : 'webm';
  const path = `${authData.user.id}/${crypto.randomUUID()}.${ext}`;
  const contentType = file.type || (kind === 'audio' ? 'audio/webm' : 'application/octet-stream');
  const { error } = await supabase.storage.from('trading-media').upload(path, file, { contentType, upsert: false });
  if (error) throw error;
  return privateMediaRef('trading-media', path);
}
