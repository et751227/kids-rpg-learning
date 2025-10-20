import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useRecords } from "../hooks/useRecords"; // 導入 useRecords 來儲存紀錄

// --- 1. 戰鬥參數設定 ---
const PLAYER_DAMAGE_HEAVY = 15;
const PLAYER_DAMAGE_NORMAL = 8;
const PLAYER_DAMAGE_LIGHT = 3;
const TIME_LIMIT_HEAVY = 5000;  // 5 秒
const TIME_LIMIT_NORMAL = 10000; // 10 秒

const MONSTER_HP_MIN = 150; // 10 * 重擊
const MONSTER_HP_MAX = 225; // 15 * 重擊

const MONSTER_DAMAGE_BASE = 5;
const MONSTER_DAMAGE_PER_LEVEL = 2; // 5. 怪物傷害隨等級提升

//const CHALLENGE_REWARD_EXP = 100; // 3. 成功獎勵

// 輔助函式：取得隨機整數
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export default function ChallengeMode() {
  const navigate = useNavigate();
  const { addRecord } = useRecords(); // 4. 取得新增紀錄的函式

  // 遊戲狀態： 'loading' | 'playerTurn' | 'calculating' | 'victory' | 'defeat'
  const [gameState, setGameState] = useState("loading");
  
  const [currentQuestion, setCurrentQuestion] = useState(null); // 當前題目
  const [input, setInput] = useState([]);
  const [feedback, setFeedback] = useState("戰鬥開始！"); // 戰鬥訊息
  const questionStartTimeRef = useRef(null); // 紀錄題目出現時間
  
  // --- 戰鬥雙方屬性 ---
  const [playerLevel, setPlayerLevel] = useState(1);
  const [playerHp, setPlayerHp] = useState(50);
  const [playerMaxHp, setPlayerMaxHp] = useState(50);
  const [exp, setExp] = useState(0);

  const [monsterHp, setMonsterHp] = useState(150);
  const [monsterMaxHp, setMonsterMaxHp] = useState(150);
  
  // --- 4. 紀錄挑戰數據 ---
  const [totalTurns, setTotalTurns] = useState(0); // 總回合數
  const [correctAnswers, setCorrectAnswers] = useState(0); // 總答對數
  const [wrongAnswersList, setWrongAnswersList] = useState([]); // 紀錄答錯的題目
  const battleTimerStartRef = useRef(null); // 紀錄挑戰總時間

  // --- 初始化 & 載入新題目 ---

  // 載入玩家數據 (只在組件掛載時執行一次)
  useEffect(() => {
    const storedLevel = parseInt(localStorage.getItem("level")) || 1;
    const storedExp = parseInt(localStorage.getItem("exp")) || 0;
    const calculatedMaxHp = 50 + (storedLevel - 1) * 10;
    
    setPlayerLevel(storedLevel);
    setExp(storedExp);
    setPlayerMaxHp(calculatedMaxHp);
    setPlayerHp(calculatedMaxHp); // 每次挑戰都滿血開始

    // 2. 隨機生成怪物血量
    const newMonsterMaxHp = getRandomInt(MONSTER_HP_MIN, MONSTER_HP_MAX);
    setMonsterMaxHp(newMonsterMaxHp);
    setMonsterHp(newMonsterMaxHp);

    battleTimerStartRef.current = Date.now(); // 4. 紀錄戰鬥開始時間
    loadNewQuestion(); // 載入第一題
  }, []);

  // 載入新題目的函式
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
        setGameState("playerTurn"); // 輪到玩家
        questionStartTimeRef.current = Date.now(); // 紀錄本題開始時間
      })
      .catch((err) => {
        console.error("載入挑戰題庫失敗", err);
        setFeedback("❌ 題庫載入失敗，請重試");
      });
  };

  // --- 處理答案提交 (核心戰鬥邏輯) ---
  const handleSubmit = () => {
    if (gameState !== 'playerTurn') return; // 防止重複提交

    setGameState("calculating"); // 進入結算狀態，暫停玩家操作
    setTotalTurns(prev => prev + 1); // 4. 總回合+1

    const answerTime = Date.now() - questionStartTimeRef.current;
    const currentQuestionText = currentQuestion.questionText;
    const joined = input.join("").toLowerCase();
    const correct = currentQuestion.answer.toLowerCase();

    let playerDamage = 0;
    let turnFeedback = "";

    // 1. 判斷答題是否正確
    if (joined === correct) {
      setCorrectAnswers(prev => prev + 1); // 4. 答對+1

      // 2. 根據時間計算傷害
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
      // 答錯
      playerDamage = 0;
      turnFeedback = `❌ 答錯了！正確是 ${correct}。`;
      setWrongAnswersList(prev => [...prev, currentQuestionText]); // 4. 紀錄錯誤題目
    }
    
    setFeedback(turnFeedback);

    // --- 玩家行動結算 ---
    const newMonsterHp = Math.max(0, monsterHp - playerDamage);
    setMonsterHp(newMonsterHp);
    if (playerDamage > 0) {
      setFeedback(prev => `${prev}\n你對怪物造成了 ${playerDamage} 點傷害！`);
    }

    // 檢查怪物是否死亡
    if (newMonsterHp <= 0) {
      handleBattleEnd(true); // 玩家勝利
      return;
    }

    // --- 怪物行動 (延遲 2 秒，讓玩家看清楚訊息) ---
    setTimeout(() => {
      // 5. 怪物傷害根據玩家等級
      const monsterDamage = MONSTER_DAMAGE_BASE + (playerLevel - 1) * MONSTER_DAMAGE_PER_LEVEL;
      const newPlayerHp = Math.max(0, playerHp - monsterDamage);
      
      setPlayerHp(newPlayerHp);
      setFeedback(prev => `${prev}\n\n👹 怪物反擊！你受到了 ${monsterDamage} 點傷害！`);

      // 檢查玩家是否死亡
      if (newPlayerHp <= 0) {
        handleBattleEnd(false); // 玩家失敗
        return;
      }

      // 戰鬥繼續，載入下一題 (再延遲 2 秒)
      setTimeout(() => {
        loadNewQuestion();
      }, 2000);

    }, 2000);
  };

  // --- 戰鬥結束處理 ---
  const handleBattleEnd = (didPlayerWin) => {
    const timeTakenMs = Date.now() - battleTimerStartRef.current;
    const timeTakenInSeconds = Math.floor(timeTakenMs / 1000);
    const uniqueWrongQuestions = [...new Set(wrongAnswersList)];
    const accuracy = totalTurns > 0 ? Math.floor((correctAnswers / totalTurns) * 100) : 100;
    
    // 🌟 1. 在這裡定義獎勵 = 怪物最大血量 (取代固定的 100)
    const rewardAmount = monsterMaxHp;
    
    if (didPlayerWin) {
      // --- 3. 玩家勝利 ---
      setGameState("victory");
      
      // 🌟 2. 使用新的 rewardAmount
      setFeedback(`🏆 勝利！你擊敗了怪物！\n獲得 ${rewardAmount} EXP！`);
      //setFeedback(`🏆 勝利！你擊敗了怪物！\n獲得 ${CHALLENGE_REWARD_EXP} EXP！`);
      // 🌟 3. 使用新的 rewardAmount
      const newExp = exp + rewardAmount;
      const newLevel = Math.floor(newExp / 50) + 1;
      
      //const newExp = exp + CHALLENGE_REWARD_EXP;
      //const newLevel = Math.floor(newExp / 50) + 1;
      
      // 儲存經驗值和等級
      localStorage.setItem("exp", newExp);
      localStorage.setItem("level", newLevel);
      setExp(newExp);
      if (newLevel > playerLevel) setPlayerLevel(newLevel);

    } else {
      // --- 玩家失敗 ---
      setGameState("defeat");
      setFeedback(`❌ 失敗...你被怪物擊倒了。\n(共 ${totalTurns} 回合)`);
    }

    // --- 4. 儲存紀錄 (無論勝敗) ---
    addRecord({
      accuracy: accuracy,
      wrongList: uniqueWrongQuestions,
      // 🌟 4. 使用新的 rewardAmount
      coins: didPlayerWin ? rewardAmount : 0,
      //coins: didPlayerWin ? CHALLENGE_REWARD_EXP : 0,
      timeTaken: timeTakenInSeconds
    });
  };


  // --- 處理玩家輸入 (與舊版相同) ---
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
      className="min-h-screen bg-cover bg-center flex flex-col items-center justify-between p-4 font-sans text-shadow"
      style={{ backgroundImage: "url('/images/bg-magic.jpg')" }} // 你可以換成戰鬥背景
    >
      
      {/* 區塊 1: 頂部 UI (怪物 & 玩家 狀態) */}
      <div className="w-full max-w-xl mx-auto p-4 bg-black bg-opacity-60 rounded-xl shadow-lg space-y-4">
        {/* 怪物狀態 */}
        <div className="text-center">
          <div className="text-2xl font-bold text-red-400">👹 森林巨魔 (等級 {playerLevel})</div>
          {/* 怪物血條 */}
          <div className="w-full bg-gray-700 rounded-full h-6 shadow-inner overflow-hidden border-2 border-red-900">
            <div
              className="bg-red-500 h-full transition-all duration-500 text-right pr-2 text-white font-bold"
              style={{ width: `${(monsterHp / monsterMaxHp) * 100}%` }}
            >
              {monsterHp} / {monsterMaxHp}
            </div>
          </div>
        </div>
        
        {/* 玩家狀態 */}
        <div className="text-center">
          <div className="text-xl font-bold text-blue-300">🧙‍♀️ 你 (等級 {playerLevel})</div>
          {/* 玩家血條 */}
          <div className="w-full bg-gray-700 rounded-full h-5 shadow-inner overflow-hidden border-2 border-blue-900">
            <div
              className="bg-blue-500 h-full transition-all duration-500 text-right pr-2 text-white font-bold text-sm"
              style={{ width: `${(playerHp / playerMaxHp) * 100}%` }}
            >
              {playerHp} / {playerMaxHp}
            </div>
          </div>
          <div className="text-sm text-yellow-300">經驗值：{exp}</div>
        </div>
      </div>

      {/* 區塊 2: 戰鬥訊息 (取代舊的 "危險!") */}
      <div 
        className="my-4 p-4 text-center text-xl font-bold text-white bg-black bg-opacity-70 rounded-lg max-w-xl whitespace-pre-line"
        style={{ minHeight: '100px' }}
      >
        {feedback}
      </div>

      {/* 區塊 3: 答題區域 (戰鬥中才顯示) */}
      {!isBattleOver && currentQuestion && (
        <div className="w-full max-w-xl flex flex-col items-center">
          <div className="text-2xl font-extrabold text-blue-900 mb-2 px-6 py-3 bg-white bg-opacity-80 rounded-xl shadow-lg drop-shadow-xl border border-blue-300 text-center">
            請拼出：「{currentQuestion.questionText}」
          </div>

          <button
            onClick={() => speak(currentQuestion.questionText)}
            disabled={buttonsDisabled}
            className="mb-3 px-6 py-2 bg-blue-500 text-white text-lg rounded-full shadow hover:bg-blue-600 transition disabled:opacity-50"
          >
            🔊 點我聽發音
          </button>

          <div className="min-h-[48px] mb-3 text-3xl tracking-widest font-mono text-center text-gray-800 bg-white px-6 py-2 rounded-full shadow">
            {input.join("") || "⋯"}
          </div>

          {/* 操作按鈕 */}
          <div className="flex gap-3 mb-4">
            <button onClick={handleBackspace} disabled={buttonsDisabled} className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded shadow disabled:opacity-50">
              ⬅ 退格
            </button>
            <button onClick={handleClear} disabled={buttonsDisabled} className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded shadow disabled:opacity-50">
              🔄 清除
            </button>
            <button
              onClick={handleSubmit}
              disabled={buttonsDisabled || input.length < 1} // 只要有輸入就能按
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded shadow disabled:opacity-50"
            >
              ✅ 攻擊
            </button>
          </div>
        </div>
      )}
      
      {/* 區塊 4: 戰鬥結束 (顯示返回按鈕) */}
      {isBattleOver && (
         <button
            onClick={() => navigate("/")} // 返回世界地圖
            className="mt-6 px-8 py-3 bg-blue-600 text-white text-xl rounded-full shadow-lg hover:bg-blue-700 transition transform hover:scale-105"
          >
            返回世界地圖
          </button>
      )}

      {/* 區塊 5: 字母按鈕 (戰鬥中才顯示) */}
      {!isBattleOver && (
        <div className="grid grid-cols-7 gap-4 max-w-xl mx-auto mb-4 px-4 w-full">
          {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((char) => (
            <button
              key={char}
              onClick={() => handleLetterClick(char)}
              disabled={buttonsDisabled}
              className="bg-yellow-300 hover:bg-yellow-400 text-2xl font-bold py-3 px-4 rounded-xl shadow transition-transform active:scale-95 min-w-[48px] min-h-[48px] disabled:opacity-50 disabled:bg-gray-400"
            >
              {char}
            </button>
          ))}
        </div>
      )}

      {/* 佔位符，確保 justify-between 正常運作 */}
      {isBattleOver && <div className="w-full max-w-xl h-40"></div>} 
      
    </div>
  );
}
