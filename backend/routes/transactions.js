const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const { categorize } = require('../utils/categorize');

const router = express.Router();
router.use(auth);

// Thêm giao dịch
router.post('/', (req, res) => {
  const { type, amount, description } = req.body;

  if (!type || !amount) {
    return res.status(400).json({ message: 'Thiếu thông tin giao dịch' });
  }
  if (!['thu', 'chi'].includes(type)) {
    return res.status(400).json({ message: 'Loại giao dịch không hợp lệ' });
  }
  if (isNaN(amount) || Number(amount) <= 0) {
    return res.status(400).json({ message: 'Số tiền không hợp lệ' });
  }

  const cat = type === 'chi' ? categorize(description) : null;

  const result = db.prepare(
    'INSERT INTO transactions (user_id, type, amount, description, category) VALUES (?, ?, ?, ?, ?)'
  ).run(req.userId, type, Number(amount), description || '', cat);

  const tx = db.prepare('SELECT * FROM transactions WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(tx);
});

// Lấy danh sách giao dịch (có phân trang)
router.get('/', (req, res) => {
  const { limit = 20, offset = 0 } = req.query;
  const rows = db.prepare(
    'SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
  ).all(req.userId, Number(limit), Number(offset));
  res.json(rows);
});

// Xóa giao dịch
router.delete('/:id', (req, res) => {
  const tx = db.prepare('SELECT * FROM transactions WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!tx) return res.status(404).json({ message: 'Không tìm thấy giao dịch' });

  db.prepare('DELETE FROM transactions WHERE id = ?').run(req.params.id);
  res.json({ message: 'Đã xóa' });
});

// Báo cáo theo khoảng thời gian
router.get('/report', (req, res) => {
  const { period = 'month' } = req.query;

  let dateFilter;
  if (period === 'today') {
    dateFilter = "DATE(created_at) = DATE('now', 'localtime')";
  } else if (period === 'week') {
    dateFilter = "created_at >= DATE('now', '-7 days', 'localtime')";
  } else {
    dateFilter = "strftime('%Y-%m', created_at, 'localtime') = strftime('%Y-%m', 'now', 'localtime')";
  }

  const summary = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN type = 'thu' THEN amount ELSE 0 END), 0) as total_thu,
      COALESCE(SUM(CASE WHEN type = 'chi' THEN amount ELSE 0 END), 0) as total_chi,
      COUNT(*) as total_count
    FROM transactions
    WHERE user_id = ? AND ${dateFilter}
  `).get(req.userId);

  const byDay = db.prepare(`
    SELECT
      DATE(created_at, 'localtime') as date,
      type,
      SUM(amount) as total
    FROM transactions
    WHERE user_id = ? AND ${dateFilter}
    GROUP BY DATE(created_at, 'localtime'), type
    ORDER BY date ASC
  `).all(req.userId);

  const byCategory = db.prepare(`
    SELECT
      COALESCE(category, 'tieu-dung') as category,
      SUM(amount) as total,
      COUNT(*) as count
    FROM transactions
    WHERE user_id = ? AND type = 'chi' AND ${dateFilter}
    GROUP BY COALESCE(category, 'tieu-dung')
  `).all(req.userId);

  res.json({ summary, byDay, byCategory });
});

module.exports = router;
