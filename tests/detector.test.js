"use strict";

// Plain-Node test runner for the detector module. No deps.
// Usage: node tests/detector.test.js
//
// detector.js is a content-script IIFE that attaches to globalThis.__AutoKorea.
// We require it as a script — Node will execute the IIFE.

const path = require("path");
globalThis.__AutoKorea = {};
require(path.resolve(__dirname, "..", "src", "content", "detector.js"));
const { detector } = globalThis.__AutoKorea;

let pass = 0;
let fail = 0;
const failures = [];

function eq(name, got, expected) {
  const ok = JSON.stringify(got) === JSON.stringify(expected);
  if (ok) {
    pass++;
  } else {
    fail++;
    failures.push(`${name}\n    got=${JSON.stringify(got)}\n    expected=${JSON.stringify(expected)}`);
  }
}

// matchKorea — should-match cases (label variants)
const SHOULD_MATCH = [
  "Korea, Republic of",
  "Republic of Korea",
  "South Korea",
  "Korea (South)",
  "Korea, South",
  "Korea (Republic of)",
  "Rep. of Korea",
  "ROK",
  "대한민국",
  "한국",
  "남한",
  "Südkorea",
  "Sudkorea",
  "Corée du Sud",
  "Corée, République de",
  "Corea del Sur",
  "Corea del Sud",
  "Coreia do Sul",
  "Zuid-Korea",
  "Korea Południowa",
  "Jižní Korea",
  "Etelä-Korea",
  "Hàn Quốc",
  "Güney Kore",
  "韓国",
  "韩国",
  "大韓民国",
  "  KR  ",
  "kor",
  "410",
  "Корея, Республика",
  "Южная Корея",
  "Νότια Κορέα"
];
for (const v of SHOULD_MATCH) eq(`matchKorea(${JSON.stringify(v)})`, detector.matchKorea(v), true);

// matchKorea — should-NOT-match cases (North Korea + sundry)
const SHOULD_NOT_MATCH = [
  "North Korea",
  "Korea, North",
  "Korea, Democratic People's Republic of",
  "Democratic People's Republic of Korea",
  "DPRK",
  "KP",
  "PRK",
  "북한",
  "북조선",
  "조선민주주의인민공화국",
  "Corée du Nord",
  "Corea del Norte",
  "Coreia do Norte",
  "Nordkorea",
  "Северная Корея",
  "Korean",
  "Koreatown",
  "Koreanic",
  "United States",
  "Japan",
  "China",
  ""
];
for (const v of SHOULD_NOT_MATCH) eq(`!matchKorea(${JSON.stringify(v)})`, detector.matchKorea(v), false);

// pickKoreaIndex semantics
eq(
  "pickKoreaIndex picks South Korea over ambiguous Korea when NK present",
  detector.pickKoreaIndex(["United States", "North Korea", "South Korea", "Japan"]),
  2
);

eq(
  "pickKoreaIndex returns -1 for ambiguous-only Korea when NK present",
  detector.pickKoreaIndex(["United States", "North Korea", "Korea", "Japan"]),
  -1
);

eq(
  "pickKoreaIndex picks ambiguous Korea when no NK",
  detector.pickKoreaIndex(["Japan", "Korea", "China"]),
  1
);

eq(
  "pickKoreaIndex picks first strong KR when multiple variants present",
  detector.pickKoreaIndex(["A", "B", "Korea, Republic of", "South Korea"]),
  2
);

eq(
  "pickKoreaIndex resolves with custom textOf accessor",
  detector.pickKoreaIndex(
    [{ name: "USA" }, { name: "North Korea" }, { name: "대한민국" }],
    (o) => o.name
  ),
  2
);

// looksLikeCountryList
eq("looksLikeCountryList rejects 12-month list", detector.looksLikeCountryList(
  ["January","February","March","April","May","June","July","August","September","October","November","December"]
), false);

const bigEn = ["United States","Canada","United Kingdom","Germany","France","Japan","China","Australia","Italy","Spain"];
while (bigEn.length < 60) bigEn.push("Foo " + bigEn.length);
eq("looksLikeCountryList accepts English country list (60 items)", detector.looksLikeCountryList(bigEn), true);

const bigKo = ["미국","캐나다","영국","독일","프랑스","일본","중국","호주","이탈리아","스페인"];
while (bigKo.length < 60) bigKo.push("기타 " + bigKo.length);
eq("looksLikeCountryList accepts Korean country list (60 items)", detector.looksLikeCountryList(bigKo), true);

// Normalization edge cases
eq("normalize collapses NFKC + whitespace + punctuation",
   detector.normalize("  KOREA, REPUBLIC OF.  "),
   "korea, republic of");

eq("normalize preserves parentheses in middle",
   detector.normalize("Korea (South)"),
   "korea (south)");

// Output
console.log(`\n${pass} pass / ${fail} fail`);
if (fail > 0) {
  console.log("\nFailures:");
  for (const f of failures) console.log("  - " + f);
  process.exit(1);
}
