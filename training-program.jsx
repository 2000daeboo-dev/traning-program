import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Bar, ReferenceLine, Legend } from "recharts";

/* ══════════════════  종목 라이브러리  ══════════════════
   pattern 이 같으면 서로 대체 가능한 후보로 먼저 보여준다.
   inc 는 kg 기준 증량 폭. bw:true 는 맨몸/추가중량 종목. */

const PAT = {
  hpush: "수평 밀기", vpush: "수직 밀기", chest: "가슴 고립",
  hpull: "수평 당기기", vpull: "수직 당기기",
  lat: "측면 삼각근", rear: "후면 삼각근",
  bic: "이두", tri: "삼두",
  quad: "대퇴사두", hinge: "힙 힌지", ham: "햄스트링 굴곡",
  calf: "종아리", abd: "고관절 외전", core: "코어",
};

const EXLIB = [
  ["bench", "벤치프레스", "hpush", 2.5], ["incbar", "인클라인 바벨프레스", "hpush", 2.5],
  ["dbbench", "덤벨 벤치프레스", "hpush", 2], ["incdb", "인클라인 덤벨프레스", "hpush", 2],
  ["machpress", "머신 체스트프레스", "hpush", 2.5], ["dips", "딥스", "hpush", 2.5, true],
  ["cgbench", "클로즈그립 벤치프레스", "hpush", 2.5], ["smithbench", "스미스머신 벤치프레스", "hpush", 2.5],

  ["ohp", "오버헤드프레스", "vpush", 2.5], ["seatdbp", "시티드 덤벨 숄더프레스", "vpush", 2],
  ["arnold", "아놀드 프레스", "vpush", 2], ["machsp", "머신 숄더프레스", "vpush", 2.5],
  ["landmine", "랜드마인 프레스", "vpush", 2.5],

  ["cfly", "케이블 플라이", "chest", 1.25], ["pecdeck", "펙덱 플라이", "chest", 2.5],
  ["dbfly", "덤벨 플라이", "chest", 1],

  ["latpull", "랫풀다운", "vpull", 2.5], ["latpulln", "뉴트럴그립 랫풀다운", "vpull", 2.5],
  ["pullup", "턱걸이 (풀업)", "vpull", 2.5, true], ["chinup", "친업", "vpull", 2.5, true],
  ["assistpull", "어시스트 풀업", "vpull", 2.5], ["sapull", "스트레이트암 풀다운", "vpull", 1.25],

  ["brow", "바벨 로우", "hpull", 2.5], ["pendlay", "펜들레이 로우", "hpull", 2.5],
  ["dbrow", "덤벨 원암 로우", "hpull", 2], ["csrow", "체스트 서포티드 로우", "hpull", 2.5],
  ["cablerow", "시티드 케이블 로우", "hpull", 2.5], ["tbar", "T바 로우", "hpull", 2.5],
  ["machrow", "머신 로우", "hpull", 2.5], ["invrow", "인버티드 로우", "hpull", 2.5, true],

  ["latraise", "사이드 레터럴 레이즈", "lat", 1], ["cablelat", "케이블 레터럴 레이즈", "lat", 1.25],
  ["machlat", "머신 레터럴 레이즈", "lat", 2.5],

  ["facepull", "페이스풀", "rear", 1.25], ["reardelt", "리어델트 플라이", "rear", 1],
  ["revpec", "리버스 펙덱", "rear", 2.5],

  ["bcurl", "바벨 / EZ바 컬", "bic", 1.25], ["inccurl", "인클라인 덤벨 컬", "bic", 1],
  ["hammer", "해머컬", "bic", 1], ["preacher", "프리처 컬", "bic", 1.25],
  ["cablecurl", "케이블 컬", "bic", 1.25],

  ["ohtri", "오버헤드 트라이셉스 익스텐션", "tri", 1.25], ["pushdown", "트라이셉스 푸시다운", "tri", 1.25],
  ["skull", "스컬크러셔", "tri", 1.25],

  ["hack", "핵스쿼트", "quad", 5], ["pendulum", "펜듈럼 스쿼트", "quad", 5],
  ["beltsq", "벨트 스쿼트", "quad", 5], ["legpress", "레그프레스", "quad", 5],
  ["backsq", "백스쿼트", "quad", 5], ["frontsq", "프론트 스쿼트", "quad", 2.5],
  ["smithsq", "스미스머신 스쿼트", "quad", 5], ["bulgarian", "불가리안 스플릿 스쿼트", "quad", 2],
  ["lunge", "워킹 런지", "quad", 2], ["legext", "레그 익스텐션", "quad", 2.5],
  ["stepup", "스텝업", "quad", 2],

  ["rdl", "루마니안 데드리프트", "hinge", 2.5], ["dbrdl", "덤벨 RDL", "hinge", 2],
  ["backext", "45도 백익스텐션", "hinge", 2.5], ["hipthrust", "힙 스러스트", "hinge", 5],
  ["goodmorning", "굿모닝", "hinge", 2.5], ["pullthrough", "케이블 풀스루", "hinge", 2.5],
  ["deadlift", "컨벤셔널 데드리프트", "hinge", 5],

  ["seatcurl", "시티드 레그컬", "ham", 2.5], ["lyingcurl", "라잉 레그컬", "ham", 2.5],
  ["nordic", "노르딕 햄스트링 컬", "ham", 0, true], ["ghr", "글루트햄 레이즈", "ham", 2.5, true],

  ["calfst", "스탠딩 카프레이즈", "calf", 2.5], ["calfseat", "시티드 카프레이즈", "calf", 2.5],
  ["calfpress", "레그프레스 카프레이즈", "calf", 5],

  ["abduct", "힙 어브덕션 머신", "abd", 2.5], ["cableabd", "케이블 힙 어브덕션", "abd", 1.25],
  ["monster", "밴드 몬스터워크", "abd", 0, true],

  ["legraise", "행잉 레그레이즈", "core", 0, true], ["cablecrunch", "케이블 크런치", "core", 2.5],
  ["plank", "플랭크", "core", 0, true], ["sideplank", "사이드 플랭크", "core", 0, true],
  ["abwheel", "앱 휠", "core", 0, true], ["pallof", "팰로프 프레스", "core", 1.25],
].map(([id, name, pattern, inc, bw]) => ({ id, name, pattern, inc, bw: !!bw }));

const LIBMAP = Object.fromEntries(EXLIB.map((e) => [e.id, e]));

/* ══════════════════  기본 프로그램  ══════════════════ */

const slot = (id, sets, lo, hi, rest, note) => {
  const l = LIBMAP[id];
  return { id, name: l.name, pattern: l.pattern, inc: l.inc, bw: l.bw, sets, lo, hi, rest, note: note || "" };
};

const DEFAULT_PROGRAM = () => ({
  sessions: {
    upperA: {
      name: "상체 A", sub: "푸시 · 스트렝스", ex: [
        slot("bench", 4, 4, 6, 180, "RPE 7–8"),
        slot("ohp", 3, 6, 8, 150),
        slot("incdb", 3, 8, 10, 120, "덤벨 한쪽 중량"),
        slot("latraise", 3, 12, 15, 60),
        slot("ohtri", 3, 10, 12, 75),
      ],
    },
    upperB: {
      name: "상체 B", sub: "풀 · 스트렝스", ex: [
        slot("pullup", 4, 5, 8, 180, "추가 중량만 입력"),
        slot("brow", 4, 6, 8, 150),
        slot("csrow", 3, 10, 12, 120),
        slot("facepull", 3, 15, 15, 60),
        slot("bcurl", 3, 8, 10, 90),
      ],
    },
    lower: {
      name: "하체", sub: "머신 중심", ex: [
        slot("hack", 4, 5, 8, 210, "스트렝스 앵커 · RPE 8"),
        slot("legpress", 3, 8, 12, 150, "발 낮게 = 사두 강조"),
        slot("seatcurl", 3, 8, 10, 120, "무겁게"),
        slot("lyingcurl", 3, 12, 15, 90),
        slot("legext", 3, 12, 15, 75, "마지막 세트 부분반복"),
        slot("backext", 3, 12, 15, 90, "힌지 패턴 보완"),
        slot("abduct", 3, 15, 20, 60, "부상 예방 · 생략 금지"),
        slot("calfst", 4, 8, 12, 90),
        slot("calfseat", 2, 15, 20, 60),
        slot("legraise", 3, 10, 10, 60, "맨몸 · 중량 0"),
      ],
    },
    upperC: {
      name: "상체 C", sub: "푸시 · 볼륨", ex: [
        slot("incbar", 4, 8, 10, 150),
        slot("seatdbp", 3, 10, 12, 120),
        slot("cfly", 3, 12, 15, 75),
        slot("latraise", 4, 12, 20, 60),
        slot("pushdown", 3, 12, 15, 60),
      ],
    },
    upperD: {
      name: "상체 D", sub: "풀 · 볼륨", ex: [
        slot("latpull", 4, 10, 12, 120),
        slot("cablerow", 4, 10, 12, 120),
        slot("sapull", 3, 12, 15, 60),
        slot("reardelt", 3, 15, 20, 60),
        slot("inccurl", 3, 12, 15, 60),
        slot("nordic", 2, 6, 8, 120, "신장성 부하 · 가볍게"),
      ],
    },
  },
  week: {
    1: { lift: "upperA", run: "easy6" },
    2: { lift: "upperB", run: "tempo" },
    3: { lift: "lower", run: "shakeout" },
    4: { lift: "upperC", run: "recovery" },
    5: { lift: "upperD", run: "interval" },
    6: { lift: "", run: "easy5" },
    0: { lift: "", run: "long" },
  },
});

/* ══════════════════  러닝  ══════════════════ */

const RUN = {
  none: { name: "러닝 없음", zone: "easy", km: 0, detail: "완전 휴식" },
  easy6: { name: "이지런", zone: "easy", km: 6, detail: "대화 가능한 강도. 느리다고 느껴져야 정상" },
  tempo: { name: "템포런", zone: "threshold", quality: true },
  shakeout: { name: "휴식 또는 셰이크아웃", zone: "easy", km: 3, detail: "하체일. 달리지 않아도 좋음" },
  recovery: { name: "회복런", zone: "easy", km: 5, detail: "이지런보다 더 느리게" },
  interval: { name: "인터벌", zone: "interval", quality: true },
  easy5: { name: "이지런 또는 휴식", zone: "easy", km: 5, detail: "피로 누적 시 과감히 쉴 것" },
  long: { name: "롱런", zone: "easy", long: true, detail: "격주로 마지막 3–4km를 마라톤 페이스로" },
};

