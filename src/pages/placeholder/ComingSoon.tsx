import { Construction } from 'lucide-react';

export function ComingSoon({ title }: { title: string }) {
  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-slate-800">{title}</h1>
      <p className="mb-6 text-sm text-slate-500">This module is part of the approved roadmap.</p>
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
        <Construction className="mb-3 h-12 w-12 text-amber-400" />
        <h2 className="text-base font-semibold text-slate-700">Coming in a later phase</h2>
        <p className="mt-1 max-w-md text-sm text-slate-500">
          The data model, API contracts and UI shell are scaffolded. This screen will be implemented in a subsequent
          milestone following the PRD development phases.
        </p>
      </div>
    </div>
  );
}
