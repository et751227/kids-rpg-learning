import { useState, useEffect } from 'react';

const STORAGE_KEY = 'challengeRecords';

export function useRecords() {
  const [records, setRecords] = useState([]);

  // 延後讀取 localStorage
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

  // 新增一筆紀錄
  // ‼️ 修改：加入 timeTaken 參數
  const addRecord = ({ accuracy, wrongList, coins, timeTaken }) => {
    const time = new Date().toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    const newRecord = {
      time, // 挑戰的日期
      accuracy,       // e.g. 80 (%)
      wrong: wrongList, // 陣列：錯誤的題目
      coinsEarned: coins,
      timeTaken: timeTaken, // e.g. 120 (秒)
    };

    const updated = [newRecord, ...records];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setRecords(updated);
  };

  // 清除所有成績紀錄
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
