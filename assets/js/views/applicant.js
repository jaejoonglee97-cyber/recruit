import { html, raw, fmtDT, fmtShort, fmtTime, fmtBytes, remaining, debounce, fmtMD } from '../util.js';
import * as st from '../store.js';
import { POSITIONS, UPLOAD_POLICY, STAGES } from '../data/seed.js';
import { personaTags } from '../data/personas.js';
import { publicShell, badge, kv, empty, phaseOf, tagChips } from './common.js';
import { navigate, rerender, toast, openModal, closeModal } from '../ui.js';

// ───────── 공용 표시 ─────────
export const eduText = (e) => `${e.school} ${e.major} ${e.degree} (${e.status}) · ${e.from || '?'} ~ ${e.to || '?'}`;
export const carText = (c) => `${c.org} · ${c.title || '직위 미기재'} · ${c.from || '?'} ~ ${c.current ? '재직 중' : c.to || '?'}${c.intern ? ' · 인턴' : ''}`;
export const certText = (q) => `${q.name}${q.score ? ` ${q.score}` : ''} · ${q.issuer || ''} · ${q.date || ''}`;

function requireLogin(next) {
  if (!st.currentAccount()) { navigate(`/login?next=${encodeURIComponent(next)}`); return true; }
  return false;
}

function myApp(appId) {
  const acc = st.currentAccount();
  const a = st.app(appId);
  if (!a || !acc || a.accountId !== acc.id) return null; // 본인 지원 건만 조회
  return a;
}

const notMine = () => publicShell(html`<div class="container section">${empty('지원 건을 찾을 수 없거나 조회 권한이 없습니다.', html`<a class="btn btn--secondary" href="#/me">내 지원현황</a>`)}</div>`, 'me');

// ───────── 로그인 ─────────
let loginEmail = '';
let shownCode = '';

export const login = {
  title: '로그인',
  render(_, q) {
    if (st.currentAccount()) { setTimeout(() => navigate(q.next || '/me')); return publicShell('', 'me'); }
    const p = st.S().pendingCode;
    const step2 = loginEmail && p && p.email === loginEmail;
    const accounts = st.S().accounts.filter((a) => a.persona);
    return publicShell(html`
      <div class="container section narrow">
        <h1 class="page-title">지원자 로그인</h1>
        <p class="page-sub">지원에 사용할 이메일을 인증하면 본인 지원 건을 조회할 수 있습니다. 다른 서비스 계정은 필요하지 않습니다.</p>
        <div class="card">
          ${!step2 ? html`
          <form data-form="request-code" novalidate>
            <label class="field"><span class="field__label">이메일</span>
              <input type="email" name="email" autocomplete="email" required value="${loginEmail}" placeholder="name@example.com" aria-describedby="email-help">
              <span class="field__help" id="email-help">인증번호를 이메일로 보내 드립니다. (데모: 실제 메일은 발송되지 않고 화면에 표시)</span>
            </label>
            <button class="btn btn--primary btn--block">인증번호 받기</button>
          </form>` : html`
          <form data-form="verify-code" novalidate>
            <p><strong>${loginEmail}</strong>(으)로 인증번호를 보냈습니다. <button type="button" class="link-btn" data-action="change-email">이메일 변경</button></p>
            <div class="alert alert--info" role="status">데모 환경: 실제 메일 대신 여기에 표시합니다. 인증번호 <strong class="mono">${shownCode}</strong> · ${fmtTime(p.expiresAt)}까지 유효</div>
            <label class="field"><span class="field__label">인증번호 6자리</span>
              <input name="code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" required class="mono">
            </label>
            <div class="row gap">
              <button class="btn btn--primary">확인</button>
              <button type="button" class="btn btn--ghost" data-action="resend-code">다시 받기</button>
            </div>
            <p class="muted small">인증번호는 10분간 유효하고 5회까지 시도할 수 있으며, 한 번 사용하면 다시 쓸 수 없습니다.</p>
          </form>`}
        </div>
        <details class="card demo-pick">
          <summary><strong>데모:</strong> 가상 지원자로 바로 로그인 (${accounts.length}명)</summary>
          <p class="muted small">이메일 인증을 건너뛰고 페르소나의 지원 건을 바로 확인합니다. 실제 운영에서는 접수번호나 이름만으로 조회할 수 없습니다.</p>
          <input type="search" class="input" placeholder="이름·직무·상황으로 찾기 (예: 보완, 반송, 사회혁신)" data-oninput="filter-personas" aria-label="가상 지원자 검색">
          <ul class="persona-pick" id="persona-pick">
            ${accounts.map((a) => { const ap = st.appsOfAccount(a.id).find((x) => !x.past); const pos = ap ? POSITIONS[ap.positionId]?.name : ''; const tags = a.persona.tags; return html`<li data-search="${a.name} ${pos} ${tags.map((t) => t.label).join(' ')} ${a.persona.archetype}">
              <button type="button" class="persona-pick__btn" data-action="quick-login" data-id="${a.id}">
                <span class="persona-pick__name">${a.persona.no}. ${a.name}</span>
                <span class="persona-pick__pos">${pos}</span>
                ${tagChips(tags.slice(0, 3))}
              </button></li>`; })}
          </ul>
        </details>
      </div>`, 'me');
  },
  forms: {
    'request-code': (f) => {
      const r = st.requestCode(f.email.value);
      if (!r.ok) { toast(r.error, 'danger'); f.email.focus(); return; }
      loginEmail = r.email; shownCode = r.code;
      rerender();
      setTimeout(() => document.querySelector('[name=code]')?.focus());
    },
    'verify-code': (f, e, p, q) => {
      const r = st.verifyCode(loginEmail, f.code.value);
      if (!r.ok) { toast(r.error, 'danger'); if (!st.S().pendingCode) { shownCode = ''; rerender(); } return; }
      loginEmail = ''; shownCode = '';
      toast('인증되었습니다.', 'success');
      navigate(q.next || '/me');
    },
  },
  actions: {
    'change-email': () => { st.S().pendingCode = null; st.save(); rerender(); },
    'resend-code': () => { const r = st.requestCode(loginEmail); shownCode = r.code; toast('인증번호를 다시 보냈습니다. 이전 번호는 더 이상 쓸 수 없습니다.'); rerender(); },
    'quick-login': (el, e, p, q) => { st.loginAs(el.dataset.id); navigate(q.next || '/me'); },
  },
  inputs: {
    'filter-personas': (el) => {
      const v = el.value.trim();
      for (const li of document.querySelectorAll('#persona-pick li')) li.hidden = v && !li.dataset.search.includes(v);
    },
  },
};

// ───────── 내 지원현황 목록 ─────────
export const me = {
  title: '내 지원현황',
  render() {
    if (requireLogin('/me')) return publicShell('', 'me');
    const acc = st.currentAccount();
    const apps = st.appsOfAccount(acc.id).sort((a, b) => (b.submittedAt || b.savedAt || '').localeCompare(a.submittedAt || a.savedAt || ''));
    const t = st.now();
    return publicShell(html`
      <div class="container section">
        <h1 class="page-title">내 지원현황</h1>
        <p class="page-sub">${acc.name ? `${acc.name}님, ` : ''}공고별 지원 건과 지금 할 일을 확인하세요. <span class="muted">(${acc.email})</span></p>
        ${apps.length ? html`<div class="app-list">${apps.map((a) => {
          const j = st.job(a.jobId); const ph = phaseOf(a, t);
          return html`<a class="app-card" href="#/me/${a.id}">
            <div class="app-card__job">${j.title}</div>
            <div class="app-card__pos">${POSITIONS[a.positionId]?.name || '지원분야 미선택'}${a.receiptNo ? html` · <span class="mono">${a.receiptNo}</span>` : ''}</div>
            <div class="app-card__status">${badge(ph.status, ph.tone)}</div>
            <p class="app-card__todo">${ph.todo}</p>
          </a>`; })}</div>`
          : empty('아직 지원한 공고가 없습니다.', html`<a class="btn btn--primary" href="#/">채용공고 보기</a>`)}
      </div>`, 'me');
  },
};

