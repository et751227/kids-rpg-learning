import { useMemo, useState } from "react";
import { learningApi } from "../api/learningClient";

const EMPTY = { chinese: "", english: "", category: "", difficulty: "", enabled: true, note: "" };

function parseCsvLine(line) {
  const cells = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (quoted && line[i + 1] === '"') { cell += '"'; i += 1; }
      else quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(cell.trim());
      cell = "";
    } else cell += char;
  }
  cells.push(cell.trim());
  return cells;
}

function parseCsv(text) {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
  if (!lines.length) return [];
  const headers = parseCsvLine(lines[0]).map((value) => value.trim().toLowerCase());
  const aliases = {
    chinese: ["chinese", "中文", "question"],
    english: ["english", "英文", "answer"],
    category: ["category", "分類"],
    difficulty: ["difficulty", "難度"],
    enabled: ["enabled", "啟用"],
    note: ["note", "備註"],
  };
  const indexFor = (key) => headers.findIndex((header) => aliases[key].includes(header));
  const indexes = Object.fromEntries(Object.keys(aliases).map((key) => [key, indexFor(key)]));
  if (indexes.chinese < 0 || indexes.english < 0) throw new Error("CSV 必須包含 chinese/english（或 中文/英文）欄位");
  return lines.slice(1).map((line) => {
    const cells = parseCsvLine(line);
    const value = (key) => indexes[key] >= 0 ? cells[indexes[key]] ?? "" : "";
    const enabledRaw = value("enabled").toLowerCase();
    return {
      chinese: value("chinese"),
      english: value("english"),
      category: value("category"),
      difficulty: value("difficulty"),
      enabled: !["false", "0", "否", "停用"].includes(enabledRaw),
      note: value("note"),
    };
  }).filter((row) => row.chinese || row.english);
}

