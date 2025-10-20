import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useRecords } from "../hooks/useRecords"; // 導入 useRecords 來儲存紀錄

// --- 參數化設定 (未來可調整) ---
const TOTAL_QUESTIONS = 10;                // 1. 每次挑戰的總題數
const HP_DRAIN_INTERVAL_MS = 5000;         // 2. 每隔 5000 毫秒 (5秒)
const HP_DRAIN_AMOUNT = 1;                 // 2. 自動扣除 1 滴血
const WRONG_ANSWER_HP_PENALTY = 10;        // 答錯時的懲罰
const CHALLENGE_REWARD_EXP = 100;          // 3. 挑戰成功的一次性獎勵
// ------------------------------------

export default function ChallengeMode() {
  const navigate = useNavigate();
  const { addRecord } = useRecords(); // 4. 取得新增紀錄的函式

  // 挑戰狀態： 'loading' | 'playing' | 'paused' | 'success' | 'failed'
  const [challengeState, setChallengeState] = useState("loading");
  
  const [challengeQuestions, setChallengeQuestions] = useState([]); // 10道題目
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0); // 目前題號 (0-9)
  
  // 4. 紀錄挑戰數據
  const [wrongAnswersList, setWrongAnswersList] = useState([]); // 紀錄答錯的題目 (questionText)
  const timerStartRef = useRef(null); // 紀錄挑戰開始時間

  const [input, setInput] = useState([]);
  const [feedback, setFeedback] = useState("");

  // 玩家屬性 (從 localStorage 載入)
  const [exp, setExp] = useState(() => parseInt(localStorage.getItem("exp")) || 0);
  const [level, setLevel] = useState(() => parseInt(localStorage.getItem("level")) || 1);
  const [maxHp, setMaxHp] = useState(() => 50 + (parseInt(localStorage.getItem("level") || 1) - 1) * 10);
  // 挑戰開始時，血量是滿的
  const [hp, setHp] = useState(() => 50 + (parseInt(localStorage.getItem("level") || 1) - 1) * 10); 
  
  // 1. 載入 10 道題目
  useEffect(() => {
    setChallengeState("loading");
    fetch("https://script.google.com/macros/s/AKfycbwjSr6rDRrqo5xq1ztDsRVDORoBWLGZwwtHSSHKkYLUykjNdao9Va-YN3eg02HTWYMh/exec?type=main")
      .then((res) => res.json())
      .then((data) => {
        // 洗牌並取出 10 題
        const shuffled = data
          .filter(item => item.chinese && item.english)
          .sort(() => 0.5 - Math.random());
        
        const challengeSet = shuffled.slice(0, TOTAL_QUESTIONS).map(random => ({
           questionText: random.chinese,
           answer: random.english.trim(),
           direction: "中 ➜ 英"
        }));

        setChallengeQuestions(challengeSet);
        timerStartRef.current = Date.now(); // 4. 紀錄開始時間
        setChallengeState("playing");
      })
      .catch((err) => {
        console.error("載入挑戰題庫失敗", err);
        setFeedback("❌ 題庫載入失敗，請重試");
        setChallengeState("failed");
      });
  }, []);

  // 2. HP 自動扣除 (5秒扣1滴血)
  useEffect(() => {
    // 只有在 'playing' 狀態下才計時
    if (challengeState !== "playing") {
      return; 
    }
    const timerId = setInterval(() => {
      setHp((prevHp) => Math.max(0, prevHp - HP_DRAIN_AMOUNT));
    }, HP_DRAIN_INTERVAL_MS);

    // 清除計時器
    return () => clearInterval(timerId);
  }, [challengeState]); // 當 [challengeState] 改變時 (例如暫停或結束)，重新觸發 effect

  // 2. 檢查血量是否歸零
  useEffect(() => {
    if (hp <= 0 && challengeState === "playing") {
      // 血量歸零，觸發挑戰結束 (標記為失敗)
      handleChallengeEnd(true); 
    }
  }, [hp, challengeState]);

  // --- 處理玩家輸入 ---
  const speak = (text) => {
    if (challengeState !== 'playing') return;
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = "zh-TW";
    speechSynthesis.speak(msg);
  };
  const handleLetterClick = (char) => {
    if (challengeState !== 'playing') return;
    const currentQuestion = challengeQuestions[currentQuestionIndex];
    if (input.length < (currentQuestion?.answer?.length || 0)) {
      setInput([...input, char]);
    }
  };
  const handleBackspace = () => {
    if (challengeState !== 'playing') return;
    setInput(input.slice(0, -1));
  };
  const handleClear = () => {
    if (challengeState !== 'playing') return;
    setInput([]);
  };

  // --- 處理答案提交 ---
  const handleSubmit = () => {
    if (challengeState !== 'playing') return; // 防止重複提交

    const currentQuestion = challengeQuestions[currentQuestionIndex];
    const joined = input.join("").toLowerCase();
    const correct = currentQuestion.answer.toLowerCase();

    setChallengeState("paused"); // 暫停 (停止HP扣血)

    if (joined === correct) {
      setFeedback("🎉 答對了！");
    } else {
      const newHp = Math.max(hp - WRONG_ANSWER_HP_PENALTY, 0);
      setHp(newHp);
      // 4. 紀錄錯誤題目
      setWrongAnswersList(prev => [...prev, currentQuestion.questionText]); 
      setFeedback(`❌ 錯了！正確是 ${correct}`);
    }

    // 顯示回饋 1.5 秒後，進入下一題
    setTimeout(() => {
      goToNextQuestion();
    }, 1500);
  };

  // --- 處理流程控制 ---
  const goToNextQuestion = () => {
    // 如果因答錯扣血導致HP歸零，立即結束
    if (hp <= 0) {
      handleChallengeEnd(true); // 標記為失敗
      return;
    }

    // 檢查是否還有下一題
    if (currentQuestionIndex < TOTAL_QUESTIONS - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setInput([]);
      setFeedback("");
      setChallengeState("playing"); // 恢復遊戲 (HP會繼續扣)
    } else {
      // 10 題全部答完，進入結算 (標記為成功)
      handleChallengeEnd(false); 
    }
  };

  // 3 & 4. 挑戰結束，結算獎勵 & 儲存紀錄
  const handleChallengeEnd = (isFailure) => {
    // 如果已經結束了，就不要重複執行 (例如扣血歸零 和 答完最後一題 同時發生)
    if (challengeState !== 'playing' && challengeState !== 'paused') return;

    const challengeFailed = isFailure || hp <= 0;
    
    // 4. 計算挑戰數據
    const timeTakenMs = Date.now() - timerStartRef.current;
    const timeTakenInSeconds = Math.floor(timeTakenMs / 1000);
    // 使用 Set 來計算不重複的錯誤題數
    const uniqueWrongQuestions = [...new Set(wrongAnswersList)];
    const correctCount = TOTAL_QUESTIONS - uniqueWrongQuestions.length;
    const accuracy = Math.floor((correctCount / TOTAL_QUESTIONS) * 100);

    // 4. 儲存紀錄 (無論成功或失敗)
    addRecord({
      accuracy: accuracy,
      wrongList: uniqueWrongQuestions,
      coins: challengeFailed ? 0 : CHALLENGE_REWARD_EXP, // 失敗0獎勵，成功100
      timeTaken: timeTakenInSeconds // 儲存花了幾秒
    });
    
    if (challengeFailed) {
      // --- 挑戰失敗 ---
      setChallengeState("failed");
      setFeedback(`❌ 挑戰失敗... (正確率 ${accuracy}%)`);
    } else {
      // --- 挑戰成功 ---
      setChallengeState("success");
      setFeedback(`🏆 挑戰完成！獲得 ${CHALLENGE_REWARD_EXP} EXP (正確率 ${accuracy}%)`);

      // 3. 結算經驗值
      const newExp = exp + CHALLENGE_REWARD_EXP;
      const newLevel = Math.floor(newExp / 50) + 1;

      if (newLevel > level) {
        // 升級了
        const newMaxHp = 50 + (newLevel - 1) * 10;
        setLevel(newLevel);
        setMaxHp(newMaxHp);
        setHp(newMaxHp); // 升級回滿血
      } else {
        // 沒升級，血量不變 (保持挑戰結束時的血量)
      }
      
      setExp(newExp);
      localStorage.setItem("exp", newExp);
      localStorage.setItem("level", newLevel);
    }
  };

  // --- 渲染畫面 ---
  if (challengeState === "loading" || challengeQuestions.length === 0) {
    return <div className="p-10 text-3xl text-center animate-bounce text-purple-700">🧠 載入挑戰題中... (共 {TOTAL_QUESTIONS} 題)</div>;
  }

  const currentQuestion = challengeQuestions[currentQuestionIndex];
  const isGameOver = (challengeState === 'success' || challengeState === 'failed');
  const buttonsDisabled = (challengeState !== 'playing'); // 字母按鈕是否禁用

  return (
    <div
      className="min-h-screen bg-cover bg-center flex flex-col items-center justify-center p-4 font-sans text-shadow"
      style={{ backgroundImage: "url('/images/bg-magic.jpg')" }}
    >
      <div className="text-5xl font-extrabold text-red-600 mb-2 tracking-wider drop-shadow-md">
        🏆 章節挑戰模式
      </div>
      
      <div className="text-2xl font-bold text-white mb-4 bg-black bg-opacity-60 px-4 py-2 rounded-lg">
        第 {currentQuestionIndex + 1} / {TOTAL_QUESTIONS} 題
      </div>

      {/* 玩家屬性顯示 */}
      <div className="bg-white bg-opacity-90 px-6 py-4 rounded-2xl shadow-lg mb-6 w-full max-w-xs flex flex-col items-center gap-3">
        {/* ... (等級和經驗值不變) ... */}
        <div className="flex gap-4 text-xl font-semibold text-gray-800">
          <div>🧙‍♀️ 等級：<span className="text-blue-600">{level}</span></div>
          <div>✨ 經驗值：<span className="text-yellow-600">{exp}</span></div>
        </div>
        {/* 血條 */}
        <div className="w-full bg-red-200 rounded-full h-4 shadow-inner overflow-hidden">
          <div
            className="bg-red-500 h-full transition-all duration-300"
            style={{ width: `${(hp / maxHp) * 100}%` }}
          ></div>
        </div>
        <div className="inline-block px-3 py-1 bg-white bg-opacity-80 rounded-full shadow text-red-700 font-bold text-sm tracking-wide border border-red-300">
          ❤️ 血量：{hp} / {maxHp} 
          {challengeState === 'playing' && <span className="ml-2 animate-pulse">(每5秒-1)</span>}
        </div>
      </div>
      
      {/* 2. (Bonus) 怪物攻擊提示 - 改善版 */}
      {challengeState === 'playing' && hp > 0 && ( // 確保血量還有才顯示
        <div className="relative mb-6 w-full max-w-sm flex flex-col items-center">
          {/* 想像中的怪物位置 (沒有圖案時用空 div 佔位) */}
          <div className="w-28 h-28 bg-transparent mb-2"></div> 
          
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                          text-red-500 text-5xl font-extrabold 
                          bg-red-900 bg-opacity-70 p-4 rounded-xl shadow-lg 
                          animate-flash-shake z-10 whitespace-nowrap
                          border-4 border-red-300">
            危險！怪物攻擊中！
          </div>
        </div>
      )}

      {/* 題目區 (只有在遊戲中才顯示) */}
      {!isGameOver && currentQuestion && (
        <>
          <div className="text-lg italic text-gray-600 mb-2">題型：{currentQuestion.direction}</div>
          <div className="text-2xl font-extrabold text-blue-900 mb-4 px-6 py-3 bg-white bg-opacity-80 rounded-xl shadow-lg drop-shadow-xl border border-blue-300 text-center max-w-lg">
            請拼出：「{currentQuestion.questionText}」
          </div>

          <button
            onClick={() => speak(currentQuestion.questionText)}
            disabled={buttonsDisabled}
            className="mb-5 px-6 py-2 bg-blue-500 text-white text-lg rounded-full shadow hover:bg-blue-600 transition disabled:opacity-50"
          >
            🔊 點我聽發音
          </button>

          <div className="min-h-[48px] mb-4 text-3xl tracking-widest font-mono text-center text-gray-800 bg-white px-6 py-2 rounded-full shadow">
            {input.join("") || "⋯"}
          </div>

          {/* 操作按鈕 */}
          <div className="flex gap-3 mb-6">
            <button onClick={handleBackspace} disabled={buttonsDisabled} className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded shadow disabled:opacity-50">
              ⬅ 退格
            </button>
            <button onClick={handleClear} disabled={buttonsDisabled} className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded shadow disabled:opacity-50">
              🔄 清除
            </button>
            <button
              onClick={handleSubmit}
              disabled={buttonsDisabled || input.length !== currentQuestion.answer.length}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded shadow disabled:opacity-50"
            >
              ✅ 確認
            </button>
          </div>

          {/* 字母按鈕 (renderAlphabetButtons) */}
          <div className="grid grid-cols-7 gap-4 max-w-xl mx-auto mb-4 px-4">
            {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((char) => (
              <button
                key={char}
                onClick={() => handleLetterClick(char)}
                disabled={buttonsDisabled}
                className="bg-yellow-300 hover:bg-yellow-400 text-2xl font-bold py-3 px-4 rounded-xl shadow transition-transform active:scale-95 min-w-[52px] min-h-[52px] disabled:opacity-50"
              >
                {char}
              </button>
            ))}
          </div>
        </>
      )}

      {/* 回饋/結算 訊息 */}
      {feedback && (
        <div className="mt-6 text-2xl font-bold text-center text-white bg-black bg-opacity-60 px-6 py-3 rounded-xl animate-bounce max-w-md">
          {feedback}
        </div>
      )}

      {/* 遊戲結束按鈕 */}
      {isGameOver && (
         <button
            onClick={() => navigate("/")} // 返回世界地圖
            className="mt-6 px-8 py-3 bg-blue-600 text-white text-xl rounded-full shadow-lg hover:bg-blue-700 transition transform hover:scale-105"
          >
            返回世界地圖
          </button>
      )}
    </div>
  );
}
