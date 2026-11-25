import { html, raw, fmtDT, fmtShort, fmtD } from '../util.js';
import * as st from '../store.js';
import { ROLES, STAFF, ORG, CLOCK_PRESETS } from '../data/seed.js';

export const badge = (text, tone = 'neutral') => html`<span class="badge badge--${tone}">${text}</span>`;

export const tagChips = (tags = []) => html`<span class="chips">${tags.map((t) => html`<span class="chip chip--${t.tone}" title="${t.sc?.length ? `검수 시나리오 ${t.sc.map((n) => `#${n}`).join(', ')}` : ''}">${t.label}</span>`)}</span>`;

export function pageHead(title, sub = '', actions = '') {
  return html`<div class="page-head">
    <div><h1 class="page-title">${title}</h1>${sub ? html`<p class="page-sub">${sub}</p>` : ''}</div>
    ${actions ? html`<div class="page-actions">${actions}</div>` : ''}
  </div>`;
}

export const empty = (text, action = '') => html`<div class="empty"><p>${text}</p>${action}</div>`;

export function demoBar() {
  return html`<div class="demo-bar" role="note">
    <div class="container demo-bar__inner">
      <span class="demo-bar__label">시제품(데모)</span>
      <span class="demo-bar__text">실제 접수처가 아닙니다 · 모든 정보는 가상</span>
      <span class="demo-bar__clock">데모 기준 시각 <strong data-clock>${fmtShort(st.now())}</strong></span>
      <button type="button" class="demo-bar__btn" data-action="open-demo">데모 설정</button>
    </div>
  </div>`;
}

export function siteHeader(active = '') {
  const acc = st.currentAccount();
  const link = (href, label, key) => html`<a href="#${href}" class="nav__link ${active === key ? 'is-active' : ''}" ${active === key ? html`aria-current="page"` : ''}>${label}</a>`;
  return html`<header class="site-header">
    <div class="container site-header__inner">
      <a href="#/" class="brand" aria-label="${ORG.name} 채용 홈">
        <img src="assets/brand/logo-horizontal-green.png" alt="${ORG.name}" class="brand__logo" width="146" height="40">
        <span class="brand__divider" aria-hidden="true"></span>
        <span class="brand__sub">채용</span>
      </a>
      <nav class="nav" aria-label="주 메뉴">
        ${link('/', '채용공고', 'jobs')}
        ${link('/me', '내 지원현황', 'me')}
        ${link('/admin', '담당자', 'admin')}
      </nav>
      <div class="site-header__user">
        ${acc ? html`<span class="user-pill" title="${acc.email}">${acc.name || acc.email}</span><button type="button" class="btn btn--ghost btn--sm" data-action="logout">로그아웃</button>`
          : html`<a href="#/login" class="btn btn--primary btn--sm">로그인</a>`}
      </div>
    </div>
  </header>`;
}

const SNS_ICON = {
  facebook: '<path d="M14 8h3V4h-3c-2.8 0-4.5 1.8-4.5 4.6V11H7v4h2.5v8h4v-8h3l.5-4h-3.5V8.8c0-.5.3-.8.5-.8z"/>',
  blog: '<path d="M4 4h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-6l-2 2.5L10 18H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zm3.2 4v6h2.1c1.3 0 2.1-.7 2.1-1.7 0-.7-.4-1.2-1-1.4.5-.2.8-.6.8-1.2 0-1-.8-1.7-2-1.7zm1.3 1h.7c.5 0 .8.3.8.7s-.3.7-.8.7h-.7zm0 2.4h.9c.5 0 .9.3.9.8s-.4.8-.9.8h-.9zM13 8v6h3.6v-1.1h-2.3V8z"/>',
  youtube: '<path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15V9l5.2 3z"/>',
};

export function snsLinks() {
  return html`<ul class="sns" aria-label="아산나눔재단 공식 채널">${ORG.sns.map((s) => html`<li><a class="sns__link" href="${s.url}" target="_blank" rel="noopener noreferrer" aria-label="${s.label} (새 창)"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="currentColor">${raw(SNS_ICON[s.key])}</svg><span>${s.label}</span></a></li>`)}</ul>`;
}

