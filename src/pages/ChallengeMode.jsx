import { useState, useEffect } from "react";
import { useMainQuestions } from "./hooks/useMainQuestions";

export default function ChallengeMode() {
  const { question, loading } = useMainQuestions();
  const [input, setInput] = useState([]);
  const [feedback, setFeedback] = useState("");
  const [exp, setExp] = useState(() => parseInt(localStorage.getItem("exp")) || 0);
  const [level, setLevel] = useState(() => parseInt(localStorage.getItem("level")) || 1);
  const [maxHp, setMaxHp] = useState(50);
  const [hp, setHp] = useState(50);

  const speak = (text) => {
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = "zh-TW";
    speechSynthesis.speak(msg);
  };

  const handleLetterClick = (char) => {
    if (input.length < (question?.answer?.length || 0)) {
      setInput([...input, char]);
    }
  };

  const handleBackspace = () => {
    setInput(input.slice(0, -1));
  };

  const handleClear = () => {
    setInput([]);
  };

  const handleSubmit = () => {
    const joined = input.join("").toLowerCase();
    const correct = question.answer.toLowerCase();

    if (joined === correct) {
      const newExp = exp + 10;
      const newLevel = Math.floor(newExp / 50) + 1;
      if (newLevel > level) {
        const newMaxHp = 50 + (newLevel - 1) * 10;
        setLevel(newLevel);
        setMaxHp(newMaxHp);
        setHp(newMaxHp);
      } else {
        setHp(Math.min(hp + 10, maxHp));
      }
      setExp(newExp);
      localStorage.setItem("exp", newExp);
      localStorage.setItem("level", newLevel);
      setFeedback("🎉 答對了！");
    } else {
      const newHp = Math.max(hp - 10, 0);
      setHp(newHp);
      setFeedback(`❌ 錯了！正確是 ${correct}`);
    }

    setTimeout(() => {
      setFeedback("");
      setInput([]);
      location.reload(); // 暫時保留 reload，可改為 loadNewQuestion()
    }, 1500);
  };

  const renderAlphabetButtons = () => {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    return (
      <div className="grid grid-cols-7 gap-4 max-w-xl mx-auto mb-4 px-4">
        {alphabet.map((char) => (
          <button
            key={char}
            onClick={() => handleLetterClick(char)}
            className="bg-yellow-300 hover:bg-yellow-400 text-2xl font-bold py-3 px-4 rounded-xl shadow transition-transform active:scale-95 min-w-[52px] min-h-[52px]"
          >
            {char}
          </button>
        ))}
      </div>
    );
  };

  if (loading || !question) {
    return <div className="p-10 text-3xl text-center animate-bounce text-purple-700">🧠 載入挑戰題中...</div>;
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center flex flex-col items-center justify-center p-4 font-sans text-shadow"
      style={{ backgroundImage: "url('/images/bg-magic.jpg')" }}
    >
      <div className="text-5xl font-extrabold text-red-600 mb-4 animate-pulse tracking-wider drop-shadow-md">
        🏆 章節挑戰模式
      </div>

      <div className="text-xl text-white mb-4 bg-black bg-opacity-60 px-4 py-2 rounded-lg">
        （此模式將加入限時與金幣機制，開發中）
      </div>

      <img
        src="/images/hero.png"
        alt="小魔法師"
        className="w-36 h-36 mb-4 rounded-full ring-4 ring-purple-400 shadow-xl bg-white bg-opacity-90 p-1"
      />

      <div className="bg-white bg-opacity-90 px-6 py-4 rounded-2xl shadow-lg mb-6 w-full max-w-xs flex flex-col items-center gap-3">
        <div className="flex gap-4 text-xl font-semibold text-gray-800">
          <div>🧙‍♀️ 等級：<span className="text-blue-600">{level}</span></div>
          <div>✨ 經驗值：<span className="text-yellow-600">{exp}</span></div>
        </div>
        <div className="w-full bg-red-200 rounded-full h-4 shadow-inner overflow-hidden">
          <div
            className="bg-red-500 h-full transition-all duration-500"
            style={{ width: `${(hp / maxHp) * 100}%` }}
          ></div>
        </div>
        <div className="inline-block px-3 py-1 bg-white bg-opacity-80 rounded-full shadow text-red-700 font-bold text-sm tracking-wide border border-red-300">
          ❤️ 血量：{hp} / {maxHp}
        </div>
      </div>

      <div className="text-lg italic text-gray-600 mb-2">題型：{question.direction}</div>

      <div className="text-2xl font-extrabold text-blue-900 mb-4 px-6 py-3 bg-white bg-opacity-80 rounded-xl shadow-lg drop-shadow-xl border border-blue-300 text-center max-w-lg">
        請拼出：「{question.questionText}」
      </div>

      <button
        onClick={() => speak(question.questionText)}
        className="mb-5 px-6 py-2 bg-blue-500 text-white text-lg rounded-full shadow hover:bg-blue-600 transition"
      >
        🔊 點我聽發音
      </button>

      <div className="min-h-[48px] mb-4 text-3xl tracking-widest font-mono text-center text-gray-800 bg-white px-6 py-2 rounded-full shadow">
        {input.join("") || "⋯"}
      </div>

      <div className="flex gap-3 mb-6">
        <button onClick={handleBackspace} className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded shadow">
          ⬅ 退格
        </button>
        <button onClick={handleClear} className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded shadow">
          🔄 清除
        </button>
        <button
          onClick={handleSubmit}
          disabled={input.length !== question.answer.length}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded shadow disabled:opacity-50"
        >
          ✅ 確認
        </button>
      </div>

      {renderAlphabetButtons()}

      {feedback && (
        <div className="mt-6 text-2xl font-bold text-center text-white bg-black bg-opacity-60 px-6 py-3 rounded-xl animate-bounce max-w-md">
          {feedback}
        </div>
      )}
    </div>
  );
}
