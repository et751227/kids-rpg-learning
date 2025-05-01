import { useState, useEffect } from "react";
import { useQuestions } from "./hooks/useQuestions";

export default function RPGWordGame() {
  const { questions, loading } = useQuestions();
  const [index, setIndex] = useState(0);
  const [exp, setExp] = useState(() => parseInt(localStorage.getItem("exp")) || 0);
  const [level, setLevel] = useState(() => parseInt(localStorage.getItem("level")) || 1);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    localStorage.setItem("exp", exp);
    localStorage.setItem("level", level);
  }, [exp, level]);

  if (loading) {
    return <div className="p-10 text-3xl text-center animate-bounce">🔄 載入題庫中...</div>;
  }

  if (!questions || questions.length === 0) {
    return <div className="p-10 text-xl text-center text-red-600">⚠️ 無法載入題目，請確認 Google Sheets 題庫內容</div>;
  }

  const current = questions[index] || {};

  const speak = (text) => {
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = "en-US";
    speechSynthesis.speak(msg);
  };

  const handleAnswer = (choice) => {
    if (choice === current.word) {
      const newExp = exp + 10;
      const newLevel = Math.floor(newExp / 50) + 1;
      setExp(newExp);
      setLevel(newLevel);
      setFeedback("🎉 太棒了！");
    } else {
      setFeedback("😢 再試一次！");
    }
    setTimeout(() => {
      setFeedback("");
      setIndex((prev) => (prev + 1) % questions.length);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 to-yellow-100 flex flex-col items-center justify-center p-4">
      <div className="text-3xl font-bold mb-4 text-purple-800 animate-pulse">🌟 RPG 單字冒險</div>
      <div className="mb-4 text-lg text-gray-700 bg-white rounded-xl px-4 py-2 shadow">
        🧙‍♂️ 角色等級：{level} ｜✨ 經驗值：{exp}
      </div>

      {current.word ? (
        <div className="p-6 bg-white rounded-3xl shadow-2xl text-center w-full max-w-md">
          <div className="text-2xl font-bold mb-3 text-blue-600">單字：{current.word}</div>
          <button
            onClick={() => speak(current.word)}
            className="mb-5 px-5 py-2 bg-blue-400 text-white rounded-full hover:bg-blue-500"
          >
            🔊 點我聽發音
          </button>
          <div className="grid grid-cols-2 gap-3">
            {current.choices?.map((c) => (
              <button
                key={c}
                onClick={() => handleAnswer(c)}
                className="py-3 bg-yellow-300 rounded-2xl hover:bg-yellow-400 text-xl font-semibold"
              >
                {c}
              </button>
            ))}
          </div>
          {feedback && <div className="mt-5 text-2xl">{feedback}</div>}
        </div>
      ) : (
        <div className="text-xl text-red-600 mt-10">⚠️ 無法顯示題目，請稍後再試</div>
      )}
    </div>
  );
}
