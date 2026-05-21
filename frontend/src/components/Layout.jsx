import { useState } from 'react';
import HomePage from '../pages/HomePage';
import ReportPage from '../pages/ReportPage';

export default function Layout({ user, onLogout }) {
  const [tab, setTab] = useState('home');

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto relative">
      <header className="bg-white border-b border-gray-200 px-4 pt-10 pb-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-lg text-black tracking-tight">Thu Chi</h1>
            <p className="text-gray-400 text-xs">{user.name || user.phone}</p>
          </div>
          <button
            onClick={onLogout}
            className="text-xs text-gray-400 hover:text-black border border-gray-200 hover:border-black px-3 py-1.5 transition-colors"
          >
            Đăng xuất
          </button>
        </div>
      </header>

      <main className="min-h-screen">
        {tab === 'home' ? <HomePage /> : <ReportPage />}
      </main>

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 flex z-10">
        <button
          onClick={() => setTab('home')}
          className={`flex-1 flex flex-col items-center py-3 gap-0.5 transition-colors ${
            tab === 'home' ? 'text-black' : 'text-gray-300 hover:text-gray-500'
          }`}
        >
          <span className="text-xl">◻</span>
          <span className="text-xs font-medium">Nhập liệu</span>
        </button>
        <button
          onClick={() => setTab('report')}
          className={`flex-1 flex flex-col items-center py-3 gap-0.5 transition-colors ${
            tab === 'report' ? 'text-black' : 'text-gray-300 hover:text-gray-500'
          }`}
        >
          <span className="text-xl">◈</span>
          <span className="text-xs font-medium">Báo cáo</span>
        </button>
      </nav>
    </div>
  );
}
