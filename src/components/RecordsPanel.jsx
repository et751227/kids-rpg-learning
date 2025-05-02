import { useRecords } from "../hooks/useRecords";

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

      <ul className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
        {records.map((r, index) => (
          <li
            key={index}
            className="bg-white bg-opacity-90 p-4 rounded-lg shadow flex flex-col border border-yellow-300"
          >
            <div className="text-sm text-gray-600 mb-1">🕒 {r.time}</div>
            <div className="text-lg font-bold text-blue-800">✅ 正確率：{r.accuracy}%</div>
            <div className="text-sm text-gray-700">❌ 錯誤題目：{r.wrong.join("、") || "無"}</div>
            <div className="text-sm text-yellow-700">💰 金幣獲得：{r.coinsEarned}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
