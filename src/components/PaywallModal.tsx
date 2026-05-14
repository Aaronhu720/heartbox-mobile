import { Link } from 'react-router-dom';

interface PaywallModalProps {
  feature: string;
  onClose: () => void;
}

export default function PaywallModal({ feature, onClose }: PaywallModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6" onClick={onClose}>
      <div className="bg-card rounded-2xl p-6 max-w-sm w-full space-y-4" onClick={e => e.stopPropagation()}>
        <div className="text-center">
          <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">✦</span>
          </div>
          <h3 className="text-lg font-semibold font-serif">升级会员</h3>
          <p className="text-sm text-muted mt-1">
            「{feature}」是会员专属功能
          </p>
        </div>

        <div className="bg-background rounded-xl p-3 space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-primary">♡</span> AI 陪伴对话
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-primary">◠</span> 情绪趋势图表
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-primary">↓</span> 数据导出
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-primary">✦</span> 去除广告
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs text-muted">
            低至 <span className="text-primary font-semibold">¥{(199 / 12).toFixed(1)}/月</span>（年付）
          </p>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm">
            稍后再说
          </button>
          <Link
            to="/membership"
            className="flex-1 px-4 py-2.5 bg-primary text-white rounded-xl text-sm text-center"
            onClick={onClose}
          >
            查看方案
          </Link>
        </div>
      </div>
    </div>
  );
}
