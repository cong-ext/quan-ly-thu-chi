import { useState, useEffect } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import api from '../api';

const formatMoney = (n) => Number(n).toLocaleString('vi-VN') + 'đ';
const formatShort = (n) => {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'tỷ';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'tr';
  if (n >= 1e3) return (n / 1e3).toFixed(0) + 'k';
  return n;
};

const PERIODS = [
  { key: 'today', label: 'Hôm nay' },
  { key: 'week',  label: '7 ngày' },
  { key: 'month', label: 'Tháng này' },
];

const CATEGORIES = {
  'phat-trien': { label: 'Phát triển bản thân', hint: 'Sách, khóa học...' },
  'sinh-hoat':  { label: 'Sinh hoạt',           hint: 'Xăng, gạo, đồ dùng...' },
  'tieu-dung':  { label: 'Tiêu dùng',           hint: 'Chi tiêu khác' },
};

// Màu xám phân cấp cho từng danh mục
const CAT_SHADES = ['#000000', '#6b7280', '#d1d5db'];

export default function ReportPage() {
  const [period, setPeriod] = useState('month');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/transactions/report?period=${period}`)
      .then(({ data }) => setData(data))
      .finally(() => setLoading(false));
  }, [period]);

  const thu = data?.summary?.total_thu || 0;
  const chi = data?.summary?.total_chi || 0;
  const balance = thu - chi;

  const pieData = [
    { name: 'Thu', value: thu },
    { name: 'Chi', value: chi },
  ].filter((d) => d.value > 0);

  const barData = (() => {
    if (!data?.byDay) return [];
    const map = {};
    data.byDay.forEach(({ date, type, total }) => {
      if (!map[date]) map[date] = { date, thu: 0, chi: 0 };
      map[date][type] = total;
    });
    return Object.values(map).map((d) => ({ ...d, label: d.date.slice(5) }));
  })();

  // Dữ liệu chi theo danh mục — đảm bảo đủ 3 danh mục dù không có giao dịch
  const categoryData = (() => {
    const raw = data?.byCategory || [];
    const map = {};
    raw.forEach(({ category, total, count }) => { map[category] = { total, count }; });
    return Object.entries(CATEGORIES).map(([key, meta], i) => ({
      key,
      label: meta.label,
      hint: meta.hint,
      total: map[key]?.total || 0,
      count: map[key]?.count || 0,
      shade: CAT_SHADES[i],
    }));
  })();

  const totalChi = categoryData.reduce((s, c) => s + c.total, 0);

  return (
    <div className="pb-24 px-4 pt-4">
      {/* Bộ lọc thời gian */}
      <div className="flex border border-gray-200 mb-5">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              period === p.key
                ? 'bg-black text-white'
                : 'bg-white text-gray-400 hover:text-black'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-gray-300 py-10 text-sm">Đang tải...</div>
      ) : (
        <>
          {/* Tóm tắt 3 ô */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="border border-gray-200 bg-white p-3 text-center">
              <p className="text-xs text-gray-400 mb-1">Tổng Thu</p>
              <p className="text-black font-bold text-sm">{formatShort(thu)}</p>
            </div>
            <div className="border border-gray-200 bg-white p-3 text-center">
              <p className="text-xs text-gray-400 mb-1">Tổng Chi</p>
              <p className="text-black font-bold text-sm">{formatShort(chi)}</p>
            </div>
            <div className="border border-gray-200 bg-white p-3 text-center">
              <p className="text-xs text-gray-400 mb-1">Số dư</p>
              <p className={`font-bold text-sm ${balance < 0 ? 'text-gray-400' : 'text-black'}`}>
                {balance < 0 ? '−' : ''}{formatShort(Math.abs(balance))}
              </p>
            </div>
          </div>

          {/* Số dư lớn */}
          <div className="bg-white border border-gray-200 p-4 mb-4">
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Số dư</p>
            <p className={`text-3xl font-bold tracking-tight ${balance < 0 ? 'text-gray-400' : 'text-black'}`}>
              {balance < 0 ? '−' : ''}{formatMoney(Math.abs(balance))}
            </p>
            <p className="text-xs text-gray-300 mt-1">{data?.summary?.total_count || 0} giao dịch</p>
          </div>

          {/* Chi theo danh mục */}
          <div className="bg-white border border-gray-200 p-4 mb-4">
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-4">Chi theo danh mục</p>
            {totalChi === 0 ? (
              <p className="text-sm text-gray-300 text-center py-4">Chưa có khoản chi nào</p>
            ) : (
              <div className="space-y-4">
                {categoryData.map((cat) => {
                  const pct = totalChi > 0 ? (cat.total / totalChi) * 100 : 0;
                  return (
                    <div key={cat.key}>
                      <div className="flex items-baseline justify-between mb-1">
                        <div>
                          <span className="text-sm font-medium text-black">{cat.label}</span>
                          <span className="text-xs text-gray-300 ml-1.5">{cat.hint}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-semibold text-black">{formatMoney(cat.total)}</span>
                          <span className="text-xs text-gray-400 ml-1.5">{pct.toFixed(0)}%</span>
                        </div>
                      </div>
                      {/* Thanh tiến trình */}
                      <div className="h-1.5 bg-gray-100 w-full">
                        <div
                          className="h-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: cat.shade }}
                        />
                      </div>
                      <p className="text-xs text-gray-300 mt-0.5">{cat.count} giao dịch</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tỷ lệ Thu / Chi (pie) */}
          {pieData.length > 0 && (
            <div className="bg-white border border-gray-200 p-4 mb-4">
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Tỷ lệ Thu / Chi</p>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%" cy="50%"
                    outerRadius={70}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    <Cell fill="#000000" />
                    <Cell fill="#d1d5db" />
                  </Pie>
                  <Tooltip formatter={(v) => formatMoney(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Biểu đồ cột theo ngày */}
          {barData.length > 0 && (
            <div className="bg-white border border-gray-200 p-4">
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Thu chi theo ngày</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={barData} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={formatShort} tick={{ fontSize: 10, fill: '#9ca3af' }} width={35} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v) => formatMoney(v)} />
                  <Bar dataKey="thu" name="Thu" fill="#000000" radius={0} />
                  <Bar dataKey="chi" name="Chi" fill="#d1d5db" radius={0} />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-2 justify-center">
                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className="w-3 h-3 bg-black inline-block" /> Thu
                </span>
                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className="w-3 h-3 bg-gray-300 inline-block" /> Chi
                </span>
              </div>
            </div>
          )}

          {pieData.length === 0 && (
            <div className="text-center text-gray-300 py-12 border border-dashed border-gray-200">
              <p className="text-sm">Chưa có dữ liệu trong khoảng thời gian này</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
