import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css'; // Tailwind 樣式
import PracticeMode from './PracticeMode';
import ChallengeMode from './ChallengeMode';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PracticeMode />} />
        <Route path="/challenge" element={<ChallengeMode />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
