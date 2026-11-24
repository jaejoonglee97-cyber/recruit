// 공통 유틸 — HTML 이스케이프, 한국시간 표시, 숫자 포맷

export class Raw {
  constructor(s) { this.s = s; }
  toString() { return this.s; }
}
export const raw = (s) => new Raw(String(s ?? ''));

export function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function val(v) {
  if (v == null || v === false || v === true) return '';
  if (v instanceof Raw) return v.s;
  if (Array.isArray(v)) return v.map(val).join('');
  return esc(v);
}

/** 모든 보간 값을 자동 이스케이프하는 템플릿 태그. raw()/html`` 결과만 그대로 삽입된다. */
export function html(strings, ...vals) {
  let out = strings[0];
  for (let i = 0; i < vals.length; i++) out += val(vals[i]) + strings[i + 1];
  return new Raw(out);
}

const TZ = 'Asia/Seoul';
const DTF = new Intl.DateTimeFormat('ko-KR', {
  timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
});

export function kparts(d) {
  const o = {};
  for (const p of DTF.formatToParts(new Date(d))) o[p.type] = p.value;
  if (o.hour === '24') o.hour = '00';
  return o;
}

/** 2026년 11월 25일 (수) 11:59 */
export function fmtDT(d, { tz = false } = {}) {
  if (!d) return '';
  const p = kparts(d);
  return `${p.year}년 ${Number(p.month)}월 ${Number(p.day)}일 (${p.weekday}) ${p.hour}:${p.minute}${tz ? ' (한국시간)' : ''}`;
}
/** 2026년 11월 25일 (수) */
export function fmtD(d) {
  if (!d) return '';
  const p = kparts(d);
  return `${p.year}년 ${Number(p.month)}월 ${Number(p.day)}일 (${p.weekday})`;
}
/** 11.25(수) 11:59 */
export function fmtShort(d) {
  if (!d) return '';
  const p = kparts(d);
  return `${p.month}.${p.day}(${p.weekday}) ${p.hour}:${p.minute}`;
}
/** 11.25(수) */
export function fmtMD(d) {
  if (!d) return '';
  const p = kparts(d);
  return `${p.month}.${p.day}(${p.weekday})`;
}
export function fmtTime(d, sec = false) {
  if (!d) return '';
  const p = kparts(d);
  return sec ? `${p.hour}:${p.minute}:${p.second}` : `${p.hour}:${p.minute}`;
}
export function fmtYMD(d) {
  if (!d) return '';
  const p = kparts(d);
  return `${p.year}.${p.month}.${p.day}`;
}
/** datetime-local 입력값(한국시간) ↔ ISO */
export function toKstInput(d) {
  const p = kparts(d);
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}
export function fromKstInput(v) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(v || '');
  if (!m) return null;
  return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4] - 9, +m[5])).toISOString();
}

export function remaining(deadline, now) {
  const ms = new Date(deadline) - new Date(now);
  if (ms <= 0) return '마감됨';
  const min = Math.floor(ms / 60000);
  const d = Math.floor(min / 1440);
  const h = Math.floor((min % 1440) / 60);
  const m = min % 60;
  if (d > 0) return `${d}일 ${h}시간 남음`;
  if (h > 0) return `${h}시간 ${m}분 남음`;
  return `${m}분 남음`;
}

export function fmtBytes(n) {
  if (n == null) return '';
  if (n < 1024) return `${n}B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)}KB`;
  return `${(n / 1024 / 1024).toFixed(1)}MB`;
}

export const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

export function maskEmail(e) {
  if (!e) return '';
  const [u, d] = e.split('@');
  return `${u.slice(0, 3)}***@${d}`;
}

export function debounce(fn, ms) {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

export function csv(rows) {
  const cell = (v) => {
    const s = v == null ? '' : String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return '﻿' + rows.map((r) => r.map(cell).join(',')).join('\r\n');
}

export function download(filename, text, type = 'text/csv;charset=utf-8') {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const sum = (arr) => arr.reduce((a, b) => a + b, 0);
export const avg = (arr) => (arr.length ? sum(arr) / arr.length : null);
export const by = (k) => (a, b) => (a[k] > b[k] ? 1 : a[k] < b[k] ? -1 : 0);
