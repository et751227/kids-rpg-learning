import React from 'react';
import ReactDOM from 'react-dom/client';
import PracticeMode from './PracticeMode.jsx'; // 這是你首頁想呈現的內容

import './index.css'; // Tailwind 樣式

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PracticeMode />
  </React.StrictMode>
);
