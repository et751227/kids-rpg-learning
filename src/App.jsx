import { useState, useEffect } from "react";
import { useMainQuestions } from "./hooks/useMainQuestions";

export default function RPGWordGameMain() {
  const [input, setInput] = useState([]);
  const [feedback, setFeedback] = useState("");
  const [exp, setExp] = useState(() => parseInt(localStorage.getItem("exp")) || 0);
  const [level, setLevel] = useState(() => parseInt(localStorage.getItem("level")) || 1);
  const [maxHp, setMaxHp] = useState(50);
  const [hp, setHp] = useState(50);
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNewQuestion();
  }, []);

  const loadNewQuestion = () => {
    setLoading(true);
    fetch("https://script.google.com/macros/s/AKfycbwjSr6rDRrqo5xq1ztDsRVDORoBWLGZwwtHSSHKkYLUykjNdao9Va-YN3eg02HTWYMh/exec?type=main")
      .then(res => res.json())
      .then(data => {
        const clean = data.filter(item => item.chinese && item.english);
        const random = clean[Math.floor(Math.random() * clean.length)];
        setQuestion({
          questionText: random.chinese,
          answer: random.english,
          direction: "中 ➜ 英"
        });
        setLoading(false);
      });
  };

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
      setFeedback("🎉 答對了！點擊任意處繼續...");
    } else {
      const newHp = Math.max(hp - 10, 0);
      setHp(newHp);
      setFeedback(`❌ 錯了！正確是 ${correct}，點擊任意處繼續...`);
    }
  };

  const handleNext = () => {
    setFeedback("");
    setInput([]);
    loadNewQuestion();
  };

  const renderAlphabetButtons = () => {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    return (
      <div className="grid grid-cols-7 gap-4 max-w-md mx-auto mb-4 px-4">
        {alphabet.map((char) => (
          <button
            key={char}
            onClick={() => handleLetterClick(char)}
            className="bg-yellow-300 hover:bg-yellow-400 text-2xl font-bold py-3 px-4 rounded-xl shadow transition-transform active:scale-95 min-w-[48px] min-h-[48px]"
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
      className="min-h-screen bg-cover bg-center flex flex-col items-center justify-center p-4 font-sans text-shadow"
      style={{ backgroundImage: "url('/images/bg-magic.jpg')" }}
      onClick={feedback ? handleNext : undefined}
    >
      {/* ...省略其餘內容... */}
      {!feedback && renderAlphabetButtons()}
      {/* ...省略其餘內容... */}
    </div>
  );
}
