(function () {
  "use strict";

  const ns = (globalThis.__AutoKorea = globalThis.__AutoKorea || {});

  const KR_LABELS_STRONG = new Set([
    "korea, republic of",
    "republic of korea",
    "south korea",
    "korea (south)",
    "korea, south",
    "korea (republic of)",
    "korea republic of",
    "korea south",
    "the republic of korea",
    "south korea (republic of korea)",
    "south korea, republic of",
    "rep. of korea",
    "rep of korea",
    "rok",
    "대한민국",
    "한국",
    "남한",
    "corée du sud",
    "coree du sud",
    "république de corée",
    "republique de coree",
    "corée, république de",
    "coree, republique de",
    "corea del sur",
    "república de corea",
    "republica de corea",
    "corea (sur)",
    "corea del sud",
    "repubblica di corea",
    "coreia do sul",
    "república da coreia",
    "republica da coreia",
    "südkorea",
    "sudkorea",
    "republik korea",
    "korea zuid",
    "zuid-korea",
    "republiek korea",
    "korea południowa",
    "korea poludniowa",
    "republika korei",
    "jižní korea",
    "jizni korea",
    "etelä-korea",
    "etela-korea",
    "korea południowa (republika korei)",
    "hàn quốc",
    "han quoc",
    "đại hàn dân quốc",
    "韓国",
    "韩国",
    "大韓民国",
    "大韩民国",
    "韓國",
    "韓國 (大韓民國)",
    "корея, республика",
    "корея (республика)",
    "республика корея",
    "южная корея",
    "كوريا الجنوبية",
    "جمهورية كوريا",
    "كوريا، جمهورية",
    "νότια κορέα",
    "δημοκρατία της κορέας",
    "kore cumhuriyeti",
    "güney kore"
  ]);

  const KR_LABELS_AMBIGUOUS = new Set(["korea", "코리아"]);

  const KR_CODES = new Set(["kr", "kor", "410"]);

  const NORTH_KOREA_TOKENS = [
    "north korea",
    "korea, north",
    "korea north",
    "korea, democratic people's republic of",
    "korea, democratic peoples republic of",
    "democratic people's republic of korea",
    "democratic peoples republic of korea",
    "dprk",
    "조선민주주의인민공화국",
    "북한",
    "북조선",
    "corée du nord",
    "coree du nord",
    "corea del norte",
    "coreia do norte",
    "nordkorea",
    "северная корея",
    "朝鲜",
    "朝鮮民主主義人民共和国"
  ];

  const NORTH_KOREA_CODES = new Set(["kp", "prk", "408"]);

  function normalize(text) {
    if (text == null) return "";
    let s = String(text);
    try {
      s = s.normalize("NFKC");
    } catch (_) {}
    s = s.toLowerCase();
    s = s.replace(/[​-‏﻿]/g, "");
    s = s.replace(/\s+/g, " ").trim();
    s = s.replace(/^[\s,.;:!?·•・–—-]+|[\s,.;:!?·•・–—-]+$/g, "");
    return s;
  }

  function isNorthKorea(text) {
    const n = normalize(text);
    if (!n) return false;
    if (NORTH_KOREA_CODES.has(n)) return true;
    for (const tok of NORTH_KOREA_TOKENS) {
      if (n === tok || n.includes(tok)) return true;
    }
    if (/\bnorth\b/.test(n) && /\bkorea\b/.test(n)) return true;
    if (/\bdprk\b/.test(n)) return true;
    if (/democratic.*korea|korea.*democratic/.test(n)) return true;
    return false;
  }

  function classify(text) {
    const n = normalize(text);
    if (!n) return { kind: "none" };
    if (isNorthKorea(n)) return { kind: "north" };
    if (KR_CODES.has(n)) return { kind: "kr", confidence: "code" };
    if (KR_LABELS_STRONG.has(n)) return { kind: "kr", confidence: "strong" };
    if (KR_LABELS_AMBIGUOUS.has(n)) return { kind: "kr", confidence: "ambiguous" };
    return { kind: "none" };
  }

  function matchKorea(text) {
    const c = classify(text);
    return c.kind === "kr";
  }

  function pickKoreaIndex(textsOrNodes, textOf) {
    const get = textOf || ((x) => x);
    let strongIdx = -1;
    let ambiguousIdx = -1;
    let hasNorthKorea = false;

    for (let i = 0; i < textsOrNodes.length; i++) {
      const text = get(textsOrNodes[i], i);
      const c = classify(text);
      if (c.kind === "north") {
        hasNorthKorea = true;
        continue;
      }
      if (c.kind !== "kr") continue;
      if (c.confidence === "strong" || c.confidence === "code") {
        if (strongIdx === -1) strongIdx = i;
      } else if (c.confidence === "ambiguous") {
        if (ambiguousIdx === -1) ambiguousIdx = i;
      }
    }

    if (strongIdx !== -1) return strongIdx;
    if (ambiguousIdx !== -1 && !hasNorthKorea) return ambiguousIdx;
    return -1;
  }

  const COUNTRY_HINT_LABELS = new Set([
    "united states", "canada", "united kingdom", "germany", "france",
    "japan", "china", "australia", "italy", "spain",
    "mexico", "brazil", "india", "russia", "netherlands",
    "sweden", "switzerland", "singapore", "norway", "denmark",
    "포르투갈", "벨기에", "오스트리아", "핀란드", "아일랜드",
    "미국", "캐나다", "영국", "독일", "프랑스",
    "일본", "중국", "호주", "이탈리아", "스페인",
    "멕시코", "브라질", "인도", "러시아", "네덜란드",
    "스웨덴", "스위스", "싱가포르", "노르웨이", "덴마크",
    "アメリカ", "アメリカ合衆国", "カナダ", "イギリス", "ドイツ", "フランス",
    "日本", "中国", "オーストラリア", "イタリア", "スペイン",
    "美国", "加拿大", "英国", "德国", "法国", "澳大利亚", "意大利", "西班牙",
    "estados unidos", "alemania", "francia", "japón", "japon", "italia", "españa", "espana",
    "vereinigte staaten", "deutschland", "frankreich", "italien", "spanien",
    "stati uniti", "germania", "francia", "giappone", "cina",
    "соединенные штаты", "германия", "франция", "япония", "китай",
    "الولايات المتحدة", "ألمانيا", "فرنسا", "اليابان", "الصين"
  ]);

  function looksLikeCountryList(texts) {
    if (texts.length < 50) return false;
    let hits = 0;
    for (let i = 0; i < texts.length && hits < 5; i++) {
      const n = normalize(texts[i]);
      if (COUNTRY_HINT_LABELS.has(n)) hits++;
    }
    return hits >= 5;
  }

  ns.detector = {
    normalize,
    classify,
    matchKorea,
    isNorthKorea,
    pickKoreaIndex,
    looksLikeCountryList
  };
})();
