import { useState } from 'react';
import AuthPage from './pages/AuthPage';
import Layout from './components/Layout';
import './index.css';

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      return saved && token ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const handleLogin = (userData) => setUser(userData);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (!user) return <AuthPage onLogin={handleLogin} />;
  return <Layout user={user} onLogout={handleLogout} />;
}
