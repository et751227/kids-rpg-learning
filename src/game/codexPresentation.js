const CATEGORY_PRESENTATION = {
  noun: { belonging: "🧰 萬物寶庫", title: "萬物寶庫", description: "收集冒險世界裡的人、地方與物品。", rewardIcon: "🧰", rewardName: "萬物收藏家徽章" },
  verb: { belonging: "🏃 行動冒險", title: "冒險家的動作", description: "收集讓角色動起來的魔法詞。", rewardIcon: "🏃", rewardName: "行動勇者徽章" },
  adjective: { belonging: "🌈 描述魔法", title: "彩虹魔法", description: "收集讓世界變得更有顏色的描述詞。", rewardIcon: "🌈", rewardName: "彩虹描繪師徽章" },
  adverb: { belonging: "💨 風之節奏", title: "風語旅人", description: "收集告訴我們事情怎麼發生的魔法詞。", rewardIcon: "💨", rewardName: "風語旅人徽章" },
  pronoun: { belonging: "🎭 角色之聲", title: "角色密語", description: "收集能代替人物與事物名字的魔法詞。", rewardIcon: "🎭", rewardName: "角色之聲徽章" },
  preposition: { belonging: "🧭 方向之路", title: "方向旅人", description: "收集能帶你找到位置與方向的魔法詞。", rewardIcon: "🧭", rewardName: "方向旅人徽章" },
  conjunction: { belonging: "🔗 連結魔法", title: "故事之橋", description: "收集能把句子與想法連在一起的魔法詞。", rewardIcon: "🔗", rewardName: "故事之橋徽章" },
  interjection: { belonging: "💬 心情之聲", title: "心情火花", description: "收集能表達驚喜與感受的魔法詞。", rewardIcon: "💬", rewardName: "心情火花徽章" },
  article: { belonging: "🔎 線索魔法", title: "線索之眼", description: "收集幫助我們找到正確名詞的魔法詞。", rewardIcon: "🔎", rewardName: "線索之眼徽章" },
  determiner: { belonging: "🔎 線索魔法", title: "線索之眼", description: "收集幫助我們指出人事物的魔法詞。", rewardIcon: "🔎", rewardName: "線索之眼徽章" },
  number: { belonging: "🔢 數字魔法", title: "數字星盤", description: "收集和數量有關的魔法詞。", rewardIcon: "🔢", rewardName: "數字星盤徽章" },
  numeral: { belonging: "🔢 數字魔法", title: "數字星盤", description: "收集和數量有關的魔法詞。", rewardIcon: "🔢", rewardName: "數字星盤徽章" },
  auxiliary: { belonging: "🪄 助力魔法", title: "助力魔法", description: "收集會幫句子補上能力、時間與語氣的魔法詞。", rewardIcon: "🪄", rewardName: "助力魔法徽章" },
  "be verb": { belonging: "🌟 存在魔法", title: "存在魔法", description: "收集用來說明是、在與存在狀態的魔法詞。", rewardIcon: "🌟", rewardName: "存在魔法徽章" },
  modal: { belonging: "🔮 可能之力", title: "可能之力", description: "收集會表達可能、能力與意願的魔法詞。", rewardIcon: "🔮", rewardName: "可能之力徽章" },
  "question word": { belonging: "🗝️ 疑問之鑰", title: "疑問之鑰", description: "收集打開問題答案的關鍵魔法詞。", rewardIcon: "🗝️", rewardName: "疑問之鑰徽章" },
  possessive: { belonging: "🏷️ 歸屬印記", title: "歸屬印記", description: "收集用來表示誰擁有什麼的魔法詞。", rewardIcon: "🏷️", rewardName: "歸屬印記徽章" },
  demonstrative: { belonging: "👉 指引之光", title: "指引之光", description: "收集用來指出這個、那個與那些事物的魔法詞。", rewardIcon: "👉", rewardName: "指引之光徽章" },
  animal: { belonging: "🐾 森林朋友" },
  animals: { belonging: "🐾 森林朋友" },
  food: { belonging: "🍎 魔法餐桌" },
  foods: { belonging: "🍎 魔法餐桌" },
  color: { belonging: "🌈 彩虹世界" },
  colors: { belonging: "🌈 彩虹世界" },
  family: { belonging: "🏡 家人夥伴" },
  school: { belonging: "🎒 學習天地" },
  body: { belonging: "💪 我的身體" },
  nature: { belonging: "🌿 自然世界" },
  time: { belonging: "🕰️ 時間旅人" },
  place: { belonging: "🏰 冒險地點" },
  places: { belonging: "🏰 冒險地點" },
  object: { belonging: "🎒 冒險道具" },
  objects: { belonging: "🎒 冒險道具" },
  emotion: { belonging: "❤️ 心情魔法" },
  emotions: { belonging: "❤️ 心情魔法" },
};

const SAFE_FALLBACK_PRESENTATION = {
  belonging: "✨ 冒險魔法",
  title: "冒險百寶箱",
  description: "收集這組在冒險世界裡發現的魔法詞。",
  rewardIcon: "🧰",
  rewardName: "冒險百寶箱徽章",
};

const normalizeCategory = (value) => String(value || "").trim().toLowerCase().replace(/[_-]+/g, " ");

export function getWordBelonging(category) {
  const key = normalizeCategory(category);
  return CATEGORY_PRESENTATION[key]?.belonging || SAFE_FALLBACK_PRESENTATION.belonging;
}

export function getRawCollectionCategory(collection) {
  const title = String(collection?.title || "").trim();
  const rewardName = String(collection?.reward?.name || "").trim();
  const titleMatch = title.match(/^([a-z][a-z0-9 _-]*)\s*收藏(?:\s+\d+)?$/i);
  const rewardMatch = rewardName.match(/^([a-z][a-z0-9 _-]*)\s*收藏(?:\s+\d+)?徽章$/i);
  const raw = titleMatch?.[1] || rewardMatch?.[1] || "";
  return raw ? normalizeCategory(raw) : null;
}

export function presentCollection(collection) {
  const category = getRawCollectionCategory(collection);
  if (!category) return collection;
  const presentation = CATEGORY_PRESENTATION[category] || SAFE_FALLBACK_PRESENTATION;
  const packMatch = String(collection?.title || "").trim().match(/\s+(\d+)$/);
  const packSuffix = packMatch?.[1] ? ` ${packMatch[1]}` : "";
  return {
    ...collection,
    title: `${presentation.title}${packSuffix}`,
    description: presentation.description,
    reward: {
      ...(collection.reward || {}),
      icon: presentation.rewardIcon,
      name: packSuffix ? `${presentation.title}${packSuffix} 徽章` : presentation.rewardName,
    },
  };
}
