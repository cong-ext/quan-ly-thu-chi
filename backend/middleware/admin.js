const { pool } = require('../db');

async function adminMiddleware(req, res, next) {
  const [rows] = await pool.execute('SELECT is_admin FROM users WHERE id = ?', [req.userId]);
  if (!rows[0] || !rows[0].is_admin) {
    return res.status(403).json({ message: 'Không có quyền truy cập' });
  }
  next();
}

module.exports = adminMiddleware;
