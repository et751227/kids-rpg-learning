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

const RAW_COLLECTION_CATEGORIES = new Set([
  "noun", "verb", "adjective", "adverb", "pronoun", "preposition", "conjunction", "interjection", "article", "determiner", "number", "numeral",
]);

const normalizeCategory = (value) => String(value || "").trim().toLowerCase().replace(/[_-]+/g, " ");

export function getWordBelonging(category) {
  const key = normalizeCategory(category);
  return CATEGORY_PRESENTATION[key]?.belonging || "✨ 冒險魔法";
}

export function getRawCollectionCategory(collection) {
  const title = String(collection?.title || "").trim();
  const rewardName = String(collection?.reward?.name || "").trim();
  const titleMatch = title.match(/^([a-z][a-z _-]*)\s*收藏$/i);
  const rewardMatch = rewardName.match(/^([a-z][a-z _-]*)\s*收藏徽章$/i);
  const candidate = normalizeCategory(titleMatch?.[1] || rewardMatch?.[1] || "");
  return RAW_COLLECTION_CATEGORIES.has(candidate) ? candidate : null;
}

export function presentCollection(collection) {
  const category = getRawCollectionCategory(collection);
  if (!category) return collection;
  const presentation = CATEGORY_PRESENTATION[category];
  return {
    ...collection,
    title: presentation.title,
    description: presentation.description,
    reward: {
      ...(collection.reward || {}),
      icon: presentation.rewardIcon,
      name: presentation.rewardName,
    },
  };
}
