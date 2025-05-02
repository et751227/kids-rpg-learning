import { useState } from 'react';

const STORAGE_KEY = 'challengeRecords';

export function useRecords() {
  const [records, setRecords] = useState(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  });

  const addRecord = ({ accuracy, wrongList, coins }) => {
    const time = new Date().toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    const newRecord = {
      time,
      accuracy, // 百分比，例如 80
      wrong: wrongList, // 錯誤的中文題目陣列
      coinsEarned: coins,
    };

    const updated = [newRecord, ...records];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setRecords(updated);
  };

  const clearRecords = () => {
    localStorage.removeItem(STORAGE_KEY);
    setRecords([]);
  };

  return { records, addRecord, clearRecords };
}