export function siteFooter() {
  return html`<footer class="site-footer">
    <div class="container site-footer__inner">
      <img src="assets/brand/logo-horizontal-green.png" alt="${ORG.name}" width="117" height="32" class="site-footer__logo">
      <div class="site-footer__text">
        <p><strong>채용 문의</strong> ${ORG.contact}</p>
        <p>데모 사이트 · 모든 정보는 가상이며 입력값은 이 브라우저에만 저장됩니다.</p>
      </div>
      ${snsLinks()}
    </div>
  </footer>`;
}

export function publicShell(content, active) {
  return html`${demoBar()}${siteHeader(active)}<main id="main" class="site-main" tabindex="-1">${content}</main>${siteFooter()}`;
}

const NAV = {
  dashboard: ['/admin', '대시보드'],
  applicants: ['/admin/applicants', '지원자'],
  review: ['/admin/review', '심사'],
  'review-status': ['/admin/review', '심사 현황'],
  evidence: ['/admin/evidence', '증빙 검토'],
  interviews: ['/admin/interviews', '면접 일정'],
  publish: ['/admin/publish', '결과 확정·발표'],
  notifications: ['/admin/notifications', '알림'],
  audit: ['/admin/audit', '감사 기록'],
  personas: ['/admin/personas', '가상 지원자 75'],
};

export function adminShell(content, active) {
  const me = st.currentStaff();
  const role = ROLES[me.role];
  return html`${demoBar()}
  <div class="admin">
    <aside class="admin__side" aria-label="관리자 메뉴">
      <a href="#/admin" class="admin__brand"><img src="assets/brand/logo-horizontal-green.png" alt="${ORG.name}" width="117" height="32"><span>채용 관리</span></a>
      <nav class="admin__nav">
        ${role.nav.map((k) => { const [href, label] = NAV[k]; return html`<a href="#${href}" class="admin__link ${active === k || (active === 'review' && k === 'review-status') ? 'is-active' : ''}">${label}</a>`; })}
      </nav>
      <div class="admin__me">
        <div class="admin__me-name">${me.name}</div>
        <div class="admin__me-role">${me.title} · ${me.team}</div>
        <div class="admin__me-actions">
          <a href="#/admin/login" class="btn btn--ghost btn--sm">역할 전환</a>
          <button type="button" class="btn btn--ghost btn--sm" data-action="staff-logout">로그아웃</button>
        </div>
        <a href="#/" class="admin__to-site">지원자 화면 보기 →</a>
      </div>
    </aside>
    <main id="main" class="admin__main" tabindex="-1">${content}</main>
  </div>`;
}

export function kv(rows) {
  return html`<dl class="kv">${rows.filter(Boolean).map(([k, v]) => html`<div class="kv__row"><dt>${k}</dt><dd>${v}</dd></div>`)}</dl>`;
}

export function scheduleText(s) {
  if (s.tbd) return '추후 안내';
  if (s.at) return html`${fmtDT(s.at)}${s.tentative ? html` <span class="muted">(예정)</span>` : ''}`;
  if (s.from && s.to) return html`${fmtDT(s.from)} ~ ${fmtDT(s.to)}${s.note ? html` <span class="muted">· ${s.note}</span>` : ''}`;
  if (s.from) return html`${fmtDT(s.from)}부터${s.note ? html` <span class="muted">· ${s.note}</span>` : ''}`;
  return '추후 안내';
}

