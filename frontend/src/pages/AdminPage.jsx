import { useState, useEffect } from 'react';
import api from '../api';

const fmtS = (n) => {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'tỷ';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'tr';
  if (n >= 1e3) return (n / 1e3).toFixed(0) + 'k';
  return Number(n).toLocaleString('vi-VN');
};
const fmtDate = (str) => {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export default function AdminPage({ user }) {
  const [stats,   setStats]   = useState(null);
  const [users,   setUsers]   = useState([]);
  const [total,   setTotal]   = useState(0);
  const [search,  setSearch]  = useState('');
  const [loading, setLoading] = useState(true);
  const [toast,   setToast]   = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); };
  const fetchStats = () => api.get('/admin/stats').then(({ data }) => setStats(data));
  const fetchUsers = (q = '') =>
    api.get(`/admin/users?search=${encodeURIComponent(q)}&limit=50`)
      .then(({ data }) => { setUsers(data.users); setTotal(data.total); });

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchStats(), fetchUsers()]).finally(() => setLoading(false));
  }, []);

  const handleSearch = (e) => { setSearch(e.target.value); fetchUsers(e.target.value); };

  const toggleAdmin = async (u) => {
    if (!window.confirm(u.is_admin ? `Thu hồi quyền admin của ${u.name || u.phone}?` : `Cấp quyền admin cho ${u.name || u.phone}?`)) return;
    await api.patch(`/admin/users/${u.id}/admin`, { is_admin: !u.is_admin });
    showToast('Đã cập nhật quyền');
    fetchUsers(search);
  };

  const deleteUser = async (u) => {
    if (!window.confirm(`Xóa tài khoản "${u.name || u.phone}"?\nToàn bộ giao dịch cũng sẽ bị xóa.`)) return;
    try {
      await api.delete(`/admin/users/${u.id}`);
      showToast('Đã xóa người dùng');
      fetchStats(); fetchUsers(search);
    } catch (err) { showToast(err.response?.data?.message || 'Xóa thất bại'); }
  };

  return (
    <div className="pb-28 px-4 pt-5">
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-3 bg-black rounded-2xl text-white text-sm font-semibold shadow-xl">
          {toast}
        </div>
      )}

      <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-4">Quản trị hệ thống</p>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 mb-5">
          {[
            { label: 'Người dùng', value: stats.total_users, sub: `+${stats.new_today} hôm nay` },
            { label: 'Giao dịch',  value: Number(stats.total_transactions).toLocaleString(), sub: 'Toàn hệ thống' },
            { label: 'Tổng Thu',   value: fmtS(stats.total_thu), sub: null },
            { label: 'Tổng Chi',   value: fmtS(stats.total_chi), sub: null },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm p-4">
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">{s.label}</p>
              <p className="text-2xl font-bold text-black">{s.value}</p>
              {s.sub && <p className="text-xs text-neutral-300 mt-1">{s.sub}</p>}
            </div>
          ))}
        </div>
      )}

      {/* User list */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 pt-5 pb-4 flex items-center justify-between gap-3 border-b border-neutral-50">
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex-shrink-0">
            Người dùng ({total})
          </p>
          <input
            type="text"
            placeholder="Tìm tên, SĐT..."
            value={search}
            onChange={handleSearch}
            className="bg-neutral-50 rounded-xl px-3 py-2 text-xs placeholder-neutral-300 focus:outline-none focus:ring-2 focus:ring-black/10 w-full max-w-[180px] transition"
          />
        </div>

        {loading ? (
          <p className="text-center text-neutral-300 text-sm py-10">Đang tải...</p>
        ) : users.length === 0 ? (
          <p className="text-center text-neutral-300 text-sm py-10">Không có người dùng</p>
        ) : (
          <div className="divide-y divide-neutral-50">
            {users.map((u) => (
              <div key={u.id} className="px-5 py-4 flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
                  u.is_admin ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-400'
                }`}>
                  {u.is_admin ? 'A' : u.name?.[0]?.toUpperCase() || '#'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-[#0a0a0a] text-sm">{u.name || '(Chưa đặt tên)'}</p>
                    {u.is_admin === 1 && (
                      <span className="text-[10px] font-bold bg-black text-white px-1.5 py-0.5 rounded-md">ADMIN</span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-400 mt-0.5">{u.phone}</p>
                  <div className="flex gap-2 mt-1.5 flex-wrap">
                    {[
                      `Đăng ký ${fmtDate(u.created_at)}`,
                      `${u.total_tx} GD`,
                      `Thu ${fmtS(u.total_thu)}`,
                      `Chi ${fmtS(u.total_chi)}`,
                    ].map((tag, i) => (
                      <span key={i} className="text-[10px] font-medium text-neutral-400 bg-neutral-50 px-2 py-0.5 rounded-md">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                {u.id !== user.id && (
                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => toggleAdmin(u)}
                      className="text-[11px] font-semibold bg-neutral-100 hover:bg-neutral-200 text-neutral-500 hover:text-black px-3 py-1.5 rounded-lg transition-all"
                    >
                      {u.is_admin ? 'Thu hồi' : 'Admin'}
                    </button>
                    <button
                      onClick={() => deleteUser(u)}
                      className="text-[11px] font-semibold bg-neutral-100 hover:bg-red-50 text-neutral-400 hover:text-red-500 px-3 py-1.5 rounded-lg transition-all"
                    >
                      Xóa
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
