const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');

const router = express.Router();

// Đăng ký
router.post('/register', async (req, res) => {
  const { phone, password, name } = req.body;

  if (!phone || !password) {
    return res.status(400).json({ message: 'Vui lòng nhập số điện thoại và mật khẩu' });
  }
  if (!/^[0-9]{9,11}$/.test(phone)) {
    return res.status(400).json({ message: 'Số điện thoại không hợp lệ' });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự' });
  }

  const [existing] = await pool.execute('SELECT id FROM users WHERE phone = ?', [phone]);
  if (existing.length > 0) {
    return res.status(409).json({ message: 'Số điện thoại đã được đăng ký' });
  }

  const hashed = await bcrypt.hash(password, 10);
  const [result] = await pool.execute(
    'INSERT INTO users (phone, password, name) VALUES (?, ?, ?)',
    [phone, hashed, name || '']
  );

  const token = jwt.sign({ userId: result.insertId }, process.env.JWT_SECRET, { expiresIn: '30d' });
  res.status(201).json({ token, user: { id: result.insertId, phone, name: name || '' } });
});

// Đăng nhập
router.post('/login', async (req, res) => {
  const { phone, password } = req.body;

  if (!phone || !password) {
    return res.status(400).json({ message: 'Vui lòng nhập số điện thoại và mật khẩu' });
  }

  const [rows] = await pool.execute('SELECT * FROM users WHERE phone = ?', [phone]);
  const user = rows[0];
  if (!user) {
    return res.status(401).json({ message: 'Số điện thoại chưa được đăng ký' });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ message: 'Mật khẩu không đúng' });
  }

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, user: { id: user.id, phone: user.phone, name: user.name } });
});

module.exports = router;