// ───────── 지원 건 상태 ─────────
function timeline(a) {
  const j = st.job(a.jobId);
  const t = st.now();
  const scr = a.stages.screening.public;
  const fin = a.stages.final.public;
  const ev = st.evidenceSummary(a, t);
  const sch = (k) => j.schedule.find((s) => s.key === k);
  const steps = [];
  const submitted = a.status !== 'draft';
  steps.push({ label: '지원서 제출', state: submitted ? 'done' : 'current', meta: submitted ? fmtDT(a.submittedAt) : '작성 중' });
  if (a.status === 'withdrawn') { steps.push({ label: '지원 철회', state: 'done', meta: fmtDT(a.withdrawnAt) }); return steps; }
  steps.push({ label: '서류심사', state: !submitted ? 'todo' : scr ? 'done' : 'current', meta: sch('screening')?.from ? `${fmtMD(sch('screening').from)} ~ ${fmtMD(sch('screening').to)}` : '추후 안내' });
  steps.push({ label: '서류 결과 발표', state: scr ? 'done' : 'todo', meta: scr ? `${st.RESULT[scr.result].label} · ${fmtShort(scr.at)}` : sch('screening_result')?.at ? fmtShort(sch('screening_result').at) : '추후 안내' });
  if (!scr || scr.result === 'pass') {
    if (a.evidence.required || (!scr && j.evidenceDeadline)) steps.push({ label: '증빙서류 제출', state: !scr ? 'todo' : ev.key === 'verified' ? 'done' : 'current', meta: a.evidence.deadline ? `마감 ${fmtShort(a.evidence.deadline)} · ${ev.label}` : j.evidenceDeadline ? `마감 ${fmtShort(j.evidenceDeadline)}` : '합격자 대상' });
    steps.push({ label: '면접', state: fin ? 'done' : a.interview && t > new Date(a.interview.at) ? 'done' : a.interview ? 'current' : 'todo', meta: a.interview ? fmtShort(a.interview.at) : sch('interview')?.tbd ? '추후 안내' : '개인별 안내' });
    steps.push({ label: '최종 발표', state: fin ? 'done' : 'todo', meta: fin ? `${st.RESULT[fin.result].label} · ${fmtShort(fin.at)}` : sch('final_result')?.at ? `${fmtShort(sch('final_result').at)} 예정` : '추후 안내' });
  }
  return steps;
}

export const status = {
  title: '지원 상세',
  render({ appId }, q) {
    if (requireLogin(`/me/${appId}`)) return publicShell('', 'me');
    const a = myApp(appId);
    if (!a) return notMine();
    const j = st.job(a.jobId);
    const t = st.now();
    const ph = phaseOf(a, t);
    const ev = st.evidenceSummary(a, t);
    const steps = timeline(a);
    const myNotifs = st.S().notifications.filter((n) => n.appId === a.id).slice(-6).reverse();
    return publicShell(html`
      <div class="container section">
        <nav class="crumbs" aria-label="위치"><a href="#/me">내 지원현황</a> <span aria-hidden="true">›</span> <span>${j.title}</span></nav>
        ${q.submitted ? html`<div class="alert alert--success" role="status"><strong>지원서가 접수되었습니다.</strong> 접수번호 <span class="mono">${a.receiptNo}</span> · 서버 접수 시각 ${fmtDT(a.submittedAt, { tz: true })}${a.versions.length > 1 ? ` · ${a.versions.length}번째 제출본이 유효합니다.` : ''}</div>` : ''}
        <section class="status-hero" aria-label="지금 상황 요약">
          <div class="status-hero__block">
            <h2 class="status-hero__label">현재 상태</h2>
            <p class="status-hero__value">${badge(ph.status, ph.tone)}</p>
            <p class="muted small">${POSITIONS[a.positionId]?.name || ''}</p>
          </div>
          <div class="status-hero__block status-hero__block--todo">
            <h2 class="status-hero__label">지금 할 일</h2>
            <p class="status-hero__todo">${ph.todo}</p>
            ${ph.ctas.length ? html`<div class="row gap wrap">${ph.ctas.map(([href, label, kind]) => html`<a class="btn btn--${kind}" href="#${href}">${label}</a>`)}</div>` : ''}
          </div>
          <div class="status-hero__block">
            <h2 class="status-hero__label">기한·일정</h2>
            ${ph.dates.length ? html`<dl class="mini-kv">${ph.dates.map(([k, v]) => html`<div><dt>${k}</dt><dd>${v}</dd></div>`)}</dl>` : html`<p class="muted">예정된 일정이 없습니다.</p>`}
          </div>
        </section>

        <div class="grid-2 section-sm">
          <section class="card">
            <h2 class="h2">진행 단계</h2>
            <ol class="timeline">${steps.map((s) => html`<li class="timeline__item is-${s.state}"><span class="timeline__dot" aria-hidden="true"></span><div><div class="timeline__label">${s.label}${s.state === 'current' ? html` <span class="sr-only">(현재 단계)</span>` : ''}</div><div class="timeline__meta">${s.meta}</div></div></li>`)}</ol>
          </section>
          <section class="card">
            <h2 class="h2">접수 내역</h2>
            ${kv([
              ['접수번호', a.receiptNo ? html`<span class="mono">${a.receiptNo}</span>` : '미발급 (최종 제출 전)'],
              ['지원분야', POSITIONS[a.positionId]?.name || '-'],
              ['최종 제출', a.submittedAt ? `${fmtDT(a.submittedAt, { tz: true })}` : '-'],
              ['유효 제출본', a.versions.length ? `${a.versions.length}번째 제출본 (v${a.versions.length})` : '-'],
              a.status === 'withdrawn' ? ['철회', `${fmtDT(a.withdrawnAt)} · ${a.withdrawReason}`] : null,
            ])}
            <div class="row gap wrap">
              ${a.status !== 'draft' ? html`<a class="btn btn--secondary btn--sm" href="#/me/${a.id}/application">제출한 지원서 보기</a>` : html`<a class="btn btn--primary btn--sm" href="#/apply/${a.jobId}">이어서 작성</a>`}
              ${a.status === 'submitted' && j.allowResubmit && st.jobStatus(j).key === 'open' ? html`<a class="btn btn--secondary btn--sm" href="#/apply/${a.jobId}" data-action="start-edit" data-id="${a.id}">수정 후 재제출</a>` : ''}
              ${a.status === 'submitted' && !a.stages.final.public ? html`<button type="button" class="btn btn--ghost btn--sm" data-action="withdraw" data-id="${a.id}">지원 철회</button>` : ''}
            </div>
          </section>
        </div>

        ${a.evidence.required ? html`<section class="card section-sm">
          <div class="card__head"><h2 class="h2">증빙서류 제출 현황</h2>${badge(ev.label, ev.tone)}</div>
          <table class="table table--compact"><thead><tr><th scope="col">서류</th><th scope="col">구분</th><th scope="col">상태</th></tr></thead><tbody>
          ${a.evidence.items.map((it) => { const s = it.temp?.state === 'uploaded' ? { label: '업로드 완료 · 제출 확정 전', tone: 'info' } : st.ITEM_STATUS[it.status]; return html`<tr><td>${it.label}${it.substitute ? html` <span class="muted small">(대체: ${it.substitute.doc})</span>` : ''}</td><td>${it.required ? '필수' : '선택'}</td><td>${badge(s.label, s.tone)}${!it.required && it.status === 'none' ? html` <span class="muted small">제출하지 않아도 접수됩니다</span>` : ''}</td></tr>`; })}
          </tbody></table>
          <p class="muted small">‘제출 완료’는 파일이 접수되었다는 뜻이고, ‘확인 완료’는 담당자가 지원서 내용과 대조를 마쳤다는 뜻입니다.</p>
        </section>` : ''}

        <section class="card section-sm">
          <h2 class="h2">받은 안내</h2>
          ${myNotifs.length ? html`<ul class="log-list">${myNotifs.map((n) => html`<li><time>${fmtShort(n.createdAt)}</time> ${n.template}${n.status === 'bounced' ? html` <span class="muted small">— 메일이 전달되지 않았지만 이 화면의 내용이 최신입니다</span>` : ''}</li>`)}</ul>` : html`<p class="muted">아직 받은 안내가 없습니다.</p>`}
          <p class="muted small">문의: 채용 담당자 recruit@example.com (데모용 가상 주소)</p>
        </section>
      </div>`, 'me');
  },
  actions: {
    withdraw: (el) => {
      openModal(html`<form data-form="withdraw" data-id="${el.dataset.id}">
        <p>지원을 철회하면 이후 전형에 참여할 수 없습니다. 같은 공고에 다시 지원할 수 있는지는 공고 정책을 따릅니다.</p>
        <label class="field"><span class="field__label">철회 사유 (선택)</span><input name="reason" class="input" maxlength="100"></label>
        <div class="row gap end"><button type="button" class="btn btn--ghost" data-action="close-modal">취소</button><button class="btn btn--danger">철회하기</button></div>
      </form>`, { title: '지원 철회' });
    },
    'start-edit': (el) => { st.startEdit(el.dataset.id); navigate(`/apply/${st.app(el.dataset.id).jobId}`); },
  },
  forms: {
    withdraw: (f) => { st.withdraw(f.dataset.id, f.reason.value); closeModal(); toast('지원을 철회했습니다.'); rerender(); },
  },
};

