import { useState, useEffect } from 'react';
import api from '../api';

const formatMoney = (n) => Number(n).toLocaleString('vi-VN') + 'đ';
const formatShort = (n) => {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'tỷ';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'tr';
  if (n >= 1e3) return (n / 1e3).toFixed(0) + 'k';
  return Number(n).toLocaleString('vi-VN');
};
const formatDate = (str) => {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
};

export default function AdminPage({ user }) {
  const [stats, setStats]   = useState(null);
  const [users, setUsers]   = useState([]);
  const [total, setTotal]   = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast]   = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const fetchStats = () =>
    api.get('/admin/stats').then(({ data }) => setStats(data));

  const fetchUsers = (q = '') =>
    api.get(`/admin/users?search=${encodeURIComponent(q)}&limit=50`)
      .then(({ data }) => { setUsers(data.users); setTotal(data.total); });

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchStats(), fetchUsers()])
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = (e) => {
    const q = e.target.value;
    setSearch(q);
    fetchUsers(q);
  };

  const toggleAdmin = async (u) => {
    const msg = u.is_admin
      ? `Thu hồi quyền admin của ${u.name || u.phone}?`
      : `Cấp quyền admin cho ${u.name || u.phone}?`;
    if (!window.confirm(msg)) return;
    await api.patch(`/admin/users/${u.id}/admin`, { is_admin: !u.is_admin });
    showToast('Đã cập nhật quyền');
    fetchUsers(search);
  };

  return (
    <div className="pb-8 px-4 pt-4">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 bg-black text-white text-sm font-medium shadow-lg">
          {toast}
        </div>
      )}

      <p className="text-xs text-gray-400 uppercase tracking-widest mb-4">Quản trị hệ thống</p>

      {/* Thống kê tổng quan */}
      {stats && (
        <div className="grid grid-cols-2 gap-2 mb-5">
          <div className="bg-white border border-gray-200 p-4">
            <p className="text-xs text-gray-400 mb-1">Người dùng</p>
            <p className="text-2xl font-bold text-black">{stats.total_users}</p>
            <p className="text-xs text-gray-300 mt-1">+{stats.new_today} hôm nay</p>
          </div>
          <div className="bg-white border border-gray-200 p-4">
            <p className="text-xs text-gray-400 mb-1">Giao dịch</p>
            <p className="text-2xl font-bold text-black">{Number(stats.total_transactions).toLocaleString()}</p>
            <p className="text-xs text-gray-300 mt-1">Tổng toàn hệ thống</p>
          </div>
          <div className="bg-white border border-gray-200 p-4">
            <p className="text-xs text-gray-400 mb-1">Tổng Thu</p>
            <p className="text-xl font-bold text-black">{formatShort(stats.total_thu)}</p>
          </div>
          <div className="bg-white border border-gray-200 p-4">
            <p className="text-xs text-gray-400 mb-1">Tổng Chi</p>
            <p className="text-xl font-bold text-black">{formatShort(stats.total_chi)}</p>
          </div>
        </div>
      )}

      {/* Danh sách người dùng */}
      <div className="bg-white border border-gray-200">
        <div className="px-4 pt-4 pb-3 border-b border-gray-100 flex items-center justify-between gap-3">
          <p className="text-xs text-gray-400 uppercase tracking-widest flex-shrink-0">
            Người dùng ({total})
          </p>
          <input
            type="text"
            placeholder="Tìm theo tên, SĐT..."
            value={search}
            onChange={handleSearch}
            className="border border-gray-200 px-3 py-1.5 text-sm text-black placeholder-gray-300 focus:outline-none focus:border-black w-full max-w-xs"
          />
        </div>

        {loading ? (
          <p className="text-center text-gray-300 text-sm py-8">Đang tải...</p>
        ) : users.length === 0 ? (
          <p className="text-center text-gray-300 text-sm py-8">Không có người dùng nào</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {users.map((u) => (
              <div key={u.id} className="px-4 py-3 flex items-start gap-3">
                <div className="w-8 h-8 border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-400 flex-shrink-0 mt-0.5">
                  {u.is_admin ? 'A' : u.id}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-black text-sm">{u.name || '(Chưa đặt tên)'}</p>
                    {u.is_admin === 1 && (
                      <span className="text-xs border border-black px-1 py-0.5 font-medium">ADMIN</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{u.phone}</p>
                  <div className="flex gap-3 mt-1 text-xs text-gray-400 flex-wrap">
                    <span>Đăng ký: {formatDate(u.created_at)}</span>
                    <span>{u.total_tx} giao dịch</span>
                    <span>Thu: {formatShort(u.total_thu)}</span>
                    <span>Chi: {formatShort(u.total_chi)}</span>
                  </div>
                </div>
                {u.id !== user.id && (
                  <button
                    onClick={() => toggleAdmin(u)}
                    className="text-xs border border-gray-200 hover:border-black px-2 py-1 text-gray-400 hover:text-black transition-colors flex-shrink-0"
                  >
                    {u.is_admin ? 'Thu hồi' : 'Cấp admin'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
