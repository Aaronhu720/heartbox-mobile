import { Link } from 'react-router-dom';
import SafetyBanner from '@/components/SafetyBanner';

export default function LandingPage() {
  const features = [
    { icon: '✎', title: '情绪日记', desc: '记录每一天的心情变化，标签和评分让你更了解自己' },
    { icon: '♡', title: 'AI 陪伴', desc: '温柔的 AI 倾听者，随时陪你聊聊，不评判、不催促' },
    { icon: '✉', title: '延迟发送', desc: '写下想说的话，设定未来某天再决定是否发送' },
    { icon: '☎', title: '短信提醒', desc: '支持通过短信或邮件发送信件，灵活选择' },
    { icon: '⛨', title: '隐私保护', desc: '独立隐私密码，只有你自己能看到这些内容' },
    { icon: '☷', title: '情绪趋势', desc: '可视化你的恢复过程，看到自己正在慢慢好起来' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-sm border-b border-border safe-top">
        <div className="px-5 py-3 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-primary tracking-wide font-serif">Half日记</h1>
          <div className="flex gap-2">
            <Link
              to="/login"
              className="px-3 py-1.5 text-sm text-primary border border-primary rounded-lg"
            >
              登录
            </Link>
            <Link
              to="/register"
              className="px-3 py-1.5 text-sm bg-primary text-white rounded-lg"
            >
              注册
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center px-5">
        <div className="w-full pt-12 pb-8 flex flex-col items-center text-center">
          <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs rounded-full mb-4">
            你的私密情绪空间
          </span>
          <h2 className="text-3xl font-light text-foreground mb-3 leading-tight font-serif">
            给情绪一个<br />
            <span className="text-primary font-medium">安全的出口</span>
          </h2>
          <p className="text-base text-muted mb-8 leading-relaxed max-w-xs">
            写下来，但不冲动发出去。<br />
            Half日记是你的私人情绪空间。
          </p>
          <Link
            to="/register"
            className="px-7 py-2.5 bg-primary text-white rounded-xl text-base shadow-sm"
          >
            开始记录
          </Link>
        </div>

        <p className="text-muted text-sm font-serif mb-6">
          此刻的感受，值得被好好记录
        </p>

        <div className="grid grid-cols-2 gap-3 w-full mb-10">
          {features.map((f, i) => (
            <div key={i} className="bg-card rounded-xl p-4 border border-border text-left">
              <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-lg mb-3">
                {f.icon}
              </div>
              <h3 className="font-medium text-sm mb-1">{f.title}</h3>
              <p className="text-xs text-muted leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <SafetyBanner />
    </div>
  );
}
