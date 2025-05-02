import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // ✅ 加這一行來載入 Tailwind 樣式
import RPGWordGame from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RPGWordGame />
  </React.StrictMode>
);