// ───────── 제출한 지원서 보기 ─────────
export function applicationView(a, { blind = false, schoolMask = false } = {}) {
  const f = a.form;
  const j = st.job(a.jobId);
  const mask = (txt) => {
    let s = txt || '';
    if (schoolMask) for (const e of f.education) { const base = e.school.replace(' 대학원', ''); s = s.split(base).join('○○대학교'); }
    if (blind && f.name) s = s.split(f.name).join('○○○');
    return s;
  };
  return html`
    <section class="card">
      <h3 class="h3">기본정보</h3>
      ${kv([
        ['성명', blind ? html`<span class="masked">블라인드</span>` : f.name],
        ['이메일', blind ? html`<span class="masked">블라인드</span>` : f.email],
        ['연락처', blind ? html`<span class="masked">블라인드</span>` : f.phone],
        f.nameEn ? ['영문이름', blind ? html`<span class="masked">블라인드</span>` : f.nameEn] : null,
        f.birth ? ['생년월일', blind ? html`<span class="masked">블라인드</span>` : f.birth] : null,
        ['지원분야', POSITIONS[f.positionId]?.name],
        f.military ? ['병역', f.military] : null,
        f.veteran || f.disability ? ['취업우대', [f.veteran && '보훈', f.disability && '장애'].filter(Boolean).join(', ')] : null,
      ])}
    </section>
    <section class="card">
      <h3 class="h3">학력</h3>
      <ul class="plain">${f.education.map((e) => html`<li>${schoolMask ? eduText({ ...e, school: e.school.includes('대학원') ? '○○대학교 대학원' : '○○대학교' }) : eduText(e)}</li>`)}</ul>
      <h3 class="h3">경력</h3>
      ${f.career.length ? html`<ul class="plain">${f.career.map((c) => html`<li><strong>${carText(c)}</strong><br><span class="muted small">${c.duties}</span></li>`)}</ul>` : html`<p class="muted">경력 없음</p>`}
      <h3 class="h3">자격·어학</h3>
      ${f.certs.length ? html`<ul class="plain">${f.certs.map((q) => html`<li>${certText(q)}</li>`)}</ul>` : html`<p class="muted">없음</p>`}
      ${f.activities?.length ? html`<h3 class="h3">수상·활동·교육</h3><ul class="plain">${f.activities.map((x) => html`<li>[${x.kind}] ${x.name}${x.org ? ` · ${x.org}` : ''}${x.from ? ` · ${x.from} ~ ${x.to || ''}` : ''}${x.desc ? html`<br><span class="muted small">${x.desc}</span>` : ''}</li>`)}</ul>` : ''}
      ${f.attachment ? html`<h3 class="h3">추가 제출서류</h3><p>📄 ${f.attachment.name} <span class="muted small">${fmtBytes(f.attachment.size)}</span></p>` : ''}
    </section>
    <section class="card">
      <h3 class="h3">서술형</h3>
      ${j.questions.map((qq) => html`<div class="essay"><h4 class="h4">${qq.label} <span class="muted small">${(f.essays?.[qq.key] || '').length}/${qq.limit}자</span></h4><p class="essay__text">${mask(f.essays?.[qq.key])}</p></div>`)}
    </section>`;
}

export const submitted = {
  title: '제출한 지원서',
  render({ appId }) {
    if (requireLogin(`/me/${appId}/application`)) return publicShell('', 'me');
    const a = myApp(appId);
    if (!a) return notMine();
    return publicShell(html`<div class="container section">
      <nav class="crumbs"><a href="#/me">내 지원현황</a> › <a href="#/me/${a.id}">${st.job(a.jobId).title}</a> › <span>제출한 지원서</span></nav>
      <h1 class="page-title">제출한 지원서</h1>
      <p class="page-sub">접수번호 <span class="mono">${a.receiptNo}</span> · v${a.versions.length} · ${fmtDT(a.submittedAt, { tz: true })} 제출. 제출본은 고정되며 심사는 이 내용으로 진행됩니다.</p>
      ${a.versions.length > 1 ? html`<div class="alert alert--info">제출 이력: ${a.versions.map((v) => `v${v.no} ${fmtShort(v.at)}`).join(' · ')} — 마지막 제출본이 유효합니다.</div>` : ''}
      <div class="stack">${applicationView(a)}</div>
    </div>`, 'me');
  },
};

// ───────── 지원서 작성 (한 페이지 + 오른쪽 목차) ─────────
const SECTIONS = [
  { id: 'basic', label: '기본정보', keys: ['positionId', 'name', 'nameEn', 'birth', 'phone'] },
  { id: 'military', label: '병역 / 취업우대', keys: ['military'] },
  { id: 'edu', label: '학력사항', keys: ['education', 'edu-'] },
  { id: 'career', label: '경력사항', keys: ['car-'] },
  { id: 'extra', label: '어학 / 자격 / 활동', keys: ['act-'] },
  { id: 'files', label: '제출서류', keys: ['attachment'] },
  { id: 'questions', label: '추가질문', keys: ['essay-', 'source'] },
  { id: 'consent', label: '개인정보 동의', keys: ['consent'] },
];
const secOf = (k) => SECTIONS.find((s) => s.keys.some((x) => (x.endsWith('-') ? k.startsWith(x) : k === x)))?.id;
const SOURCES = ['아산나눔재단 홈페이지', '아산나눔재단 뉴스레터', '아산나눔재단 SNS', '사람인', '잡코리아', '링크드인', '로켓펀치', '링커리어', '대학 취업지원실', '지인 소개', '기타'];
const ACT_KINDS = ['수상', '대외활동', '봉사활동', '교육이수'];
let formErrors = {};
let submitting = false;

function blankForm(acc, j) {
  return {
    positionId: j.positions.length === 1 ? j.positions[0] : '',
    name: acc.name || '', nameEn: '', birth: '', email: acc.email, phone: acc.phone || '',
    military: '', veteran: false, disability: false,
    education: [{ id: 'e1', school: '', major: '', degree: '학사', status: '졸업', entry: '입학', from: '', to: '', gpa: '', gpaMax: '4.5' }],
    career: [], certs: [], activities: [], attachment: null, essays: {}, source: '', sourceEtc: '',
    consent: { agreed: false, optional: false, thirdParty: false },
  };
}

function serialize(formEl, prev) {
  const g = (n) => formEl.querySelector(`[name="${n}"]`);
  const val = (n, d) => (g(n) ? (g(n).type === 'checkbox' ? g(n).checked : g(n).value) : d);
  const rows = (kind) => [...formEl.querySelectorAll(`[data-row="${kind}"]`)].map((r) => {
    const o = { id: r.dataset.id };
    for (const el of r.querySelectorAll('[data-f]')) o[el.dataset.f] = el.type === 'checkbox' ? el.checked : el.value;
    return o;
  });
  const essays = {};
  for (const el of formEl.querySelectorAll('[data-essay]')) essays[el.dataset.essay] = el.value;
  return {
    ...prev,
    positionId: val('positionId', prev.positionId),
    name: val('name', prev.name), nameEn: val('nameEn', prev.nameEn), birth: val('birth', prev.birth), phone: val('phone', prev.phone),
    military: val('military', prev.military), veteran: val('veteran', prev.veteran), disability: val('disability', prev.disability),
    education: rows('edu'),
    career: rows('car').map((c) => ({ ...c, to: c.current ? null : c.to })),
    certs: rows('cert'),
    activities: rows('act'),
    essays: { ...prev.essays, ...essays },
    source: formEl.querySelector('[name="source"]:checked')?.value ?? prev.source ?? '',
    sourceEtc: val('sourceEtc', prev.sourceEtc),
    consent: { ...prev.consent, agreed: !!val('consent'), optional: !!val('consentOptional'), thirdParty: !!val('consentThird') },
  };
}

const err = (k) => (formErrors[k] ? html`<span class="field__error" id="err-${k}">${formErrors[k]}</span>` : '');
const errAttr = (k) => (formErrors[k] ? html`aria-invalid="true" aria-describedby="err-${k}"` : '');
const req = html`<span class="req-dot" aria-label="필수">*</span>`;
const lbl = (text, required = false) => html`<span class="field__label">${text}${required ? req : ''}</span>`;
const sel = (attrs, opts, cur, placeholder = '선택') => html`<select class="input" ${typeof attrs === 'string' ? raw(attrs) : attrs}><option value="">${placeholder}</option>${opts.map((o) => html`<option ${cur === o ? 'selected' : ''}>${o}</option>`)}</select>`;

function currentFormState(jobId) {
  const acc = st.currentAccount();
  const j = st.job(jobId);
  const a = st.draftFor(acc.id, jobId);
  const base = blankForm(acc, j);
  const saved = a?.pendingForm || a?.form;
  const form = saved ? { ...base, ...saved, consent: { ...base.consent, ...saved.consent } } : base;
  return { acc, j, a, form };
}

function repeatBlock(kind, label, rows, body, { min = 0 } = {}) {
  return html`${rows.map((r, i) => html`<div class="repeat" data-row="${kind}" data-id="${r.id}">
      <div class="repeat__head"><strong>${label} ${i + 1}</strong>${rows.length > min ? html`<button type="button" class="link-btn small" data-action="remove-row" data-kind="${kind}" data-id="${r.id}">삭제</button>` : ''}</div>
      ${body(r, i)}
    </div>`)}
    <button type="button" class="btn-add" data-action="add-row" data-kind="${kind}">+ ${label} 추가</button>`;
}

