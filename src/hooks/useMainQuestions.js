import { useState } from "react";
import { useMainQuestions } from "./hooks/useMainQuestions";

export default function RPGWordGameMain() {
  const { question, loading } = useMainQuestions();
  const [input, setInput] = useState([]);
  const [feedback, setFeedback] = useState("");
  const [exp, setExp] = useState(() => parseInt(localStorage.getItem("exp")) || 0);
  const [level, setLevel] = useState(() => parseInt(localStorage.getItem("level")) || 1);
  const [maxHp, setMaxHp] = useState(50);
  const [hp, setHp] = useState(50);

  const speak = (text) => {
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = "zh-TW"; // 中文語音
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
      location.reload();
    }, 1500);
  };

  const renderAlphabetButtons = () => {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    return (
      <div className="grid grid-cols-7 gap-2 max-w-md mx-auto mb-4">
        {alphabet.map((char) => (
          <button
            key={char}
            onClick={() => handleLetterClick(char)}
            className="bg-yellow-300 hover:bg-yellow-400 text-xl font-bold py-2 rounded-lg shadow"
          >
            {char}
          </button>
        ))}
      </div>
    );
  };

  if (loading || !question) {
    return <div className="p-10 text-3xl text-center animate-bounce text-purple-700">🧠 載入拼字題中...</div>;
  }

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
        className="w-36 h-36 mb-4 rounded-full ring-4 ring-purple-400 shadow-xl bg-white bg-opacity-90 p-1"
      />

      <div className="bg-white bg-opacity-90 px-6 py-4 rounded-2xl shadow-lg mb-6 w-full max-w-xs flex flex-col items-center gap-3">
        <div className="flex gap-4 text-xl font-semibold text-gray-800">
          <div className="whitespace-nowrap">🧙‍♀️ 等級：<span className="text-blue-600">{level}</span></div>
          <div className="whitespace-nowrap">✨ 經驗值：<span className="text-yellow-600">{exp}</span></div>
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

      <div className="text-lg text-gray-600 italic mb-2">題型：{question.direction}</div>
      <div className="text-2xl font-bold text-blue-700 mb-2">請拼出：「{question.questionText}」</div>

      <button
        onClick={() => speak(question.questionText)}
        className="mb-4 px-5 py-2 bg-blue-500 text-white text-lg rounded-full shadow hover:bg-blue-600 transition"
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
        <div className="mt-6 text-2xl font-bold text-center animate-bounce">
          {feedback}
        </div>
      )}
    </div>
  );
}
