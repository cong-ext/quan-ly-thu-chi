import { useState } from 'react';
import api from '../api';

export default function AuthPage({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ phone: '', password: '', name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post(mode === 'login' ? '/auth/login' : '/auth/register', form);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      onLogin(data.user);
    } catch (err) {
      setError(err.response?.data?.message || 'Đã có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center px-5">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white text-2xl font-bold">₫</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0a0a0a] tracking-tight">Thu Chi</h1>
          <p className="text-sm text-neutral-400 mt-1">Quản lý tài chính cá nhân</p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-white rounded-2xl p-1 mb-6 shadow-sm">
          {['login', 'register'].map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                mode === m
                  ? 'bg-black text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-600'
              }`}
            >
              {m === 'login' ? 'Đăng nhập' : 'Đăng ký'}
            </button>
          ))}
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Họ tên</label>
              <input
                type="text"
                placeholder="Nguyễn Văn A"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-neutral-50 rounded-xl px-4 py-3 text-sm text-[#0a0a0a] placeholder-neutral-300 focus:outline-none focus:ring-2 focus:ring-black/10 transition"
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Số điện thoại</label>
            <input
              type="tel"
              placeholder="0912 345 678"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full bg-neutral-50 rounded-xl px-4 py-3 text-sm text-[#0a0a0a] placeholder-neutral-300 focus:outline-none focus:ring-2 focus:ring-black/10 transition"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Mật khẩu</label>
            <input
              type="password"
              placeholder="Tối thiểu 6 ký tự"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full bg-neutral-50 rounded-xl px-4 py-3 text-sm text-[#0a0a0a] placeholder-neutral-300 focus:outline-none focus:ring-2 focus:ring-black/10 transition"
              required
            />
          </div>

          {error && (
            <div className="bg-neutral-50 rounded-xl px-4 py-3 text-sm text-neutral-500">{error}</div>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-black hover:bg-neutral-800 active:bg-neutral-900 text-white font-semibold py-3.5 rounded-xl text-sm transition-all duration-200 disabled:opacity-40 mt-2 shadow-sm"
          >
            {loading ? 'Đang xử lý...' : mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
          </button>
        </div>

      </div>
    </div>
  );
}
