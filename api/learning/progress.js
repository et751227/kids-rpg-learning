const {
  noStore,
  playerId,
  upstream,
  verifyAdminSession,
  verifyParentSession,
  verifySession,
} = require("../../server/learning-proxy.cjs");

function normalizeBattle(battle) {
  return {
    sessionKey: battle.sessionKey,
    monsterTier: battle.monsterTier,
    outcome: battle.outcome,
    questionCount: Number(battle.questionCount || 0),
    correctCount: Number(battle.correctCount || 0),
    wrongCount: Number(battle.wrongCount || 0),
    earnedExp: Number(battle.exp?.earned || 0),
    levelBefore: Number(battle.level?.before || 1),
    levelAfter: Number(battle.level?.after || 1),
    completedAt: battle.completedAt,
  };
}

module.exports = async function handler(req, res) {
  noStore(res);
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  if (!verifySession(req) && !verifyParentSession(req) && !verifyAdminSession(req)) {
    return res.status(401).json({ error: "learning_session_required" });
  }

  try {
    const encodedPlayerId = encodeURIComponent(playerId());

    if (req.query?.view === "battles") {
      const requestedLimit = Number.parseInt(String(req.query?.limit ?? "50"), 10);
      const requestedOffset = Number.parseInt(String(req.query?.offset ?? "0"), 10);
      const limit = Number.isFinite(requestedLimit) ? Math.min(100, Math.max(1, requestedLimit)) : 50;
      const offset = Number.isFinite(requestedOffset) ? Math.max(0, requestedOffset) : 0;
      const history = await upstream(`/v1/players/${encodedPlayerId}/battles?limit=${limit}&offset=${offset}`);
      if (history.status < 200 || history.status >= 300) {
        return res.status(history.status).json(history.payload);
      }
      return res.status(200).json({
        historySemantics: history.payload?.historySemantics || "lifetime-paginated",
        retentionPolicy: history.payload?.retentionPolicy || "permanent",
        lifetimeBattleSummary: history.payload?.summary || null,
        lifetimeBattleHistory: Array.isArray(history.payload?.battles)
          ? history.payload.battles.map(normalizeBattle)
          : [],
        battleHistoryPage: history.payload?.page || {
          offset,
          limit,
          returned: 0,
          hasMore: false,
          nextOffset: null,
        },
      });
    }

    const progress = await upstream(`/v1/players/${encodedPlayerId}/progress`);
    if (progress.status < 200 || progress.status >= 300) {
      return res.status(progress.status).json(progress.payload);
    }

    let wordWeakness = null;
    try {
      const weakness = await upstream(`/v1/players/${encodedPlayerId}/word-weakness`);
      if (weakness.status >= 200 && weakness.status < 300) {
        wordWeakness = weakness.payload;
      } else {
        console.warn("learning weakness read model unavailable", { status: weakness.status });
      }
    } catch (error) {
      console.warn("learning weakness read model request failed", { message: error?.message || "unknown" });
    }

    return res.status(200).json({
      ...progress.payload,
      wordWeakness,
    });
  } catch (error) {
    console.error("learning progress proxy failed", error);
    return res.status(502).json({ error: "learning_upstream_unavailable" });
  }
};
