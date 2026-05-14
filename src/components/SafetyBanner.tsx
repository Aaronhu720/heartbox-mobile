import { SAFETY_MESSAGE } from '@/lib/safety';

export default function SafetyBanner() {
  return (
    <div className="bg-secondary/50 border-t border-border px-4 py-3 text-center safe-bottom">
      <p className="text-xs text-muted leading-relaxed">{SAFETY_MESSAGE}</p>
    </div>
  );
}
