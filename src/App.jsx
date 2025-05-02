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
    return <div className="p-10 text-4xl text-center animate-bounce text-purple-700 font-bold">🔄 正在載入魔法題庫...</div>;
  }

  if (!questions || questions.length === 0) {
    return <div className="p-10 text-2xl text-center text-red-600">⚠️ 沒有題目可用，請檢查 Google Sheets！</div>;
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
    <div
      className="min-h-screen bg-cover bg-center flex flex-col items-center justify-center p-6 font-sans"
      style={{ backgroundImage: "url('/images/bg-magic.jpg')" }}
    >
      <div className="text-5xl font-extrabold text-purple-700 mb-4 animate-pulse tracking-wider">
        🌟 RPG 單字冒險
      </div>

      <img
        src="/images/hero.png"
        alt="小魔法師"
        className="w-32 h-32 mb-4 animate-bounce"
      />

      <div className="text-2xl bg-white text-gray-800 px-6 py-3 rounded-full shadow-lg mb-6 font-semibold flex gap-6 items-center">
        🧙‍♀️ 等級：<span className="text-blue-600">{level}</span> ｜✨ 經驗值：<span className="text-yellow-600">{exp}</span>
      </div>

      {current.word ? (
        <div className="w-full max-w-xl bg-white bg-opacity-90 rounded-3xl shadow-2xl p-8 text-center">
          <div className="text-3xl font-bold text-blue-700 mb-4">單字：{current.word}</div>

          <button
            onClick={() => speak(current.word)}
            className="mb-6 px-6 py-3 bg-blue-500 text-white text-lg font-semibold rounded-full hover:bg-blue-600 transition-all duration-200"
          >
            🔊 點我聽發音
          </button>

          <div className="grid grid-cols-2 gap-5">
            {current.options?.map((c) => (
              <button
                key={c}
                onClick={() => handleAnswer(c)}
                className={`py-5 px-3 rounded-full text-2xl font-bold shadow-xl
                  bg-gradient-to-br from-yellow-300 to-yellow-400
                  hover:from-yellow-400 hover:to-yellow-500 hover:scale-105
                  transition-all duration-300 transform border-4 border-yellow-600
                  ${feedback ? "pointer-events-none opacity-50" : ""}
                `}
              >
                🎁 {c}
              </button>
            ))}
          </div>

          {feedback && (
            <div
              className={`mt-8 text-4xl font-extrabold animate-bounce
                ${feedback.includes("太棒了") ? "text-green-600" : "text-red-500"}
              `}
            >
              {feedback}
            </div>
          )}
        </div>
      ) : (
        <div className="text-2xl text-red-600 mt-10">⚠️ 顯示題目失敗，請稍後再試</div>
      )}
    </div>
  );
}