const PHASES = [
  { name: "유산소 기반기", from: "2026-09-01", to: "2026-12-31", km: [30, 45], goal: "10K 60분", focus: "질 세션 1회 + 스트라이드. 거리를 쌓는 시기", tempo: "임계 3×8분 (휴식 2분 조깅)", interval: "6×2분 (동시간 조깅 휴식)", long: [10, 14] },
  { name: "임계 주력기", from: "2027-01-01", to: "2027-04-30", km: [45, 55], goal: "10K 56–57분", focus: "질 세션 2회로 증가", tempo: "임계 2×15분 (휴식 3분)", interval: "5×1km @레이스 페이스 (휴식 2분)", long: [14, 17] },
  { name: "여름 유지기", from: "2027-05-01", to: "2027-08-31", km: [50, 55], goal: "10K 53–54분", focus: "더위로 페이스 저하. 강도 유지에 집중", tempo: "임계 25분 연속 또는 언덕 8×90초", interval: "5×1km @레이스 페이스", long: [15, 17] },
  { name: "10K 특화기", from: "2027-09-01", to: "2027-11-30", km: [55, 60], goal: "10K 51분", focus: "VO2max + 레이스 페이스", tempo: "임계 25–30분 연속", interval: "4×1.2km 또는 3×2km @레이스 페이스", long: [16, 18] },
  { name: "레이스 준비기", from: "2027-12-01", to: "2028-01-31", km: [45, 45], goal: "sub-50", focus: "거리 감량, 레이스 페이스 굳히기, 테이퍼", tempo: "레이스 페이스 3×2km (휴식 2분)", interval: "8×400m @레피티션", long: [12, 16] },
];

const ZONES = {
  easy: { label: "이지 / 롱런", mult: [1.15, 1.23] },
  marathon: { label: "마라톤", mult: [1.04, 1.06] },
  threshold: { label: "템포 / 임계", mult: [0.985, 1.012] },
  interval: { label: "인터벌 (VO2max)", mult: [0.9, 0.925] },
  rep: { label: "레피티션 / 스트라이드", mult: [0.83, 0.855] },
};

/* ══════════════════  유틸  ══════════════════ */

const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const parse = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); };
const DOW = ["일", "월", "화", "수", "목", "금", "토"];