export default function VocabularyManager() {
  const [adminKey, setAdminKey] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [includeDisabled, setIncludeDisabled] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [importRows, setImportRows] = useState([]);
  const [importPreview, setImportPreview] = useState(null);

  const accuracy = (item) => item.totalAttempts > 0 ? Math.round((item.totalCorrect / item.totalAttempts) * 100) : null;
  const problemCount = useMemo(() => items.filter((item) => item.totalAttempts >= 3 && accuracy(item) < 70).length, [items]);

  const load = async (nextSearch = search) => {
    setBusy(true);
    setMessage("");
    try {
      const result = await learningApi.vocabularyList({ adminKey, search: nextSearch, includeDisabled });
      setItems(result.items || []);
    } catch (error) {
      setMessage(error.status === 403 ? "管理密碼不正確" : "題庫讀取失敗");
    } finally { setBusy(false); }
  };

  const unlock = async () => {
    setBusy(true);
    setMessage("");
    try {
      await learningApi.login(adminKey);
      const result = await learningApi.vocabularyList({ adminKey, includeDisabled: true });
      setItems(result.items || []);
      setUnlocked(true);
    } catch (_) {
      setMessage("管理密碼不正確或題庫服務尚未就緒");
    } finally { setBusy(false); }
  };

  const beginNew = () => { setEditing("new"); setForm(EMPTY); };
  const beginEdit = (item) => {
    setEditing(item.vocabularyId);
    setForm({
      chinese: item.chinese || "",
      english: item.english || "",
      category: item.category || "",
      difficulty: item.difficulty || "",
      enabled: item.enabled !== false,
      note: item.note || "",
    });
  };

  const save = async () => {
    setBusy(true);
    setMessage("");
    try {
      if (editing === "new") await learningApi.vocabularyCreate({ adminKey, item: form });
      else await learningApi.vocabularyUpdate({ adminKey, vocabularyId: editing, item: form });
      setEditing(null);
      setForm(EMPTY);
      setMessage("題庫已儲存");
      await load();
    } catch (error) {
      setMessage(error.body?.error === "vocabulary_duplicate" ? "這組中英文已存在" : "題庫儲存失敗");
    } finally { setBusy(false); }
  };

  const toggleEnabled = async (item) => {
    setBusy(true);
    try {
      await learningApi.vocabularyUpdate({
        adminKey,
        vocabularyId: item.vocabularyId,
        item: { ...item, enabled: !item.enabled },
      });
      await load();
    } catch (_) { setMessage("啟用狀態更新失敗"); }
    finally { setBusy(false); }
  };

  const handleFile = async (file) => {
    setMessage("");
    setImportPreview(null);
    try {
      const rows = parseCsv(await file.text());
      setImportRows(rows);
      const preview = await learningApi.vocabularyImport({ adminKey, rows, dryRun: true });
      setImportPreview(preview);
    } catch (error) {
      setImportRows([]);
      setMessage(error.message || "CSV 解析失敗");
    }
  };

  const commitImport = async () => {
    setBusy(true);
    try {
      const result = await learningApi.vocabularyImport({ adminKey, rows: importRows, dryRun: false });
      setMessage(`匯入完成：新增 ${result.summary?.inserted || 0}，更新 ${result.summary?.updated || 0}`);
      setImportRows([]);
      setImportPreview(null);
      await load();
    } catch (_) { setMessage("題庫匯入失敗"); }
    finally { setBusy(false); }
  };

  if (!unlocked) {
    return (
      <div className="max-w-xl mx-auto bg-white/95 rounded-2xl p-6 shadow-xl">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">🔐 大人題庫管理</h2>
        <p className="text-sm text-slate-600 mb-4">使用既有家庭登入密碼重新驗證後，才能查看答案、修正或匯入題庫。</p>
        <div className="flex gap-2">
          <input type="password" value={adminKey} onChange={(e) => setAdminKey(e.target.value)} onKeyDown={(e) => e.key === "Enter" && unlock()} className="flex-1 border rounded-xl px-4 py-3" placeholder="家庭管理密碼" />
          <button onClick={unlock} disabled={busy || !adminKey} className="px-5 py-3 rounded-xl bg-indigo-600 text-white font-bold disabled:opacity-40">進入</button>
        </div>
        {message && <div className="mt-3 text-red-700 font-semibold">{message}</div>}
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4">
      <div className="grid md:grid-cols-3 gap-3">
        <div className="bg-white/95 rounded-xl p-4 shadow"><div className="text-sm text-slate-500">目前題目</div><div className="text-3xl font-bold">{items.length}</div></div>
        <div className="bg-white/95 rounded-xl p-4 shadow"><div className="text-sm text-slate-500">停用題目</div><div className="text-3xl font-bold">{items.filter((item) => !item.enabled).length}</div></div>
        <div className="bg-white/95 rounded-xl p-4 shadow"><div className="text-sm text-slate-500">可能需校對（≥3次且&lt;70%）</div><div className="text-3xl font-bold text-red-700">{problemCount}</div></div>
      </div>

      <div className="bg-white/95 rounded-2xl p-4 shadow-xl">
        <div className="flex flex-wrap gap-2 items-center mb-4">
          <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} placeholder="搜尋中文或英文" className="flex-1 min-w-[220px] border rounded-xl px-4 py-2" />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={includeDisabled} onChange={(e) => setIncludeDisabled(e.target.checked)} /> 顯示停用</label>
          <button onClick={() => load()} className="px-4 py-2 rounded-xl bg-slate-700 text-white">搜尋</button>
          <button onClick={beginNew} className="px-4 py-2 rounded-xl bg-green-600 text-white font-bold">＋ 新增題目</button>
        </div>

        {editing && (
          <div className="mb-4 p-4 rounded-xl bg-indigo-50 border border-indigo-200 grid md:grid-cols-2 gap-3">
            <input value={form.chinese} onChange={(e) => setForm({ ...form, chinese: e.target.value })} className="border rounded-lg px-3 py-2" placeholder="中文" />
            <input value={form.english} onChange={(e) => setForm({ ...form, english: e.target.value })} className="border rounded-lg px-3 py-2" placeholder="英文" />
            <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="border rounded-lg px-3 py-2" placeholder="分類（可空白）" />
            <input value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })} className="border rounded-lg px-3 py-2" placeholder="難度（可空白）" />
            <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="border rounded-lg px-3 py-2 md:col-span-2" placeholder="備註（可空白）" />
            <label className="flex gap-2 items-center"><input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} /> 啟用</label>
            <div className="flex justify-end gap-2"><button onClick={() => setEditing(null)} className="px-4 py-2 rounded-lg bg-slate-300">取消</button><button onClick={save} disabled={busy || !form.chinese.trim() || !form.english.trim()} className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-bold disabled:opacity-40">儲存</button></div>
          </div>
        )}

        <div className="overflow-auto max-h-[560px] border rounded-xl">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-800 text-white"><tr><th className="p-2 text-left">中文</th><th className="p-2 text-left">英文</th><th className="p-2">使用/正確率</th><th className="p-2">狀態</th><th className="p-2">操作</th></tr></thead>
            <tbody>{items.map((item) => (
              <tr key={item.vocabularyId} className={`border-t ${!item.enabled ? "bg-slate-100 text-slate-500" : accuracy(item) !== null && accuracy(item) < 70 ? "bg-red-50" : "bg-white"}`}>
                <td className="p-2 font-semibold">{item.chinese}</td><td className="p-2 font-mono">{item.english}</td>
                <td className="p-2 text-center">{item.totalAttempts || 0} / {accuracy(item) === null ? "—" : `${accuracy(item)}%`}</td>
                <td className="p-2 text-center">{item.enabled ? "啟用" : "停用"}</td>
                <td className="p-2"><div className="flex justify-center gap-2"><button onClick={() => beginEdit(item)} className="px-3 py-1 rounded bg-blue-600 text-white">編輯</button><button onClick={() => toggleEnabled(item)} className="px-3 py-1 rounded bg-slate-600 text-white">{item.enabled ? "停用" : "啟用"}</button></div></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        {busy && <div className="mt-2 text-slate-500">處理中…</div>}
        {message && <div className="mt-2 font-semibold text-indigo-800">{message}</div>}
      </div>

      <div className="bg-white/95 rounded-2xl p-4 shadow-xl">
        <h3 className="text-xl font-bold mb-2">📥 CSV 批次匯入</h3>
        <p className="text-sm text-slate-600 mb-3">第一列需包含 <code>chinese,english</code>；可選 category,difficulty,enabled,note。會先 Preview，不會直接寫入。</p>
        <input type="file" accept=".csv,text/csv" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
        {importPreview && (
          <div className="mt-3 rounded-xl bg-amber-50 border border-amber-200 p-3">
            <div className="font-bold">預覽：共 {importPreview.summary?.rows} 筆；新增 {importPreview.summary?.new}；既有 {importPreview.summary?.existing}</div>
            <div className="text-sm text-slate-600 mt-1">既有的相同中英文會更新分類/難度/啟用/備註，不會建立重複題目。</div>
            <button onClick={commitImport} disabled={busy} className="mt-3 px-5 py-2 rounded-xl bg-green-600 text-white font-bold disabled:opacity-40">確認匯入</button>
          </div>
        )}
      </div>
    </div>
  );
}
