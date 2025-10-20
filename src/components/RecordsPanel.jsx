import { useState } from "react"; // 導入 useState
import { useRecords } from "../hooks/useRecords";

// 2. 建立一個新的子元件來顯示單筆紀錄，並管理自己的 "是否展開" 狀態
function RecordItem({ record }) {
  const [isExpanded, setIsExpanded] = useState(false); // 4. 錯誤列表是否展開

  // 格式化秒數為 MM:SS
  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds === undefined) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <li className="bg-white bg-opacity-90 p-4 rounded-lg shadow flex flex-col border border-yellow-300">
      <div className="text-sm text-gray-600 mb-2">🕒 挑戰時間：{record.time}</div>
      <div className="flex justify-between items-center mb-2">
        <div className="text-lg font-bold text-blue-800">✅ 正確率：{record.accuracy}%</div>
        <div className="text-sm font-semibold text-gray-700">
          ⏱️ 花費時間：{formatTime(record.timeTaken)}
        </div>
      </div>
      <div className="text-sm text-yellow-700 mb-2">
        💰 獲得獎勵：{record.coinsEarned} {record.coinsEarned > 0 ? 'EXP' : ''}
      </div>

      {/* 4. 檢視錯誤題目按鈕 */}
      {record.wrong && record.wrong.length > 0 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-left text-red-700 hover:text-red-900 font-semibold mt-2"
        >
          {isExpanded ? '➖ 隱藏錯誤題目' : '➕ 檢視錯誤題目'} ({record.wrong.length} 題)
        </button>
      )}

      {/* 4. 展開的錯誤題目列表 */}
      {isExpanded && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <ul className="list-disc list-inside space-y-1 text-sm text-red-900">
            {record.wrong.map((wrongItem, idx) => (
              <li key={idx}>{wrongItem}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 如果沒有錯誤題目 */}
      {record.wrong && record.wrong.length === 0 && (
        <div className="text-sm text-green-700 font-semibold mt-2">
          🎉 完美通關！沒有錯誤！
        </div>
      )}
    </li>
  );
}


export default function RecordsPanel() {
  const { records, clearRecords } = useRecords();

  if (records.length === 0) {
    return (
      <div className="p-6 text-center text-lg text-gray-700 bg-white bg-opacity-90 rounded-lg shadow-lg max-w-lg mx-auto mt-10">
        📝 尚無任何成績紀錄
      </div>
    );
  }

  return (
    <div className="p-6 bg-yellow-100 bg-opacity-70 rounded-xl shadow-xl max-w-2xl mx-auto mt-10">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-yellow-800">📖 歷史挑戰紀錄</h2>
        <button
          onClick={clearRecords}
          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded shadow text-sm"
        >
          清空紀錄
        </button>
      </div>

      {/* 1. 改為使用新的 RecordItem 元件 */}
      <ul className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
        {records.map((r, index) => (
          <RecordItem key={index} record={r} />
        ))}
      </ul>
    </div>
  );
}