function sectionDone(id, form, j) {
  if (id === 'basic') return !!(form.positionId && form.name && form.nameEn && form.birth && form.phone);
  if (id === 'military') return !!form.military;
  if (id === 'edu') return form.education.length > 0 && form.education.every((e) => e.school && e.major);
  if (id === 'questions') return j.questions.every((q) => (form.essays?.[q.key] || '').trim()) && !!form.source;
  if (id === 'consent') return !!form.consent?.agreed;
  return null; // 선택 섹션
}

export const apply = {
  title: '지원서 작성',
  render({ jobId }) {
    if (requireLogin(`/apply/${jobId}`)) return publicShell('', 'jobs');
    const { j, a, form } = currentFormState(jobId);
    if (!j) return publicShell(html`<div class="container section">${empty('공고를 찾을 수 없습니다.')}</div>`, 'jobs');
    const js = st.jobStatus(j);
    if (a?.status === 'submitted' && !a.pendingForm) {
      return publicShell(html`<div class="container section narrow">${empty('이미 제출한 지원서가 있습니다.', html`<a class="btn btn--primary" href="#/me/${a.id}">접수 내역 보기</a>`)}</div>`, 'jobs');
    }
    if (a?.status === 'withdrawn') return publicShell(html`<div class="container section narrow">${empty('철회한 지원 건입니다. 이 공고는 동일 공고 중복 지원을 허용하지 않습니다.', html`<a class="btn btn--secondary" href="#/me">내 지원현황</a>`)}</div>`, 'jobs');
    if (js.key !== 'open' && !a) return publicShell(html`<div class="container section narrow">${empty(`${js.label} 공고입니다. 지금은 지원할 수 없습니다.`, html`<a class="btn btn--secondary" href="#/jobs/${j.id}">공고 보기</a>`)}</div>`, 'jobs');
    const closed = js.key !== 'open';
    const errKeys = Object.keys(formErrors);
    const errSecs = new Set(errKeys.map(secOf));
    const editing = !!a?.pendingForm;
    const f = j.filter || {};
    const c = form.consent || {};
    const allConsent = c.agreed && c.optional && c.thirdParty;

    return publicShell(html`
      <div class="container section">
        <a class="back-link" href="#/jobs/${j.id}">← 공고로 돌아가기</a>
        <header class="jd__head">
          <h1 class="page-title">${j.title}</h1>
          <ul class="job-card__tags">${[f.type, f.career, f.place].filter(Boolean).map((x) => html`<li>${x}</li>`)}<li>마감 ${fmtShort(j.apply.to)}</li></ul>
        </header>
        ${closed ? html`<div class="alert alert--danger" role="alert"><strong>접수 기간이 끝났습니다.</strong> 임시저장한 내용은 볼 수 있지만 제출할 수 없습니다.${a?.lateAttemptAt ? ` 마감 이후 ${fmtDT(a.lateAttemptAt, { tz: true })}에 제출 시도 기록이 있습니다.` : ''}</div>` : ''}
        ${editing ? html`<div class="alert alert--info">제출한 지원서는 그대로 유효합니다. 고친 뒤 ‘재제출’을 눌러야 새 버전으로 접수됩니다. <button type="button" class="link-btn" data-action="cancel-edit" data-id="${a.id}">수정 취소</button></div>` : ''}

        <div class="af">
          <form data-form="apply" data-job="${j.id}" class="af__main" novalidate data-oninput="autosave">
            ${errKeys.length ? html`<div class="alert alert--danger" role="alert" tabindex="-1" id="error-summary"><strong>확인이 필요한 항목이 ${errKeys.length}개 있습니다.</strong><ul>${errKeys.map((k) => html`<li data-err="${k}">${formErrors[k]}</li>`)}</ul></div>` : ''}

            <section class="af__sec" id="sec-basic">
              <div class="af__sec-head"><h2 class="h2">기본정보</h2><span class="muted small">${req} 필수 입력</span></div>
              ${j.positions.length > 1 ? html`<label class="field">${lbl('지원분야', true)}
                <select name="positionId" class="input" ${errAttr('positionId')}><option value="">선택</option>${j.positions.map((p) => html`<option value="${p}" ${form.positionId === p ? 'selected' : ''}>${POSITIONS[p].name}</option>`)}</select>${err('positionId')}</label>` : html`<input type="hidden" name="positionId" value="${form.positionId}">`}
              <div class="grid-2">
                <label class="field">${lbl('이름', true)}<input name="name" class="input" autocomplete="name" value="${form.name}" ${errAttr('name')}>${err('name')}</label>
                <label class="field">${lbl('영문이름', true)}<input name="nameEn" class="input" autocomplete="off" placeholder="Hong Gildong" value="${form.nameEn}" ${errAttr('nameEn')}>${err('nameEn')}</label>
                <label class="field">${lbl('생년월일', true)}<input name="birth" type="date" class="input" value="${form.birth}" ${errAttr('birth')}>${err('birth')}</label>
                <label class="field">${lbl('연락처', true)}<input name="phone" class="input" inputmode="tel" autocomplete="tel" placeholder="010-0000-0000" value="${form.phone}" ${errAttr('phone')}>${err('phone')}</label>
              </div>
              <label class="field">${lbl('이메일')}<input class="input" value="${form.email}" readonly aria-readonly="true"><span class="field__help">로그인 때 인증한 주소로 결과를 안내합니다.</span></label>
            </section>

            <section class="af__sec" id="sec-military">
              <h2 class="h2">병역 / 취업우대</h2>
              <div class="grid-2">
                <label class="field">${lbl('병역사항', true)}${sel(html`name="military" ${errAttr('military')}`, ['군필', '미필', '면제', '복무 중', '해당 없음'], form.military)}${err('military')}</label>
                <div class="field">${lbl('취업우대 (해당 시)')}
                  <div class="row gap wrap"><label class="check"><input type="checkbox" name="veteran" ${form.veteran ? 'checked' : ''}> 보훈 대상</label><label class="check"><input type="checkbox" name="disability" ${form.disability ? 'checked' : ''}> 장애</label></div>
                  <span class="field__help">증빙은 서류 합격 후 받습니다.</span></div>
              </div>
            </section>

            <section class="af__sec" id="sec-edu">
              <h2 class="h2">학력사항</h2>
              <p class="af__hint">고등학교를 제외한 학사 이상 학력을 모두 적어 주세요. 서류 합격 후 졸업·성적증명서를 받습니다.</p>
              ${err('education')}
              ${repeatBlock('edu', '학력', form.education, (e, i) => html`
                <div class="grid-3">
                  <label class="field">${lbl('학위', true)}${sel('data-f="degree"', ['전문학사', '학사', '석사', '박사'], e.degree)}</label>
                  <label class="field">${lbl('학교명', true)}<input class="input" data-f="school" value="${e.school}" ${errAttr(`edu-${i}`)}></label>
                  <label class="field">${lbl('전공', true)}<input class="input" data-f="major" value="${e.major}"></label>
                  <label class="field">${lbl('입학 (연.월)', true)}<input class="input" data-f="from" placeholder="2018.03" value="${e.from}"></label>
                  <label class="field">${lbl('졸업 (연.월)')}<input class="input" data-f="to" placeholder="2022.02" value="${e.to}"></label>
                  <label class="field">${lbl('졸업구분', true)}${sel('data-f="status"', ['졸업', '졸업예정', '수료', '재학', '휴학', '중퇴'], e.status)}</label>
                  <label class="field">${lbl('입학구분')}${sel('data-f="entry"', ['입학', '편입'], e.entry || '입학')}</label>
                  <div class="field">${lbl('평점')}<div class="row gap"><input class="input" data-f="gpa" inputmode="decimal" placeholder="3.8" value="${e.gpa || ''}" aria-label="평점"><span class="muted">/</span>${sel('data-f="gpaMax" aria-label="만점 기준"', ['4.5', '4.3', '4.0', '100'], e.gpaMax || '4.5', '만점')}</div></div>
                </div>${err(`edu-${i}`)}`, { min: 1 })}
            </section>

            <section class="af__sec" id="sec-career">
              <h2 class="h2">경력사항</h2>
              <p class="af__hint">담당 업무와 역할을 구체적으로 적어 주세요. 경력이 없으면 비워 두세요.</p>
              ${repeatBlock('car', '경력', form.career, (cr, i) => html`
                <div class="grid-3">
                  <label class="field">${lbl('회사명', true)}<input class="input" data-f="org" value="${cr.org}" ${errAttr(`car-${i}`)}></label>
                  <label class="field">${lbl('부서')}<input class="input" data-f="dept" value="${cr.dept || ''}"></label>
                  <label class="field">${lbl('직급·직무')}<input class="input" data-f="title" value="${cr.title}"></label>
                  <label class="field">${lbl('고용형태')}${sel('data-f="type"', ['정규직', '계약직', '인턴', '프리랜서'], cr.type || (cr.intern ? '인턴' : ''))}</label>
                  <label class="field">${lbl('입사 (연.월)', true)}<input class="input" data-f="from" placeholder="2021.03" value="${cr.from}"></label>
                  <div class="field">${lbl('퇴사 (연.월)')}<input class="input" data-f="to" placeholder="2024.02" value="${cr.to || ''}"><label class="check small"><input type="checkbox" data-f="current" ${cr.current ? 'checked' : ''}> 재직 중</label></div>
                </div>
                <label class="field">${lbl('담당업무')}<textarea class="input" rows="3" data-f="duties">${cr.duties || ''}</textarea></label>
                ${err(`car-${i}`)}`)}
            </section>

            <section class="af__sec" id="sec-extra">
              <h2 class="h2">어학 / 자격 / 활동 <span class="muted small">선택</span></h2>
              <h3 class="af__sub">어학·자격증</h3>
              <p class="af__hint">지원일 기준 유효하고 증빙 가능한 것만 적어 주세요.</p>
              ${repeatBlock('cert', '어학·자격', form.certs, (q) => html`
                <div class="grid-3">
                  <label class="field">${lbl('구분')}<select class="input" data-f="kind"><option value="cert" ${q.kind === 'cert' ? 'selected' : ''}>자격증</option><option value="lang" ${q.kind === 'lang' ? 'selected' : ''}>어학</option></select></label>
                  <label class="field">${lbl('자격·시험명')}<input class="input" data-f="name" value="${q.name}"></label>
                  <label class="field">${lbl('점수·등급')}<input class="input" data-f="score" value="${q.score || ''}"></label>
                  <label class="field">${lbl('발급기관')}<input class="input" data-f="issuer" value="${q.issuer || ''}"></label>
                  <label class="field">${lbl('취득일 (연.월)')}<input class="input" data-f="date" value="${q.date || ''}"></label>
                </div>`)}
              <h3 class="af__sub">수상·활동·교육</h3>
              ${repeatBlock('act', '활동', form.activities || [], (ac, i) => html`
                <div class="grid-3">
                  <label class="field">${lbl('구분', true)}${sel('data-f="kind"', ACT_KINDS, ac.kind)}</label>
                  <label class="field">${lbl('활동·상훈·과정명', true)}<input class="input" data-f="name" value="${ac.name || ''}" ${errAttr(`act-${i}`)}></label>
                  <label class="field">${lbl('기관')}<input class="input" data-f="org" value="${ac.org || ''}"></label>
                  <label class="field">${lbl('시작 (연.월)')}<input class="input" data-f="from" value="${ac.from || ''}"></label>
                  <label class="field">${lbl('종료 (연.월)')}<input class="input" data-f="to" value="${ac.to || ''}"></label>
                </div>
                <label class="field">${lbl('내용')}<textarea class="input" rows="2" data-f="desc">${ac.desc || ''}</textarea></label>${err(`act-${i}`)}`)}
            </section>

            <section class="af__sec" id="sec-files">
              <h2 class="h2">제출서류 <span class="muted small">선택</span></h2>
              <p class="af__hint">포트폴리오, 상세 경력기술서 등 · PDF 1개, ${UPLOAD_POLICY.maxFile / 1024 / 1024}MB 이하 · 내지 않아도 불이익은 없습니다.</p>
              ${form.attachment ? html`<div class="file-row"><span>📄 ${form.attachment.name} <span class="muted small">${fmtBytes(form.attachment.size)}</span></span><button type="button" class="link-btn small" data-action="remove-attach">삭제</button></div>`
                : html`<label class="btn btn--secondary file-btn">파일 선택<input type="file" accept="application/pdf,.pdf" class="sr-only" data-onchange="attach"></label>`}
              ${err('attachment')}
            </section>

            <section class="af__sec" id="sec-questions">
              <h2 class="h2">추가질문</h2>
              ${j.questions.map((qq) => { const v = form.essays?.[qq.key] || ''; return html`<label class="field">${lbl(qq.label, true)}
                <span class="field__help">${qq.help}${qq.min ? ` (${qq.min}~${qq.limit}자)` : ` (최대 ${qq.limit}자)`}</span>
                <textarea class="input" rows="7" data-essay="${qq.key}" data-limit="${qq.limit}" data-min="${qq.min || 0}" ${errAttr(`essay-${qq.key}`)}>${v}</textarea>
                <span class="counter ${v.length > qq.limit || (qq.min && v.length && v.length < qq.min) ? 'is-over' : ''}" data-count-for="${qq.key}">${v.length} / ${qq.limit}</span>${err(`essay-${qq.key}`)}</label>`; })}
              <fieldset class="field">
                <legend class="field__label">채용 공고를 처음 접한 곳${req}</legend>
                <span class="field__help">서류 전형과 무관합니다.</span>
                <div class="radio-grid">${SOURCES.map((s) => html`<label class="check"><input type="radio" name="source" value="${s}" ${form.source === s ? 'checked' : ''}> ${s}</label>`)}</div>
                ${form.source === '기타' ? html`<input name="sourceEtc" class="input" placeholder="직접 입력" value="${form.sourceEtc || ''}">` : ''}
                ${err('source')}
              </fieldset>
            </section>

            <section class="af__sec" id="sec-consent">
              <h2 class="h2">개인정보 수집 및 이용 동의</h2>
              <label class="check consent-all"><input type="checkbox" data-action="consent-all" ${allConsent ? 'checked' : ''}> <strong>전체 동의</strong></label>
              <div class="consent-list">
                ${[
                  ['consent', '개인정보 필수항목 수집 및 이용 동의', true, c.agreed, '수집 항목: 이름, 영문이름, 생년월일, 연락처, 이메일, 병역, 학력, 경력, 서술형 답변 · 목적: 지원자 식별과 전형 진행·결과 안내 · 보유: 운영 기관이 확정한 기간'],
                  ['consentOptional', '개인정보 선택항목 수집 및 이용 동의', false, c.optional, '수집 항목: 취업우대, 어학·자격, 수상·활동, 추가 제출서류 · 동의하지 않아도 지원할 수 있습니다.'],
                  ['consentThird', '개인정보 제3자 제공 동의', false, c.thirdParty, '외부 심사위원에게 심사에 필요한 범위에서 제공 · 동의하지 않아도 지원할 수 있습니다.'],
                ].map(([name, label, must, on, body]) => html`<div class="consent-item">
                  <label class="check"><input type="checkbox" name="${name}" ${on ? 'checked' : ''} ${name === 'consent' ? errAttr('consent') : ''}> ${label} <span class="${must ? 'req-txt' : 'muted'} small">(${must ? '필수' : '선택'})</span></label>
                  <details><summary>보기</summary><p>${body} <span class="muted">(데모 문구)</span></p></details>
                </div>`)}
              </div>
              ${err('consent')}
            </section>
          </form>

          <aside class="af__side" aria-label="작성 현황">
            <nav class="af__toc" aria-label="지원서 목차">
              ${SECTIONS.map((s) => { const done = sectionDone(s.id, form, j); return html`<a href="#sec-${s.id}" class="af__toc-link ${errSecs.has(s.id) ? 'has-error' : ''}" data-action="apply-jump" data-target="sec-${s.id}">
                <span class="af__toc-mark ${done ? 'is-done' : ''}" aria-hidden="true">${errSecs.has(s.id) ? '!' : done ? '✓' : ''}</span>${s.label}</a>`; })}
            </nav>
            <div class="af__actions">
              <p class="save-status" data-save-status aria-live="polite">${a?.savedAt ? html`자동 저장됨 · <time>${fmtTime(a.savedAt, true)}</time>` : '입력하면 자동 저장'}</p>
              <button type="button" class="btn btn--primary btn--lg btn--block" data-action="submit-app" ${closed ? 'disabled' : ''}>${editing ? '재제출하기' : '제출하기'}</button>
              <p class="muted small af__note">${j.allowResubmit ? '마감 전까지 고쳐서 다시 낼 수 있습니다.' : '제출 후에는 수정할 수 없습니다.'}</p>
            </div>
          </aside>
        </div>
      </div>`, 'jobs');
  },
  mounted() {
    if (Object.keys(formErrors).length) document.getElementById('error-summary')?.focus();
  },
  inputs: {
    autosave: (formEl, e) => {
      const ta = e.target.closest('[data-essay]');
      if (ta) {
        const cnt = document.querySelector(`[data-count-for="${ta.dataset.essay}"]`);
        const lim = Number(ta.dataset.limit); const min = Number(ta.dataset.min);
        if (cnt) { cnt.textContent = `${ta.value.length} / ${lim}`; cnt.classList.toggle('is-over', ta.value.length > lim || (min && ta.value.length && ta.value.length < min)); }
      }
      if (e.target.name === 'source' || ['consent', 'consentOptional', 'consentThird'].includes(e.target.name)) { persist(); rerender(); return; }
      const s = document.querySelector('[data-save-status]');
      if (s) s.textContent = '저장 중…';
      autosaveDebounced(formEl);
    },
  },
  changes: {
    attach: (el) => {
      const file = el.files?.[0];
      if (!file) return;
      const form = persist();
      if (!/\.pdf$/i.test(file.name)) { toast('PDF 파일만 올릴 수 있습니다.', 'danger'); return; }
      if (file.size > UPLOAD_POLICY.maxFile) { toast(`${UPLOAD_POLICY.maxFile / 1024 / 1024}MB 이하 파일만 올릴 수 있습니다.`, 'danger'); return; }
      form.attachment = { name: file.name, size: file.size, at: st.now().toISOString() };
      saveForm(form); rerender();
      toast('파일을 첨부했습니다. (데모: 파일 내용은 저장하지 않음)', 'success');
    },
  },
  actions: {
    'apply-jump': (el) => document.getElementById(el.dataset.target)?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    'consent-all': (el) => {
      const on = el.checked;
      for (const n of ['consent', 'consentOptional', 'consentThird']) { const x = document.querySelector(`[name="${n}"]`); if (x) x.checked = on; }
      persist(); rerender();
    },
    'remove-attach': () => { const form = persist(); form.attachment = null; saveForm(form); rerender(); },
    'add-row': (el) => {
      const form = persist();
      const kind = el.dataset.kind;
      const id = `${kind}${Date.now().toString(36)}`;
      if (kind === 'edu') form.education.push({ id, school: '', major: '', degree: '학사', status: '졸업', entry: '입학', from: '', to: '', gpa: '', gpaMax: '4.5' });
      if (kind === 'car') form.career.push({ id, org: '', dept: '', title: '', type: '', from: '', to: '', current: false, duties: '' });
      if (kind === 'cert') form.certs.push({ id, kind: 'cert', name: '', score: '', issuer: '', date: '' });
      if (kind === 'act') (form.activities ||= []).push({ id, kind: '', name: '', org: '', from: '', to: '', desc: '' });
      saveForm(form);
      rerender();
      setTimeout(() => { const rows = document.querySelectorAll(`[data-row="${kind}"]`); rows[rows.length - 1]?.querySelector('input, select')?.focus(); });
    },
    'remove-row': (el) => {
      const form = persist();
      const key = { edu: 'education', car: 'career', cert: 'certs', act: 'activities' }[el.dataset.kind];
      form[key] = form[key].filter((r) => r.id !== el.dataset.id);
      saveForm(form);
      rerender();
    },
    'submit-app': () => {
      const form = persist();
      const j = st.job(document.querySelector('[data-form=apply]').dataset.job);
      formErrors = st.validateForm(j, form);
      if (Object.keys(formErrors).length) {
        rerender();
        document.getElementById('error-summary')?.scrollIntoView({ block: 'center' });
        return;
      }
      const acc = st.currentAccount();
      const a = st.draftFor(acc.id, j.id);
      openModal(html`
        <p>${j.allowResubmit ? '마감 전까지 고쳐서 다시 낼 수 있으며, 마지막 제출본이 유효합니다.' : html`<strong>제출 후에는 수정할 수 없습니다.</strong>`} 내용을 확인해 주세요.</p>
        <div class="stack">${applicationView({ ...(a || {}), jobId: j.id, form })}</div>
        <div class="row gap end modal__foot"><button type="button" class="btn btn--ghost" data-action="close-modal">계속 작성</button><button type="button" class="btn btn--primary" data-action="confirm-submit" data-job="${j.id}">최종 제출</button></div>`, { title: '제출 전 확인', wide: true });
    },
    'confirm-submit': (el) => {
      if (submitting) return;
      submitting = true;
      el.disabled = true; el.textContent = '제출 중…';
      const jobId = el.dataset.job;
      const acc = st.currentAccount();
      const a = st.draftFor(acc.id, jobId);
      if (!a) { submitting = false; closeModal(); toast('저장에 실패해 제출하지 못했습니다. 다시 시도해 주세요.', 'danger'); return; }
      setTimeout(() => { // 네트워크 지연 흉내
        const r = st.submitApplication(a.id);
        submitting = false;
        closeModal();
        if (r.ok) { formErrors = {}; navigate(`/me/${a.id}?submitted=1`); return; }
        if (r.error === 'deadline') { toast('접수 마감 시각이 지나 제출할 수 없습니다. 서버 접수 시각 기준으로 판정합니다.', 'danger'); rerender(); return; }
        formErrors = r.errors || {};
        toast('확인이 필요한 항목이 있습니다.', 'danger');
        rerender();
      }, 600);
    },
    'cancel-edit': (el) => { st.cancelEdit(el.dataset.id); navigate(`/me/${el.dataset.id}`); },
    'retry-save': () => { const fe = document.querySelector('[data-form=apply]'); if (fe) doAutosave(fe); },
  },
};

