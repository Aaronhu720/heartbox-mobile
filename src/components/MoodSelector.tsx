import { MOOD_TAGS } from '@/lib/safety';

interface Props {
  selectedTag: string;
  moodScore: number;
  onTagChange: (tag: string) => void;
  onScoreChange: (score: number) => void;
}

export default function MoodSelector({ selectedTag, moodScore, onTagChange, onScoreChange }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">今天的情绪</label>
        <div className="flex flex-wrap gap-2">
          {MOOD_TAGS.map(tag => (
            <button
              key={tag.value}
              type="button"
              onClick={() => onTagChange(tag.value)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all border-2 ${
                selectedTag === tag.value
                  ? 'font-medium'
                  : 'border-transparent bg-gray-50 text-muted'
              }`}
              style={selectedTag === tag.value ? {
                backgroundColor: tag.bg,
                color: tag.color,
                borderColor: tag.color + '60',
              } : undefined}
            >
              <span>{tag.emoji}</span>
              {tag.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          情绪评分：<span className="text-primary">{moodScore}</span>/10
        </label>
        <input
          type="range"
          min="1"
          max="10"
          value={moodScore}
          onChange={(e) => onScoreChange(parseInt(e.target.value))}
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-xs text-muted mt-1">
          <span>很差</span>
          <span>很好</span>
        </div>
      </div>
    </div>
  );
}
