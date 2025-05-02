import { useState, useEffect } from "react";

export function useMainQuestions() {
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("https://script.google.com/macros/s/AKfycbwjSr6rDRrqo5xq1ztDsRVDORoBWLGZwwtHSSHKkYLUykjNdao9Va-YN3eg02HTWYMh/exec?type=main")
      .then((res) => res.json())
      .then((data) => {
        const raw = data.map((item) => ({
          english: item.english.trim(),
          chinese: item.chinese.trim(),
        }));

        const random = raw[Math.floor(Math.random() * raw.length)];
        const isChineseQuestion = true; // 永遠是中文題

        const questionText = isChineseQuestion ? random.chinese : random.english;
        const answer = isChineseQuestion ? random.english : random.chinese;

        setQuestion({
          questionText,
          answer,
          direction: isChineseQuestion ? "中 ➜ 英" : "英 ➜ 中",
          shuffledLetters: isChineseQuestion
            ? shuffleArray(answer.toUpperCase().split("")) // 打散字母
            : [],
        });

        setLoading(false);
      })
      .catch((err) => {
        console.error("載入拼字題庫失敗", err);
        setLoading(false);
      });
  }, []);

  return { question, loading };
}

function shuffleArray(array) {
  return array
    .map((value) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
}