function persist() {
  const formEl = document.querySelector('[data-form=apply]');
  const { form } = currentFormState(formEl.dataset.job);
  const next = serialize(formEl, form);
  saveForm(next);
  if (Object.keys(formErrors).length) { const now = st.validateForm(st.job(formEl.dataset.job), next); for (const k of Object.keys(formErrors)) if (!now[k]) delete formErrors[k]; }
  return next;
}
function saveForm(form) {
  const formEl = document.querySelector('[data-form=apply]');
  const r = st.saveDraft(st.currentAccount().id, formEl.dataset.job, form);
  if (!r.ok) {
    // 저장 실패 시에도 화면 입력은 유지 — 메모리에 보관했다가 다시 시도
    pendingUnsaved = form;
  }
  return r;
}
let pendingUnsaved = null;
function doAutosave(formEl) {
  const { form } = currentFormState(formEl.dataset.job);
  const next = serialize(formEl, pendingUnsaved || form);
  const r = st.saveDraft(st.currentAccount().id, formEl.dataset.job, next);
  const s = document.querySelector('[data-save-status]');
  if (!s) return;
  if (r.ok) clearResolvedErrors(formEl.dataset.job, next);
  if (r.ok) { pendingUnsaved = null; s.innerHTML = String(html`자동 저장됨 · <time>${fmtTime(r.savedAt, true)}</time>`); s.classList.remove('is-error'); }
  else { pendingUnsaved = next; s.innerHTML = String(html`<span>저장하지 못했습니다.</span> <button type="button" class="link-btn" data-action="retry-save">다시 시도</button>`); s.classList.add('is-error'); }
}
const autosaveDebounced = debounce(doAutosave, 700);
/** 고친 항목의 오류 표시를 입력 중에 바로 지운다 (다시 그리지 않아 입력 위치 유지) */
function clearResolvedErrors(jobId, form) {
  if (!Object.keys(formErrors).length) return;
  const now = st.validateForm(st.job(jobId), form);
  for (const k of Object.keys(formErrors)) {
    if (now[k]) continue;
    delete formErrors[k];
    document.getElementById(`err-${k}`)?.remove();
    document.querySelectorAll(`[aria-describedby="err-${k}"]`).forEach((el) => { el.removeAttribute('aria-invalid'); el.removeAttribute('aria-describedby'); });
    document.querySelector(`[data-err="${k}"]`)?.remove();
  }
  const box = document.getElementById('error-summary');
  const n = Object.keys(formErrors).length;
  if (box) { if (!n) box.remove(); else box.querySelector('strong').textContent = `확인이 필요한 항목이 ${n}개 있습니다.`; }
}

