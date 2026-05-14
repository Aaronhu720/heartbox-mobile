import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

const navItems = [
  { href: '/dashboard', label: '首页', icon: '◈' },
  { href: '/entry/new', label: '写日记', icon: '✎' },
  { href: '/calendar', label: '日历', icon: '▦' },
  { href: '/trends', label: '趋势', icon: '◠' },
  { href: '/letters', label: '信件', icon: '✉' },
  { href: '/ai', label: 'AI', icon: '♡' },
  { href: '/settings', label: '设置', icon: '⚙' },
];

export default function Navbar() {
  const location = useLocation();
  const { logout } = useAuth();

  return (
    <nav className="bg-card/90 backdrop-blur-sm border-b border-border px-4 py-2 sticky top-0 z-50 safe-top">
      <div className="flex items-center justify-between">
        <Link to="/dashboard" className="text-lg font-semibold text-primary tracking-wide font-serif">
          Half日记
        </Link>
        <button
          onClick={logout}
          className="text-xs text-muted hover:text-foreground px-2 py-1 rounded"
        >
          退出
        </button>
      </div>

      {/* Mobile bottom-style horizontal scroll nav */}
      <div className="flex items-center gap-1 mt-1.5 overflow-x-auto pb-0.5 -mx-1 px-1">
        {navItems.map(item => (
          <Link
            key={item.href}
            to={item.href}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors ${
              location.pathname === item.href || location.pathname.startsWith(item.href + '/')
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-muted active:text-foreground'
            }`}
          >
            <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] ${
              location.pathname === item.href || location.pathname.startsWith(item.href + '/')
                ? 'bg-primary/15 text-primary'
                : 'bg-border/50 text-muted'
            }`}>
              {item.icon}
            </span>
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
