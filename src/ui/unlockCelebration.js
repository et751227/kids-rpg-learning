const UNLOCK_TOAST_ID = "kids-vocabulary-unlock-toast";

export function showVocabularyUnlock(unlock) {
  if (!unlock?.newlyUnlocked || typeof document === "undefined") return;

  document.getElementById(UNLOCK_TOAST_ID)?.remove();

  const overlay = document.createElement("div");
  overlay.id = UNLOCK_TOAST_ID;
  overlay.setAttribute("role", "status");
  overlay.setAttribute("aria-live", "polite");
  overlay.style.cssText = [
    "position:fixed",
    "inset:0",
    "z-index:9999",
    "display:flex",
    "align-items:center",
    "justify-content:center",
    "padding:24px",
    "background:rgba(15,23,42,.72)",
    "backdrop-filter:blur(4px)",
  ].join(";");

  const card = document.createElement("div");
  card.style.cssText = [
    "width:min(92vw,520px)",
    "border-radius:28px",
    "padding:28px 24px",
    "text-align:center",
    "background:white",
    "box-shadow:0 24px 80px rgba(0,0,0,.35)",
    "font-family:inherit",
  ].join(";");

  const word = String(unlock.word || "").trim();
  const chinese = String(unlock.chinese || "").trim();
  const unlockedCount = Number(unlock.unlockedCount || 0);
  const trancheTarget = Number(unlock.trancheTarget || 300);

  card.innerHTML = `
    <div style="font-size:52px;line-height:1">✨</div>
    <div style="margin-top:10px;font-size:28px;font-weight:900;color:#6d28d9">NEW WORD UNLOCKED!</div>
    <div style="margin-top:14px;font-size:38px;font-weight:900;color:#0f172a">${escapeHtml(word)}</div>
    <div style="margin-top:4px;font-size:22px;font-weight:700;color:#475569">${escapeHtml(chinese)}</div>
    <div style="margin-top:18px;font-size:18px;font-weight:800;color:#166534">📖 已解鎖 ${unlockedCount} / ${trancheTarget}</div>
    <button type="button" style="margin-top:22px;min-width:180px;min-height:52px;border:0;border-radius:16px;background:#7c3aed;color:white;font-size:20px;font-weight:900;cursor:pointer">收進圖鑑！</button>
  `;

  const close = () => overlay.remove();
  card.querySelector("button")?.addEventListener("click", close, { once: true });
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) close();
  });
  overlay.appendChild(card);
  document.body.appendChild(overlay);

  window.setTimeout(() => {
    if (document.getElementById(UNLOCK_TOAST_ID) === overlay) close();
  }, 6500);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
