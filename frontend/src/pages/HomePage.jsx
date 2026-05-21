import { useState, useEffect, useCallback } from 'react';
import api from '../api';

const formatMoney = (n) => Number(n).toLocaleString('vi-VN') + 'đ';

const formatDate = (str) => {
  const d = new Date(str);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) +
    ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

const CATEGORY_LABEL = {
  'phat-trien': 'Phát triển bản thân',
  'sinh-hoat':  'Sinh hoạt',
  'tieu-dung':  'Tiêu dùng',
};

export default function HomePage() {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
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
    const raw = amount.replace(/[.,\s]/g, '');
    if (!raw || isNaN(raw) || Number(raw) <= 0) {
      showToast('Vui lòng nhập số tiền hợp lệ');
      return;
    }
    setLoading(true);
    try {
      await api.post('/transactions', {
        type,
        amount: Number(raw),
        description: description.trim(),
      });
      setDescription('');
      setAmount('');
      showToast(type === 'thu' ? 'Đã thêm khoản thu' : 'Đã thêm khoản chi');
      fetchTransactions();
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi khi lưu');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa giao dịch này?')) return;
    try {
      await api.delete(`/transactions/${id}`);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    } catch {}
  };

  const handleAmountInput = (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    setAmount(raw ? Number(raw).toLocaleString('vi-VN') : '');
  };

  return (
    <div className="pb-24">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 bg-black text-white text-sm font-medium shadow-lg">
          {toast}
        </div>
      )}

      <div className="bg-white border-b border-gray-100 px-4 pt-4 pb-5">
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Nhập giao dịch</p>
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Nội dung (VD: Ăn sáng, Lương tháng 5...)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border border-gray-200 px-3 py-3 text-base text-black placeholder-gray-300 focus:outline-none focus:border-black"
          />
          <input
            type="text"
            inputMode="numeric"
            placeholder="Số tiền"
            value={amount}
            onChange={handleAmountInput}
            className="w-full border border-gray-200 px-3 py-3 text-base text-black placeholder-gray-300 focus:outline-none focus:border-black"
          />

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => handleSubmit('thu')}
              disabled={loading}
              className="bg-gray-200 hover:bg-gray-300 active:bg-gray-400 text-black font-bold py-4 text-base border border-black transition-colors disabled:opacity-40"
            >
              + THU
            </button>
            <button
              onClick={() => handleSubmit('chi')}
              disabled={loading}
              className="bg-white hover:bg-gray-50 active:bg-gray-100 text-black font-bold py-4 text-base border border-black transition-colors disabled:opacity-40"
            >
              − CHI
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4">
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Giao dịch gần đây</p>
        {transactions.length === 0 ? (
          <div className="text-center text-gray-300 py-12 border border-dashed border-gray-200">
            <p className="text-sm">Chưa có giao dịch nào</p>
          </div>
        ) : (
          <div className="space-y-px">
            {transactions.map((tx) => (
              <div key={tx.id} className="bg-white px-4 py-3 flex items-center gap-3 border border-gray-100">
                <div className={`w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0 border ${
                  tx.type === 'thu' ? 'border-black text-black' : 'border-gray-300 text-gray-400'
                }`}>
                  {tx.type === 'thu' ? '+' : '−'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-black text-sm truncate">
                    {tx.description || (tx.type === 'thu' ? 'Khoản thu' : 'Khoản chi')}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <p className="text-xs text-gray-300">{formatDate(tx.created_at)}</p>
                    {tx.type === 'chi' && tx.category && (
                      <span className="text-xs text-gray-400 border border-gray-200 px-1">
                        {CATEGORY_LABEL[tx.category] || tx.category}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`font-semibold text-sm ${tx.type === 'thu' ? 'text-black' : 'text-gray-400'}`}>
                    {tx.type === 'thu' ? '+' : '−'}{formatMoney(tx.amount)}
                  </p>
                  <button
                    onClick={() => handleDelete(tx.id)}
                    className="text-xs text-gray-200 hover:text-gray-500 mt-0.5"
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
