import { useEffect, useRef, useState } from 'react';
import { Mic, Square, Trash2, Play, Pause, Loader2 } from 'lucide-react';
import { resolveMediaUrl, uploadPrivateMedia } from '@/lib/media';

interface VoiceRecorderProps {
  onUpload: (url: string) => void;
  existingUrl?: string | null;
}

export function VoiceRecorder({ onUpload, existingUrl }: VoiceRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(existingUrl || null);
  const [playing, setPlaying] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    let active = true;
    if (!existingUrl) { setAudioUrl(null); return () => { active = false; }; }
    resolveMediaUrl(existingUrl).then(url => { if (active) setAudioUrl(url); }).catch(() => { if (active) setError('This voice note could not be loaded.'); });
    return () => { active = false; };
  }, [existingUrl]);

  const startRecording = async () => {
    setError(null);
    setAudioBlob(null);
    setAudioUrl(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        streamRef.current?.getTracks().forEach(t => t.stop());
        await uploadBlob(blob);
      };

      recorder.start();
      setRecording(true);
      setDuration(0);
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    } catch {
      setError('Microphone access denied. Please allow microphone permissions in your browser.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const uploadBlob = async (blob: Blob) => {
    setUploading(true);
    try {
      const ref = await uploadPrivateMedia(blob, 'audio');
      onUpload(ref);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Failed to upload voice note. Please try again.');
    } finally { setUploading(false); }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  };

  const deleteRecording = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
    onUpload('');
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (audioUrl && !recording) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary border border-themed">
        <button
          type="button"
          onClick={togglePlay}
          className="p-2 rounded-lg bg-brand-500 text-white hover:bg-brand-600 transition-colors"
        >
          {playing ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <span className="text-sm font-mono text-secondary flex-1">{formatTime(duration)}</span>
        {uploading && <Loader2 size={16} className="animate-spin text-muted" />}
        <button type="button" onClick={deleteRecording} className="p-2 rounded-lg text-error-500 hover:bg-error-500/10 transition-colors">
          <Trash2 size={16} />
        </button>
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setPlaying(false)}
          className="hidden"
        />
      </div>
    );
  }

  return (
    <div>
      {recording ? (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-error-500/10 border border-error-500/20">
          <span className="flex items-center gap-2 text-sm font-medium text-error-500">
            <span className="w-2.5 h-2.5 rounded-full bg-error-500 animate-pulse" />
            Recording... {formatTime(duration)}
          </span>
          <button type="button" onClick={stopRecording} className="ml-auto p-2 rounded-lg bg-error-500 text-white hover:bg-error-600 transition-colors">
            <Square size={16} />
          </button>
        </div>
      ) : (
        <button type="button" onClick={startRecording} className="btn-secondary w-full justify-center">
          <Mic size={18} />
          Record Voice Note
        </button>
      )}
      {error && <p className="mt-2 text-xs text-error-500">{error}</p>}
    </div>
  );
}
