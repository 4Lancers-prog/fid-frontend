import { Loader2 } from 'lucide-react';

export function Spinner({ className = '' }: { className?: string }) {
  return <Loader2 className={`animate-spin ${className}`} aria-hidden />;
}

export function FullPageLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex h-full min-h-[50vh] w-full items-center justify-center gap-3 text-slate-500">
      <Spinner className="h-5 w-5" />
      <span>{label}</span>
    </div>
  );
}
