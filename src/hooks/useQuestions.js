import { useState, useEffect } from "react";

export function useQuestions() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("https://script.google.com/macros/s/AKfycbwjSr6rDRrqo5xq1ztDsRVDORoBWLGZwwtHSSHKkYLUykjNdao9Va-YN3eg02HTWYMh/exec")
      .then((res) => res.json())
      .then((data) => {
        const formatted = data.map((item) => ({
          word: item.word,
          options: item.options,  // ✅ 正確從 API 使用現有 options 陣列
          answer: item.answer,
        }));
        setQuestions(formatted);
        setLoading(false);
      })
      .catch((err) => {
        console.error("題庫載入失敗", err);
        setLoading(false);
      });
  }, []);

  return { questions, loading };
}