const mmss = (sec) => {
  if (sec === null || sec === undefined || sec < 0) return "—";
  const m = Math.floor(sec / 60), s = Math.round(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
};
const hms = (sec) => {
  if (!sec || sec <= 0) return "—";
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = Math.round(sec % 60);
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
};
const toSec = (str) => {
  if (!str) return 0;
  const p = String(str).trim().split(":").map(Number);
  if (p.some(isNaN)) return 0;
  if (p.length === 3) return p[0] * 3600 + p[1] * 60 + p[2];
  if (p.length === 2) return p[0] * 60 + p[1];
  return p[0];
};
const monday = (s) => { const d = parse(s); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return iso(d); };
const weeksBetween = (a, b) => Math.round((parse(monday(b)) - parse(monday(a))) / 604800000);

const phaseFor = (s) => {
  const t = parse(s).getTime();
  for (const p of PHASES) if (t >= parse(p.from).getTime() && t <= parse(p.to).getTime()) return p;
  return t < parse(PHASES[0].from).getTime() ? PHASES[0] : PHASES[PHASES.length - 1];
};
const paceRange = (tenK, zone) => {
  const b = tenK / 10, [x, y] = ZONES[zone].mult;
  return [b * x, b * y];
};
const e1rm = (w, r) => (w > 0 && r > 0 ? w * (1 + r / 30) : 0);

const weeklyKmTarget = (s) => {
  const p = phaseFor(s);
  const total = Math.max(1, weeksBetween(p.from, p.to));
  const idx = Math.max(0, Math.min(total, weeksBetween(p.from, s)));
  const raw = p.km[0] + (p.km[1] - p.km[0]) * (idx / total);
  return Math.round(raw * (idx % 4 === 3 ? 0.78 : 1));
};

/* ── 단위 ── 입력한 값과 단위를 그대로 보존하고 표시할 때만 환산한다 */
const LB = 2.20462262;
const toKg = (v, u) => (u === "lb" ? Number(v) / LB : Number(v));
const fromKg = (kg, u) => (u === "lb" ? kg * LB : kg);
const nice = (v, u) => { const st = u === "lb" ? 0.5 : 0.25; return Math.round(v / st) * st; };
const UL = (u) => (u === "lb" ? "lbs" : "kg");
/* 증량 폭은 그 종목의 단위 그대로 저장하고, 단위를 바꿀 때만 환산한다 */
const INC_TO_LB = { 0: 0, 1: 2.5, 1.25: 2.5, 2: 5, 2.5: 5, 5: 10 };
const INC_TO_KG = { 0: 0, 2.5: 1.25, 5: 2.5, 10: 5 };
const convertInc = (v, from, to) => {
  if (from === to || !v) return v;
  const t = to === "lb" ? INC_TO_LB : INC_TO_KG;
  if (t[v] != null) return t[v];
  const step = to === "lb" ? 2.5 : 0.5;
  return Math.round((to === "lb" ? v * LB : v / LB) / step) * step;
};
const unitOf = (d, id) => (d.units && d.units[id]) || d.settings.unit || "kg";
const showW = (s, u) => {
  if (!s || s.w === "" || s.w == null) return "";
  const su = s.u || "kg";
  return su === u ? s.w : String(nice(fromKg(toKg(s.w, su), u), u));
};
const setKg = (s) => (s && s.w !== "" && s.w != null ? toKg(s.w, s.u || "kg") : 0);

/* ══════════════════  저장소  ══════════════════ */

const KEY = "training-program-v2";
const BLANK = () => ({
  settings: { startDate: "2026-09-07", bw: "", bwU: "kg", unit: "kg", autoRest: true, tenK: 3900 },
  program: DEFAULT_PROGRAM(),
  custom: [],
  units: {},
  log: {},
  tt: [{ date: "2026-09-01", sec: 3900 }],
});

const RESCUE = KEY + "-rescue-";

const normalize = (s) => {
  const b = BLANK();
  if (!s || typeof s !== "object") return null;
  return {
    ...b, ...s,
    settings: { ...b.settings, ...(s.settings || {}) },
    program: s.program && s.program.sessions ? s.program : b.program,
    custom: Array.isArray(s.custom) ? s.custom : [],
    units: s.units && typeof s.units === "object" ? s.units : {},
    log: s.log && typeof s.log === "object" ? s.log : {},
    tt: Array.isArray(s.tt) && s.tt.length ? s.tt : b.tt,
  };
};

async function loadData() {
  let raw = null;
  try { const r = await window.storage.get(KEY); raw = r && r.value; } catch (e) { raw = null; }
  if (!raw) return { data: BLANK(), error: null };
  try {
    const n = normalize(JSON.parse(raw));
    if (!n) throw new Error("저장 형식을 알아볼 수 없습니다");
    return { data: n, error: null };
  } catch (e) {
    /* 읽지 못한 원본을 덮어쓰기 전에 따로 보관한다 */
    try { await window.storage.set(RESCUE + Date.now(), raw); } catch (e2) { /* 저장 공간 부족 */ }
    return { data: BLANK(), error: String((e && e.message) || e) };
  }
}
const saveData = async (d) => {
  try { await window.storage.set(KEY, JSON.stringify(d)); return true; } catch (e) { return false; }
};

/* ══════════════════  스타일  ══════════════════ */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600&family=Barlow+Condensed:wght@500;600;700&display=swap');

.tp *, .tp *::before, .tp *::after { box-sizing: border-box; }
.tp {
  --ink:#171C22; --panel:#212832; --panel2:#1B2129; --line:#2E3742;
  --paper:#E8EBED; --muted:#8A97A4; --dim:#5C6874;
  --iron:#D8DEE4; --pulse:#FF4D2E;
  font-family:'Barlow',system-ui,-apple-system,sans-serif;
  background:var(--ink); color:var(--paper);
  min-height:100vh; padding-bottom:78px; -webkit-font-smoothing:antialiased;
}
.tp .cond { font-family:'Barlow Condensed','Barlow',sans-serif; }
.tp button { font-family:inherit; cursor:pointer; }
.tp button:focus-visible, .tp input:focus-visible, .tp select:focus-visible, .tp textarea:focus-visible {
  outline:2px solid var(--pulse); outline-offset:2px;
}
.tp input, .tp select {
  font-family:'Barlow Condensed',sans-serif; background:var(--panel2);
  border:1px solid var(--line); color:var(--paper); border-radius:6px;
}
.tp input[type=text], .tp input[type=date] { font-family:'Barlow',sans-serif; }

/* 헤더 */
.tp-head { padding:20px 18px 15px; border-bottom:1px solid var(--line); }
.tp-nav { display:flex; align-items:center; gap:9px; margin-bottom:14px; }
.tp-nav button { background:none; border:1px solid var(--line); color:var(--muted); width:34px; height:34px; border-radius:8px; font-size:16px; line-height:1; }
.tp-nav button:hover { color:var(--paper); border-color:var(--dim); }
.tp-date { flex:1; display:flex; align-items:baseline; gap:9px; min-width:0; }
.tp-dow { font-size:26px; font-weight:700; line-height:1; }
.tp-md { font-size:15px; color:var(--muted); font-weight:500; }
.tp-wk { font-size:12.5px; color:var(--dim); text-align:right; line-height:1.35; flex-shrink:0; }
.tp-title { display:flex; align-items:flex-end; justify-content:space-between; gap:14px; }
.tp-sess { font-size:44px; font-weight:700; line-height:.9; }
.tp-sub { font-size:14px; color:var(--muted); margin-top:5px; }
.tp-off { color:var(--dim); }

/* 탤리 */
.tp-tally { display:flex; flex-wrap:wrap; gap:3px; align-items:flex-end; max-width:132px; justify-content:flex-end; }
.tp-tick { width:7px; height:17px; border-radius:1px; background:var(--line); }
.tp-tick.on { background:var(--iron); }
.tp-count { font-size:13px; color:var(--muted); margin-top:6px; text-align:right; }

/* 배너 */
.tp-banner { margin:0; padding:11px 18px; font-size:13.5px; border-bottom:1px solid var(--line); line-height:1.5; }
.tp-banner.iron { background:rgba(216,222,228,.07); color:var(--iron); }
.tp-banner.hot { background:rgba(255,77,46,.09); color:#FFA893; }

/* 종목 행 */
.tp-row { border-bottom:1px solid var(--line); padding:15px 18px; position:relative; }
.tp-row::before { content:''; position:absolute; left:0; top:0; bottom:0; width:3px; background:var(--iron); opacity:.5; }
.tp-row.run::before { background:var(--pulse); opacity:1; }
.tp-row.done::before { opacity:1; }
.tp-exhead { display:flex; align-items:flex-start; justify-content:space-between; gap:10px; }
.tp-exname { font-size:17px; font-weight:600; line-height:1.3; text-align:left; background:none; border:none; color:inherit; padding:0; display:flex; align-items:baseline; gap:7px; flex-wrap:wrap; }
.tp-exname:hover { color:var(--pulse); }
.tp-swapped { font-size:11.5px; color:var(--pulse); border:1px solid var(--pulse); border-radius:4px; padding:1px 5px; font-weight:600; }
.tp-scheme { font-family:'Barlow Condensed',sans-serif; font-size:17px; color:var(--muted); white-space:nowrap; font-weight:600; flex-shrink:0; }
.tp-meta { font-size:12.5px; color:var(--dim); margin-top:4px; display:flex; gap:12px; flex-wrap:wrap; align-items:center; }
.tp-meta button { background:none; border:none; color:var(--dim); padding:0; font-size:12.5px; text-decoration:underline; text-underline-offset:2px; }
.tp-meta button:hover { color:var(--pulse); }
.tp-prev { font-size:12.5px; color:var(--muted); margin-top:9px; line-height:1.5; }
.tp-prev b { color:var(--iron); font-weight:600; }

.tp-sets { display:flex; flex-direction:column; gap:6px; margin-top:10px; }
.tp-set { display:flex; align-items:center; gap:7px; }
.tp-setno { font-family:'Barlow Condensed',sans-serif; font-size:14px; color:var(--dim); width:14px; flex-shrink:0; }
.tp-set input { width:100%; min-width:0; padding:9px 8px; font-size:17px; text-align:center; font-weight:600; }
.tp-fld { flex:1; display:flex; align-items:center; gap:4px; min-width:0; }
.tp-unit { font-size:12px; color:var(--dim); flex-shrink:0; }
.tp-chk { width:40px; height:38px; flex-shrink:0; border-radius:6px; border:1px solid var(--line); background:var(--panel2); color:var(--dim); font-size:17px; display:flex; align-items:center; justify-content:center; }
.tp-chk.on { background:var(--iron); border-color:var(--iron); color:var(--ink); }
.tp-row.run .tp-chk.on { background:var(--pulse); border-color:var(--pulse); color:#fff; }

/* 러닝 */
.tp-runhead { display:flex; align-items:baseline; justify-content:space-between; gap:12px; }
.tp-runname { font-family:'Barlow Condensed',sans-serif; font-size:25px; font-weight:700; color:var(--pulse); line-height:1; }
.tp-pace { font-family:'Barlow Condensed',sans-serif; font-size:19px; font-weight:600; white-space:nowrap; }
.tp-workout { font-size:14.5px; margin-top:9px; line-height:1.5; }

/* 섹션 */
.tp-sec { padding:22px 18px 10px; }
.tp-sech { font-family:'Barlow Condensed',sans-serif; font-size:23px; font-weight:700; margin:0 0 4px; }
.tp-secp { font-size:13.5px; color:var(--muted); margin:0 0 14px; line-height:1.6; }

/* 표 */
.tp-tbl { width:100%; border-collapse:collapse; font-size:14px; }
.tp-tbl th { text-align:left; font-weight:600; color:var(--muted); font-size:12.5px; padding:7px 8px 7px 0; border-bottom:1px solid var(--line); }
.tp-tbl td { padding:10px 8px 10px 0; border-bottom:1px solid var(--line); vertical-align:top; }
.tp-tbl td.num { font-family:'Barlow Condensed',sans-serif; font-size:17px; font-weight:600; white-space:nowrap; }
.tp-tbl tr.now td { background:rgba(255,77,46,.08); }
.tp-up { color:#7FC98B; } .tp-down { color:var(--pulse); }

/* 주간 */
.tp-day { display:flex; align-items:center; gap:12px; padding:13px 18px; border:none; border-bottom:1px solid var(--line); width:100%; background:none; text-align:left; color:inherit; }
.tp-day.today { background:var(--panel); }
.tp-daydow { font-family:'Barlow Condensed',sans-serif; font-size:21px; font-weight:700; width:20px; flex-shrink:0; }
.tp-dayinfo { flex:1; min-width:0; }
.tp-daylift { font-size:15px; font-weight:600; display:block; }
.tp-dayrun { font-size:13px; color:var(--pulse); margin-top:2px; display:block; }
.tp-dots { display:flex; gap:5px; flex-shrink:0; }
.tp-dot { width:9px; height:9px; border-radius:50%; border:1.5px solid var(--line); }
.tp-dot.lift.on { background:var(--iron); border-color:var(--iron); }
.tp-dot.run.on { background:var(--pulse); border-color:var(--pulse); }

/* 지표 */
.tp-mets { display:flex; gap:1px; background:var(--line); border-bottom:1px solid var(--line); }
.tp-met { flex:1; background:var(--ink); padding:14px 12px; min-width:0; }
.tp-metv { font-family:'Barlow Condensed',sans-serif; font-size:28px; font-weight:700; line-height:1; }
.tp-metv small { font-size:15px; color:var(--muted); font-weight:600; }
.tp-metl { font-size:12px; color:var(--muted); margin-top:5px; }

/* 폼 */
.tp-f { display:flex; flex-direction:column; gap:5px; margin-bottom:16px; min-width:0; }
.tp-f input, .tp-f select { max-width:100%; }
.tp-f label { font-size:13px; color:var(--muted); }
.tp-f input, .tp-f select { padding:11px 12px; font-size:16px; text-align:left; }
.tp-f small { font-size:12px; color:var(--dim); line-height:1.55; }
.tp-btn { padding:11px 16px; border-radius:8px; border:1px solid var(--line); background:var(--panel); color:var(--paper); font-size:14.5px; font-weight:600; }
.tp-btn:hover { border-color:var(--dim); }
.tp-btn.hot { background:var(--pulse); border-color:var(--pulse); color:#fff; }
.tp-btn.sm { padding:6px 11px; font-size:13px; }
.tp-btn.danger:hover { border-color:var(--pulse); color:var(--pulse); }
label.tp-btn { display:inline-flex; align-items:center; cursor:pointer; }
label.tp-btn input[type=file] { display:none; }
.tp-seg { display:flex; border:1px solid var(--line); border-radius:8px; overflow:hidden; width:fit-content; max-width:100%; }
.tp-seg button { background:var(--panel2); border:none; color:var(--muted); padding:10px 20px; font-family:'Barlow Condensed',sans-serif; font-size:18px; font-weight:600; line-height:1; }
.tp-seg button + button { border-left:1px solid var(--line); }
.tp-seg button.on { background:var(--iron); color:var(--ink); }

/* 칩 */
.tp-chips { display:flex; gap:6px; overflow-x:auto; padding:0 18px 14px; -webkit-overflow-scrolling:touch; }
.tp-chip { flex-shrink:0; background:var(--panel2); border:1px solid var(--line); color:var(--muted); padding:8px 14px; border-radius:20px; font-size:14px; font-weight:600; white-space:nowrap; }
.tp-chip.on { background:var(--iron); border-color:var(--iron); color:var(--ink); }

/* 편집 행 */
.tp-edit { border-bottom:1px solid var(--line); padding:13px 18px; }
.tp-edithead { display:flex; align-items:center; gap:8px; }
.tp-editname { flex:1; text-align:left; background:none; border:none; color:var(--paper); font-size:16px; font-weight:600; padding:0; min-width:0; }
.tp-editname:hover { color:var(--pulse); }
.tp-mini { width:30px; height:30px; flex-shrink:0; border-radius:6px; border:1px solid var(--line); background:var(--panel2); color:var(--muted); font-size:14px; line-height:1; display:flex; align-items:center; justify-content:center; }
.tp-mini:hover { color:var(--paper); border-color:var(--dim); }
.tp-unitbtn { width:auto; min-width:40px; padding:0 9px; font-size:12.5px; font-weight:600; }
.tp-unitbtn.lb { border-color:var(--pulse); color:var(--pulse); }
.tp-nums { display:flex; gap:7px; margin-top:9px; }
.tp-num { flex:1; display:flex; flex-direction:column; gap:3px; min-width:0; }
.tp-num span { font-size:11px; color:var(--dim); }
.tp-num input { padding:7px 4px; font-size:15px; text-align:center; font-weight:600; width:100%; }

/* 시트 */
.tp-scrim { position:fixed; inset:0; background:rgba(10,13,16,.72); z-index:40; }
.tp-sheet { position:fixed; left:0; right:0; bottom:0; max-height:82vh; background:var(--ink); border-top:1px solid var(--line); border-radius:16px 16px 0 0; z-index:41; display:flex; flex-direction:column; }
.tp-sheeth { padding:16px 18px 12px; border-bottom:1px solid var(--line); flex-shrink:0; }
.tp-sheeth h3 { font-family:'Barlow Condensed',sans-serif; font-size:24px; font-weight:700; margin:0 0 3px; }
.tp-sheeth p { font-size:13px; color:var(--muted); margin:0 0 12px; line-height:1.5; }
.tp-sheeth input { width:100%; padding:11px 12px; font-size:16px; }
.tp-sheetb { overflow-y:auto; -webkit-overflow-scrolling:touch; flex:1; }
.tp-opt { display:flex; align-items:center; gap:11px; width:100%; padding:13px 18px; background:none; border:none; border-bottom:1px solid var(--line); color:inherit; text-align:left; }
.tp-opt:hover { background:var(--panel); }
.tp-opt.on { background:var(--panel); }
.tp-optn { flex:1; font-size:15.5px; font-weight:500; min-width:0; }
.tp-optp { font-size:12px; color:var(--dim); flex-shrink:0; }
.tp-sheetf { padding:12px 18px calc(12px + env(safe-area-inset-bottom)); border-top:1px solid var(--line); display:flex; gap:8px; flex-shrink:0; }

/* 휴식 타이머 */
.tp-timer { position:fixed; left:0; right:0; bottom:56px; background:var(--panel); border-top:1px solid var(--line); z-index:25; display:flex; align-items:center; gap:11px; padding:11px 16px; overflow:hidden; }
.tp-timerfill { position:absolute; left:0; top:0; bottom:0; background:rgba(255,77,46,.16); transition:width .25s linear; }
.tp-timer > * { position:relative; }
.tp-timerv { font-family:'Barlow Condensed',sans-serif; font-size:29px; font-weight:700; line-height:1; min-width:62px; }
.tp-timerv.zero { color:var(--pulse); }
.tp-timern { flex:1; font-size:13px; color:var(--muted); min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

/* 탭바 */
.tp-tabs { position:fixed; bottom:0; left:0; right:0; display:flex; background:var(--panel2); border-top:1px solid var(--line); z-index:30; padding-bottom:env(safe-area-inset-bottom); }
.tp-tab { flex:1; background:none; border:none; padding:11px 2px 13px; color:var(--dim); font-size:12.5px; font-weight:600; border-top:2px solid transparent; margin-top:-1px; }
.tp-tab.on { color:var(--paper); border-top-color:var(--pulse); }

.tp-empty { padding:36px 18px; color:var(--muted); font-size:14px; line-height:1.7; }
@media (prefers-reduced-motion: reduce) { .tp *, .tp *::before { transition:none !important; animation:none !important; } }
`;

/* ══════════════════  공통  ══════════════════ */

const lookupEx = (id, custom) =>
  LIBMAP[id] || (custom || []).find((c) => c.id === id) || { id, name: id, pattern: "", inc: 2.5, bw: false };

/* 종목 선택 시트 */
function Picker({ current, custom, onPick, onClose, onRevert, title, hint, taken }) {
  const [q, setQ] = useState("");
  const all = useMemo(() => [...EXLIB, ...(custom || [])], [custom]);
  /* 같은 세션에 같은 종목이 두 번 들어가면 기록이 한 배열을 공유해 섞인다 */
  const pool = useMemo(() => {
    const skip = new Set((taken || []).filter((id) => id !== current));
    return all.filter((e) => !skip.has(e.id));
  }, [all, taken, current]);
  const cur = current ? lookupEx(current, custom) : null;

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    const hit = t ? pool.filter((e) => e.name.toLowerCase().includes(t)) : pool;
    if (!cur || t) return hit;
    // 같은 움직임 패턴을 먼저
    const same = hit.filter((e) => e.pattern === cur.pattern);
    const rest = hit.filter((e) => e.pattern !== cur.pattern);
    return [...same, ...rest];
  }, [q, pool, cur]);

  const sameCount = cur && !q.trim() ? list.filter((e) => e.pattern === cur.pattern).length : 0;
  const canCreate = q.trim() && !all.some((e) => e.name === q.trim());

  return (
    <>
      <div className="tp-scrim" onClick={onClose} />
      <div className="tp-sheet" role="dialog" aria-label={title}>
        <div className="tp-sheeth">
          <h3>{title}</h3>
          <p>{hint}</p>
          <input autoFocus type="text" placeholder="종목 검색 또는 새 이름 입력"
            value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="tp-sheetb">
          {canCreate && (
            <button className="tp-opt" onClick={() => onPick({ create: q.trim() })}>
              <span className="tp-optn">“{q.trim()}” 새로 만들기</span>
              <span className="tp-optp">직접 입력</span>
            </button>
          )}
          {list.map((e, i) => (
            <button key={e.id} className={`tp-opt ${e.id === current ? "on" : ""}`} onClick={() => onPick({ id: e.id })}>
              <span className="tp-optn">{e.name}</span>
              <span className="tp-optp">{i < sameCount ? PAT[e.pattern] : (PAT[e.pattern] || "")}</span>
            </button>
          ))}
          {!list.length && !canCreate && <div className="tp-empty">일치하는 종목이 없습니다.</div>}
        </div>
        <div className="tp-sheetf">
          {onRevert && <button className="tp-btn" onClick={onRevert}>원래대로</button>}
          <button className="tp-btn" style={{ flex: 1 }} onClick={onClose}>닫기</button>
        </div>
      </div>
    </>
  );
}

/* 휴식 타이머 바 */
function RestBar({ timer, setTimer }) {
  const [now, setNow] = useState(Date.now());
  const fired = useRef(false);

  const started = timer ? timer.startedAt : 0;

  useEffect(() => { fired.current = false; }, [started]);
  useEffect(() => {
    if (!timer) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [timer]);

  /* 화면이 꺼지면 브라우저가 타이머를 멈춰 알림이 늦는다. 쉬는 동안만 화면을 붙잡는다 */
  useEffect(() => {
    if (!started || !navigator.wakeLock) return;
    let lock = null, done = false;
    const acquire = () => navigator.wakeLock.request("screen")
      .then((l) => { if (done) l.release().catch(() => {}); else lock = l; })
      .catch(() => { /* 절전 모드 등에서는 거부된다 */ });
    const onVis = () => { if (!done && document.visibilityState === "visible") acquire(); };
    acquire();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      done = true;
      document.removeEventListener("visibilitychange", onVis);
      if (lock) lock.release().catch(() => {});
    };
  }, [started]);

  useEffect(() => {
    if (!timer || fired.current || now < timer.endsAt) return;
    fired.current = true;
    try {
      const C = window.AudioContext || window.webkitAudioContext;
      if (C) {
        const ctx = new C(), o = ctx.createOscillator(), g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.frequency.value = 880; g.gain.value = 0.13;
        o.start(); o.stop(ctx.currentTime + 0.18);
        setTimeout(() => ctx.close(), 400);
      }
    } catch (e) { /* 오디오 차단됨 */ }
    if (navigator.vibrate) navigator.vibrate([160, 90, 160]);
  }, [now, timer]);

  if (!timer) return null;
  const leftMs = timer.endsAt - now;
  const left = Math.ceil(leftMs / 1000);
  const pct = Math.max(0, Math.min(100, 100 * (1 - leftMs / (timer.dur * 1000))));

  return (
    <div className="tp-timer">
      <div className="tp-timerfill" style={{ width: `${pct}%` }} />
      <span className={`tp-timerv ${left <= 0 ? "zero" : ""}`}>{left > 0 ? mmss(left) : "완료"}</span>
      <span className="tp-timern">{timer.name}</span>
      <button className="tp-btn sm" onClick={() => setTimer((t) => (t ? { ...t, endsAt: t.endsAt + 30000, dur: t.dur + 30 } : t))}>+30초</button>
      <button className="tp-btn sm" onClick={() => setTimer(null)}>끄기</button>
    </div>
  );
}

/* ══════════════════  앱  ══════════════════ */

export default function App() {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState("today");
  const [date, setDate] = useState(iso(new Date()));
  const [timer, setTimer] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [stale, setStale] = useState(false);
  const save = useRef(null);
  const latest = useRef(null);

  useEffect(() => { loadData().then((r) => { setData(r.data); setLoadError(r.error); }); }, []);
  useEffect(() => {
    latest.current = data;
    if (!data) return;
    clearTimeout(save.current);
    save.current = setTimeout(() => saveData(data), 400);
    return () => clearTimeout(save.current);
  }, [data]);

  /* 화면을 끄거나 탭을 닫을 때는 디바운스를 기다리지 않고 즉시 저장한다 */
  useEffect(() => {
    const flush = () => {
      if (!latest.current) return;
      clearTimeout(save.current);
      saveData(latest.current);
    };
    const onVis = () => { if (document.visibilityState === "hidden") flush(); };
    const onStorage = (e) => { if (e.key === KEY) setStale(true); };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pagehide", flush);
    window.addEventListener("storage", onStorage);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pagehide", flush);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const patch = useCallback((fn) => setData((d) => { const n = structuredClone(d); fn(n); return n; }), []);
  const startRest = useCallback((name, sec) => {
    if (!sec) return;
    setTimer({ name, dur: sec, endsAt: Date.now() + sec * 1000, startedAt: Date.now() });
  }, []);

  if (!data) return <div className="tp"><style>{CSS}</style><div className="tp-empty">기록을 불러오는 중</div></div>;

  const tenK = data.tt.length ? data.tt[data.tt.length - 1].sec : data.settings.tenK;
  const unit = data.settings.unit || "kg";
  const shared = { data, patch, unit, tenK };

  return (
    <div className="tp">
      <style>{CSS}</style>
      {loadError && (
        <div className="tp-banner hot">
          저장된 기록을 불러오지 못해 빈 상태로 시작했습니다. 읽지 못한 원본은 지우지 않고 따로 보관해두었습니다. ({loadError})
          <button className="tp-btn sm" style={{ marginLeft: 8 }} onClick={() => setLoadError(null)}>확인</button>
        </div>
      )}
      {stale && (
        <div className="tp-banner iron">
          다른 탭에서 기록이 바뀌었습니다. 이 화면에서 계속 입력하면 그 내용을 덮어쓸 수 있습니다.
          <button className="tp-btn sm" style={{ marginLeft: 8 }} onClick={() => window.location.reload()}>새로고침</button>
        </div>
      )}
      {tab === "today" && <Today {...shared} date={date} setDate={setDate} startRest={startRest} />}
      {tab === "week" && <Week {...shared} date={date} setDate={setDate} setTab={setTab} />}
      {tab === "run" && <Running {...shared} />}
      {tab === "log" && <History {...shared} />}
      {tab === "prog" && <Program {...shared} />}
      {tab === "set" && <Settings {...shared} setData={setData} />}
      <RestBar timer={timer} setTimer={setTimer} />
      <nav className="tp-tabs">
        {[["today", "오늘"], ["week", "주간"], ["run", "러닝"], ["log", "기록"], ["prog", "구성"], ["set", "설정"]].map(([k, l]) => (
          <button key={k} className={`tp-tab ${tab === k ? "on" : ""}`} onClick={() => setTab(k)} aria-current={tab === k}>{l}</button>
        ))}
      </nav>
    </div>
  );
}

/* ══════════════════  오늘  ══════════════════ */

function Today({ data, patch, tenK, date, setDate, startRest }) {
  const [pick, setPick] = useState(null); // 대체 대상 슬롯 id
  const dow = parse(date).getDay();
  const plan = data.program.week[dow] || { lift: "", run: "none" };
  const session = plan.lift ? data.program.sessions[plan.lift] : null;
  const run = RUN[plan.run] || RUN.none;
  const phase = phaseFor(date);
  const pw = weeksBetween(data.settings.startDate, date) + 1;
  const deload = pw > 0 && pw % 5 === 0;

  const day = data.log[date] || {};
  const swap = day.swap || {};
  const liftLog = day.lift || {};

  // 슬롯에 대체가 걸려 있으면 그 종목으로 바꾸되, 세트·반복 구성은 슬롯의 것을 유지한다
  const exList = useMemo(() => {
    if (!session) return [];
    return session.ex.map((s) => {
      const sets = deload ? Math.max(1, Math.ceil(s.sets / 2)) : s.sets;
      const sw = swap[s.id];
      if (!sw) return { ...s, sets, slotId: s.id };
      const l = lookupEx(sw, data.custom);
      return { ...s, sets, slotId: s.id, id: l.id, name: l.name, inc: l.inc, bw: l.bw, swapped: true };
    });
  }, [session, swap, deload, data.custom]);

  const totalSets = exList.reduce((a, e) => a + e.sets, 0);
  const doneSets = exList.reduce((a, e) => a + (liftLog[e.id] || []).filter((x) => x && x.d).length, 0);

  const setVal = (exId, i, field, v) => patch((d) => {
    const day = d.log[date] = d.log[date] || {};
    const lift = day.lift = day.lift || {};
    const arr = lift[exId] = lift[exId] || [];
    while (arr.length <= i) arr.push({ w: "", r: "", d: false });
    arr[i][field] = v;
    if (field === "w") arr[i].u = unitOf(d, exId);
  });

  const runSet = (field, v) => patch((d) => {
    const day = d.log[date] = d.log[date] || {};
    day.run = day.run || { km: "", time: "", d: false };
    day.run[field] = v;
  });

  const doSwap = (res) => {
    patch((d) => {
      const day = d.log[date] = d.log[date] || {};
      day.swap = day.swap || {};
      if (res.create) {
        const id = "c_" + Date.now().toString(36);
        d.custom.push({ id, name: res.create, pattern: "", inc: 2.5, bw: false });
        day.swap[pick] = id;
      } else {
        if (res.id === pick) delete day.swap[pick];
        else day.swap[pick] = res.id;
      }
    });
    setPick(null);
  };

  const [pLo, pHi] = paceRange(tenK, run.zone);
  const workout = run.quality ? (plan.run === "tempo" ? phase.tempo : phase.interval) : null;

  return (
    <>
      <header className="tp-head">
        <div className="tp-nav">
          <button onClick={() => setDate(addDays(date, -1))} aria-label="이전 날">‹</button>
          <button onClick={() => setDate(addDays(date, 1))} aria-label="다음 날">›</button>
          <div className="tp-date">
            <span className="tp-dow cond">{DOW[dow]}</span>
            <span className="tp-md cond">{parse(date).getMonth() + 1}월 {parse(date).getDate()}일</span>
          </div>
          <div className="tp-wk cond">{pw > 0 ? `${pw}주차` : "시작 전"}<br />{phase.name}</div>
        </div>
        <div className="tp-title">
          <div>
            <div className={`tp-sess cond ${session ? "" : "tp-off"}`}>{session ? session.name : "웨이트 휴식"}</div>
            <div className="tp-sub">{session ? session.sub : "러닝만"}</div>
          </div>
          {session && (
            <div>
              <div className="tp-tally">
                {Array.from({ length: totalSets }).map((_, i) => <span key={i} className={`tp-tick ${i < doneSets ? "on" : ""}`} />)}
              </div>
              <div className="tp-count cond">{doneSets} / {totalSets} 세트</div>
            </div>
          )}
        </div>
      </header>

      {deload && session && <p className="tp-banner iron">디로드 주간. 중량은 그대로 두고 세트를 절반으로 줄입니다. 실패 지점까지 밀지 마세요.</p>}
      {run.quality && <p className="tp-banner hot">질 높은 러닝 세션. 웨이트와 최소 6시간 간격을 두고, 가능하면 러닝을 먼저 하세요.</p>}

      {exList.map((e) => (
        <Exercise key={e.slotId} ex={e} log={liftLog[e.id] || []} date={date} allLog={data.log}
          unit={unitOf(data, e.id)} onChange={setVal} onSwap={() => setPick(e.slotId)} startRest={startRest}
          autoRest={data.settings.autoRest} />
      ))}

      <div className={`tp-row run ${day.run && day.run.d ? "done" : ""}`}>
        <div className="tp-runhead">
          <span className="tp-runname">{run.name}</span>
          {plan.run !== "none" && <span className="tp-pace">{mmss(pLo)}–{mmss(pHi)} /km</span>}
        </div>
        {workout && <div className="tp-workout">워밍업 15분 → {workout} → 쿨다운 10분</div>}
        {run.long && <div className="tp-workout">{phase.long[0]}–{phase.long[1]}km · {run.detail}</div>}
        {!workout && !run.long && <div className="tp-workout">{run.km ? `${run.km}km · ` : ""}{run.detail}</div>}
        {plan.run !== "none" && (
          <div className="tp-sets">
            <div className="tp-set">
              <span className="tp-setno" />
              <span className="tp-fld">
                <input type="number" step="0.1" inputMode="decimal" placeholder="거리"
                  value={(day.run && day.run.km) || ""} onChange={(e) => runSet("km", e.target.value)} aria-label="달린 거리" />
                <span className="tp-unit">km</span>
              </span>
              <span className="tp-fld">
                <input type="text" inputMode="numeric" placeholder="45:30"
                  value={(day.run && day.run.time) || ""} onChange={(e) => runSet("time", e.target.value)} aria-label="소요 시간" />
                <span className="tp-unit">시간</span>
              </span>
              <button className={`tp-chk ${day.run && day.run.d ? "on" : ""}`}
                onClick={() => runSet("d", !(day.run && day.run.d))} aria-label="러닝 완료">✓</button>
            </div>
          </div>
        )}
        {day.run && Number(day.run.km) > 0 && toSec(day.run.time) > 0 && (
          <div className="tp-prev">실제 페이스 <b>{mmss(toSec(day.run.time) / Number(day.run.km))} /km</b></div>
        )}
      </div>

      {pick && (
        <Picker title="종목 바꾸기" hint="오늘 하루만 바뀝니다. 기록은 바꾼 종목 이름으로 쌓이고, 세트·반복 구성은 그대로입니다."
          current={swap[pick] || pick} custom={data.custom} taken={exList.map((e) => e.id)}
          onPick={doSwap} onClose={() => setPick(null)}
          onRevert={swap[pick] ? () => { patch((d) => { delete d.log[date].swap[pick]; }); setPick(null); } : null} />
      )}
    </>
  );
}

function Exercise({ ex, log, date, allLog, unit, onChange, onSwap, startRest, autoRest }) {
  const U = UL(unit);

  const prev = useMemo(() => {
    const ds = Object.keys(allLog).filter((d) => d < date && allLog[d].lift && allLog[d].lift[ex.id]).sort().reverse();
    for (const d of ds) {
      const sets = allLog[d].lift[ex.id].filter((s) => s && s.d && s.r);
      if (sets.length) return { date: d, sets };
    }
    return null;
  }, [allLog, date, ex.id]);

  const prevW = prev ? nice(fromKg(setKg(prev.sets[0]), unit), unit) : 0;
  const suggest = useMemo(() => {
    if (!prev) return null;
    const top = prev.sets.length >= ex.sets && prev.sets.every((s) => Number(s.r) >= ex.hi);
    return top ? { w: prevW + ex.inc, r: ex.lo, up: true } : { w: prevW, up: false };
  }, [prev, prevW, ex, unit]);

  const doneCount = log.filter((s) => s && s.d).length;

  const toggle = (i, on) => {
    onChange(ex.id, i, "d", on);
    if (on && autoRest && i < ex.sets - 1) startRest(`${ex.name} ${i + 1}세트 후`, ex.rest);
  };

  return (
    <div className={`tp-row ${doneCount === ex.sets ? "done" : ""}`}>
      <div className="tp-exhead">
        <button className="tp-exname" onClick={onSwap} aria-label={`${ex.name} 종목 바꾸기`}>
          {ex.name}
          {ex.swapped && <span className="tp-swapped">대체</span>}
        </button>
        <span className="tp-scheme">{ex.lo === ex.hi ? ex.lo : `${ex.lo}–${ex.hi}`} × {ex.sets}</span>
      </div>
      <div className="tp-meta">
        {ex.note && <span>{ex.note}</span>}
        <button onClick={() => startRest(ex.name, ex.rest)}>휴식 {mmss(ex.rest)}</button>
      </div>
      <div className="tp-sets">
        {Array.from({ length: ex.sets }).map((_, i) => {
          const s = log[i] || { w: "", r: "", d: false };
          return (
            <div className="tp-set" key={i}>
              <span className="tp-setno">{i + 1}</span>
              <span className="tp-fld">
                <input type="number" step={unit === "lb" ? "2.5" : "0.5"} inputMode="decimal"
                  placeholder={suggest ? String(suggest.w) : U} value={showW(s, unit)}
                  onChange={(e) => onChange(ex.id, i, "w", e.target.value)} aria-label={`${i + 1}세트 중량`} />
                <span className="tp-unit">{U}</span>
              </span>
              <span className="tp-fld">
                <input type="number" inputMode="numeric"
                  placeholder={suggest && suggest.r ? String(suggest.r) : String(ex.lo)} value={s.r}
                  onChange={(e) => onChange(ex.id, i, "r", e.target.value)} aria-label={`${i + 1}세트 반복`} />
                <span className="tp-unit">회</span>
              </span>
              <button className={`tp-chk ${s.d ? "on" : ""}`} onClick={() => toggle(i, !s.d)} aria-label={`${i + 1}세트 완료`}>✓</button>
            </div>
          );
        })}
      </div>
      {prev ? (
        <div className="tp-prev">
          직전 {parse(prev.date).getMonth() + 1}/{parse(prev.date).getDate()} · {prevW}{U} × {prev.sets.map((s) => s.r).join(", ")}
          {suggest && suggest.up && <> → 이번엔 <b>{suggest.w}{U} · {ex.lo}회부터</b></>}
          {suggest && !suggest.up && <> → <b>{suggest.w}{U} 유지, 반복수 늘리기</b></>}
        </div>
      ) : (
        <div className="tp-prev">이 종목 첫 기록입니다. {ex.hi}회를 RPE 7–8로 넘길 중량에서 시작하세요.</div>
      )}
    </div>
  );
}

/* ══════════════════  주간  ══════════════════ */

function Week({ data, date, setDate, setTab }) {
  const mon = monday(date);
  const days = Array.from({ length: 7 }, (_, i) => addDays(mon, i));
  const today = iso(new Date());
  const target = weeklyKmTarget(mon);
  const phase = phaseFor(mon);
  const pw = weeksBetween(data.settings.startDate, mon) + 1;

  const km = days.reduce((s, d) => { const r = data.log[d] && data.log[d].run; return s + (r && r.d ? Number(r.km) || 0 : 0); }, 0);
  const time = days.reduce((s, d) => { const r = data.log[d] && data.log[d].run; return s + (r && r.d ? toSec(r.time) : 0); }, 0);
  const liftDone = days.filter((d) => {
    const l = data.log[d] && data.log[d].lift;
    return l && Object.values(l).some((sets) => sets.some((s) => s && s.d));
  }).length;
  const planned = Object.values(data.program.week).filter((w) => w.lift).length;

  return (
    <>
      <header className="tp-head">
        <div className="tp-nav">
          <button onClick={() => setDate(addDays(mon, -7))} aria-label="이전 주">‹</button>
          <button onClick={() => setDate(addDays(mon, 7))} aria-label="다음 주">›</button>
          <div className="tp-date">
            <span className="tp-dow cond">{pw > 0 ? `${pw}주차` : "시작 전"}</span>
            <span className="tp-md cond">{parse(mon).getMonth() + 1}/{parse(mon).getDate()} – {parse(addDays(mon, 6)).getMonth() + 1}/{parse(addDays(mon, 6)).getDate()}</span>
          </div>
        </div>
        <div className="tp-sub">{phase.name} · {phase.focus}</div>
      </header>

      <div className="tp-mets">
        <div className="tp-met"><div className="tp-metv">{km.toFixed(0)}<small> / {target}</small></div><div className="tp-metl">주간 거리 km</div></div>
        <div className="tp-met"><div className="tp-metv">{liftDone}<small> / {planned}</small></div><div className="tp-metl">웨이트 세션</div></div>
        <div className="tp-met"><div className="tp-metv">{hms(time)}</div><div className="tp-metl">러닝 시간</div></div>
      </div>

      {days.map((d) => {
        const dw = parse(d).getDay();
        const plan = data.program.week[dw] || { lift: "", run: "none" };
        const sess = plan.lift ? data.program.sessions[plan.lift] : null;
        const l = data.log[d] && data.log[d].lift;
        const r = data.log[d] && data.log[d].run;
        const lOn = l && Object.values(l).some((sets) => sets.some((s) => s && s.d));
        const swapped = data.log[d] && data.log[d].swap && Object.keys(data.log[d].swap).length;
        return (
          <button key={d} className={`tp-day ${d === today ? "today" : ""}`} onClick={() => { setDate(d); setTab("today"); }}>
            <span className="tp-daydow">{DOW[dw]}</span>
            <span className="tp-dayinfo">
              <span className="tp-daylift">{sess ? `${sess.name} · ${sess.sub}` : "웨이트 휴식"}{swapped ? ` (대체 ${swapped})` : ""}</span>
              <span className="tp-dayrun">
                {(RUN[plan.run] || RUN.none).name}
                {r && r.d && Number(r.km) > 0 ? ` — ${r.km}km${toSec(r.time) ? " " + mmss(toSec(r.time) / Number(r.km)) + "/km" : ""}` : ""}
              </span>
            </span>
            <span className="tp-dots">
              {sess && <span className={`tp-dot lift ${lOn ? "on" : ""}`} />}
              {plan.run !== "none" && <span className={`tp-dot run ${r && r.d ? "on" : ""}`} />}
            </span>
          </button>
        );
      })}

      <div className="tp-sec">
        <h2 className="tp-sech">이번 주 주의점</h2>
        <p className="tp-secp">
          거리 증가는 3주 증량 뒤 1주 감량입니다. 감량 주에는 목표가 자동으로 약 22% 줄어듭니다.
          정강이 앞쪽 통증, 아침 아킬레스 경직, 무릎 앞쪽 통증이 이틀 이상 이어지면 거리를 즉시 30% 줄이세요.
          탄수화물과 단백질을 충분히 유지하고 감량기를 두지 마세요.
        </p>
      </div>
    </>
  );
}

/* ══════════════════  러닝  ══════════════════ */

function Running({ data, patch, tenK }) {
  const [d, setD] = useState(iso(new Date()));
  const [t, setT] = useState("");
  const phase = phaseFor(iso(new Date()));

  const add = () => {
    const sec = toSec(t);
    if (!sec) return;
    patch((x) => { x.tt.push({ date: d, sec }); x.tt.sort((a, b) => a.date.localeCompare(b.date)); });
    setT("");
  };
  const chart = data.tt.map((x) => ({ date: x.date.slice(2), min: +(x.sec / 60).toFixed(2) }));

  return (
    <>
      <header className="tp-head">
        <div className="tp-sess cond">{hms(tenK)}</div>
        <div className="tp-sub">현재 10K · 목표 50:00까지 {tenK > 3000 ? hms(tenK - 3000) + " 단축" : "달성"}</div>
      </header>

      <div className="tp-sec">
        <h2 className="tp-sech">훈련 페이스</h2>
        <p className="tp-secp">최신 기록 기준으로 자동 계산됩니다. 8–10주마다 타임트라이얼을 넣으면 전체가 갱신됩니다.</p>
        <table className="tp-tbl"><tbody>
          {Object.entries(ZONES).map(([k, z]) => {
            const [a, b] = paceRange(tenK, k);
            return <tr key={k}><td>{z.label}</td><td className="num" style={{ textAlign: "right" }}>{mmss(a)}–{mmss(b)}</td></tr>;
          })}
        </tbody></table>
      </div>

      <div className="tp-sec">
        <h2 className="tp-sech">이번 시기의 질 세션</h2>
        <p className="tp-secp">{phase.name} · {phase.focus}</p>
        <table className="tp-tbl"><tbody>
          <tr><td style={{ width: 62 }}>화요일</td><td>{phase.tempo}</td></tr>
          <tr><td>금요일</td><td>{phase.interval}</td></tr>
          <tr><td>일요일</td><td>롱런 {phase.long[0]}–{phase.long[1]}km</td></tr>
        </tbody></table>
      </div>

      <div className="tp-sec">
        <h2 className="tp-sech">로드맵</h2>
        <p className="tp-secp">2028년 1월 sub-50까지 다섯 시기.</p>
        <table className="tp-tbl">
          <thead><tr><th>시기</th><th>주간 거리</th><th style={{ textAlign: "right" }}>목표</th></tr></thead>
          <tbody>
            {PHASES.map((p) => (
              <tr key={p.name} className={p.name === phase.name ? "now" : ""}>
                <td>{p.name}<br /><span style={{ color: "var(--dim)", fontSize: 12 }}>{p.from.slice(2, 7)}–{p.to.slice(2, 7)}</span></td>
                <td className="num">{p.km[0] === p.km[1] ? p.km[0] : `${p.km[0]}→${p.km[1]}`}</td>
                <td className="num" style={{ textAlign: "right" }}>{p.goal}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="tp-sec">
        <h2 className="tp-sech">타임트라이얼</h2>
        <p className="tp-secp">10km 실측 기록. 가장 최근 값이 모든 페이스의 기준이 됩니다.</p>
        {chart.length > 1 && (
          <div style={{ height: 190, margin: "0 -8px 16px 0" }}>
            <ResponsiveContainer>
              <LineChart data={chart}>
                <CartesianGrid stroke="#2E3742" vertical={false} />
                <XAxis dataKey="date" stroke="#8A97A4" fontSize={12} />
                <YAxis stroke="#8A97A4" fontSize={12} domain={["dataMin - 2", "dataMax + 2"]} reversed width={44}
                  tickFormatter={(v) => `${Math.floor(v)}분`} />
                <Tooltip contentStyle={{ background: "#212832", border: "1px solid #2E3742", borderRadius: 8, color: "#E8EBED", fontFamily: "Barlow" }}
                  formatter={(v) => [hms(v * 60), "10K"]} />
                <ReferenceLine y={50} stroke="#FF4D2E" strokeDasharray="4 4"
                  label={{ value: "목표 50:00", fill: "#FF4D2E", fontSize: 12, position: "insideTopRight" }} />
                <Line type="monotone" dataKey="min" stroke="#E8EBED" strokeWidth={2} dot={{ r: 3, fill: "#E8EBED" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 16 }}>
          <div className="tp-f" style={{ flex: 1, marginBottom: 0 }}>
            <label htmlFor="ttd">날짜</label>
            <input id="ttd" type="date" value={d} onChange={(e) => setD(e.target.value)} />
          </div>
          <div className="tp-f" style={{ flex: 1, marginBottom: 0 }}>
            <label htmlFor="ttt">10K 기록</label>
            <input id="ttt" type="text" inputMode="numeric" placeholder="1:02:30" value={t} onChange={(e) => setT(e.target.value)} />
          </div>
          <button className="tp-btn hot" onClick={add}>추가</button>
        </div>
        <table className="tp-tbl"><tbody>
          {[...data.tt].reverse().map((x, i) => (
            <tr key={i}>
              <td>{x.date}</td>
              <td className="num">{hms(x.sec)}</td>
              <td className="num" style={{ color: "var(--muted)" }}>{mmss(x.sec / 10)}/km</td>
              <td style={{ textAlign: "right" }}>
                <button className="tp-btn sm danger"
                  onClick={() => patch((y) => { y.tt = y.tt.filter((z) => !(z.date === x.date && z.sec === x.sec)); })}>삭제</button>
              </td>
            </tr>
          ))}
        </tbody></table>
      </div>
    </>
  );
}

/* ══════════════════  기록  ══════════════════ */

function History({ data, unit }) {
  const [mode, setMode] = useState("all");
  const [sel, setSel] = useState(null);
  const [metric, setMetric] = useState("e1rm");

  /* 종목별 세션 요약을 한 번에 만든다 */
  const byEx = useMemo(() => {
    const m = {};
    Object.keys(data.log).sort().forEach((d) => {
      const lift = data.log[d].lift;
      if (!lift) return;
      Object.entries(lift).forEach(([id, sets]) => {
        const done = sets.filter((s) => s && s.d && s.w !== "" && s.r);
        if (!done.length) return;
        const bestKg = Math.max(...done.map((s) => e1rm(setKg(s), Number(s.r))));
        const topKg = Math.max(...done.map((s) => setKg(s)));
        const volKg = done.reduce((a, s) => a + setKg(s) * Number(s.r), 0);
        const reps = done.reduce((a, s) => a + Number(s.r), 0);
        (m[id] = m[id] || []).push({ date: d, bestKg, topKg, volKg, sets: done.length, reps, detail: done });
      });
    });
    return m;
  }, [data.log]);

  const ids = Object.keys(byEx);
  const name = (id) => lookupEx(id, data.custom).name;

  /* 전체 종목 비교표 */
  const overview = useMemo(() => ids.map((id) => {
    const h = byEx[id];
    const first = h[0], last = h[h.length - 1];
    const chg = first.bestKg > 0 ? ((last.bestKg - first.bestKg) / first.bestKg) * 100 : 0;
    const peak = Math.max(...h.map((x) => x.bestKg));
    const u = unitOf(data, id);
    return {
      id, name: name(id), n: h.length, last: last.date, u,
      e1rm: fromKg(last.bestKg, u), peak: fromKg(peak, u), chg,
      stale: last.bestKg < peak * 0.98,
    };
  }).sort((a, b) => b.chg - a.chg), [ids, byEx, data]);

  const cur = sel && byEx[sel] ? byEx[sel] : null;
  const su = sel ? unitOf(data, sel) : unit;
  const SU = UL(su);
  const chart = cur ? cur.map((x) => ({
    date: x.date.slice(5),
    e1rm: +fromKg(x.bestKg, su).toFixed(1),
    top: +fromKg(x.topKg, su).toFixed(1),
    vol: Math.round(fromKg(x.volKg, su)),
  })) : [];

  const mileage = useMemo(() => {
    const w = {};
    Object.entries(data.log).forEach(([d, day]) => {
      if (day.run && day.run.d && Number(day.run.km) > 0) w[monday(d)] = (w[monday(d)] || 0) + Number(day.run.km);
    });
    return Object.keys(w).sort().map((k) => ({ week: k.slice(5), km: +w[k].toFixed(1), target: weeklyKmTarget(k) }));
  }, [data.log]);

  const totalKm = mileage.reduce((s, x) => s + x.km, 0);
  const sessions = Object.values(data.log).filter((d) => d.lift && Object.values(d.lift).some((s) => s.some((x) => x && x.d))).length;

  if (!ids.length && !mileage.length) return (
    <div className="tp-empty">아직 기록이 없습니다. 오늘 탭에서 세트를 완료하면 여기에 종목별 추이가 쌓입니다.</div>
  );

  const MET = { e1rm: "추정 1RM", top: "최고 세트 중량", vol: "세션 볼륨" };

  return (
    <>
      <header className="tp-head">
        <div className="tp-sess cond">기록</div>
        <div className="tp-sub">웨이트 {sessions}회 · 러닝 {totalKm.toFixed(0)}km · 종목 {ids.length}개</div>
      </header>
      <div className="tp-chips" style={{ paddingTop: 14 }}>
        <button className={`tp-chip ${mode === "all" ? "on" : ""}`} onClick={() => setMode("all")}>전체 비교</button>
        <button className={`tp-chip ${mode === "one" ? "on" : ""}`} onClick={() => { setMode("one"); if (!sel) setSel(ids[0]); }}>종목 상세</button>
        <button className={`tp-chip ${mode === "run" ? "on" : ""}`} onClick={() => setMode("run")}>러닝 거리</button>
      </div>

      {mode === "all" && (
        <div className="tp-sec" style={{ paddingTop: 6 }}>
          <p className="tp-secp">
            첫 기록 대비 추정 1RM 변화율 순입니다. 최고치보다 2% 이상 낮은 종목에는 정체 표시가 붙습니다.
            종목 이름을 누르면 상세로 넘어갑니다.
          </p>
          <table className="tp-tbl">
            <thead><tr><th>종목</th><th>최근 1RM</th><th>최고</th><th style={{ textAlign: "right" }}>변화</th></tr></thead>
            <tbody>
              {overview.map((o) => (
                <tr key={o.id}>
                  <td>
                    <button style={{ background: "none", border: "none", color: "var(--paper)", padding: 0, fontSize: 14, fontWeight: 600, textAlign: "left" }}
                      onClick={() => { setSel(o.id); setMode("one"); }}>{o.name}</button>
                    <div style={{ color: "var(--dim)", fontSize: 12, marginTop: 2 }}>
                      {o.n}회 · {o.last.slice(5)}{o.stale ? " · 정체" : ""}
                    </div>
                  </td>
                  <td className="num">{o.e1rm.toFixed(1)}<span style={{ color: "var(--muted)", fontSize: 11, fontWeight: 500 }}> {UL(o.u)}</span></td>
                  <td className="num" style={{ color: "var(--muted)" }}>{o.peak.toFixed(1)}</td>
                  <td className={`num ${o.chg >= 0 ? "tp-up" : "tp-down"}`} style={{ textAlign: "right" }}>
                    {o.chg >= 0 ? "+" : ""}{o.chg.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="tp-secp" style={{ marginTop: 14 }}>추정 1RM은 Epley 공식(중량 × (1 + 반복/30))입니다. 단위는 종목마다 구성 탭에서 지정한 값을 따릅니다.</p>
        </div>
      )}

      {mode === "one" && (
        <>
          <div className="tp-sec" style={{ paddingTop: 6 }}>
            <div className="tp-f">
              <select value={sel || ""} onChange={(e) => setSel(e.target.value)} aria-label="종목 선택">
                {ids.map((id) => <option key={id} value={id}>{name(id)}</option>)}
              </select>
            </div>
            {cur && (
              <>
                <div className="tp-seg" style={{ marginBottom: 16 }}>
                  {Object.entries(MET).map(([k, l]) => (
                    <button key={k} className={metric === k ? "on" : ""} onClick={() => setMetric(k)}>{l}</button>
                  ))}
                </div>
                {chart.length > 1 ? (
                  <div style={{ height: 210, margin: "0 -8px 8px 0" }}>
                    <ResponsiveContainer>
                      <LineChart data={chart}>
                        <CartesianGrid stroke="#2E3742" vertical={false} />
                        <XAxis dataKey="date" stroke="#8A97A4" fontSize={12} />
                        <YAxis stroke="#8A97A4" fontSize={12} width={44} domain={["auto", "auto"]} />
                        <Tooltip contentStyle={{ background: "#212832", border: "1px solid #2E3742", borderRadius: 8, color: "#E8EBED", fontFamily: "Barlow" }}
                          formatter={(v) => [`${v} ${SU}`, MET[metric]]} />
                        <Line type="monotone" dataKey={metric} name={MET[metric]} stroke="#D8DEE4" strokeWidth={2} dot={{ r: 3, fill: "#D8DEE4" }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : <p className="tp-secp">추이를 그리려면 두 번 이상 기록이 필요합니다.</p>}
              </>
            )}
          </div>
          {cur && (
            <div className="tp-sec" style={{ paddingTop: 4 }}>
              <h2 className="tp-sech">세션 기록</h2>
              <p className="tp-secp">직전 세션 대비 추정 1RM 변화를 함께 보여줍니다.</p>
              <table className="tp-tbl">
                <thead><tr><th>날짜</th><th>수행</th><th>1RM {SU}</th><th style={{ textAlign: "right" }}>변화</th></tr></thead>
                <tbody>
                  {[...cur].reverse().map((x, i, arr) => {
                    const p = arr[i + 1];
                    const dv = p ? fromKg(x.bestKg - p.bestKg, su) : null;
                    return (
                      <tr key={x.date}>
                        <td>{x.date.slice(5)}</td>
                        <td style={{ fontSize: 13 }}>
                          {x.detail.map((s) => `${showW(s, su)}×${s.r}`).join(", ")}
                          <div style={{ color: "var(--dim)", fontSize: 12, marginTop: 2 }}>총 {x.reps}회 · {Math.round(fromKg(x.volKg, su))}{SU}</div>
                        </td>
                        <td className="num">{fromKg(x.bestKg, su).toFixed(1)}</td>
                        <td className={`num ${dv === null ? "" : dv >= 0 ? "tp-up" : "tp-down"}`} style={{ textAlign: "right" }}>
                          {dv === null ? "—" : `${dv >= 0 ? "+" : ""}${dv.toFixed(1)}`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {mode === "run" && (
        <div className="tp-sec" style={{ paddingTop: 6 }}>
          <p className="tp-secp">막대가 목표선을 계속 넘으면 부상 위험이 올라갑니다. 모자란 주는 그냥 넘기세요.</p>
          {mileage.length ? (
            <div style={{ height: 220, margin: "0 -8px 8px 0" }}>
              <ResponsiveContainer>
                <ComposedChart data={mileage}>
                  <CartesianGrid stroke="#2E3742" vertical={false} />
                  <XAxis dataKey="week" stroke="#8A97A4" fontSize={12} />
                  <YAxis stroke="#8A97A4" fontSize={12} width={34} />
                  <Tooltip contentStyle={{ background: "#212832", border: "1px solid #2E3742", borderRadius: 8, color: "#E8EBED", fontFamily: "Barlow" }} />
                  <Legend wrapperStyle={{ fontSize: 12, color: "#8A97A4" }} />
                  <Bar dataKey="km" name="실제" fill="#FF4D2E" radius={[3, 3, 0, 0]} />
                  <Line type="stepAfter" dataKey="target" name="목표" stroke="#8A97A4" dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="tp-secp">러닝 기록이 아직 없습니다.</p>}
        </div>
      )}
    </>
  );
}

/* ══════════════════  구성 (프로그램 편집)  ══════════════════ */

function Program({ data, patch }) {
  const keys = Object.keys(data.program.sessions);
  const [sid, setSid] = useState(keys[0]);
  const [pick, setPick] = useState(null); // {idx} 또는 {add:true}
  const s = data.program.sessions[sid];

  const upd = (idx, field, v) => patch((d) => { d.program.sessions[sid].ex[idx][field] = v; });
  /* 단위는 종목 단위로 관리하므로 다른 세션에 든 같은 종목의 증량 폭도 함께 환산한다 */
  const setExUnit = (id, u) => patch((d) => {
    const from = unitOf(d, id);
    if (from === u) return;
    d.units = d.units || {};
    d.units[id] = u;
    Object.values(d.program.sessions).forEach((ss) => ss.ex.forEach((x) => {
      if (x.id === id) x.inc = convertInc(x.inc, from, u);
    }));
  });
  const move = (idx, dir) => patch((d) => {
    const a = d.program.sessions[sid].ex, j = idx + dir;
    if (j < 0 || j >= a.length) return;
    [a[idx], a[j]] = [a[j], a[idx]];
  });
  const del = (idx) => patch((d) => { d.program.sessions[sid].ex.splice(idx, 1); });

  const onPick = (res) => {
    patch((d) => {
      let id, l;
      if (res.create) {
        id = "c_" + Date.now().toString(36);
        l = { id, name: res.create, pattern: "", inc: 2.5, bw: false };
        d.custom.push(l);
      } else { id = res.id; l = lookupEx(id, d.custom); }
      const arr = d.program.sessions[sid].ex;
      const inc = convertInc(l.inc, "kg", unitOf(d, id));
      if (pick.add) arr.push({ id, name: l.name, pattern: l.pattern, inc, bw: l.bw, sets: 3, lo: 8, hi: 12, rest: 120, note: "" });
      else arr[pick.idx] = { ...arr[pick.idx], id, name: l.name, pattern: l.pattern, inc, bw: l.bw };
    });
    setPick(null);
  };

  return (
    <>
      <header className="tp-head">
        <div className="tp-sess cond">구성</div>
        <div className="tp-sub">프로그램을 직접 바꿉니다. 여기서 바꾸면 앞으로 모든 날에 적용됩니다.</div>
      </header>

      <div className="tp-chips" style={{ paddingTop: 14 }}>
        {keys.map((k) => (
          <button key={k} className={`tp-chip ${sid === k ? "on" : ""}`} onClick={() => setSid(k)}>
            {data.program.sessions[k].name}
          </button>
        ))}
        <button className="tp-chip" onClick={() => patch((d) => {
          const id = "s_" + Date.now().toString(36);
          d.program.sessions[id] = { name: "새 세션", sub: "", ex: [] };
        })}>＋ 세션</button>
      </div>

      <div className="tp-sec" style={{ paddingTop: 0, paddingBottom: 4 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <div className="tp-f" style={{ flex: 1, marginBottom: 10 }}>
            <label>세션 이름</label>
            <input type="text" value={s.name} onChange={(e) => patch((d) => { d.program.sessions[sid].name = e.target.value; })} />
          </div>
          <div className="tp-f" style={{ flex: 1.4, marginBottom: 10 }}>
            <label>설명</label>
            <input type="text" value={s.sub} onChange={(e) => patch((d) => { d.program.sessions[sid].sub = e.target.value; })} />
          </div>
        </div>
      </div>

      {s.ex.map((e, i) => {
        const eu = unitOf(data, e.id);
        return (
        <div className="tp-edit" key={i}>
          <div className="tp-edithead">
            <button className="tp-editname" onClick={() => setPick({ idx: i })}>{e.name}</button>
            <button className={`tp-mini tp-unitbtn ${eu === "lb" ? "lb" : ""}`} aria-label={`${e.name} 무게 단위, 현재 ${UL(eu)}`}
              onClick={() => setExUnit(e.id, eu === "kg" ? "lb" : "kg")}>{UL(eu)}</button>
            <button className="tp-mini" onClick={() => move(i, -1)} aria-label="위로">↑</button>
            <button className="tp-mini" onClick={() => move(i, 1)} aria-label="아래로">↓</button>
            <button className="tp-mini" onClick={() => del(i)} aria-label="삭제">×</button>
          </div>
          <div className="tp-nums">
            <label className="tp-num"><span>세트</span>
              <input type="number" min="1" value={e.sets} onChange={(ev) => upd(i, "sets", Math.max(1, Number(ev.target.value) || 1))} /></label>
            <label className="tp-num"><span>최소 반복</span>
              <input type="number" min="1" value={e.lo} onChange={(ev) => upd(i, "lo", Number(ev.target.value) || 1)} /></label>
            <label className="tp-num"><span>최대 반복</span>
              <input type="number" min="1" value={e.hi} onChange={(ev) => upd(i, "hi", Number(ev.target.value) || 1)} /></label>
            <label className="tp-num"><span>휴식 초</span>
              <input type="number" min="0" step="15" value={e.rest} onChange={(ev) => upd(i, "rest", Math.max(0, Number(ev.target.value) || 0))} /></label>
            <label className="tp-num"><span>증량 {UL(eu)}</span>
              <input type="number" min="0" step={eu === "lb" ? "2.5" : "0.5"} value={e.inc}
                onChange={(ev) => upd(i, "inc", Math.max(0, Number(ev.target.value) || 0))} /></label>
          </div>
          <div className="tp-f" style={{ marginTop: 9, marginBottom: 0 }}>
            <input type="text" placeholder="메모 (선택)" value={e.note} onChange={(ev) => upd(i, "note", ev.target.value)} />
          </div>
        </div>
        );
      })}

      <div className="tp-sec" style={{ paddingTop: 16 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="tp-btn hot" onClick={() => setPick({ add: true })}>종목 추가</button>
          {keys.length > 1 && !Object.values(data.program.week).some((w) => w.lift === sid) && (
            <button className="tp-btn danger" onClick={() => patch((d) => { delete d.program.sessions[sid]; setSid(Object.keys(d.program.sessions)[0]); })}>
              이 세션 삭제
            </button>
          )}
        </div>
        {Object.values(data.program.week).some((w) => w.lift === sid) && keys.length > 1 && (
          <p className="tp-secp" style={{ marginTop: 12 }}>요일에 배정된 세션은 삭제할 수 없습니다. 아래에서 배정을 먼저 해제하세요.</p>
        )}
      </div>

      <div className="tp-sec">
        <h2 className="tp-sech">요일 배정</h2>
        <p className="tp-secp">각 요일에 어떤 세션과 어떤 러닝을 넣을지 정합니다. 하체 다음 날에 질 높은 러닝이 오지 않게 하세요.</p>
        <table className="tp-tbl">
          <tbody>
            {[1, 2, 3, 4, 5, 6, 0].map((dw) => {
              const w = data.program.week[dw] || { lift: "", run: "none" };
              return (
                <tr key={dw}>
                  <td style={{ width: 26 }} className="num">{DOW[dw]}</td>
                  <td style={{ paddingRight: 6 }}>
                    <select style={{ width: "100%", padding: "8px 6px", fontSize: 14 }} value={w.lift}
                      onChange={(e) => patch((d) => { d.program.week[dw] = { ...w, lift: e.target.value }; })}>
                      <option value="">웨이트 휴식</option>
                      {keys.map((k) => <option key={k} value={k}>{data.program.sessions[k].name}</option>)}
                    </select>
                  </td>
                  <td>
                    <select style={{ width: "100%", padding: "8px 6px", fontSize: 14 }} value={w.run}
                      onChange={(e) => patch((d) => { d.program.week[dw] = { ...w, run: e.target.value }; })}>
                      {Object.entries(RUN).map(([k, r]) => <option key={k} value={k}>{r.name}</option>)}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="tp-sec">
        <h2 className="tp-sech">되돌리기</h2>
        <p className="tp-secp">구성만 초기값으로 되돌립니다. 운동 기록은 지워지지 않습니다.</p>
        <button className="tp-btn danger" onClick={() => patch((d) => { d.program = DEFAULT_PROGRAM(); setSid("upperA"); })}>
          기본 프로그램으로 되돌리기
        </button>
      </div>

      {pick && (
        <Picker title={pick.add ? "종목 추가" : "종목 바꾸기"}
          hint={pick.add ? "추가한 종목은 3세트 8–12회, 휴식 120초로 시작합니다. 아래에서 바꾸세요."
            : "프로그램 자체가 바뀝니다. 하루만 바꾸려면 오늘 탭에서 종목 이름을 누르세요."}
          current={pick.add ? null : s.ex[pick.idx].id} custom={data.custom} taken={s.ex.map((e) => e.id)}
          onPick={onPick} onClose={() => setPick(null)} />
      )}
    </>
  );
}

/* ══════════════════  설정  ══════════════════ */

function Settings({ data, patch, setData, unit }) {
  const [confirm, setConfirm] = useState(false);
  const [imp, setImp] = useState(null);
  const s = data.settings;

  const readBackup = (file, input) => {
    if (input) input.value = "";
    if (!file) return;
    const r = new FileReader();
    r.onerror = () => setImp({ error: "파일을 읽을 수 없습니다" });
    r.onload = () => {
      try {
        const x = JSON.parse(String(r.result));
        if (!x || !x.program || !x.program.sessions) throw new Error("이 앱의 백업 파일이 아닙니다");
        const ex = new Set();
        Object.values(x.log || {}).forEach((d) => d && d.lift && Object.keys(d.lift).forEach((id) => ex.add(id)));
        setImp({ data: x, days: Object.keys(x.log || {}).length, ex: ex.size, tt: (x.tt || []).length });
      } catch (e) { setImp({ error: String((e && e.message) || e) }); }
    };
    r.readAsText(file);
  };
  const applyBackup = () => {
    const n = normalize(imp.data);
    if (!n) { setImp({ error: "형식을 알아볼 수 없습니다" }); return; }
    setData(n); saveData(n); setImp(null);
  };
  const U = UL(unit);
  const bwShown = showW({ w: s.bw, u: s.bwU || "kg" }, unit);
  const bwKg = s.bw ? toKg(s.bw, s.bwU || "kg") : 0;

  return (
    <>
      <header className="tp-head">
        <div className="tp-sess cond">설정</div>
        <div className="tp-sub">기록은 이 브라우저에 저장됩니다</div>
      </header>

      <div className="tp-sec">
        <div className="tp-f">
          <label>기본 중량 단위</label>
          <div className="tp-seg">
            {[["kg", "kg"], ["lb", "lbs"]].map(([k, l]) => (
              <button key={k} className={unit === k ? "on" : ""} aria-pressed={unit === k}
                onClick={() => patch((d) => {
                  const from = d.settings.unit || "kg";
                  if (from === k) return;
                  d.settings.unit = k;
                  Object.values(d.program.sessions).forEach((ss) => ss.ex.forEach((x) => {
                    if (!(d.units && d.units[x.id])) x.inc = convertInc(x.inc, from, k);
                  }));
                })}>{l}</button>
            ))}
          </div>
          <small>종목별로 따로 지정하지 않은 종목과 체중에 적용되는 기본값입니다. 특정 종목만 다른 단위로 쓰려면 구성 탭에서 종목 이름 옆의 단위 버튼을 누르세요. 기록은 입력했던 단위 그대로 남으므로 단위를 오가도 숫자가 어긋나지 않습니다.</small>
        </div>

        <div className="tp-f">
          <label>세트 완료 시 휴식 타이머</label>
          <div className="tp-seg">
            {[[true, "자동 시작"], [false, "수동"]].map(([v, l]) => (
              <button key={String(v)} className={!!s.autoRest === v ? "on" : ""} aria-pressed={!!s.autoRest === v}
                onClick={() => patch((d) => { d.settings.autoRest = v; })}>{l}</button>
            ))}
          </div>
          <small>수동이어도 종목 아래 “휴식 0:00”을 누르면 언제든 시작합니다. 종목별 휴식 시간은 구성 탭에서 바꿉니다.</small>
        </div>

        <div className="tp-f">
          <label htmlFor="sd">프로그램 시작일</label>
          <input id="sd" type="date" value={s.startDate} onChange={(e) => patch((d) => { d.settings.startDate = e.target.value; })} />
          <small>주차와 디로드 주기(4주 누적 + 1주 디로드)의 기준입니다. 월요일로 맞추세요.</small>
        </div>

        <div className="tp-f">
          <label htmlFor="bw">체중 {U}</label>
          <input id="bw" type="number" step={unit === "lb" ? "0.5" : "0.1"} inputMode="decimal" value={bwShown}
            onChange={(e) => patch((d) => { d.settings.bw = e.target.value; d.settings.bwU = unit; })} />
          <small>{bwKg > 0
            ? `하루 단백질 ${(bwKg * 1.8).toFixed(0)}–${(bwKg * 2.2).toFixed(0)}g · 탄수화물 ${(bwKg * 5).toFixed(0)}–${(bwKg * 7).toFixed(0)}g`
            : "입력하면 하루 단백질·탄수화물 목표를 계산합니다."}</small>
        </div>
      </div>

      <div className="tp-sec">
        <h2 className="tp-sech">데이터</h2>
        <p className="tp-secp">프로그램 구성과 모든 기록이 함께 저장됩니다. 기록은 이 브라우저에만 있으므로, 기기를 옮기거나 폰에서도 쓰려면 백업 파일을 내려받아 그쪽에서 불러오세요.</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="tp-btn" onClick={() => {
            const b = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(b);
            a.download = `training-${iso(new Date())}.json`;
            a.click();
          }}>백업 내려받기</button>
          <label className="tp-btn">
            백업 불러오기
            <input type="file" accept="application/json,.json"
              onChange={(e) => readBackup(e.target.files && e.target.files[0], e.target)} />
          </label>
          <button className={`tp-btn ${confirm ? "hot" : "danger"}`} onClick={() => {
            if (!confirm) { setConfirm(true); return; }
            const b = BLANK(); setData(b); saveData(b); setConfirm(false);
          }}>{confirm ? "정말 지웁니다" : "전체 초기화"}</button>
        </div>
        {imp && (imp.error ? (
          <p className="tp-secp" style={{ marginTop: 12, color: "var(--pulse)" }}>
            백업 파일을 읽지 못했습니다. ({imp.error})
            <button className="tp-btn sm" style={{ marginLeft: 8 }} onClick={() => setImp(null)}>닫기</button>
          </p>
        ) : (
          <div style={{ marginTop: 12 }}>
            <p className="tp-secp" style={{ marginBottom: 8 }}>
              이 파일에는 기록 {imp.days}일 · 종목 {imp.ex}개 · 타임트라이얼 {imp.tt}개가 들어 있습니다.
              불러오면 지금 이 기기의 기록과 구성이 모두 대체됩니다. 필요하면 먼저 백업을 내려받으세요.
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="tp-btn hot" onClick={applyBackup}>대체하고 불러오기</button>
              <button className="tp-btn" onClick={() => setImp(null)}>취소</button>
            </div>
          </div>
        ))}
      </div>

      <div className="tp-sec">
        <h2 className="tp-sech">이 프로그램의 전제</h2>
        <p className="tp-secp">
          러닝의 80%는 느리게. 하체일에는 질 높은 러닝을 넣지 않습니다.
          같은 날 둘 다 할 때는 6시간 이상 간격을 두고, 템포·인터벌 날은 러닝을 먼저 합니다.
          상체 스트렝스와 근매스는 러닝에 거의 영향받지 않지만, 주간 거리가 55km를 넘는 구간에서 대퇴사두 근매스는 정체할 수 있습니다.
          구성 탭에서 무엇을 바꾸든 이 원칙은 유지하는 편이 좋습니다.
        </p>
      </div>
    </>
  );
}
