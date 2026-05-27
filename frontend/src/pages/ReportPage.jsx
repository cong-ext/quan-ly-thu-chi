import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import api from '../api';

const fmt  = (n) => Number(n).toLocaleString('vi-VN') + 'đ';
const fmtS = (n) => {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'tỷ';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'tr';
  if (n >= 1e3) return (n / 1e3).toFixed(0) + 'k';
  return Number(n).toLocaleString();
};

const PERIODS = [
  { key: 'today', label: 'Hôm nay' },
  { key: 'week',  label: '7 ngày'  },
  { key: 'month', label: 'Tháng'   },
];

const CATS = {
  'phat-trien': { label: 'Phát triển bản thân', hint: 'Sách, khóa học...' },
  'sinh-hoat':  { label: 'Sinh hoạt hàng ngày', hint: 'Xăng, gạo, đồ dùng...' },
  'tieu-dung':  { label: 'Tiêu dùng chung',     hint: 'Chi tiêu khác' },
};
const CAT_COLORS = ['#0a0a0a', '#737373', '#d4d4d4'];

export default function ReportPage() {
  const [period, setPeriod] = useState('month');
  const [data,   setData]   = useState(null);
  const [loading,setLoading]= useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/transactions/report?period=${period}`)
      .then(({ data }) => setData(data))
      .finally(() => setLoading(false));
  }, [period]);

  const thu     = data?.summary?.total_thu || 0;
  const chi     = data?.summary?.total_chi || 0;
  const balance = thu - chi;

  const pieData = [
    { name: 'Thu', value: thu },
    { name: 'Chi', value: chi },
  ].filter(d => d.value > 0);

  const barData = (() => {
    if (!data?.byDay) return [];
    const map = {};
    data.byDay.forEach(({ date, type, total }) => {
      if (!map[date]) map[date] = { date, thu: 0, chi: 0 };
      map[date][type] = total;
    });
    return Object.values(map).map(d => ({ ...d, label: d.date.slice(5) }));
  })();

  const catData = (() => {
    const raw = data?.byCategory || [];
    const map = {};
    raw.forEach(({ category, total, count }) => { map[category] = { total, count }; });
    return Object.entries(CATS).map(([key, meta], i) => ({
      key, ...meta,
      total: map[key]?.total || 0,
      count: map[key]?.count || 0,
      color: CAT_COLORS[i],
    }));
  })();

  const totalChi = catData.reduce((s, c) => s + c.total, 0);

  return (
    <div className="pb-28 px-4 pt-5">

      {/* Period filter */}
      <div className="flex bg-white rounded-2xl p-1 shadow-sm mb-5">
        {PERIODS.map(p => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              period === p.key ? 'bg-black text-white shadow-sm' : 'text-neutral-400 hover:text-neutral-600'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-neutral-300 py-16 text-sm">Đang tải...</div>
      ) : (
        <>
          {/* Balance hero */}
          <div className="bg-black rounded-2xl p-5 mb-4 shadow-sm">
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">Số dư</p>
            <p className="text-4xl font-bold text-white tracking-tight">
              {balance < 0 ? '−' : ''}{fmt(Math.abs(balance))}
            </p>
            <p className="text-xs text-neutral-500 mt-2">{data?.summary?.total_count || 0} giao dịch</p>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white rounded-2xl shadow-sm p-4">
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Tổng Thu</p>
              <p className="text-2xl font-bold text-black">{fmtS(thu)}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-4">
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Tổng Chi</p>
              <p className="text-2xl font-bold text-black">{fmtS(chi)}</p>
            </div>
          </div>

          {/* Chi theo danh mục */}
          <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-4">Chi theo danh mục</p>
            {totalChi === 0 ? (
              <p className="text-sm text-neutral-300 text-center py-4">Chưa có khoản chi nào</p>
            ) : (
              <div className="space-y-5">
                {catData.map((cat) => {
                  const pct = totalChi > 0 ? (cat.total / totalChi) * 100 : 0;
                  return (
                    <div key={cat.key}>
                      <div className="flex items-start justify-between mb-1.5">
                        <div>
                          <p className="text-sm font-semibold text-[#0a0a0a]">{cat.label}</p>
                          <p className="text-xs text-neutral-400">{cat.hint}</p>
                        </div>
                        <div className="text-right ml-3 flex-shrink-0">
                          <p className="text-sm font-bold text-black">{fmtS(cat.total)}</p>
                          <p className="text-xs text-neutral-400">{pct.toFixed(0)}%</p>
                        </div>
                      </div>
                      <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, backgroundColor: cat.color }}
                        />
                      </div>
                      <p className="text-[10px] text-neutral-300 mt-1">{cat.count} giao dịch</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pie chart */}
          {pieData.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">Tỷ lệ Thu / Chi</p>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={70} innerRadius={35} dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    <Cell fill="#0a0a0a" />
                    <Cell fill="#d4d4d4" />
                  </Pie>
                  <Tooltip formatter={(v) => fmt(v)} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Bar chart */}
          {barData.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-4">Thu chi theo ngày</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={barData} barCategoryGap="35%">
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#a3a3a3' }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={fmtS} tick={{ fontSize: 10, fill: '#a3a3a3' }} width={32} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v) => fmt(v)} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="thu" name="Thu" fill="#0a0a0a" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="chi" name="Chi" fill="#d4d4d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-3 justify-center">
                <span className="flex items-center gap-1.5 text-xs text-neutral-500 font-medium">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#0a0a0a] inline-block" /> Thu
                </span>
                <span className="flex items-center gap-1.5 text-xs text-neutral-500 font-medium">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#d4d4d4] inline-block" /> Chi
                </span>
              </div>
            </div>
          )}

          {pieData.length === 0 && (
            <div className="bg-white rounded-2xl shadow-sm py-12 text-center">
              <p className="text-3xl mb-2">📊</p>
              <p className="text-sm text-neutral-300 font-medium">Chưa có dữ liệu</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