export function demoPanel() {
  const t = st.now();
  const flags = st.S().flags;
  return html`
    <section class="demo-panel">
      <h3 class="h3">데모 기준 시각</h3>
      <p class="muted small">마감 판정은 이 시각을 서버 시각으로 간주해 처리합니다. 현재: <strong>${fmtDT(t, { tz: true })}</strong></p>
      <div class="preset-list">
        ${CLOCK_PRESETS.map((p) => html`<button type="button" class="btn btn--secondary btn--sm" data-action="set-clock" data-at="${p.at}">${p.label}</button>`)}
      </div>
      <form data-form="custom-clock" class="inline-form">
        <label class="field-inline"><span>직접 지정 (한국시간)</span><input type="datetime-local" name="at" required></label>
        <button class="btn btn--primary btn--sm">적용</button>
      </form>
    </section>
    <section class="demo-panel">
      <h3 class="h3">빠른 이동</h3>
      <div class="preset-list">
        <a class="btn btn--secondary btn--sm" href="#/admin/personas" data-action="close-modal-link">가상 지원자 75명 보기</a>
        ${STAFF.slice(0, 4).map((s) => html`<button type="button" class="btn btn--secondary btn--sm" data-action="quick-staff" data-id="${s.id}">${s.title}(${s.name})로 보기</button>`)}
      </div>
    </section>
    <section class="demo-panel">
      <h3 class="h3">장애 상황 재현</h3>
      <label class="check"><input type="checkbox" data-action="toggle-autosave-fail" ${flags.autosaveFail ? 'checked' : ''}> 지원서 자동저장 실패 시뮬레이션</label>
      <p class="muted small">증빙 업로드에서 파일명에 ‘암호’ 또는 ‘손상’이 들어가면 검사 실패를 재현합니다.</p>
    </section>
    <section class="demo-panel">
      <h3 class="h3">면접 이후 상황 만들기</h3>
      <p class="muted small">시각을 면접 종료 후(11/28)로 옮기고, 참석 기록과 심사위원 면접 평가를 샘플로 채웁니다. 이후 ‘결과 확정·발표’에서 최종 발표 흐름을 시연할 수 있습니다.</p>
      <button type="button" class="btn btn--secondary btn--sm" data-action="demo-fill-interviews">면접 평가 샘플 채우기</button>
    </section>
    <section class="demo-panel">
      <h3 class="h3">데이터</h3>
      <p class="muted small">이 브라우저에 저장된 데모 데이터(지원·심사·발표 기록)를 처음 상태로 되돌립니다.</p>
      <button type="button" class="btn btn--danger btn--sm" data-action="reset-demo">데모 데이터 초기화</button>
    </section>`;
}

