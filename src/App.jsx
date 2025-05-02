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
    if (choice === current.answer) {
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
    <div className="min-h-screen bg-gradient-to-br from-pink-100 to-yellow-100 flex flex-col items-center justify-center p-4 font-sans">
      <div className="text-4xl font-extrabold mb-4 text-purple-700 animate-pulse tracking-wider">
        🌟 RPG 單字冒險
      </div>
      <div className="mb-4 text-lg text-gray-800 bg-white rounded-full px-6 py-2 shadow-lg font-semibold tracking-wide">
        🧙‍♂️ 等級：{level} ｜✨ 經驗值：{exp}
      </div>

      {current.word ? (
        <div className="p-6 bg-white rounded-3xl shadow-2xl text-center w-full max-w-md">
          <div className="text-2xl font-bold mb-3 text-blue-600">單字：{current.word}</div>
          <button
            onClick={() => speak(current.word)}
            className="mb-5 px-5 py-2 bg-blue-400 text-white rounded-full hover:bg-blue-500 transition-transform active:scale-95"
          >
            🔊 點我聽發音
          </button>

          <div className="grid grid-cols-2 gap-3">
            {current.options?.map((c) => (
              <button
                key={c}
                onClick={() => handleAnswer(c)}
                className={`py-4 rounded-2xl text-xl font-semibold transition-transform duration-200
                  ${feedback
                    ? "pointer-events-none opacity-50"
                    : "bg-yellow-300 hover:bg-yellow-400 active:scale-95 shadow-md"}
                `}
              >
                🎁 {c}
              </button>
            ))}
          </div>

          {feedback && (
            <div
              className={`mt-6 text-3xl font-bold transition-opacity duration-500 animate-bounce
                ${feedback.includes("太棒了") ? "text-green-600" : "text-red-500"}
              `}
            >
              {feedback}
            </div>
          )}
        </div>
      ) : (
        <div className="text-xl text-red-600 mt-10">⚠️ 無法顯示題目，請稍後再試</div>
      )}
    </div>
  );
}
