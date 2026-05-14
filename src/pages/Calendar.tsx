import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { getEntries, type DiaryEntry } from '@/lib/db';
import { MOOD_TAGS } from '@/lib/safety';

export default function CalendarPage() {
  const { userId } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    getEntries(userId, { month: monthStr, limit: 50 }).then(({ entries: e }) => {
      setEntries(e);
      setLoading(false);
    });
  }, [userId, monthStr]);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const entryMap: Record<number, DiaryEntry> = {};
  entries.forEach(e => {
    const day = new Date(e.createdAt).getDate();
    entryMap[day] = e;
  });

  const getMoodColor = (tag: string) => MOOD_TAGS.find(t => t.value === tag)?.color || '#E8E0D8';
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  return (
    <div className="max-w-lg mx-auto pb-6">
      <h1 className="text-xl font-semibold mb-5 font-serif">情绪日历</h1>

      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="text-muted px-3 py-1">←</button>
          <h2 className="text-base font-medium font-serif">{year}年{month + 1}月</h2>
          <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="text-muted px-3 py-1">→</button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {['日', '一', '二', '三', '四', '五', '六'].map(d => (
            <div key={d} className="text-center text-[10px] text-muted py-1">{d}</div>
          ))}
        </div>

        {loading ? (
          <div className="py-8 text-center text-muted text-sm">加载中...</div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`e-${i}`} className="aspect-square" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const entry = entryMap[day];
              const isToday = isCurrentMonth && today.getDate() === day;

              return (
                <div key={day} className="aspect-square relative">
                  {entry ? (
                    <Link
                      to={`/entry/${entry.id}`}
                      className="w-full h-full rounded-lg flex flex-col items-center justify-center text-xs"
                      style={{ backgroundColor: getMoodColor(entry.moodTag) + '30' }}
                    >
                      <span className="font-medium" style={{ color: getMoodColor(entry.moodTag) }}>{day}</span>
                      <span className="text-[9px]" style={{ color: getMoodColor(entry.moodTag) }}>{entry.moodScore}</span>
                      <div className="w-1.5 h-1.5 rounded-full mt-0.5" style={{ backgroundColor: getMoodColor(entry.moodTag) }} />
                    </Link>
                  ) : (
                    <div className={`w-full h-full rounded-lg flex items-center justify-center text-xs ${isToday ? 'ring-2 ring-primary' : ''}`}>
                      <span className={isToday ? 'text-primary font-medium' : 'text-muted'}>{day}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-4 grid grid-cols-4 gap-2">
          {MOOD_TAGS.map(tag => (
            <div key={tag.value} className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg" style={{ backgroundColor: tag.color + '15' }}>
              <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: tag.color }} />
              <span className="text-xs" style={{ color: tag.color }}>{tag.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