// ───────── 증빙서류 제출 ─────────
function itemCard(a, it, t, deadlinePassed) {
  const f = a.form;
  const linked = it.group === 'education' ? f.education.find((e) => e.id === it.link) : it.group === 'career' ? f.career.find((c) => c.id === it.link) : f.certs.find((q) => q.id === it.link);
  const linkedText = linked ? (it.group === 'education' ? eduText(linked) : it.group === 'career' ? carText(linked) : certText(linked)) : '';
  const temp = it.temp;
  const s = temp?.state === 'uploaded' ? { label: '업로드 완료 · 제출 확정 전', tone: 'info' } : temp?.state === 'uploading' ? { label: '업로드 중', tone: 'info' } : temp?.state === 'scanning' ? { label: '검사 중', tone: 'info' } : temp?.state === 'error' ? { label: '오류', tone: 'danger' } : st.ITEM_STATUS[it.status];
  const locked = it.status === 'verified' || it.status === 'na';
  const latest = it.files[it.files.length - 1];
  return html`<article class="ev-item ${it.status === 'revision' ? 'is-revision' : ''}" id="item-${it.id}">
    <div class="ev-item__head">
      <div>
        <h3 class="ev-item__title">${it.type}${it.required ? html` <span class="req">필수</span>` : html` <span class="opt">선택</span>`}</h3>
        <p class="ev-item__linked">지원서 기재: ${linkedText}</p>
      </div>
      ${badge(s.label, s.tone)}
    </div>
    ${it.status === 'revision' && it.review ? html`<div class="alert alert--warn"><strong>보완 요청</strong> ${it.review.reason}${it.review.due ? html`<br>보완 마감: <strong>${fmtDT(it.review.due, { tz: true })}</strong>` : ''}</div>` : ''}
    ${latest ? html`<p class="ev-item__file">현재 제출본: <strong>${latest.name}</strong> (v${latest.version}${latest.range ? ` · ${latest.range}` : ''} · ${fmtBytes(latest.size)}) · ${fmtShort(it.submittedAt || latest.uploadedAt)} 제출${it.late ? ' · 지연 제출' : ''}${it.substitute ? html` · <span class="muted">대체 서류: ${it.substitute.doc}</span>` : ''}</p>` : ''}
    ${temp?.state === 'uploading' || temp?.state === 'scanning' ? html`<div class="progress" role="progressbar" aria-label="${temp.state === 'uploading' ? '업로드 중' : '파일 검사 중'}" aria-valuetext="${temp.state === 'uploading' ? '업로드 중' : '검사 중'}"><span class="progress__bar ${temp.state === 'scanning' ? 'is-scan' : ''}"></span></div><p class="muted small">${temp.name} · ${temp.state === 'uploading' ? '업로드 중…' : '형식·손상·유해 파일 검사 중… 검사 전에는 열람할 수 없습니다.'}</p>` : ''}
    ${temp?.state === 'uploaded' ? html`<p class="ev-item__temp">업로드됨: <strong>${temp.name}</strong> (${fmtBytes(temp.size)}${temp.range ? ` · ${temp.range}` : ''}) — 아래 <strong>제출 확정</strong>을 눌러야 제출됩니다. <button type="button" class="link-btn" data-action="clear-temp" data-item="${it.id}">취소</button></p>` : ''}
    ${temp?.state === 'error' ? html`<div class="alert alert--danger" role="alert"><strong>${temp.name}</strong>: ${temp.message || '비밀번호가 걸린 PDF는 열 수 없습니다. 비밀번호를 해제한 파일로 다시 올려 주세요.'}</div>` : ''}
    ${locked ? html`<p class="muted small">${it.status === 'verified' ? '담당자 확인이 끝난 서류는 교체할 수 없습니다. 변경이 필요하면 담당자에게 문의해 주세요.' : '담당자가 ‘해당 없음’으로 처리했습니다.'}</p>`
      : html`<div class="ev-item__actions">
        <label class="btn btn--secondary btn--sm file-btn">${latest ? '새 파일로 교체' : '파일 선택'}<input type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" data-onchange="pick-file" data-item="${it.id}" class="sr-only"></label>
        ${it.group === 'career' && it.alt ? html`<label class="check small"><input type="checkbox" data-onchange="toggle-sub" data-item="${it.id}" ${it.pendingSubstitute || (!temp && it.substitute) ? 'checked' : ''}> 경력증명서 발급이 어려워 <strong>${it.alt}</strong>로 대체 제출</label>` : ''}
      </div>
      ${it.group === 'career' && (it.pendingSubstitute) ? html`<label class="field"><span class="field__label">대체 제출 사유</span><input class="input" data-onchange="sub-reason" data-item="${it.id}" value="${it.pendingSubstitute?.reason || ''}" placeholder="예: 근무했던 회사가 폐업해 발급이 불가능합니다"></label>` : ''}
      ${it.required && !latest && !temp ? html`<details class="small"><summary>이 서류를 기한 안에 내기 어려운가요?</summary>
        <label class="field"><span class="field__label">제출 곤란 사유 (담당자가 확인합니다)</span><input class="input" data-onchange="difficulty" data-item="${it.id}" value="${it.difficulty || ''}" placeholder="예: 해외 대학으로 발급에 2주가 걸립니다"></label></details>` : ''}`}
    ${it.history.length ? html`<details class="small ev-item__history"><summary>이력 ${it.history.length}건</summary><ul class="log-list">${it.history.map((h) => html`<li><time>${fmtShort(h.at)}</time> ${h.text}</li>`)}</ul></details>` : ''}
  </article>`;
}

