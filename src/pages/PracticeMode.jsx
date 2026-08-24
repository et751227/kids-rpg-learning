import { useEffect, useState } from "react";
import AnswerPad from "../components/AnswerPad";

export default function RPGWordGameMain() {
  const [input, setInput] = useState([]);
  const [feedback, setFeedback] = useState("");
  const [exp, setExp] = useState(() => parseInt(localStorage.getItem("exp")) || 0);
  const [level, setLevel] = useState(() => parseInt(localStorage.getItem("level")) || 1);
  const [maxHp, setMaxHp] = useState(50);
  const [hp, setHp] = useState(50);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadNewQuestion();
  }, []);

  useEffect(() => {
    const clickHandler = () => {
      if (feedback) handleNext();
    };
    window.addEventListener("click", clickHandler);
    return () => window.removeEventListener("click", clickHandler);
  }, [feedback]);

  const loadNewQuestion = () => {
    setIsLoading(true);
    fetch("https://script.google.com/macros/s/AKfycbwjSr6rDRrqo5xq1ztDsRVDORoBWLGZwwtHSSHKkYLUykjNdao9Va-YN3eg02HTWYMh/exec?type=main")
      .then((res) => res.json())
      .then((data) => {
        const clean = data.filter((item) => item.chinese && item.english);
        const random = clean[Math.floor(Math.random() * clean.length)];
        setCurrentQuestion({
          questionText: random.chinese,
          answer: random.english,
          direction: "中 ➜ 英",
        });
        setIsLoading(false);
      });
  };

  const speak = (text) => {
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = "zh-TW";
    speechSynthesis.speak(msg);
  };

  const handleLetterClick = (char) => {
    if (input.length < (currentQuestion?.answer?.length || 0)) {
      setInput((value) => [...value, char]);
    }
  };

  const handleSubmit = () => {
    const joined = input.join("").toLowerCase();
    const correct = currentQuestion.answer.toLowerCase();

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
      setHp(Math.max(hp - 10, 0));
      setFeedback(`❌ 錯了！正確是 ${correct}，點擊任意處繼續...`);
    }
  };

  const handleNext = () => {
    setFeedback("");
    setInput([]);
    loadNewQuestion();
  };

  if (isLoading || !currentQuestion) {
    return <div className="p-10 text-3xl text-center animate-bounce text-purple-700">🧠 載入拼字題中...</div>;
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center flex flex-col items-center justify-center p-3 md:p-5 font-sans text-shadow"
      style={{ backgroundImage: "url('/images/bg-magic.jpg')" }}
    >
      <div className="w-full max-w-6xl grid gap-3 md:gap-4" style={{ gridTemplateRows: "auto auto auto 1fr" }}>
        <div className="text-center text-3xl md:text-4xl font-extrabold text-purple-700 tracking-wider drop-shadow-md">
          🏡 村莊單字練習
        </div>

        <div className="grid grid-cols-[auto_1fr] gap-4 items-center bg-white/90 px-4 py-3 rounded-2xl shadow-lg">
          <img
            src="/images/hero.png"
            alt="小魔法師"
            className="w-20 h-20 md:w-24 md:h-24 rounded-full ring-4 ring-purple-400 bg-white p-1"
          />
          <div className="grid gap-2">
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-lg font-semibold text-gray-800">
              <div>🧙‍♀️ 等級：<span className="text-blue-600">{level}</span></div>
              <div>✨ 經驗值：<span className="text-yellow-600">{exp}</span></div>
              <div>❤️ 血量：<span className="text-red-700">{hp} / {maxHp}</span></div>
            </div>
            <div className="w-full bg-red-200 rounded-full h-4 overflow-hidden">
              <div className="bg-red-500 h-full transition-all duration-500" style={{ width: `${(hp / maxHp) * 100}%` }} />
            </div>
          </div>
        </div>

        <div className="grid gap-2 text-center">
          <div className="text-sm md:text-base italic text-gray-700">題型：{currentQuestion.direction}</div>
          <div className="text-xl md:text-2xl font-extrabold text-blue-800 bg-white/90 px-6 py-2 rounded-xl drop-shadow">
            請拼出：「{currentQuestion.questionText}」
          </div>
          <div>
            <button
              onClick={(event) => { event.stopPropagation(); speak(currentQuestion.questionText); }}
              className="px-5 py-2 bg-blue-500 text-white text-base md:text-lg rounded-full shadow active:scale-95"
            >
              🔊 點我聽發音
            </button>
          </div>
        </div>

        {!feedback ? (
          <AnswerPad
            input={input}
            answerLength={currentQuestion.answer.length}
            onLetter={handleLetterClick}
            onBackspace={() => setInput((value) => value.slice(0, -1))}
            onClear={() => setInput([])}
            onSubmit={handleSubmit}
          />
        ) : (
          <button
            onClick={(event) => { event.stopPropagation(); handleNext(); }}
            className="self-center justify-self-center text-2xl font-bold text-white bg-black/70 px-6 py-4 rounded-xl max-w-2xl min-h-[72px]"
          >
            {feedback}
          </button>
        )}
      </div>
    </div>
  );
}
