const express = require('express');
const { pool } = require('../db');
const auth = require('../middleware/auth');
const { categorize } = require('../utils/categorize');

const router = express.Router();
router.use(auth);

// Thêm giao dịch
router.post('/', async (req, res) => {
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

  const [result] = await pool.execute(
    'INSERT INTO transactions (user_id, type, amount, description, category) VALUES (?, ?, ?, ?, ?)',
    [req.userId, type, Number(amount), description || '', cat]
  );

  const [rows] = await pool.execute('SELECT * FROM transactions WHERE id = ?', [result.insertId]);
  res.status(201).json(rows[0]);
});

// Lấy danh sách giao dịch
router.get('/', async (req, res) => {
  const limit  = Math.max(1, Number(req.query.limit)  || 20);
  const offset = Math.max(0, Number(req.query.offset) || 0);

  const [rows] = await pool.execute(
    `SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`,
    [req.userId]
  );
  res.json(rows);
});

// Xóa giao dịch
router.delete('/:id', async (req, res) => {
  const [rows] = await pool.execute(
    'SELECT id FROM transactions WHERE id = ? AND user_id = ?',
    [req.params.id, req.userId]
  );
  if (rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy giao dịch' });

  await pool.execute('DELETE FROM transactions WHERE id = ?', [req.params.id]);
  res.json({ message: 'Đã xóa' });
});

// Báo cáo theo khoảng thời gian
router.get('/report', async (req, res) => {
  const { period = 'month' } = req.query;

  let dateFilter;
  if (period === 'today') {
    dateFilter = 'DATE(created_at) = CURDATE()';
  } else if (period === 'week') {
    dateFilter = 'created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
  } else {
    dateFilter = "DATE_FORMAT(created_at, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m')";
  }

  const [[summary]] = await pool.execute(`
    SELECT
      COALESCE(SUM(CASE WHEN type = 'thu' THEN amount ELSE 0 END), 0) AS total_thu,
      COALESCE(SUM(CASE WHEN type = 'chi' THEN amount ELSE 0 END), 0) AS total_chi,
      COUNT(*) AS total_count
    FROM transactions
    WHERE user_id = ? AND ${dateFilter}
  `, [req.userId]);

  const [byDay] = await pool.execute(`
    SELECT
      DATE(created_at) AS date,
      type,
      SUM(amount) AS total
    FROM transactions
    WHERE user_id = ? AND ${dateFilter}
    GROUP BY DATE(created_at), type
    ORDER BY date ASC
  `, [req.userId]);

  const [byCategory] = await pool.execute(`
    SELECT
      COALESCE(category, 'tieu-dung') AS category,
      SUM(amount) AS total,
      COUNT(*) AS count
    FROM transactions
    WHERE user_id = ? AND type = 'chi' AND ${dateFilter}
    GROUP BY COALESCE(category, 'tieu-dung')
  `, [req.userId]);

  res.json({ summary, byDay, byCategory });
});

module.exports = router;