export const evidence = {
  title: '증빙서류 제출',
  render({ appId }) {
    if (requireLogin(`/me/${appId}/evidence`)) return publicShell('', 'me');
    const a = myApp(appId);
    if (!a) return notMine();
    if (!a.evidence.required) return publicShell(html`<div class="container section narrow">${empty('증빙서류 제출 대상이 아닙니다. 서류전형 합격자에게만 제출 화면이 열립니다.', html`<a class="btn btn--secondary" href="#/me/${a.id}">지원 상세로</a>`)}</div>`, 'me');
    const t = st.now();
    const deadlinePassed = t > new Date(a.evidence.deadline);
    const items = a.evidence.items;
    const groups = [['education', '학력 증빙'], ['career', '경력 증빙'], ['optional', '선택 서류']];
    const req = items.filter((i) => i.required);
    const ready = req.filter((i) => ['pending', 'verified', 'na'].includes(i.status) || i.temp?.state === 'uploaded' || i.difficulty);
    const staged = items.filter((i) => i.temp?.state === 'uploaded' || (i.difficulty && !['pending', 'verified'].includes(i.status)));
    const ev = st.evidenceSummary(a, t);
    return publicShell(html`
      <div class="container section">
        <nav class="crumbs"><a href="#/me">내 지원현황</a> › <a href="#/me/${a.id}">${st.job(a.jobId).title}</a> › <span>증빙서류 제출</span></nav>
        <div class="page-head">
          <div>
            <h1 class="page-title">증빙서류 제출</h1>
            <p class="page-sub">지원서에 적은 학력·경력별로 증빙을 연결해 주세요. 현재 상태 ${badge(ev.label, ev.tone)}</p>
          </div>
          <div class="deadline-box ${deadlinePassed ? 'is-over' : ''}">
            <span class="deadline-box__label">제출 마감</span>
            <strong>${fmtDT(a.evidence.deadline, { tz: true })}</strong>
            <span>${deadlinePassed ? '마감됨 · 지금 제출하면 지연 제출로 기록됩니다' : remaining(a.evidence.deadline, t)}</span>
          </div>
        </div>
        <div class="alert alert--info">
          <ul class="tight">
            <li>파일 형식 ${UPLOAD_POLICY.exts.join(', ').toUpperCase()} · 파일당 ${UPLOAD_POLICY.maxFile / 1024 / 1024}MB · 전체 ${UPLOAD_POLICY.maxTotal / 1024 / 1024}MB 이하 (현재 ${fmtBytes(st.totalEvidenceBytes(a))})</li>
            <li>파일을 올린 뒤 맨 아래 <strong>제출 확정</strong>을 눌러야 제출됩니다. 마감 판정은 제출 확정 시각(서버 기준)으로 합니다.</li>
            <li>주민등록번호 뒷자리 등 채용 확인에 필요 없는 정보는 가린 뒤 올려 주세요.</li>
            <li class="muted">데모: 파일 내용은 저장·전송되지 않고 이름과 크기만 기록합니다. 파일명에 ‘암호’가 들어가면 비밀번호 PDF 오류를 재현합니다.</li>
          </ul>
        </div>
        ${groups.map(([g, label]) => { const list = items.filter((i) => i.group === g); return list.length ? html`<section class="section-sm"><h2 class="h2">${label}</h2><div class="stack">${list.map((it) => itemCard(a, it, t, deadlinePassed))}</div></section>` : ''; })}
        <details class="card section-sm">
          <summary class="h3">여러 서류를 PDF 하나로 합쳐서 내기</summary>
          <p class="muted small">기존 방식처럼 한 파일로 낼 수도 있습니다. 어떤 서류가 몇 쪽에 있는지 표시해 주시면 담당자가 항목별로 확인합니다.</p>
          <form data-form="merged" novalidate>
            <label class="field"><span class="field__label">통합 PDF</span><input type="file" name="file" accept=".pdf,application/pdf" class="input"></label>
            <table class="table table--compact"><thead><tr><th scope="col">포함</th><th scope="col">서류</th><th scope="col">쪽 범위</th></tr></thead><tbody>
            ${items.filter((i) => !['verified', 'na'].includes(i.status)).map((it) => html`<tr><td><input type="checkbox" name="inc" value="${it.id}" aria-label="${it.label} 포함"></td><td>${it.label}</td><td><input class="input input--sm" name="range-${it.id}" placeholder="예: 1~2" aria-label="${it.label} 쪽 범위"></td></tr>`)}
            </tbody></table>
            <button class="btn btn--secondary btn--sm">통합 PDF 연결하기</button>
          </form>
        </details>
        <div class="submit-bar">
          <div class="submit-bar__info"><strong>필수 ${req.length}개 중 ${ready.length}개 준비됨</strong>${staged.length ? html` · 제출 확정 대기 ${staged.length}건` : ''}</div>
          <button type="button" class="btn btn--primary btn--lg" data-action="finalize" ${staged.length ? '' : 'disabled'}>제출 확정</button>
        </div>
      </div>`, 'me');
  },
  changes: {
    'pick-file': (el, e, { appId }) => {
      const file = el.files?.[0];
      if (!file) return;
      uploadFlow(appId, [el.dataset.item], file, null);
    },
    'toggle-sub': (el, e, { appId }) => {
      const it = st.app(appId).evidence.items.find((x) => x.id === el.dataset.item);
      st.setSubstitute(appId, it.id, el.checked ? { doc: it.alt, reason: '' } : null);
      rerender();
    },
    'sub-reason': (el, e, { appId }) => {
      const it = st.app(appId).evidence.items.find((x) => x.id === el.dataset.item);
      st.setSubstitute(appId, it.id, { doc: it.alt, reason: el.value });
    },
    difficulty: (el, e, { appId }) => { st.setDifficulty(appId, el.dataset.item, el.value.trim()); rerender(); },
  },
  forms: {
    merged: (f, e, { appId }) => {
      const file = f.file.files?.[0];
      const inc = [...f.querySelectorAll('[name=inc]:checked')].map((x) => x.value);
      if (!file) { toast('통합 PDF 파일을 선택해 주세요.', 'danger'); return; }
      if (!inc.length) { toast('이 파일에 포함된 서류를 하나 이상 선택해 주세요.', 'danger'); return; }
      const ranges = Object.fromEntries(inc.map((id) => [id, f[`range-${id}`].value.trim()]));
      uploadFlow(appId, inc, file, ranges);
    },
  },
  actions: {
    'clear-temp': (el, e, { appId }) => { st.setTemp(appId, [el.dataset.item], null); rerender(); },
    finalize: (el, e, { appId }) => {
      const a = st.app(appId);
      const missing = st.evidenceMissing(a);
      const late = st.now() > new Date(a.evidence.deadline);
      const doIt = (allowPartial) => {
        const r = st.finalizeEvidence(appId, { allowPartial });
        closeModal();
        if (r.ok) { toast(`${r.count}건을 제출했습니다.${r.late ? ' (지연 제출로 기록)' : ''} 담당자 확인 후 결과를 알려 드립니다.`, r.late ? 'warn' : 'success'); rerender(); }
        else if (r.error === 'nothing') toast('제출할 파일이 없습니다.', 'danger');
      };
      if (missing.length || late) {
        openModal(html`<div>
          ${late ? html`<div class="alert alert--danger">제출 마감(${fmtDT(a.evidence.deadline, { tz: true })})이 지났습니다. 지금 제출하면 <strong>지연 제출</strong>로 기록되고, 인정 여부는 담당자가 판단합니다.</div>` : ''}
          ${missing.length ? html`<p>아직 준비되지 않은 <strong>필수 서류 ${missing.length}건</strong>이 있습니다.</p><ul>${missing.map((m) => html`<li>${m.label}</li>`)}</ul><p>준비된 서류만 먼저 제출할까요? 남은 서류는 마감 전까지 추가로 제출해야 합니다.</p>` : ''}
          <div class="row gap end"><button type="button" class="btn btn--ghost" data-action="close-modal">돌아가기</button><button type="button" class="btn btn--primary" data-action="confirm-finalize">준비된 서류 제출</button></div>
        </div>`, { title: '제출 확정 전 확인' });
        evidence.actions['confirm-finalize'] = () => doIt(true);
        return;
      }
      doIt(false);
    },
  },
};

