import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { getTrends, type TrendData } from '@/lib/db';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { isMember } from '@/lib/membership';
import PaywallModal from '@/components/PaywallModal';

export default function TrendsPage() {
  const { userId } = useAuth();
  const [period, setPeriod] = useState(30);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [summary, setSummary] = useState<{ totalEntries: number; totalWantsContact: number; avgScore: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !isMember()) return;
    setLoading(true);
    getTrends(userId, period).then(data => {
      setTrends(data.trends);
      setSummary(data.summary);
      setLoading(false);
    });
  }, [userId, period]);

  if (!isMember()) {
    return <PaywallModal feature="情绪趋势" onClose={() => window.history.back()} />;
  }

  return (
    <div className="max-w-lg mx-auto pb-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-semibold font-serif">情绪趋势</h1>
        <div className="flex gap-1.5">
          {[{ days: 7, label: '7天' }, { days: 30, label: '30天' }, { days: 90, label: '90天' }].map(opt => (
            <button key={opt.days} onClick={() => setPeriod(opt.days)}
              className={`px-2.5 py-1 rounded-lg text-xs ${period === opt.days ? 'bg-primary text-white' : 'bg-card border border-border text-muted'}`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-muted text-sm">加载中...</div>
      ) : trends.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-muted text-sm mb-2">还没有足够的数据</p>
          <p className="text-xs text-muted">开始记录日记后，这里会显示你的情绪变化趋势</p>
        </div>
      ) : (
        <div className="space-y-5">
          {summary && (
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-card rounded-xl border border-border p-3 text-center">
                <p className="text-xl font-semibold text-primary">{summary.totalEntries}</p>
                <p className="text-[10px] text-muted mt-0.5">记录总数</p>
              </div>
              <div className="bg-card rounded-xl border border-border p-3 text-center">
                <p className="text-xl font-semibold text-primary">{summary.avgScore}</p>
                <p className="text-[10px] text-muted mt-0.5">平均情绪分</p>
              </div>
              <div className="bg-card rounded-xl border border-border p-3 text-center">
                <p className="text-xl font-semibold text-primary">{summary.totalWantsContact}</p>
                <p className="text-[10px] text-muted mt-0.5">想联系对方</p>
              </div>
            </div>
          )}

          <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="font-medium text-sm mb-3 font-serif">情绪评分变化</h3>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8E0D8" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis domain={[1, 10]} tick={{ fontSize: 10 }} />
                  <Tooltip labelFormatter={(label) => `日期: ${label}`} formatter={(value) => [`${value} 分`, '情绪评分']} />
                  <Line type="monotone" dataKey="avgScore" stroke="#8B5E5A" strokeWidth={2} dot={{ fill: '#8B5E5A', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="font-medium text-sm mb-3 font-serif">"想联系对方" 次数</h3>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8E0D8" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                  <Tooltip labelFormatter={(label) => `日期: ${label}`} formatter={(value) => [`${value} 次`, '想联系对方']} />
                  <Bar dataKey="wantsContact" fill="#D4C5B9" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[10px] text-muted mt-2 text-center">如果这个数字在慢慢减少，说明你正在恢复</p>
          </div>
        </div>
      )}
    </div>
  );
}
