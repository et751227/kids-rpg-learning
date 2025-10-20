import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useRecords } from "../hooks/useRecords";

// --- 戰鬥參數設定 (不變) ---
const PLAYER_DAMAGE_HEAVY = 15;
const PLAYER_DAMAGE_NORMAL = 8;
const PLAYER_DAMAGE_LIGHT = 3;
const TIME_LIMIT_HEAVY = 5000;
const TIME_LIMIT_NORMAL = 10000;

const MONSTER_HP_MIN = 150;
const MONSTER_HP_MAX = 225;

const MONSTER_DAMAGE_BASE = 5;
const MONSTER_DAMAGE_PER_LEVEL = 2;

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export default function ChallengeMode() {
  const navigate = useNavigate();
  const { addRecord } = useRecords();

  const [gameState, setGameState] = useState("loading");
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [input, setInput] = useState([]);
  const [feedback, setFeedback] = useState("戰鬥開始！");
  const questionStartTimeRef = useRef(null);
  
  const [playerLevel, setPlayerLevel] = useState(1);
  const [playerHp, setPlayerHp] = useState(50);
  const [playerMaxHp, setPlayerMaxHp] = useState(50);
  const [exp, setExp] = useState(0);

  const [monsterHp, setMonsterHp] = useState(150);
  const [monsterMaxHp, setMonsterMaxHp] = useState(150);
  
  const [totalTurns, setTotalTurns] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [wrongAnswersList, setWrongAnswersList] = useState([]);
  const battleTimerStartRef = useRef(null);

  // --- 初始化 & 載入新題目 (不變) ---
  useEffect(() => {
    const storedLevel = parseInt(localStorage.getItem("level")) || 1;
    const storedExp = parseInt(localStorage.getItem("exp")) || 0;
    const calculatedMaxHp = 50 + (storedLevel - 1) * 10;
    
    setPlayerLevel(storedLevel);
    setExp(storedExp);
    setPlayerMaxHp(calculatedMaxHp);
    setPlayerHp(calculatedMaxHp);

    const newMonsterMaxHp = getRandomInt(MONSTER_HP_MIN, MONSTER_HP_MAX);
    setMonsterMaxHp(newMonsterMaxHp);
    setMonsterHp(newMonsterMaxHp);

    battleTimerStartRef.current = Date.now();
    loadNewQuestion();
  }, []);

  const loadNewQuestion = () => {
    setGameState("loading");
    fetch("https://script.google.com/macros/s/AKfycbwjSr6rDRrqo5xq1ztDsRVDORoBWLGZwwtHSSHKkYLUykjNdao9Va-YN3eg02HTWYMh/exec?type=main")
      .then((res) => res.json())
      .then((data) => {
        const clean = data.filter(item => item.chinese && item.english);
        const random = clean[Math.floor(Math.random() * clean.length)];
        
        setCurrentQuestion({
           questionText: random.chinese,
           answer: random.english.trim(),
           direction: "中 ➜ 英"
        });
        
        setInput([]);
        setFeedback("請回答！");
        setGameState("playerTurn");
        questionStartTimeRef.current = Date.now();
      })
      .catch((err) => {
        console.error("載入挑戰題庫失敗", err);
        setFeedback("❌ 題庫載入失敗，請重試");
      });
  };

  // --- 處理答案提交 (不變) ---
  const handleSubmit = () => {
    if (gameState !== 'playerTurn') return;

    setGameState("calculating");
    setTotalTurns(prev => prev + 1);

    const answerTime = Date.now() - questionStartTimeRef.current;
    const currentQuestionText = currentQuestion.questionText;
    const joined = input.join("").toLowerCase();
    const correct = currentQuestion.answer.toLowerCase();

    let playerDamage = 0;
    let turnFeedback = "";
    let wasPlayerCorrect = false;

    if (joined === correct) {
      wasPlayerCorrect = true;
      setCorrectAnswers(prev => prev + 1);

      if (answerTime < TIME_LIMIT_HEAVY) {
        playerDamage = PLAYER_DAMAGE_HEAVY;
        turnFeedback = `⚡️ 答對了！ ${Math.floor(answerTime/1000)}秒 (重擊)！`;
      } else if (answerTime < TIME_LIMIT_NORMAL) {
        playerDamage = PLAYER_DAMAGE_NORMAL;
        turnFeedback = `⚔️ 答對了！ ${Math.floor(answerTime/1000)}秒 (普通攻擊)。`;
      } else {
        playerDamage = PLAYER_DAMAGE_LIGHT;
        turnFeedback = `🩹 答對了！ ${Math.floor(answerTime/1000)}秒 (輕擊)。`;
      }
      
    } else {
      wasPlayerCorrect = false;
      playerDamage = 0;
      turnFeedback = `❌ 答錯了！正確是 ${correct}。`;
      setWrongAnswersList(prev => [...prev, currentQuestionText]);
    }
    
    setFeedback(turnFeedback);

    const newMonsterHp = Math.max(0, monsterHp - playerDamage);
    setMonsterHp(newMonsterHp);
    if (playerDamage > 0) {
      setFeedback(prev => `${prev}\n你對怪物造成了 ${playerDamage} 點傷害！`);
    }

    if (newMonsterHp <= 0) {
      handleBattleEnd(true);
      return;
    }

    setTimeout(() => {
      const monsterDamageFull = MONSTER_DAMAGE_BASE + (playerLevel - 1) * MONSTER_DAMAGE_PER_LEVEL;
      const monsterDamage = wasPlayerCorrect 
                              ? Math.floor(monsterDamageFull / 2)
                              : monsterDamageFull;

      const newPlayerHp = Math.max(0, playerHp - monsterDamage);
      
      setPlayerHp(newPlayerHp);
      
      if (wasPlayerCorrect) {
        setFeedback(prev => `${prev}\n\n👹 怪物反擊！你成功格擋！只受到了 ${monsterDamage} 點傷害！`);
      } else {
        setFeedback(prev => `${prev}\n\n👹 怪物反擊！你受到了 ${monsterDamage} 點傷害！`);
      }

      if (newPlayerHp <= 0) {
        handleBattleEnd(false);
        return;
      }

      setTimeout(() => {
        loadNewQuestion();
      }, 2000);

    }, 2000);
  };

  // --- 戰鬥結束處理 (不變) ---
  const handleBattleEnd = (didPlayerWin) => {
    const timeTakenMs = Date.now() - battleTimerStartRef.current;
    const timeTakenInSeconds = Math.floor(timeTakenMs / 1000);
    const uniqueWrongQuestions = [...new Set(wrongAnswersList)];
    const accuracy = totalTurns > 0 ? Math.floor((correctAnswers / totalTurns) * 100) : 100;

    const rewardAmount = monsterMaxHp; 

    if (didPlayerWin) {
      setGameState("victory");
      setFeedback(`🏆 勝利！你擊敗了怪物！\n獲得 ${rewardAmount} EXP！`);
      
      const newExp = exp + rewardAmount;
      const newLevel = Math.floor(newExp / 50) + 1;
      
      localStorage.setItem("exp", newExp);
      localStorage.setItem("level", newLevel);
      setExp(newExp);
      if (newLevel > playerLevel) setPlayerLevel(newLevel);

    } else {
      setGameState("defeat");
      setFeedback(`❌ 失敗...你被怪物擊倒了。\n(共 ${totalTurns} 回合)`);
    }

    addRecord({
      accuracy: accuracy,
      wrongList: uniqueWrongQuestions,
      coins: didPlayerWin ? rewardAmount : 0,
      timeTaken: timeTakenInSeconds
    });
  };

  // --- 處理玩家輸入 (不變) ---
  const speak = (text) => {
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = "zh-TW";
    speechSynthesis.speak(msg);
  };
  const handleLetterClick = (char) => {
    if (gameState !== 'playerTurn') return;
    if (input.length < (currentQuestion?.answer?.length || 0)) {
      setInput([...input, char]);
    }
  };
  const handleBackspace = () => {
    if (gameState !== 'playerTurn') return;
    setInput(input.slice(0, -1));
  };
  const handleClear = () => {
    if (gameState !== 'playerTurn') return;
    setInput([]);
  };

  // --- 渲染畫面 ---
  const isBattleOver = (gameState === 'victory' || gameState === 'defeat');
  const buttonsDisabled = (gameState !== 'playerTurn');
  
  if (gameState === "loading" && !currentQuestion) {
     return <div className="p-10 text-3xl text-center animate-bounce text-purple-700">⚔️ 遭遇強敵！準備戰鬥...</div>;
  }

  return (
    <div
      className="relative min-h-screen w-screen bg-cover bg-center flex flex-col items-center justify-start p-0 overflow-hidden" // 使用 relative 和 overflow-hidden
      style={{ backgroundImage: "url('/images/challenge_full_background.png')", backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      {/* 所有的 UI 元素都使用 absolute 定位 */}

      {/* 1. 怪物 HP 條 - 調整位置到圖片左上角 */}
      <div className="absolute top-[3.5%] left-[50%] -translate-x-1/2 w-[28%] h-[2.5%] bg-transparent flex items-center justify-center z-20">
        <div className="w-full h-full bg-gray-700 rounded-full shadow-inner overflow-hidden border border-red-800">
          <div
            className="bg-red-500 h-full transition-all duration-300"
            style={{ width: `${(monsterHp / monsterMaxHp) * 100}%` }}
          ></div>
        </div>
        {/* <span className="absolute text-white text-xs font-bold pointer-events-none">HP</span> */}
      </div>

      {/* 2. "DANGER! MONSTER ATTACK!" 提示 - 調整位置到圖片右上角 */}
      {gameState !== 'loading' && !isBattleOver && (
        <div 
          className="absolute top-[16%] right-[8%] w-[25%] h-[8%]
                     bg-red-700 bg-opacity-90 rounded border-2 border-red-300 shadow-lg
                     flex items-center justify-center z-20
                     text-white text-lg font-bold text-center uppercase animate-pulse"
        >
          DANGER! MONSTER ATTACK!
        </div>
      )}

      {/* 3. 戰鬥訊息 (feedback) - 定位在圖片中央偏下，怪物和英雄之間 */}
      <div 
        className="absolute top-[30%] left-1/2 -translate-x-1/2 w-4/5 max-w-md p-3
                   text-center text-xl font-bold text-white bg-black bg-opacity-70 rounded-lg shadow-xl
                   z-30 whitespace-pre-line"
        style={{ minHeight: '80px', lineHeight: '1.4' }}
      >
        {feedback}
      </div>

      {/* 4. 題目區域 (只有在戰鬥中才顯示) - 定位在怪物下方，英雄上方 */}
      {!isBattleOver && currentQuestion && (
        <>
          <div className="absolute top-[48%] left-1/2 -translate-x-1/2 w-4/5 max-w-md p-3
                          bg-white bg-opacity-80 rounded-xl shadow-lg border border-blue-300 text-center z-30">
            <div className="text-lg font-extrabold text-blue-900">
              請拼出：「{currentQuestion.questionText}」
            </div>
          </div>
          <button
            onClick={() => speak(currentQuestion.questionText)}
            disabled={buttonsDisabled}
            className="absolute top-[58%] left-1/2 -translate-x-1/2 px-6 py-2 bg-blue-500 text-white text-lg rounded-full shadow hover:bg-blue-600 transition disabled:opacity-50 z-30"
          >
            🔊 點我聽發音
          </button>
        </>
      )}

      {/* 5. 輸入框 - 定位在英雄上方 */}
      <div className="absolute top-[68%] left-1/2 -translate-x-1/2 min-h-[48px] w-4/5 max-w-md
                      text-3xl tracking-widest font-mono text-center text-gray-800 bg-white px-6 py-2 rounded-full shadow z-30">
        {input.join("") || "⋯"}
      </div>

      {/* 6. 操作按鈕 (退格, 清除, 攻擊) - 定位在輸入框下方 */}
      <div className="absolute top-[78%] left-1/2 -translate-x-1/2 flex gap-3 z-30">
        <button onClick={handleBackspace} disabled={buttonsDisabled} className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded shadow disabled:opacity-50">
          ⬅ 退格
        </button>
        <button onClick={handleClear} disabled={buttonsDisabled} className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded shadow disabled:opacity-50">
          🔄 清除
        </button>
        <button
          onClick={handleSubmit}
          disabled={buttonsDisabled || input.length < 1}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded shadow disabled:opacity-50"
        >
          ✅ 攻擊
        </button>
      </div>

      {/* 7. 字母按鈕 - 定位在 Image 2 圖片的底部字母位置，並調整大小 */}
      {!isBattleOver && (
        <div className="absolute bottom-[2%] left-1/2 -translate-x-1/2 
                        grid grid-cols-7 gap-3 w-[70%] max-w-lg z-30"> {/* 調整 gap 和 w */}
          {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((char) => (
            <button
              key={char}
              onClick={() => handleLetterClick(char)}
              disabled={buttonsDisabled}
              className="bg-yellow-300 hover:bg-yellow-400 text-xl font-bold py-2 rounded-lg shadow 
                         transition-transform active:scale-95 disabled:opacity-50 disabled:bg-gray-400"
              style={{ minWidth: '40px', minHeight: '40px' }} // 調整按鈕大小
            >
              {char}
            </button>
          ))}
        </div>
      )}
      
      {/* 8. 戰鬥結束按鈕 (返回世界地圖) - 定位在中央 */}
      {isBattleOver && (
         <button
            onClick={() => navigate("/")}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                       mt-6 px-8 py-3 bg-blue-600 text-white text-xl rounded-full shadow-lg 
                       hover:bg-blue-700 transition transform hover:scale-105 z-40"
          >
            返回世界地圖
          </button>
      )}

      {/* 9. 玩家資訊 (等級、血量、經驗值) - 定位在圖片左下角 */}
      <div className="absolute bottom-[10%] left-[5%] text-white text-left z-30">
         <div className="text-lg font-bold">🧙‍♀️ 等級：{playerLevel}</div>
         <div className="text-sm">✨ 經驗值：{exp}</div>
         <div className="text-lg font-bold text-red-300">❤️ HP: {playerHp} / {playerMaxHp}</div>
      </div>

    </div>
  );
}