function uploadFlow(appId, itemIds, file, ranges) {
  const a = st.app(appId);
  const fileId = `F${Date.now().toString(36)}`;
  const base = { fileId, name: file.name, size: file.size, at: st.nowISO(), merged: !!ranges };
  const total = st.totalEvidenceBytes(a) + file.size;
  const setAll = (state, extra = {}) => {
    for (const id of itemIds) st.setTemp(appId, [id], { ...base, state, range: ranges ? (ranges[id] ? `${ranges[id]}쪽` : '쪽 미지정') : null, ...extra });
    rerender();
  };
  setAll('uploading');
  setTimeout(() => {
    setAll('scanning');
    setTimeout(() => {
      const chk = st.fileCheck(file);
      if (!chk.ok) { setAll('error', { error: chk.error, message: chk.message }); toast(chk.message, 'danger'); return; }
      if (total > UPLOAD_POLICY.maxTotal) { setAll('error', { error: 'total', message: `지원 건당 전체 용량 ${UPLOAD_POLICY.maxTotal / 1024 / 1024}MB를 넘습니다.` }); return; }
      setAll('uploaded', { pages: ranges ? null : 1 });
      toast('업로드와 검사가 끝났습니다. 제출 확정을 눌러 주세요.', 'success');
    }, 900);
  }, 700);
}

// ───────── 면접 안내 ─────────
export const interview = {
  title: '면접 안내',
  render({ appId }) {
    if (requireLogin(`/me/${appId}/interview`)) return publicShell('', 'me');
    const a = myApp(appId);
    if (!a) return notMine();
    const iv = a.interview;
    if (!iv) return publicShell(html`<div class="container section narrow">${empty('안내된 면접 일정이 없습니다.', html`<a class="btn btn--secondary" href="#/me/${a.id}">지원 상세로</a>`)}</div>`, 'me');
    const resp = st.IV_RESP[iv.response ?? 'null'];
    const past = st.now() > new Date(iv.at);
    return publicShell(html`
      <div class="container section">
        <nav class="crumbs"><a href="#/me">내 지원현황</a> › <a href="#/me/${a.id}">${st.job(a.jobId).title}</a> › <span>면접 안내</span></nav>
        <h1 class="page-title">면접 안내</h1>
        <p class="page-sub">이 화면의 일정이 가장 최신입니다. ${iv.version > 1 ? html`<strong>일정이 변경되었습니다 (v${iv.version}).</strong> 이전에 받은 안내와 다를 수 있습니다.` : ''}</p>
        <div class="grid-2">
          <section class="card interview-card">
            <h2 class="h2">${POSITIONS[a.positionId].name} 개인 면접</h2>
            ${kv([
              ['면접 일시', html`<strong class="big">${fmtDT(iv.at)}</strong>`],
              ['도착 권장', `${fmtDT(iv.arriveBy)} (시작 15분 전)`],
              ['장소', iv.place],
              ['대기', iv.waiting],
              ['방식', iv.mode],
              ['준비물', iv.bring],
            ])}
            ${iv.history.length > 1 ? html`<h3 class="h4">일정 변경 이력</h3><ul class="log-list">${iv.history.map((h) => html`<li><time>${fmtShort(h.at)}</time> v${h.version} · ${fmtShort(h.when)} — ${h.text}</li>`)}</ul>` : ''}
          </section>
          <section class="card">
            <h2 class="h2">참석 여부 응답</h2>
            <p>현재 응답: ${badge(resp.label, resp.tone)} ${iv.responseAt ? html`<span class="muted small">${fmtShort(iv.responseAt)}</span>` : ''}</p>
            ${iv.response === 'ask' ? html`<div class="alert alert--info">${iv.responseHandled ? '담당자가 문의를 확인했습니다.' : '담당자가 문의를 확인하고 있습니다.'} 일정은 변경 안내를 받기 전까지 그대로입니다.</div>` : ''}
            ${past ? html`<p class="muted">면접 일시가 지나 응답을 바꿀 수 없습니다.</p>` : html`<form data-form="iv-response" novalidate>
              <fieldset class="radios">
                <legend class="sr-only">참석 여부</legend>
                <label class="check"><input type="radio" name="response" value="yes" ${iv.response === 'yes' ? 'checked' : ''}> 참석 예정</label>
                <label class="check"><input type="radio" name="response" value="ask" ${iv.response === 'ask' ? 'checked' : ''}> 일정 문의</label>
                <label class="check"><input type="radio" name="response" value="no" ${iv.response === 'no' ? 'checked' : ''}> 불참</label>
              </fieldset>
              <label class="field"><span class="field__label">담당자에게 남길 말 <span class="muted small">(일정 문의·불참 시 필수)</span></span><textarea name="note" class="input" rows="3" maxlength="300">${iv.responseNote || ''}</textarea></label>
              <p class="muted small">일정 문의를 보내도 면접 시간은 자동으로 바뀌지 않습니다. 변경되면 이 화면과 이메일로 다시 안내합니다.</p>
              <button class="btn btn--primary">응답 보내기</button>
            </form>`}
          </section>
        </div>
      </div>`, 'me');
  },
  forms: {
    'iv-response': (f, e, { appId }) => {
      const resp = f.querySelector('[name=response]:checked')?.value;
      if (!resp) { toast('참석 여부를 선택해 주세요.', 'danger'); return; }
      if ((resp === 'ask' || resp === 'no') && !f.note.value.trim()) { toast('일정 문의·불참은 사유를 적어 주세요.', 'danger'); f.note.focus(); return; }
      st.respondInterview(appId, resp, f.note.value.trim());
      toast('응답을 보냈습니다.', 'success');
      rerender();
    },
  },
};

export { personaTags };
