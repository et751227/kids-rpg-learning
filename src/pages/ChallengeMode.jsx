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

  // --- 所有的 State (狀態) ... (不變) ---
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

  // --- 載入新題目函式 (不變) ---
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
section-two-of-two
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

  // --- 🌟 渲染畫面 (全新佈局) 🌟 ---
  const isBattleOver = (gameState === 'victory' || gameState === 'defeat');
  const buttonsDisabled = (gameState !== 'playerTurn');
  
  if (gameState === "loading" && !currentQuestion) {
     return <div className="p-10 text-3xl text-center animate-bounce text-purple-700">⚔️ 遭遇強敵！準備戰鬥...</div>;
  }

  // 1. 為了讓 UI 不跑版，我們把整個遊戲包在一個「固定長寬比」的容器中
  return (
    // 1A. 這是最外層的黑色背景 (用於手機上下黑邊)
    <div className="w-full min-h-screen bg-black flex items-center justify-center p-4">
      
      {/* 1B. 這是固定 16:9 的遊戲容器 */}
      <div 
        className="relative w-full overflow-hidden shadow-2xl rounded-lg" 
        style={{ maxWidth: '1280px', paddingTop: '56.25%' }} // 16:9 的長寬比
      >

        {/* 1C. 這是你的背景圖，它會填滿 16:9 的容器 */}
        <div
          className="absolute top-0 left-0 right-0 bottom-0 bg-cover bg-center"
          // 🌟🌟🌟 確保你的背景圖路徑正確 🌟🌟🌟
          // 這裡我使用你上傳的檔名
          style={{ backgroundImage: "url('/images/challenge_full_background.png')" }} 
        >
          {/* 所有的 UI 元素都放在這裡面，用百分比定位 */}

          {/* 1. 怪物 HP 條 (放置在頂部中央) */}
          <div className="absolute top-[4%] left-[50%] -translate-x-1/2 w-[40%] max-w-sm h-[4%] z-20">
            <div className="w-full h-full bg-gray-900 bg-opacity-70 rounded-full shadow-inner overflow-hidden border-2 border-red-900">
              <div
                className="bg-red-600 h-full transition-all duration-300 flex items-center justify-end pr-2"
                style={{ width: `${(monsterHp / monsterMaxHp) * 100}%` }}
              >
                  <span className="text-white text-sm font-bold">{monsterHp}</span>
                </div>
            </div>
          </div>

          {/* 2. "DANGER!" 提示 (放置在頂部右側) - 修正版 */}
          {gameState !== 'loading' && !isBattleOver && (
            <div 
              className="absolute top-[4%] right-[4%] 
                       w-auto min-w-[180px] max-w-[240px] py-3 px-4
                       bg-red-700 bg-opacity-90 rounded border-2 border-red-300 shadow-lg
                       flex items-center justify-center z-20
                       text-white text-md md:text-lg font-bold text-center uppercase animate-pulse"
            >
              DANGER!
            </div>
          )}

          {/* 3. 戰鬥訊息 (feedback) (放置在中央) */}
          <div 
            className="absolute top-[28%] left-1/2 -translate-x-1/2 w-[80%] max-w-lg p-3
                      text-center text-lg md:text-xl font-bold text-white bg-black bg-opacity-70 rounded-lg shadow-xl
                      z-30 whitespace-pre-line"
            style={{ minHeight: '80px', lineHeight: '1.4' }}
          >
            {feedback}
          </div>

          {/* 4. 題目區域 (放置在小法師頭頂) */}
          {!isBattleOver && currentQuestion && (
            <>
              <div className="absolute top-[45%] left-1/2 -translate-x-1/2 w-[80%] max-w-lg p-3
                            bg-white bg-opacity-90 rounded-xl shadow-lg border border-blue-300 text-center z-30">
                <div className="text-lg md:text-2xl font-extrabold text-blue-900">
                  請拼出：「{currentQuestion.questionText}」
                </div>
              </div>
              <button
                onClick={() => speak(currentQuestion.questionText)}
                disabled={buttonsDisabled}
                className="absolute top-[55%] left-1/2 -translate-x-1/2 px-6 py-2 bg-blue-500 text-white text-lg rounded-full shadow hover:bg-blue-600 transition disabled:opacity-50 z-30"
             >
                🔊 點我聽發音
              </button>
            </>
         )}

          {/* 5. 輸入框 (放置在法師正前方) */}
          <div className="absolute top-[65%] left-1/2 -translate-x-1/2 min-h-[48px] w-[80%] max-w-lg
                        text-3xl tracking-widest font-mono text-center text-gray-800 bg-white px-6 py-2 rounded-full shadow z-30">
            {input.join("") || "⋯"}
          </div>

          {/* 6. 操作按鈕 (退格, 清除, 攻擊) (放置在輸入框下方) */}
          <div className="absolute top-[75%] left-1/2 -translate-x-1/2 flex gap-3 z-30">
            <button onClick={handleBackspace} disabled={buttonsDisabled} className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded shadow disabled:opacity-50 text-sm md:text-base">
              ⬅ 退格
            </button>
            <button onClick={handleClear} disabled={buttonsDisabled} className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded shadow disabled:opacity-50 text-sm md:text-base">
              🔄 清除
            </button>
            <button
              onClick={handleSubmit}
              disabled={buttonsDisabled || input.length < 1}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded shadow disabled:opacity-50 text-sm md:text-base"
            >
              ✅ 攻擊
            </button>
          </div>

          {/* 7. 字母按鈕 (放置在最底部) - 修正版 */}
          {!isBattleOver && (
            <div className="absolute bottom-[4%] left-1/2 -translate-x-1/2 
                         grid grid-cols-7 gap-1 md:gap-2 w-[90%] max-w-xl z-30">
              {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((char) => (
                <button
                  key={char}
                  onClick={() => handleLetterClick(char)}
                  disabled={buttonsDisabled}
                  className="bg-yellow-300 hover:bg-yellow-400 text-md md:text-lg font-bold py-2 rounded-lg shadow 
                           transition-transform active:scale-95 disabled:opacity-50 disabled:bg-gray-400"
                >
                  {char}
                </button>
              ))}
            </div>
          )}
          
          {/* 8. 戰鬥結束按鈕 (返回世界地圖) */}
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

          {/* 9. 玩家資訊 (放置在左下角) + 玩家血條 */}
          <div className="absolute bottom-[5%] left-[4%] w-[40%] max-w-[250px] z-30 
                      text-white text-left bg-black bg-opacity-60 p-3 rounded-lg shadow-lg">
            <div className="text-lg font-bold">🧙‍♀️ 等級：{playerLevel}</div>
            <div className="text-sm">✨ 經驗值：{exp}</div>
            {/* 玩家血條 */}
            <div className="w-full bg-gray-700 rounded-full h-5 shadow-inner overflow-hidden border border-blue-900 mt-2">
              <div
                className="bg-blue-500 h-full transition-all duration-300 flex items-center justify-end pr-1"
                style={{ width: `${(playerHp / playerMaxHp) * 100}%` }}
              >
                <span className="text-white text-xs font-bold">{playerHp}</span>
              </div>
            </div>
          </div>
          
        </div> {/* 1C. 結束 (背景圖容器) */}
      </div> {/* 1B. 結束 (16:9 容器) */}
    </div> // 1A. 結束 (黑色背景)
  );
}
