import { useState, useEffect } from 'react';

const STORAGE_KEY = 'challengeRecords';

export function useRecords() {
  const [records, setRecords] = useState([]);

  // ✅ 延後讀取 localStorage，避免 SSR 或首載報錯
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setRecords(JSON.parse(raw));
      } catch (err) {
        console.error('localStorage parse error:', err);
        setRecords([]);
      }
    }
  }, []);

  // ✅ 新增一筆紀錄（準備寫入 localStorage）
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
      accuracy,       // e.g. 80 (%)
      wrong: wrongList, // 陣列：錯誤的題目
      coinsEarned: coins,
    };

    const updated = [newRecord, ...records];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setRecords(updated);
  };

  // ✅ 清除所有成績紀錄
  const clearRecords = () => {
    localStorage.removeItem(STORAGE_KEY);
    setRecords([]);
  };

  return {
    records,
    addRecord,
    clearRecords,
  };
}
