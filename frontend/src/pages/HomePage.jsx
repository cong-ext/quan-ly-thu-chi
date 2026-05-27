import { useState, useEffect, useCallback } from 'react';
import api from '../api';

const formatMoney = (n) => Number(n).toLocaleString('vi-VN') + 'đ';
const formatDate  = (str) => {
  const d = new Date(str);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
    + ' · ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

const CATEGORY_LABEL = {
  'phat-trien': 'Phát triển',
  'sinh-hoat':  'Sinh hoạt',
  'tieu-dung':  'Tiêu dùng',
};

export default function HomePage() {
  const [description, setDescription] = useState('');
  const [amount,      setAmount]      = useState('');
  const [transactions, setTransactions] = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [toast,       setToast]       = useState(null);

  const showToast = (msg, type = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  const fetchTransactions = useCallback(async () => {
    try {
      const { data } = await api.get('/transactions?limit=30');
      setTransactions(data);
    } catch {}
  }, []);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const handleSubmit = async (type) => {
    const raw = amount.replace(/\D/g, '');
    if (!raw || Number(raw) <= 0) { showToast('Vui lòng nhập số tiền hợp lệ', 'err'); return; }
    setLoading(true);
    try {
      await api.post('/transactions', { type, amount: Number(raw), description: description.trim() });
      setDescription(''); setAmount('');
      showToast(type === 'thu' ? 'Đã thêm khoản thu' : 'Đã thêm khoản chi');
      fetchTransactions();
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi khi lưu', 'err');
    } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa giao dịch này?')) return;
    try {
      await api.delete(`/transactions/${id}`);
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch {}
  };

  const handleAmountInput = (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    setAmount(raw ? Number(raw).toLocaleString('vi-VN') : '');
  };

  return (
    <div className="pb-28 px-4 pt-5">

      {toast && (
        <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-white text-sm font-semibold shadow-xl transition-all ${
          toast.type === 'err' ? 'bg-neutral-800' : 'bg-black'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Input card */}
      <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
        <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-4">Nhập giao dịch</p>
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Nội dung giao dịch..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-neutral-50 rounded-xl px-4 py-3 text-sm placeholder-neutral-300 focus:outline-none focus:ring-2 focus:ring-black/10 transition"
          />
          <input
            type="text"
            inputMode="numeric"
            placeholder="Số tiền"
            value={amount}
            onChange={handleAmountInput}
            className="w-full bg-neutral-50 rounded-xl px-4 py-3 text-sm placeholder-neutral-300 focus:outline-none focus:ring-2 focus:ring-black/10 transition"
          />
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={() => handleSubmit('thu')}
              disabled={loading}
              className="bg-neutral-100 hover:bg-neutral-200 active:bg-neutral-300 text-black font-bold py-4 rounded-xl text-sm transition-all disabled:opacity-40"
            >
              + THU
            </button>
            <button
              onClick={() => handleSubmit('chi')}
              disabled={loading}
              className="bg-black hover:bg-neutral-800 active:bg-neutral-900 text-white font-bold py-4 rounded-xl text-sm transition-all disabled:opacity-40 shadow-sm"
            >
              − CHI
            </button>
          </div>
        </div>
      </div>

      {/* Transaction list */}
      <div>
        <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3 px-1">Giao dịch gần đây</p>
        {transactions.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm py-12 text-center">
            <p className="text-3xl mb-2">📋</p>
            <p className="text-sm text-neutral-300 font-medium">Chưa có giao dịch nào</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <div key={tx.id} className="bg-white rounded-2xl shadow-sm px-4 py-3.5 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                  tx.type === 'thu' ? 'bg-neutral-100 text-black' : 'bg-black text-white'
                }`}>
                  {tx.type === 'thu' ? '+' : '−'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#0a0a0a] text-sm truncate">
                    {tx.description || (tx.type === 'thu' ? 'Khoản thu' : 'Khoản chi')}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-neutral-400">{formatDate(tx.created_at)}</p>
                    {tx.type === 'chi' && tx.category && (
                      <span className="text-[10px] font-medium text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded-md">
                        {CATEGORY_LABEL[tx.category] || tx.category}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`font-bold text-sm ${tx.type === 'thu' ? 'text-black' : 'text-neutral-500'}`}>
                    {tx.type === 'thu' ? '+' : '−'}{formatMoney(tx.amount)}
                  </p>
                  <button
                    onClick={() => handleDelete(tx.id)}
                    className="text-[10px] text-neutral-200 hover:text-neutral-400 mt-0.5 transition-colors"
                  >
                    xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
