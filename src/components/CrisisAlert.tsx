import { CRISIS_MESSAGE } from '@/lib/safety';

export default function CrisisAlert({ show, onClose }: { show: boolean; onClose: () => void }) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-card rounded-2xl p-6 max-w-md w-full shadow-xl">
        <div className="text-center mb-4">
          <div className="w-14 h-14 rounded-full bg-danger/10 text-danger flex items-center justify-center text-2xl mx-auto mb-3">
            ♡
          </div>
          <h3 className="text-lg font-semibold">我们在乎你</h3>
        </div>
        <p className="text-sm text-foreground whitespace-pre-line leading-relaxed mb-6">
          {CRISIS_MESSAGE}
        </p>
        <button
          onClick={onClose}
          className="w-full py-2.5 bg-primary text-white rounded-xl text-sm"
        >
          我知道了
        </button>
      </div>
    </div>
  );
}
