import { useState } from 'react';
import HomePage from '../pages/HomePage';
import ReportPage from '../pages/ReportPage';
import AdminPage from '../pages/AdminPage';

const NAV = [
  { key: 'home',   label: 'Nhập liệu', icon: (active) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="4"/>
      <line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
    </svg>
  )},
  { key: 'report', label: 'Báo cáo', icon: (active) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  )},
];

const ADMIN_NAV = { key: 'admin', label: 'Quản trị', icon: (active) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
  </svg>
)};

export default function Layout({ user, onLogout }) {
  const [tab, setTab] = useState('home');
  const tabs = user.is_admin === 1 ? [...NAV, ADMIN_NAV] : NAV;

  return (
    <div className="min-h-screen bg-[#f5f5f5] max-w-md mx-auto relative">

      {/* Header */}
      <header className="bg-white px-5 pt-12 pb-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-black rounded-xl flex items-center justify-center">
              <span className="text-white text-xs font-bold">₫</span>
            </div>
            <div>
              <h1 className="font-bold text-base text-[#0a0a0a] leading-tight">Thu Chi</h1>
              <p className="text-neutral-400 text-xs leading-tight">{user.name || user.phone}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="text-xs font-medium text-neutral-400 hover:text-black bg-neutral-100 hover:bg-neutral-200 px-3 py-1.5 rounded-lg transition-all"
          >
            Đăng xuất
          </button>
        </div>
      </header>

      {/* Content */}
      <main>
        {tab === 'home'   && <HomePage />}
        {tab === 'report' && <ReportPage />}
        {tab === 'admin'  && <AdminPage user={user} />}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white shadow-[0_-1px_0_#e5e5e5] flex z-10 pb-safe">
        {tabs.map(({ key, label, icon }) => {
          const active = tab === key;
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-all ${
                active ? 'text-black' : 'text-neutral-300 hover:text-neutral-500'
              }`}
            >
              {icon(active)}
              <span className={`text-[10px] font-semibold tracking-wide ${active ? 'text-black' : 'text-neutral-300'}`}>
                {label}
              </span>
            </button>
          );
        })}
      </nav>

    </div>
  );
}
