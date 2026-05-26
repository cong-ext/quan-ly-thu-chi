const express = require('express');
const { pool } = require('../db');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

const router = express.Router();
router.use(auth);
router.use(admin);

// Thống kê tổng quan
router.get('/stats', async (req, res) => {
  const [[totals]] = await pool.execute(`
    SELECT
      COUNT(DISTINCT u.id)                                          AS total_users,
      COUNT(t.id)                                                   AS total_transactions,
      COALESCE(SUM(CASE WHEN t.type='thu' THEN t.amount END), 0)   AS total_thu,
      COALESCE(SUM(CASE WHEN t.type='chi' THEN t.amount END), 0)   AS total_chi
    FROM users u
    LEFT JOIN transactions t ON t.user_id = u.id
  `);

  const [[newToday]] = await pool.execute(`
    SELECT COUNT(*) AS count FROM users WHERE DATE(created_at) = CURDATE()
  `);

  res.json({ ...totals, new_today: newToday.count });
});

// Danh sách người dùng
router.get('/users', async (req, res) => {
  const limit  = Math.max(1,  Number(req.query.limit)  || 50);
  const offset = Math.max(0,  Number(req.query.offset) || 0);
  const search = req.query.search || '';

  const whereSearch = search ? `AND (u.phone LIKE ? OR u.name LIKE ?)` : '';
  const params = search
    ? [`%${search}%`, `%${search}%`, limit, offset]
    : [limit, offset];

  const [users] = await pool.execute(`
    SELECT
      u.id,
      u.phone,
      u.name,
      u.is_admin,
      u.created_at,
      COUNT(t.id)                                                   AS total_tx,
      COALESCE(SUM(CASE WHEN t.type='thu' THEN t.amount END), 0)   AS total_thu,
      COALESCE(SUM(CASE WHEN t.type='chi' THEN t.amount END), 0)   AS total_chi,
      MAX(t.created_at)                                             AS last_activity
    FROM users u
    LEFT JOIN transactions t ON t.user_id = u.id
    WHERE 1=1 ${whereSearch}
    GROUP BY u.id
    ORDER BY u.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `, search ? [`%${search}%`, `%${search}%`] : []);

  const [[{ total }]] = await pool.execute(
    `SELECT COUNT(*) AS total FROM users WHERE 1=1 ${whereSearch}`,
    search ? [`%${search}%`, `%${search}%`] : []
  );

  res.json({ users, total });
});

// Cấp / thu hồi quyền admin
router.patch('/users/:id/admin', async (req, res) => {
  const { is_admin } = req.body;
  await pool.execute('UPDATE users SET is_admin = ? WHERE id = ?', [is_admin ? 1 : 0, req.params.id]);
  res.json({ message: 'Đã cập nhật' });
});

module.exports = router;