export function phaseOf(a, at = st.now()) {
  const j = st.job(a.jobId);
  const ss = st.S().stageState[j.id] || {};
  const ev = st.evidenceSummary(a, at);
  const out = { status: '', tone: 'info', todo: '', dates: [], ctas: [] };
  if (a.status === 'draft') {
    if (j.apply.to && at > new Date(j.apply.to)) {
      out.status = '접수 기간 종료 · 미제출'; out.tone = 'neutral';
      out.todo = a.lateAttemptAt ? `마감 이후(${fmtDT(a.lateAttemptAt)})에 제출을 시도해 접수되지 않았습니다.` : '임시저장한 지원서는 최종 제출되지 않아 접수되지 않았습니다.';
      out.dates.push(['접수 마감', fmtDT(j.apply.to, { tz: true })]);
    } else {
      out.status = '지원서 작성 중'; out.tone = 'warn';
      out.todo = '지원서를 완성해 최종 제출해 주세요. 임시저장만으로는 접수되지 않습니다.';
      out.dates.push(['접수 마감', fmtDT(j.apply.to, { tz: true })]);
      out.ctas.push([`/apply/${j.id}`, '이어서 작성하기', 'primary']);
    }
    return out;
  }
  if (a.status === 'withdrawn') {
    out.status = '지원 철회'; out.tone = 'neutral';
    out.todo = `${fmtDT(a.withdrawnAt)}에 지원을 철회했습니다. 더 진행할 절차가 없습니다.`;
    return out;
  }
  const fin = a.stages.final.public;
  if (fin) {
    const map = { pass: ['최종 합격', 'success', '축하합니다. 입사 관련 안내는 담당자가 개별 연락드립니다. (데모)'], fail: ['최종 결과: 불합격', 'neutral', '끝까지 함께해 주셔서 감사합니다.'], reserve: ['최종 예비합격', 'info', '결원이 생기면 개별 연락드립니다.'], forfeit: ['전형 종료 (면접 불참)', 'neutral', '면접에 참석하지 않아 전형이 종료되었습니다.'] };
    const [s, tone, todo] = map[fin.result];
    out.status = s; out.tone = tone; out.todo = todo;
    out.dates.push(['최종 발표', fmtDT(fin.at)]);
    if (fin.corrected) out.todo = `${todo} (결과가 정정되었습니다: ${fin.corrected.reason})`;
    return out;
  }
  const scr = a.stages.screening.public;
  if (!scr) {
    out.status = '서류전형 심사 중'; out.tone = 'info';
    out.todo = '결과 발표를 기다려 주세요. 발표되면 이 화면에서 바로 확인할 수 있고, 이메일로도 안내합니다.';
    const sr = j.schedule.find((s) => s.key === 'screening_result');
    out.dates.push(['서류 결과 발표', sr?.at ? fmtDT(sr.at) : '추후 안내']);
    return out;
  }
  if (scr.result === 'fail') {
    out.status = '서류전형 결과: 불합격'; out.tone = 'neutral';
    out.todo = '지원해 주셔서 감사합니다. 아쉽게도 이번 서류전형에서는 함께하지 못하게 되었습니다.';
    out.dates.push(['결과 발표', fmtDT(scr.at)]);
    return out;
  }
  if (scr.result === 'reserve') {
    out.status = '서류전형 예비합격'; out.tone = 'info';
    out.todo = '합격자 중 결원이 생기면 개별 연락드립니다. 별도로 하실 일은 없습니다.';
    out.dates.push(['결과 발표', fmtDT(scr.at)]);
    return out;
  }
  // 서류 합격
  out.status = `서류전형 합격 · ${ev.key === 'verified' ? '증빙 확인 완료' : ev.key === 'submitted' ? '증빙 확인 대기' : ev.key === 'revision' ? '증빙 보완 요청' : ev.key === 'partial' ? '증빙 일부 제출' : '증빙서류 제출 대기'}`;
  out.tone = ev.key === 'revision' || ev.key === 'partial' || ev.key === 'none' || ev.key === 'overdue' ? 'warn' : 'success';
  const todos = [];
  const req = a.evidence.items.filter((i) => i.required);
  const remain = req.filter((i) => ['none', 'error'].includes(i.status));
  const rev = a.evidence.items.filter((i) => i.status === 'revision');
  if (rev.length) todos.push(`보완 요청된 서류 ${rev.length}건을 다시 제출해 주세요.`);
  if (remain.length) todos.push(`${remain.slice(0, 2).map((i) => i.type.split(' ')[0]).join('·')}${remain.length > 2 ? ` 외 ${remain.length - 2}건` : ''}을(를) 제출해 주세요.`);
  if (!rev.length && !remain.length && ev.key !== 'verified') todos.push('담당자가 증빙을 확인하고 있습니다. 확인 결과는 이 화면에 표시됩니다.');
  if (a.interview && !a.interview.response) todos.push('면접 참석 여부를 알려 주세요.');
  if (a.interview?.response === 'ask') todos.push('보내 주신 일정 문의를 담당자가 확인 중입니다. 일정은 변경 안내 전까지 그대로입니다.');
  if (!todos.length) todos.push('안내된 일시에 면접에 참석해 주세요.');
  out.todo = todos.join(' ');
  if (a.evidence.deadline) out.dates.push(['증빙 제출 마감', fmtDT(a.evidence.deadline, { tz: true })]);
  const revDue = rev.find((i) => i.review?.due)?.review.due;
  if (revDue) out.dates.push(['보완 마감', fmtDT(revDue, { tz: true })]);
  if (a.interview) {
    out.dates.push(['개인 면접', fmtDT(a.interview.at)]);
    out.dates.push(['도착 권장', `${fmtShort(a.interview.arriveBy)} (시작 15분 전)`]);
    out.dates.push(['장소', a.interview.place]);
  }
  out.ctas.push([`/me/${a.id}/evidence`, ev.key === 'verified' ? '증빙서류 확인하기' : '증빙서류 제출하기', ev.key === 'verified' ? 'secondary' : 'primary']);
  if (a.interview) out.ctas.push([`/me/${a.id}/interview`, '면접 안내 확인하기', 'secondary']);
  return out;
}

export { fmtD };
