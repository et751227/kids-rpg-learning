<Route path="/records" element={<RecordsPage />} />
// src/pages/RecordsPage.jsx
import React from 'react';
import RecordsPanel from '../components/RecordsPanel';

export default function RecordsPage() {
  return (
    <div
      className="min-h-screen bg-cover bg-center flex flex-col items-center p-6 font-sans"
      style={{ backgroundImage: "url('/images/bg-magic.jpg')" }}
    >
      <h1 className="text-4xl font-bold text-white bg-black bg-opacity-50 px-6 py-3 rounded-xl mb-6 mt-10 shadow">
        🧾 歷史成績紀錄
      </h1>
      <RecordsPanel />
    </div>
  );
}
