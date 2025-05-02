import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css'; // Tailwind 樣式

import PracticeMode from './PracticeMode';
import ChallengeMode from './ChallengeMode';
import RecordsPage from './pages/RecordsPage'; // ✅ 新增這行

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PracticeMode />} />
        <Route path="/challenge" element={<ChallengeMode />} />
        <Route path="/records" element={<RecordsPage />} /> {/* ✅ 新增這行 */}
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
