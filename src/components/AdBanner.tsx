import { Link } from 'react-router-dom';
import { isMember } from '@/lib/membership';

interface AdBannerProps {
  slot: 'dashboard' | 'diary-list';
}

export default function AdBanner({ slot }: AdBannerProps) {
  const showMemberAd = !isMember();

  return (
    <div className="space-y-3">
      {/* 会员推广（非会员可见） */}
      {showMemberAd && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="relative bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3 flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs text-amber-800 font-medium">
                {slot === 'dashboard' ? '升级会员，解锁全部功能' : '开通会员，去除广告'}
              </p>
              <p className="text-[10px] text-amber-600 mt-0.5">
                AI陪伴 · 情绪趋势 · 数据导出 · 无广告
              </p>
            </div>
            <Link
              to="/membership"
              className="px-3 py-1.5 bg-amber-500 text-white text-xs rounded-lg flex-shrink-0"
            >
              了解更多
            </Link>
          </div>
        </div>
      )}

      {/* 趣味功能入口（所有用户可见） */}
      <div className="grid grid-cols-2 gap-3">
        {/* 塔罗牌 */}
        <Link
          to="/tarot"
          className="bg-card border border-border rounded-xl p-4 active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-xl">
              🔮
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium font-serif">塔罗牌</p>
              <p className="text-[10px] text-muted mt-0.5">¥9.9/次</p>
            </div>
          </div>
        </Link>

        {/* 姓名配对 */}
        <Link
          to="/name-test"
          className="bg-card border border-border rounded-xl p-4 active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center text-xl">
              💕
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium font-serif">姓名配对</p>
              <p className="text-[10px] text-muted mt-0.5">¥9.9/次</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
