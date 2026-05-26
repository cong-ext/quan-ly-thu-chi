require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDB } = require('./db');

const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/admin', adminRoutes);
app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

// Endpoint tạm thời để cấp quyền admin — bảo vệ bằng SETUP_SECRET
app.get('/api/setup-admin', async (req, res) => {
  const { secret, phone, password } = req.query;
  const validSecret = process.env.SETUP_SECRET;

  if (!validSecret || secret !== validSecret) {
    return res.status(403).json({ message: 'Sai secret key' });
  }
  if (!phone || !password) {
    return res.status(400).json({ message: 'Thiếu phone hoặc password' });
  }

  const bcrypt = require('bcryptjs');
  const { pool } = require('./db');

  const [rows] = await pool.execute('SELECT id FROM users WHERE phone = ?', [phone]);
  if (rows.length === 0) {
    return res.status(404).json({ message: `Không tìm thấy user với phone: ${phone}` });
  }

  const hashed = await bcrypt.hash(password, 10);
  await pool.execute(
    'UPDATE users SET password = ?, is_admin = 1 WHERE phone = ?',
    [hashed, phone]
  );

  res.json({ message: `Đã cấp quyền admin và đổi mật khẩu cho ${phone}` });
});

// Serve frontend build trong production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../frontend/dist');
  app.use(express.static(distPath));
  app.get(/(.*)/, (_, res) => res.sendFile(path.join(distPath, 'index.html')));
}

// Khởi động server sau khi DB sẵn sàng
initDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server chạy tại http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Không thể kết nối database:', err.message);
    process.exit(1);
  });
