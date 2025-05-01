import { useState, useEffect } from "react";

const wordList = [
  { word: "apple", choices: ["apple", "banana", "cat", "dog"] },
  { word: "sun", choices: ["moon", "star", "sun", "cloud"] },
  { word: "dog", choices: ["fish", "dog", "bird", "tree"] },
  { word: "car", choices: ["bus", "car", "bike", "train"] },
  { word: "book", choices: ["book", "pen", "bag", "table"] }
];

export default function RPGWordGame() {
  const [index, setIndex] = useState(0);
  const [exp, setExp] = useState(() => parseInt(localStorage.getItem("exp")) || 0);
  const [level, setLevel] = useState(() => parseInt(localStorage.getItem("level")) || 1);
  const [feedback, setFeedback] = useState("");

  const current = wordList[index];

  useEffect(() => {
    localStorage.setItem("exp", exp);
    localStorage.setItem("level", level);
  }, [exp, level]);

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
      setFeedback("✅ Correct!");
    } else {
      setFeedback("❌ Try again!");
    }
    setTimeout(() => {
      setFeedback("");
      setIndex((prev) => (prev + 1) % wordList.length);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 to-green-100 flex flex-col items-center justify-center p-4">
      <div className="text-2xl font-bold mb-4">🌟 RPG 單字冒險</div>
      <div className="mb-2">角色等級：{level} / 經驗值：{exp}</div>
      <div className="p-4 bg-white rounded-2xl shadow-xl text-center w-full max-w-md">
        <div className="text-xl font-semibold mb-2">單字：{current.word}</div>
        <button
          onClick={() => speak(current.word)}
          className="mb-4 px-4 py-2 bg-blue-500 text-white rounded-xl"
        >
          🔊 聽發音
        </button>
        <div className="grid grid-cols-2 gap-2">
          {current.choices.map((c) => (
            <button
              key={c}
              onClick={() => handleAnswer(c)}
              className="p-2 bg-yellow-200 rounded-xl hover:bg-yellow-300"
            >
              {c}
            </button>
          ))}
        </div>
        {feedback && <div className="mt-4 text-xl">{feedback}</div>}
      </div>
    </div>
  );
}
