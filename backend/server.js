require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDB } = require('./db');

const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

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
