import { html, fmtDT, fmtShort, fmtBytes, pct, csv, download, maskEmail, toKstInput, fromKstInput, fmtMD, fmtTime } from '../util.js';
import * as st from '../store.js';
import { JOBS, POSITIONS, STAFF, ROLES, RUBRIC, STAGES } from '../data/seed.js';
import { adminShell, badge, kv, pageHead, empty, tagChips } from './common.js';
import { applicationView, eduText, carText, certText } from './applicant.js';
import { navigate, rerender, toast, openModal, closeModal } from '../ui.js';

// ───────── 권한 ─────────
function guard(allowed, active, renderFn) {
  const me = st.currentStaff();
  if (!me) { setTimeout(() => navigate('/admin/login')); return ''; }
  if (allowed && !allowed.includes(me.role)) {
    return adminShell(html`<div class="admin-page">${pageHead('접근 권한이 없습니다')}<div class="alert alert--warn">${ROLES[me.role].label} 역할로는 이 화면을 볼 수 없습니다. 운영 버전에서는 화면을 숨기는 것과 별개로 서버에서 요청을 차단해야 합니다.</div></div>`, active);
  }
  return adminShell(html`<div class="admin-page">${renderFn(me)}</div>`, active);
}

const jobOptions = (cur, ids = ['J26H2', 'J26MARU']) => html`<label class="field-inline"><span>공고</span><select class="input input--sm" data-onchange="pick-job">${ids.map((id) => html`<option value="${id}" ${cur === id ? 'selected' : ''}>${st.job(id).title}</option>`)}</select></label>`;
const posName = (id) => POSITIONS[id]?.name || '-';
const personaOf = (a) => st.account(a.accountId)?.persona;
const resultBadge = (r) => (r ? badge(st.RESULT[r.result].label, st.RESULT[r.result].tone) : html`<span class="muted">-</span>`);

const pickJobChange = { 'pick-job': (el) => { const [path] = location.hash.slice(1).split('?'); navigate(`${path}?job=${el.value}`); } };

export const staffLogin = {
  title: '담당자 로그인',
  render() {
    return html`<div class="admin-login">
      <div class="admin-login__card card">
        <img src="assets/brand/logo-horizontal-green.png" alt="아산나눔재단" width="160" height="44">
        <h1 class="page-title">채용 관리 로그인</h1>
        <p class="page-sub">데모에서는 역할을 골라 바로 들어갑니다. 운영 버전에서는 관리자 추가 인증(2단계 인증)과 심사위원 권한 만료를 적용합니다.</p>
        <ul class="staff-list">${STAFF.map((s) => html`<li><button type="button" class="staff-btn" data-action="staff-login" data-id="${s.id}">
          <span class="staff-btn__name">${s.name}</span><span class="staff-btn__role">${s.title} · ${s.team}</span>
          <span class="staff-btn__desc">${{ recruiter: '공고·지원자·배정·결과안·일정·알림 관리', approver: '결과 확정·발표 승인, 정정', verifier: '합격자 증빙 대조·보완 요청', evaluator: `배정 직무 블라인드 심사 (${(s.assigned || []).map((p) => POSITIONS[p].code).join(', ')})` }[s.role]}</span>
        </button></li>`)}</ul>
        <a href="#/" class="muted small">← 지원자 화면으로</a>
      </div>
    </div>`;
  },
  actions: {
    'staff-login': (el) => {
      st.staffLogin(el.dataset.id);
      const me = st.currentStaff();
      navigate(me.role === 'evaluator' ? '/admin/review' : me.role === 'verifier' ? '/admin/evidence' : '/admin');
    },
  },
};

// ───────── 대시보드 ─────────
export const dashboard = {
  title: '대시보드',
  render(p, q) {
    return guard(['recruiter', 'approver'], 'dashboard', () => {
      const jobId = q.job || 'J26H2';
      const t = st.now();
      const all = st.appsOfJob(jobId).filter((a) => !a.past);
      const sub = all.filter((a) => a.status === 'submitted');
      const drafts = all.filter((a) => a.status === 'draft');
      const wd = all.filter((a) => a.status === 'withdrawn');
      let need = 0; let done = 0;
      for (const a of sub) { const r = st.reviewStats(a, 'screening'); need += r.needed; done += r.done; }
      const ss = st.S().stageState[jobId];
      const targets = sub.filter((a) => a.evidence.required);
      const evc = { verified: 0, submitted: 0, partial: 0, none: 0, overdue: 0, revision: 0 };
      targets.forEach((a) => { evc[st.evidenceSummary(a, t).key]++; });
      const itemsAll = targets.flatMap((a) => a.evidence.items);
      const pendingItems = itemsAll.filter((i) => i.status === 'pending').length;
      const revisionItems = itemsAll.filter((i) => i.status === 'revision').length;
      const verifiedItems = itemsAll.filter((i) => i.status === 'verified').length;
      const ivs = sub.filter((a) => a.interview);
      const ivc = { yes: 0, no: 0, ask: 0, null: 0 };
      ivs.forEach((a) => { ivc[a.interview.response ?? 'null']++; });
      const notifs = st.S().notifications.filter((n) => st.app(n.appId)?.jobId === jobId);
      const nProblem = notifs.filter((n) => ['bounced', 'failed'].includes(n.status));
      const queued = notifs.filter((n) => n.status === 'queued');
      const askOpen = ivs.filter((a) => a.interview.response === 'ask' && !a.interview.responseHandled);
      const totalApps = st.S().applications.filter((a) => a.status !== 'draft').length;
      const uniqPeople = new Set(st.S().applications.filter((a) => a.status !== 'draft').map((a) => a.accountId)).size;
      const j = st.job(jobId);
      const stageChip = (k) => { const s = ss?.[k]?.state || 'draft'; return badge({ draft: '작성 중', confirmed: '확정·비공개', published: '공개' }[s], { draft: 'neutral', confirmed: 'warn', published: 'success' }[s]); };
      const bar = (n, total, tone = 'brand') => html`<span class="bar"><span class="bar__fill bar__fill--${tone}" style="width:${pct(n, total)}%"></span></span>`;
      return html`
        ${pageHead('대시보드', `${j.title} · 기준 ${fmtDT(t, { tz: true })}`, jobOptions(jobId))}
        <div class="kpi-grid">
          <a class="kpi" href="#/admin/applicants?job=${jobId}"><span class="kpi__label">최종 제출</span><span class="kpi__value">${sub.length}<small>건</small></span><span class="kpi__sub">임시저장 ${drafts.length} · 철회 ${wd.length}</span></a>
          <a class="kpi" href="#/admin/review"><span class="kpi__label">서류 심사 진행률</span><span class="kpi__value">${pct(done, need)}<small>%</small></span><span class="kpi__sub">제출 평가표 ${done} / 필요 ${need}</span>${bar(done, need)}</a>
          <a class="kpi" href="#/admin/publish?job=${jobId}"><span class="kpi__label">결과 발표</span><span class="kpi__value kpi__value--sm">서류 ${stageChip('screening')}</span><span class="kpi__sub">면접·최종 ${stageChip('final')}</span></a>
          <a class="kpi" href="#/admin/evidence"><span class="kpi__label">증빙 제출 (대상 ${targets.length}명)</span><span class="kpi__value">${evc.submitted + evc.verified + evc.revision}<small>명 제출</small></span><span class="kpi__sub">일부 ${evc.partial} · 미제출 ${evc.none + evc.overdue}${evc.overdue ? ` (기한 초과 ${evc.overdue})` : ''}</span>${bar(evc.submitted + evc.verified + evc.revision, targets.length)}</a>
          <a class="kpi" href="#/admin/evidence"><span class="kpi__label">증빙 검토 (항목)</span><span class="kpi__value">${pendingItems}<small>건 대기</small></span><span class="kpi__sub">보완 요청 ${revisionItems} · 확인 완료 ${verifiedItems}</span></a>
          <a class="kpi" href="#/admin/interviews?job=${jobId}"><span class="kpi__label">면접 응답 (${ivs.length}명)</span><span class="kpi__value">${ivc.yes}<small>명 참석</small></span><span class="kpi__sub">미응답 ${ivc.null} · 문의 ${ivc.ask} · 불참 ${ivc.no}</span></a>
          <a class="kpi ${nProblem.length ? 'kpi--alert' : ''}" href="#/admin/notifications"><span class="kpi__label">알림 문제</span><span class="kpi__value">${nProblem.length}<small>건</small></span><span class="kpi__sub">발송 실패·반송 · 예약 ${queued.length}건</span></a>
          <div class="kpi"><span class="kpi__label">누적 지원 건수 / 지원자 수</span><span class="kpi__value">${totalApps}<small>건</small> / ${uniqPeople}<small>명</small></span><span class="kpi__sub">전체 공고 기준 · 재지원자 중복 제거</span></div>
        </div>
        <div class="grid-2 section-sm">
          <section class="card">
            <h2 class="h2">오늘 처리할 일</h2>
            <ul class="todo">
              ${pendingItems ? html`<li><a href="#/admin/evidence?f=submitted">증빙 확인 대기 ${pendingItems}건 검토</a></li>` : ''}
              ${revisionItems ? html`<li><a href="#/admin/evidence?f=revision">보완 요청 ${revisionItems}건 재제출 여부 확인</a></li>` : ''}
              ${evc.none + evc.partial + evc.overdue ? html`<li><a href="#/admin/notifications?f=queued">증빙 미제출·일부 제출 ${evc.none + evc.partial + evc.overdue}명 — 마감 전 안내 ${queued.length}건 예약됨</a></li>` : ''}
              ${askOpen.length ? html`<li><a href="#/admin/interviews?job=${jobId}">면접 일정 문의 ${askOpen.length}건 확인</a></li>` : ''}
              ${ivc.null ? html`<li><a href="#/admin/interviews?job=${jobId}">면접 미응답 ${ivc.null}명 연락</a></li>` : ''}
              ${nProblem.length ? html`<li><a href="#/admin/notifications?f=problem">반송·실패 메일 ${nProblem.length}건 연락처 확인</a></li>` : ''}
              ${ss?.final?.state === 'draft' && jobId === 'J26H2' ? html`<li><a href="#/admin/publish?job=${jobId}">면접 후 최종 결과안 작성 (발표 예정 ${fmtMD(j.schedule.find((s) => s.key === 'final_result')?.at)})</a></li>` : ''}
            </ul>
          </section>
          <section class="card">
            <h2 class="h2">직무별 현황</h2>
            <div class="table-wrap"><table class="table table--compact">
              <thead><tr><th scope="col">직무</th><th scope="col">제출</th><th scope="col">서류 합격</th><th scope="col">증빙 완료</th><th scope="col">면접 참석 예정</th></tr></thead>
              <tbody>${j.positions.map((pid) => { const s = sub.filter((a) => a.positionId === pid); const ps = s.filter((a) => a.stages.screening.public?.result === 'pass'); return html`<tr><th scope="row" title="${POSITIONS[pid].name}">${POSITIONS[pid].code}</th><td>${s.length}</td><td>${ps.length}</td><td>${ps.filter((a) => st.evidenceSummary(a, t).key === 'verified').length}</td><td>${ps.filter((a) => a.interview?.response === 'yes').length}</td></tr>`; })}</tbody>
            </table></div>
          </section>
        </div>`;
    });
  },
  changes: pickJobChange,
};

// ───────── 지원자 목록 ─────────
function filteredApps(q) {
  const jobId = q.job || 'J26H2';
  const t = st.now();
  let list = st.appsOfJob(jobId).filter((a) => !a.past);
  if (q.pos) list = list.filter((a) => a.positionId === q.pos);
  if (q.s) list = list.filter((a) => a.status === q.s);
  if (q.r) list = list.filter((a) => (a.stages.screening.internal?.result || 'none') === q.r);
  if (q.ev) list = list.filter((a) => st.evidenceSummary(a, t).key === q.ev);
  if (q.q) { const k = q.q.trim(); list = list.filter((a) => [a.form.name, a.receiptNo, a.form.email, ...(personaOf(a)?.tags || []).map((x) => x.label)].join(' ').includes(k)); }
  return list;
}

export const applicants = {
  title: '지원자',
  render(p, q) {
    const me = st.currentStaff();
    if (me?.role === 'verifier') { setTimeout(() => navigate('/admin/evidence')); return ''; }
    if (me?.role === 'evaluator') { setTimeout(() => navigate('/admin/review')); return ''; }
    return guard(['recruiter', 'approver'], 'applicants', () => {
      const jobId = q.job || 'J26H2';
      const j = st.job(jobId);
      const t = st.now();
      const list = filteredApps(q).sort((a, b) => (a.receiptNo || 'Z').localeCompare(b.receiptNo || 'Z'));
      const sel = (name, opts) => html`<select class="input input--sm" name="${name}" aria-label="${name}">${opts.map(([v, l]) => html`<option value="${v}" ${(q[name] || '') === v ? 'selected' : ''}>${l}</option>`)}</select>`;
      return html`
        ${pageHead('지원자', `${j.title} · ${list.length}건 표시`, html`${jobOptions(jobId)}
          <button type="button" class="btn btn--secondary btn--sm" data-action="export" data-kind="full">CSV (담당자용)</button>
          <button type="button" class="btn btn--secondary btn--sm" data-action="export" data-kind="share">CSV (내부 공유용 집계)</button>`)}
        <form class="filters" data-form="filter" data-job="${jobId}">
          ${sel('pos', [['', '전체 직무'], ...j.positions.map((x) => [x, POSITIONS[x].name])])}
          ${sel('s', [['', '지원서 상태'], ['submitted', '제출 완료'], ['draft', '작성 중'], ['withdrawn', '철회']])}
          ${sel('r', [['', '서류 결과'], ['pass', '합격'], ['reserve', '예비'], ['fail', '불합격'], ['none', '미정']])}
          ${sel('ev', [['', '증빙 상태'], ['verified', '확인 완료'], ['submitted', '확인 대기'], ['revision', '보완 요청'], ['partial', '일부 제출'], ['none', '미제출'], ['overdue', '기한 초과']])}
          <input class="input input--sm" type="search" name="q" value="${q.q || ''}" placeholder="이름·접수번호·상황 태그" aria-label="검색">
          <button class="btn btn--primary btn--sm">적용</button>
          <a class="btn btn--ghost btn--sm" href="#/admin/applicants?job=${jobId}">초기화</a>
        </form>
        <div class="table-wrap"><table class="table">
          <thead><tr><th scope="col">접수번호</th><th scope="col">이름</th><th scope="col">지원분야</th><th scope="col">상태</th><th scope="col">서류 평균</th><th scope="col">서류 결과</th><th scope="col">증빙</th><th scope="col">면접 응답</th><th scope="col">상황 (데모 페르소나)</th></tr></thead>
          <tbody>${list.map((a) => {
            const rs = st.reviewStats(a, 'screening'); const ev = st.evidenceSummary(a, t);
            const resp = a.interview ? st.IV_RESP[a.interview.response ?? 'null'] : null;
            return html`<tr>
              <td class="mono">${a.receiptNo || '-'}</td>
              <td><a href="#/admin/applicants/${a.id}">${a.form.name || '(이름 미입력)'}</a></td>
              <td>${POSITIONS[a.positionId]?.code || '-'}</td>
              <td>${badge({ submitted: '제출', draft: '작성 중', withdrawn: '철회' }[a.status], a.status === 'submitted' ? 'info' : 'neutral')}</td>
              <td>${rs.avg != null ? html`${rs.avg.toFixed(1)} <span class="muted small">(${rs.done}/${rs.needed})</span>` : '-'}</td>
              <td>${resultBadge(a.stages.screening.internal)}${a.stages.screening.internal && !a.stages.screening.public ? html` <span class="muted small">비공개</span>` : ''}</td>
              <td>${ev.key === 'na' ? html`<span class="muted">-</span>` : badge(ev.label, ev.tone)}</td>
              <td>${resp ? badge(resp.label, resp.tone) : html`<span class="muted">-</span>`}</td>
              <td>${tagChips((personaOf(a)?.tags || []).filter((x) => !x.key.startsWith('e:')).slice(0, 3))}</td>
            </tr>`; })}</tbody>
        </table></div>
        ${list.length ? '' : empty('조건에 맞는 지원자가 없습니다.')}`;
    });
  },
  changes: pickJobChange,
  forms: {
    filter: (f) => {
      const params = new URLSearchParams({ job: f.dataset.job });
      for (const k of ['pos', 's', 'r', 'ev', 'q']) if (f[k].value) params.set(k, f[k].value);
      navigate(`/admin/applicants?${params}`);
    },
  },
  actions: {
    export: (el, e, p, q) => {
      const list = filteredApps(q);
      const t = st.now();
      const full = el.dataset.kind === 'full';
      const head = full ? ['접수번호', '이름', '이메일', '연락처', '지원분야', '제출시각(KST)', '서류평균', '서류결과', '증빙상태', '면접일시', '면접응답'] : ['접수번호', '지원분야', '제출일', '서류평균', '서류결과', '증빙상태', '면접응답'];
      const rows = list.map((a) => {
        const rs = st.reviewStats(a, 'screening');
        const base = [a.receiptNo || '', ...(full ? [a.form.name, a.form.email, a.form.phone] : []), posName(a.positionId), full ? fmtDT(a.submittedAt) : fmtMD(a.submittedAt), rs.avg?.toFixed(1) || '', a.stages.screening.internal ? st.RESULT[a.stages.screening.internal.result].label : '', st.evidenceSummary(a, t).label];
        return full ? [...base, a.interview ? fmtDT(a.interview.at) : '', a.interview ? st.IV_RESP[a.interview.response ?? 'null'].label : ''] : [...base, a.interview ? st.IV_RESP[a.interview.response ?? 'null'].label : ''];
      });
      download(`지원자_${full ? '담당자용' : '내부공유용'}_${q.job || 'J26H2'}.csv`, csv([head, ...rows]));
      st.logView('내보내기', q.job || 'J26H2', `${full ? '담당자용(연락처 포함)' : '내부 공유용(연락처·서술형 제외)'} CSV ${rows.length}건`);
      toast('CSV를 내려받았습니다. 다운로드 기록이 감사 로그에 남습니다.');
    },
  },
};

// ───────── 지원자 상세 ─────────
export const applicantDetail = {
  title: '지원자 상세',
  render({ appId }, q) {
    return guard(['recruiter', 'approver'], 'applicants', (me) => {
      const a = st.app(appId);
      if (!a) return empty('지원 건을 찾을 수 없습니다.');
      const acc = st.account(a.accountId);
      const per = acc.persona;
      const tab = q.tab || 'form';
      const t = st.now();
      const ev = st.evidenceSummary(a, t);
      const tabs = [['form', '지원서 제출본'], ['review', '전형·평가'], ['evidence', '증빙'], ['interview', '면접'], ['log', '알림·이력·메모']];
      const ss = st.S().stageState[a.jobId];
      let body;
      if (tab === 'form') {
        body = html`${a.versions.length ? html`<p class="muted small">제출 이력: ${a.versions.map((v) => `v${v.no} ${fmtShort(v.at)}`).join(' · ')} · 동의: ${a.form.consent?.version || '-'} ${a.form.consent?.at ? fmtShort(a.form.consent.at) : ''}</p>` : ''}<div class="stack">${applicationView(a)}</div>`;
      } else if (tab === 'review') {
        body = html`${['screening', 'final'].map((stage) => {
          const rs = a.reviews[stage];
          const stat = st.reviewStats(a, stage);
          return html`<section class="card"><div class="card__head"><h3 class="h3">${STAGES[stage].label}</h3>
            <span>내부 결과 ${resultBadge(a.stages[stage].internal)} · 공개 결과 ${a.stages[stage].public ? resultBadge(a.stages[stage].public) : html`<span class="muted">비공개</span>`}</span></div>
            ${rs.length ? html`<div class="table-wrap"><table class="table table--compact"><thead><tr><th scope="col">심사위원</th>${RUBRIC[stage].map((c) => html`<th scope="col">${c.label}<br><span class="muted small">/${c.max}</span></th>`)}<th scope="col">합계</th><th scope="col">의견</th><th scope="col">상태</th><th scope="col"></th></tr></thead><tbody>
            ${rs.map((r) => html`<tr><td>${st.staff(r.evaluatorId).name}</td>${RUBRIC[stage].map((c) => html`<td>${r.scores?.[c.key] ?? '-'}</td>`)}<td><strong>${r.total ?? '-'}</strong></td><td class="small">${r.comment}</td><td>${badge(r.status === 'submitted' ? '제출' : '임시저장', r.status === 'submitted' ? 'success' : 'neutral')}</td>
              <td>${me.role === 'recruiter' && r.status === 'submitted' && ss[stage].state === 'draft' ? html`<button type="button" class="link-btn" data-action="reopen-review" data-stage="${stage}" data-ev="${r.evaluatorId}">재개방</button>` : ''}</td></tr>`)}
            </tbody></table></div>
            <p class="small">평균 <strong>${stat.avg != null ? stat.avg.toFixed(1) : '-'}</strong> · 제출 ${stat.done}/${stat.needed}${stat.done < stat.needed ? html` · <span class="text-warn">누락 평가 ${stat.needed - stat.done}건</span>` : ''} <span class="muted">— 계산값은 참고용이며 합격 여부는 권한 있는 담당자가 확정합니다.</span></p>` : html`<p class="muted">평가가 없습니다.</p>`}
          </section>`; })}`;
      } else if (tab === 'evidence') {
        body = a.evidence.required ? html`<section class="card"><div class="card__head"><h3 class="h3">증빙 요약</h3>${badge(ev.label, ev.tone)}</div>
          <ul class="plain">${a.evidence.items.map((it) => html`<li>${badge(st.ITEM_STATUS[it.status].label, st.ITEM_STATUS[it.status].tone)} ${it.label} ${it.files.length ? html`<span class="muted small">· ${it.files.length}개 버전</span>` : ''}</li>`)}</ul>
          <a class="btn btn--primary btn--sm" href="#/admin/evidence/${a.id}">증빙 대조 화면 열기</a></section>` : empty('증빙 제출 대상이 아닙니다.');
      } else if (tab === 'interview') {
        const iv = a.interview;
        body = iv ? html`<section class="card">${kv([['일시', fmtDT(iv.at)], ['도착 권장', fmtDT(iv.arriveBy)], ['장소', iv.place], ['응답', html`${badge(st.IV_RESP[iv.response ?? 'null'].label, st.IV_RESP[iv.response ?? 'null'].tone)} ${iv.responseNote}`], ['일정 버전', `v${iv.version}`]])}
          <ul class="log-list">${iv.history.map((h) => html`<li><time>${fmtShort(h.at)}</time> v${h.version} ${fmtShort(h.when)} — ${h.text}</li>`)}</ul>
          <a class="btn btn--secondary btn--sm" href="#/admin/interviews?job=${a.jobId}">면접 일정 관리로</a></section>` : empty('면접 일정이 없습니다.');
      } else {
        const notifs = st.S().notifications.filter((n) => n.appId === a.id);
        const logs = st.S().audit.filter((l) => l.target === a.id);
        body = html`<div class="grid-2">
          <section class="card"><h3 class="h3">알림 이력</h3><ul class="log-list">${notifs.map((n) => html`<li><time>${fmtShort(n.createdAt)}</time> ${n.template} ${badge(NSTAT[n.status].label, NSTAT[n.status].tone)}</li>`)}</ul></section>
          <section class="card"><h3 class="h3">변경·접근 이력</h3>${logs.length ? html`<ul class="log-list">${logs.map((l) => html`<li><time>${fmtShort(l.at)}</time> ${st.actorName(l.actor)} · ${l.action} ${l.detail ? html`<span class="muted">— ${l.detail}</span>` : ''}</li>`)}</ul>` : html`<p class="muted">기록 없음</p>`}</section>
        </div>
        <section class="card section-sm"><h3 class="h3">내부 메모 <span class="muted small">— 지원자에게 공개·발송되지 않습니다</span></h3>
          ${a.memos.length ? html`<ul class="log-list">${a.memos.map((m) => html`<li><time>${fmtShort(m.at)}</time> ${st.staff(m.by)?.name}: ${m.text}</li>`)}</ul>` : ''}
          <form data-form="memo" class="row gap"><input class="input" name="text" required maxlength="300" placeholder="메모 입력" aria-label="내부 메모"><button class="btn btn--secondary btn--sm">저장</button></form>
        </section>`;
      }
      return html`
        <nav class="crumbs"><a href="#/admin/applicants?job=${a.jobId}">지원자</a> › <span>${a.form.name}</span></nav>
        ${pageHead(html`${a.form.name} <span class="muted small mono">${a.receiptNo || ''}</span>`, `${st.job(a.jobId).title} · ${posName(a.positionId)} · ${a.submittedAt ? `${fmtDT(a.submittedAt)} 제출` : '미제출'}`)}
        ${per ? html`<aside class="persona-box"><strong>데모 페르소나 #${per.no}</strong> ${per.archetype} · 경력 ${per.years}년 · ${per.device} · 디지털 숙련도 ${per.literacy}<br><span>${per.summary}</span><br><span class="muted">니즈·우려: ${per.need}</span> ${tagChips(per.tags)}</aside>` : ''}
        <div class="tabs" role="tablist">${tabs.map(([k, l]) => html`<a role="tab" class="tabs__tab ${tab === k ? 'is-active' : ''}" aria-selected="${tab === k}" href="#/admin/applicants/${a.id}?tab=${k}">${l}</a>`)}</div>
        <div class="stack">${body}</div>`;
    });
  },
  forms: {
    memo: (f, e, { appId }) => { st.addMemo(appId, f.text.value.trim()); rerender(); },
    'reopen-review': (f, e, { appId }) => {
      if (!f.reason.value.trim()) { toast('재개방 사유를 입력해 주세요.', 'danger'); return; }
      st.reopenReview(f.dataset.stage, appId, f.dataset.ev, f.reason.value.trim()); closeModal(); toast('평가표를 재개방했습니다. 변경 이력이 남습니다.'); rerender();
    },
  },
  actions: {
    'reopen-review': (el) => openModal(html`<form data-form="reopen-review" data-stage="${el.dataset.stage}" data-ev="${el.dataset.ev}"><label class="field"><span class="field__label">재개방 사유 (필수, 이력에 남음)</span><input class="input" name="reason" required></label><div class="row gap end"><button type="button" class="btn btn--ghost" data-action="close-modal">취소</button><button class="btn btn--primary">재개방</button></div></form>`, { title: '제출된 평가 재개방' }),
  },
};

// ───────── 심사 ─────────
export const review = {
  title: '심사',
  render(p, q) {
    return guard(['evaluator', 'recruiter'], 'review', (me) => {
      if (me.role === 'recruiter') return reviewStatus(q);
      const stage = q.stage || 'final';
      const jobId = q.job || 'J26H2';
      const list = st.stageCandidates(jobId, stage).filter((a) => me.assigned.includes(a.positionId));
      const ss = st.S().stageState[jobId][stage];
      return html`
        ${pageHead('심사', `${me.name} 위원 · 배정 직무: ${me.assigned.filter((x) => POSITIONS[x].jobId === jobId).map(posName).join(', ') || '없음'}`, jobOptions(jobId))}
        <div class="tabs">${['screening', 'final'].map((k) => html`<a class="tabs__tab ${stage === k ? 'is-active' : ''}" href="#/admin/review?job=${jobId}&stage=${k}">${STAGES[k].label}</a>`)}</div>
        ${ss.state !== 'draft' ? html`<div class="alert alert--info">${STAGES[stage].label} 결과가 ${ss.state === 'published' ? '공개' : '확정'}되어 평가를 수정할 수 없습니다. 제출한 평가만 볼 수 있습니다.</div>` : ''}
        <p class="muted small">배정된 지원 건만 보입니다. 성명·연락처와 학교명은 가려지며, 다른 위원의 평가는 보이지 않습니다.</p>
        ${list.length ? html`<div class="table-wrap"><table class="table">
          <thead><tr><th scope="col">심사번호</th><th scope="col">직무</th><th scope="col">내 평가</th><th scope="col">합계</th><th scope="col"></th></tr></thead>
          <tbody>${list.map((a, i) => { const r = st.myReview(a, stage, me.id); return html`<tr>
            <td class="mono">${POSITIONS[a.positionId].code}-${String(i + 1).padStart(2, '0')}</td><td>${posName(a.positionId)}</td>
            <td>${r ? badge(r.status === 'submitted' ? '제출 완료' : '임시저장', r.status === 'submitted' ? 'success' : 'warn') : badge('미작성', 'neutral')}</td>
            <td>${r?.total ?? '-'}</td>
            <td><a class="btn btn--${!r || r.status !== 'submitted' ? 'primary' : 'ghost'} btn--sm" href="#/admin/review/${stage}/${a.id}?job=${jobId}&n=${i + 1}">${!r || r.status !== 'submitted' ? '평가하기' : '보기'}</a></td></tr>`; })}</tbody>
        </table></div>` : empty(stage === 'final' ? '면접 평가 대상이 없습니다.' : '배정된 지원 건이 없습니다.')}`;
    });
  },
  changes: pickJobChange,
};

function reviewStatus(q) {
  const jobId = q.job || 'J26H2';
  const stage = q.stage || 'screening';
  const list = st.stageCandidates(jobId, stage);
  const evals = STAFF.filter((s) => s.role === 'evaluator');
  const j = st.job(jobId);
  // 동점 표시
  const avgs = list.map((a) => ({ a, s: st.reviewStats(a, stage) }));
  const ties = new Set();
  for (const pid of j.positions) {
    const m = {};
    avgs.filter((x) => x.a.positionId === pid && x.s.avg != null).forEach((x) => { const k = x.s.avg.toFixed(2); (m[k] = m[k] || []).push(x.a.id); });
    Object.values(m).forEach((ids) => { if (ids.length > 1) ids.forEach((id) => ties.add(id)); });
  }
  return html`
    ${pageHead('심사 현황', `${j.title} · 담당자는 진행 현황만 보고 평가는 하지 않습니다`, jobOptions(jobId))}
    <div class="tabs">${['screening', 'final'].map((k) => html`<a class="tabs__tab ${stage === k ? 'is-active' : ''}" href="#/admin/review?job=${jobId}&stage=${k}">${STAGES[k].label}</a>`)}</div>
    <div class="table-wrap"><table class="table table--compact">
      <thead><tr><th scope="col">심사위원</th>${j.positions.map((pid) => html`<th scope="col">${POSITIONS[pid].code}</th>`)}<th scope="col">제출 / 배정</th></tr></thead>
      <tbody>${evals.map((ev) => { let need = 0; let done = 0; return html`<tr><th scope="row">${ev.name} <span class="muted small">${ev.title}</span></th>${j.positions.map((pid) => {
        if (!ev.assigned.includes(pid)) return html`<td class="muted">-</td>`;
        const ls = list.filter((a) => a.positionId === pid); const d = ls.filter((a) => st.myReview(a, stage, ev.id)?.status === 'submitted').length; need += ls.length; done += d;
        return html`<td>${d}/${ls.length}</td>`; })}<td><strong>${done}/${need}</strong></td></tr>`; })}</tbody>
    </table></div>
    <section class="card section-sm"><h2 class="h2">점수 순위 (참고)</h2>
      <p class="muted small">계산값은 결과안 작성을 돕는 참고 자료입니다. 누락 평가와 동점은 표시하며, 합격 여부는 담당자가 정하고 책임자가 확정합니다.</p>
      <div class="table-wrap"><table class="table table--compact"><thead><tr><th scope="col">직무</th><th scope="col">이름</th><th scope="col">평균</th><th scope="col">제출</th><th scope="col">표시</th></tr></thead><tbody>
      ${avgs.sort((x, y) => x.a.positionId.localeCompare(y.a.positionId) || (y.s.avg ?? -1) - (x.s.avg ?? -1)).map(({ a, s }) => html`<tr><td>${POSITIONS[a.positionId].code}</td><td><a href="#/admin/applicants/${a.id}?tab=review">${a.form.name}</a></td><td>${s.avg != null ? s.avg.toFixed(1) : '-'}</td><td>${s.done}/${s.needed}</td><td>${s.done < s.needed ? badge('누락 평가', 'warn') : ''} ${ties.has(a.id) ? badge('동점', 'info') : ''}</td></tr>`)}
      </tbody></table></div></section>`;
}

export const reviewForm = {
  title: '평가표',
  render({ stage, appId }, q) {
    return guard(['evaluator'], 'review', (me) => {
      const a = st.app(appId);
      if (!a || !me.assigned.includes(a.positionId)) return html`${pageHead('평가표')}<div class="alert alert--warn">배정되지 않은 지원 건입니다. 운영 버전에서는 서버가 이 요청을 차단합니다.</div>`;
      const r = st.myReview(a, stage, me.id);
      const locked = r?.status === 'submitted' || st.S().stageState[a.jobId][stage].state !== 'draft';
      const rub = RUBRIC[stage];
      return html`
        <nav class="crumbs"><a href="#/admin/review?job=${a.jobId}&stage=${stage}">심사</a> › <span>${POSITIONS[a.positionId].code}-${String(q.n || '').padStart(2, '0')}</span></nav>
        ${pageHead(`${STAGES[stage].label} 평가표`, `${posName(a.positionId)} · 블라인드 적용 (성명·연락처·학교명 가림)`)}
        <div class="review-layout">
          <div class="stack review-layout__doc">${applicationView(a, { blind: true, schoolMask: true })}
            ${stage === 'final' && a.interview ? html`<section class="card"><h3 class="h3">면접 정보</h3>${kv([['면접 일시', fmtDT(a.interview.at)], ['참석', a.interview.attendance === 'attended' ? '참석' : a.interview.attendance === 'absent' ? '불참' : '기록 전']])}</section>` : ''}
            <p class="muted small">원본 증빙 파일은 블라인드 항목이 포함될 수 있어 심사위원에게 공개하지 않습니다.</p>
          </div>
          <form class="card review-layout__form" data-form="review" data-stage="${stage}" novalidate>
            <h2 class="h3">평가</h2>
            ${rub.map((c) => html`<label class="field"><span class="field__label">${c.label} <span class="muted small">0~${c.max}점</span></span>
              <input type="number" class="input" name="${c.key}" min="0" max="${c.max}" step="1" value="${r?.scores?.[c.key] ?? ''}" ${locked ? 'disabled' : ''} required data-oninput="sum"></label>`)}
            <p class="review-total">합계 <strong data-total>${r?.total ?? 0}</strong> / ${rub.reduce((x, c) => x + c.max, 0)}점</p>
            <label class="field"><span class="field__label">의견</span><textarea class="input" name="comment" rows="4" ${locked ? 'disabled' : ''}>${r?.comment || ''}</textarea></label>
            ${locked ? html`<div class="alert alert--info">제출한 평가표입니다${r?.at ? ` (${fmtShort(r.at)})` : ''}. 수정이 필요하면 채용 담당자에게 재개방을 요청해 주세요.</div>`
              : html`<div class="row gap"><button type="button" class="btn btn--ghost" data-action="review-save">임시저장</button><button class="btn btn--primary">제출</button></div>`}
          </form>
        </div>`;
    });
  },
  inputs: {
    sum: () => { const f = document.querySelector('[data-form=review]'); let s = 0; f.querySelectorAll('input[type=number]').forEach((i) => { s += Number(i.value) || 0; }); f.querySelector('[data-total]').textContent = s; },
  },
  forms: {
    review: (f, e, { stage, appId }) => submitReview(f, stage, appId, true),
  },
  actions: {
    'review-save': (el, e, { stage, appId }) => submitReview(document.querySelector('[data-form=review]'), stage, appId, false),
  },
};

function submitReview(f, stage, appId, submit) {
  const me = st.currentStaff();
  const scores = {};
  for (const c of RUBRIC[stage]) {
    const v = f[c.key].value;
    if (submit && (v === '' || Number(v) < 0 || Number(v) > c.max)) { toast(`${c.label} 점수를 0~${c.max} 사이로 입력해 주세요.`, 'danger'); f[c.key].focus(); return; }
    scores[c.key] = v === '' ? null : Math.round(Number(v));
  }
  if (submit && !confirm('제출하면 수정할 수 없습니다. 제출할까요?')) return;
  const r = st.saveReview(stage, appId, me.id, scores, f.comment.value.trim(), submit);
  if (!r.ok) { toast(r.error, 'danger'); return; }
  toast(submit ? '평가를 제출했습니다.' : '임시저장했습니다.', 'success');
  if (submit) navigate(`/admin/review?job=${st.app(appId).jobId}&stage=${stage}`); else rerender();
}

// ───────── 증빙 검토 ─────────
export const evidenceList = {
  title: '증빙 검토',
  render(p, q) {
    return guard(['verifier', 'recruiter'], 'evidence', () => {
      const t = st.now();
      const list = st.appsOfJob('J26H2').filter((a) => a.evidence.required && a.status === 'submitted');
      const f = q.f || '';
      const rows = list.map((a) => ({ a, s: st.evidenceSummary(a, t) })).filter(({ s }) => !f || s.key === f || (f === 'none' && s.key === 'overdue'));
      rows.sort((x, y) => y.s.pending - x.s.pending || y.s.revision - x.s.revision);
      const cnt = (k) => list.filter((a) => { const kk = st.evidenceSummary(a, t).key; return k === 'none' ? kk === 'none' || kk === 'overdue' : kk === k; }).length;
      return html`
        ${pageHead('증빙 검토', `2026년 하반기 신규 직원 채용 · 제출 마감 ${fmtDT(st.job('J26H2').evidenceDeadline, { tz: true })}`, html`<button type="button" class="btn btn--secondary btn--sm" data-action="bulk-download">증빙 일괄 다운로드</button>`)}
        <div class="tabs">${[['', `전체 ${list.length}`], ['submitted', `확인 대기 ${cnt('submitted')}`], ['revision', `보완 요청 ${cnt('revision')}`], ['partial', `일부 제출 ${cnt('partial')}`], ['none', `미제출 ${cnt('none')}`], ['verified', `확인 완료 ${cnt('verified')}`]].map(([k, l]) => html`<a class="tabs__tab ${f === k ? 'is-active' : ''}" href="#/admin/evidence${k ? `?f=${k}` : ''}">${l}</a>`)}</div>
        <div class="table-wrap"><table class="table">
          <thead><tr><th scope="col">접수번호</th><th scope="col">이름</th><th scope="col">직무</th><th scope="col">필수 제출</th><th scope="col">확인 대기</th><th scope="col">보완</th><th scope="col">상태</th><th scope="col">최근 제출</th></tr></thead>
          <tbody>${rows.map(({ a, s }) => html`<tr>
            <td class="mono">${a.receiptNo}</td><td><a href="#/admin/evidence/${a.id}">${a.form.name}</a></td><td>${POSITIONS[a.positionId].code}</td>
            <td>${s.submitted}/${s.total}</td><td>${s.pending || '-'}</td><td>${s.revision || '-'}</td>
            <td>${badge(s.label, s.tone)}${s.late ? html` ${badge('지연 제출', 'danger')}` : ''}</td>
            <td>${a.evidence.finalizedAt ? fmtShort(a.evidence.finalizedAt) : '-'}</td></tr>`)}</tbody>
        </table></div>`;
    });
  },
  actions: {
    'bulk-download': () => {
      openModal(html`<p>권한을 다시 확인한 뒤 <strong>10분간 유효한</strong> 다운로드 경로를 만듭니다. 파일은 ‘지원분야_이름/서류유형_v버전.pdf’ 구조로 묶입니다.</p>
        <div class="alert alert--info">데모에는 실제 파일이 없어 다운로드 기록만 남깁니다.</div>
        <div class="row gap end"><button type="button" class="btn btn--ghost" data-action="close-modal">취소</button><button type="button" class="btn btn--primary" data-action="bulk-download-go">기록 남기고 진행</button></div>`, { title: '증빙 일괄 다운로드' });
    },
    'bulk-download-go': () => { st.logView('증빙 일괄 다운로드', 'J26H2', '권한 재확인 · 만료형 경로 10분 (데모)'); closeModal(); toast('다운로드 기록을 남겼습니다.'); },
  },
};

export const evidenceDetail = {
  title: '증빙 대조',
  render({ appId }) {
    return guard(['verifier', 'recruiter'], 'evidence', (me) => {
      const a = st.app(appId);
      if (!a?.evidence.required) return empty('증빙 대상이 아닙니다.');
      const t = st.now();
      const ev = st.evidenceSummary(a, t);
      const f = a.form;
      const groups = [['education', '학력'], ['career', '경력'], ['optional', '선택 서류']];
      return html`
        <nav class="crumbs"><a href="#/admin/evidence">증빙 검토</a> › <span>${f.name}</span></nav>
        ${pageHead(html`${f.name} <span class="muted small mono">${a.receiptNo}</span>`, html`${posName(a.positionId)} · ${badge(ev.label, ev.tone)} ${a.evidence.late ? badge('지연 제출 포함', 'danger') : ''} · 제출 확정 ${a.evidence.finalizedAt ? fmtDT(a.evidence.finalizedAt) : '없음'}`)}
        <div class="alert alert--info small">지원서 제출본(v${a.versions.length}, ${fmtShort(a.submittedAt)})의 기재 내용과 증빙 파일을 나란히 확인합니다. 불일치만으로 자동 탈락시키지 않으며, 사유와 후속 조치를 기록합니다.</div>
        ${groups.map(([g, label]) => { const items = a.evidence.items.filter((i) => i.group === g); if (!items.length) return ''; return html`<section class="section-sm"><h2 class="h2">${label}</h2><div class="stack">${items.map((it) => {
          const linked = g === 'education' ? f.education.find((e) => e.id === it.link) : g === 'career' ? f.career.find((c) => c.id === it.link) : f.certs.find((q) => q.id === it.link);
          const s = st.ITEM_STATUS[it.status];
          const latest = it.files[it.files.length - 1];
          return html`<article class="compare">
            <div class="compare__left"><h3 class="h4">지원서 기재 내용</h3><p>${linked ? (g === 'education' ? eduText(linked) : g === 'career' ? carText(linked) : certText(linked)) : '-'}</p>${g === 'career' && linked?.duties ? html`<p class="muted small">${linked.duties}</p>` : ''}</div>
            <div class="compare__right">
              <div class="compare__head"><h3 class="h4">${it.type} ${it.required ? html`<span class="req">필수</span>` : html`<span class="opt">선택</span>`}</h3>${badge(s.label, s.tone)}</div>
              ${latest ? html`<ul class="file-list">${it.files.slice().reverse().map((fl, i) => html`<li class="${i ? 'is-old' : ''}"><span class="file-list__name">${fl.name}</span> <span class="muted small">v${fl.version} · ${fl.merged ? `통합 PDF ${fl.pages || '?'}쪽 중 ${fl.range || '쪽 미지정'}` : `${fl.pages || '?'}쪽`} · ${fmtBytes(fl.size)} · 검사 통과 · ${fmtShort(fl.uploadedAt)}</span>${i === 0 ? html` <button type="button" class="link-btn" data-action="view-file" data-name="${fl.name}">열람</button>` : html` <span class="muted small">(이전 제출본)</span>`}</li>`)}</ul>` : html`<p class="muted">제출된 파일 없음${it.temp?.state === 'error' ? ' · 지원자 업로드 검사 실패(격리됨)' : ''}</p>`}
              ${it.substitute ? html`<p class="small"><strong>대체 서류</strong>: ${it.substitute.doc} — 사유: ${it.substitute.reason}</p>` : ''}
              ${it.difficulty ? html`<p class="small"><strong>제출 곤란 사유</strong>: ${it.difficulty}</p>` : ''}
              ${it.late ? html`<p class="small text-danger">마감 이후 제출 (${fmtShort(it.submittedAt)})</p>` : ''}
              ${it.review ? html`<p class="small muted">${{ verified: '확인 완료', revision: '보완 요청', substitute_ok: '대체 서류 확인', na: '해당 없음' }[it.review.result]} · ${st.staff(it.review.by)?.name || ''} · ${fmtShort(it.review.at)}${it.review.reason ? ` · ${it.review.reason}` : ''}${it.review.note ? ` · 메모: ${it.review.note}` : ''}</p>` : ''}
              ${it.prevReview && it.status === 'pending' ? html`<p class="small muted">이전 버전 검토: ${it.prevReview.reason || it.prevReview.result} (새 파일에는 승계되지 않음)</p>` : ''}
              <div class="row gap wrap">
                ${it.status === 'pending' ? html`
                  <button type="button" class="btn btn--primary btn--sm" data-action="ev-verify" data-item="${it.id}" data-kind="${it.substitute ? 'substitute_ok' : 'verified'}">${it.substitute ? '대체 서류 확인' : '확인 완료'}</button>
                  <button type="button" class="btn btn--secondary btn--sm" data-action="ev-revision" data-item="${it.id}">보완 요청</button>
                  ${!it.required ? html`<button type="button" class="btn btn--ghost btn--sm" data-action="ev-na" data-item="${it.id}">해당 없음</button>` : ''}` : ''}
                ${it.status === 'none' && !it.required ? html`<span class="muted small">선택 서류 미제출 — 정상 접수</span>` : ''}
                ${['verified', 'na'].includes(it.status) ? html`<button type="button" class="btn btn--ghost btn--sm" data-action="ev-reopen" data-item="${it.id}">재개방</button>` : ''}
              </div>
              ${it.history.length ? html`<details class="small"><summary>이력 ${it.history.length}건</summary><ul class="log-list">${it.history.map((h) => html`<li><time>${fmtShort(h.at)}</time> ${h.text}</li>`)}</ul></details>` : ''}
            </div>
          </article>`; })}</div></section>`; })}`;
    });
  },
  actions: {
    'view-file': (el, e, { appId }) => { st.logView('증빙 파일 열람', appId, el.dataset.name); toast('데모: 실제 파일은 없으며 열람 기록만 남깁니다.'); },
    'ev-verify': (el, e, { appId }) => openModal(html`<form data-form="ev-verify" data-item="${el.dataset.item}" data-kind="${el.dataset.kind}">
      <p>지원서 기재 내용과 파일을 대조해 이상이 없으면 확인 완료로 처리합니다. 확인 완료된 항목은 지원자가 교체할 수 없습니다.</p>
      <label class="field"><span class="field__label">메모 (선택 · 불일치가 있었다면 내용과 후속 조치)</span><input class="input" name="note" maxlength="200"></label>
      <div class="row gap end"><button type="button" class="btn btn--ghost" data-action="close-modal">취소</button><button class="btn btn--primary">확인 완료</button></div></form>`, { title: '증빙 확인' }),
    'ev-revision': (el) => openModal(html`<form data-form="ev-revision" data-item="${el.dataset.item}">
      <label class="field"><span class="field__label">보완 요청 사유 (지원자에게 그대로 표시됩니다)</span><textarea class="input" name="reason" rows="3" required placeholder="예: 발급일이 3개월을 넘었습니다. 최근 3개월 안에 발급한 서류로 다시 제출해 주세요."></textarea></label>
      <label class="field"><span class="field__label">보완 마감 (한국시간)</span><input type="datetime-local" class="input" name="due" required value="${toKstInput(new Date(st.now().getTime() + 24 * 3600 * 1000))}"></label>
      <p class="muted small">보완 마감은 최초 제출 마감과 별도로 관리합니다. 요청 확정 시 지원자에게 알림이 발송됩니다.</p>
      <div class="row gap end"><button type="button" class="btn btn--ghost" data-action="close-modal">취소</button><button class="btn btn--primary">보완 요청</button></div></form>`, { title: '보완 요청' }),
    'ev-na': (el, e, { appId }) => { st.reviewEvidence(appId, el.dataset.item, 'na'); toast('해당 없음으로 처리했습니다.'); rerender(); },
    'ev-reopen': (el) => openModal(html`<form data-form="ev-reopen" data-item="${el.dataset.item}"><label class="field"><span class="field__label">재개방 사유</span><input class="input" name="reason" required></label><div class="row gap end"><button type="button" class="btn btn--ghost" data-action="close-modal">취소</button><button class="btn btn--primary">재개방</button></div></form>`, { title: '확인 완료 항목 재개방' }),
  },
  forms: {
    'ev-verify': (f, e, { appId }) => { st.reviewEvidence(appId, f.dataset.item, f.dataset.kind, { note: f.note.value.trim() }); closeModal(); toast('확인 완료로 처리했습니다.', 'success'); rerender(); },
    'ev-revision': (f, e, { appId }) => {
      if (!f.reason.value.trim()) { toast('보완 요청 사유를 입력해 주세요.', 'danger'); return; }
      st.reviewEvidence(appId, f.dataset.item, 'revision', { reason: f.reason.value.trim(), due: fromKstInput(f.due.value) });
      closeModal(); toast('보완 요청을 보냈습니다.', 'success'); rerender();
    },
    'ev-reopen': (f, e, { appId }) => { st.reopenEvidence(appId, f.dataset.item, f.reason.value.trim()); closeModal(); toast('항목을 재개방했습니다.'); rerender(); },
  },
};

// ───────── 면접 일정 ─────────
export const interviews = {
  title: '면접 일정',
  render(p, q) {
    return guard(['recruiter', 'approver'], 'interviews', (me) => {
      const jobId = q.job || 'J26H2';
      const t = st.now();
      const list = st.appsOfJob(jobId).filter((a) => a.interview && a.status === 'submitted').sort((x, y) => x.interview.at.localeCompare(y.interview.at));
      const days = {};
      list.forEach((a) => { const d = fmtMD(a.interview.at); (days[d] = days[d] || []).push(a); });
      return html`
        ${pageHead('면접 일정', `개인별 일정 ${list.length}건 · 변경 시 버전과 알림이 함께 남습니다`, jobOptions(jobId))}
        ${Object.keys(days).length ? Object.entries(days).map(([d, as]) => html`<section class="section-sm"><h2 class="h2">${d}</h2><div class="table-wrap"><table class="table">
          <thead><tr><th scope="col">시간</th><th scope="col">이름</th><th scope="col">직무</th><th scope="col">응답</th><th scope="col">메모</th><th scope="col">증빙</th><th scope="col">참석</th><th scope="col"></th></tr></thead>
          <tbody>${as.map((a) => { const iv = a.interview; const r = st.IV_RESP[iv.response ?? 'null']; const ev = st.evidenceSummary(a, t); const started = t >= new Date(iv.at); return html`<tr>
            <td><strong>${fmtTime(iv.at)}</strong>${iv.version > 1 ? html` <span class="muted small">v${iv.version}</span>` : ''}</td>
            <td><a href="#/admin/applicants/${a.id}?tab=interview">${a.form.name}</a></td><td>${POSITIONS[a.positionId].code}</td>
            <td>${badge(r.label, r.tone)}${iv.response === 'ask' && iv.responseHandled ? html` <span class="muted small">확인함</span>` : ''}</td>
            <td class="small">${iv.responseNote || ''}</td>
            <td>${badge(ev.label, ev.tone)}</td>
            <td>${iv.attendance ? badge(iv.attendance === 'attended' ? '참석' : '불참', iv.attendance === 'attended' ? 'success' : 'neutral') : started && me.role === 'recruiter' ? html`<button type="button" class="link-btn" data-action="attend" data-id="${a.id}" data-v="attended">참석</button> · <button type="button" class="link-btn" data-action="attend" data-id="${a.id}" data-v="absent">불참</button>` : html`<span class="muted small">-</span>`}</td>
            <td>${me.role === 'recruiter' ? html`<button type="button" class="btn btn--ghost btn--sm" data-action="reschedule" data-id="${a.id}">일정 변경</button>${iv.response === 'ask' && !iv.responseHandled ? html` <button type="button" class="btn btn--secondary btn--sm" data-action="handle-ask" data-id="${a.id}">문의 확인</button>` : ''}` : ''}</td>
          </tr>`; })}</tbody></table></div></section>`) : empty('배정된 면접 일정이 없습니다.')}
        <p class="muted small">‘증빙 확인 완료’를 면접 참여 조건으로 둘지는 공고 정책으로 정합니다. 이 데모 공고는 증빙 검토와 면접을 병행합니다.</p>`;
    });
  },
  changes: pickJobChange,
  actions: {
    reschedule: (el) => {
      const a = st.app(el.dataset.id);
      openModal(html`<form data-form="reschedule" data-id="${a.id}">
        <p><strong>${a.form.name}</strong> · 현재 ${fmtDT(a.interview.at)} (v${a.interview.version})</p>
        ${a.interview.responseNote ? html`<div class="alert alert--info small">지원자 메모: ${a.interview.responseNote}</div>` : ''}
        <label class="field"><span class="field__label">새 일시 (한국시간)</span><input type="datetime-local" class="input" name="at" required value="${toKstInput(a.interview.at)}"></label>
        <label class="field"><span class="field__label">변경 사유 (지원자 안내에 표시)</span><input class="input" name="reason" required placeholder="예: 지원자 요청에 따라 오후로 조정"></label>
        <p class="muted small">변경하면 일정 버전이 올라가고 변경 안내 메일이 발송됩니다. 지원자 응답은 다시 받습니다.</p>
        <div class="row gap end"><button type="button" class="btn btn--ghost" data-action="close-modal">취소</button><button class="btn btn--primary">변경 확정</button></div></form>`, { title: '면접 일정 변경' });
    },
    'handle-ask': (el) => { st.handleAsk(el.dataset.id); toast('문의를 확인 처리했습니다. 일정은 자동으로 바뀌지 않습니다.'); rerender(); },
    attend: (el) => { st.markAttendance(el.dataset.id, el.dataset.v); rerender(); },
  },
  forms: {
    reschedule: (f) => {
      const iso = fromKstInput(f.at.value);
      if (!iso || !f.reason.value.trim()) { toast('새 일시와 사유를 입력해 주세요.', 'danger'); return; }
      const clash = st.appsOfJob(st.app(f.dataset.id).jobId).find((x) => x.id !== f.dataset.id && x.interview?.at === iso);
      if (clash && !confirm(`${clash.form.name} 지원자와 같은 시각입니다. 그래도 변경할까요?`)) return;
      st.rescheduleInterview(f.dataset.id, iso, f.reason.value.trim());
      closeModal(); toast('일정을 변경하고 안내를 발송했습니다.', 'success'); rerender();
    },
  },
};

// ───────── 결과 확정·발표 ─────────
const STAGE_STATE = { draft: ['작성 중', 'neutral'], confirmed: ['확정·비공개', 'warn'], published: ['공개', 'success'] };

export const publish = {
  title: '결과 확정·발표',
  render(p, q) {
    return guard(['recruiter', 'approver'], 'publish', (me) => {
      const jobId = q.job || 'J26H2';
      const j = st.job(jobId);
      const ss = st.S().stageState[jobId];
      const stage = q.stage || (jobId === 'J26H2' ? 'final' : 'screening');
      const s = ss[stage];
      const list = st.stageCandidates(jobId, stage);
      const counts = { pass: 0, fail: 0, reserve: 0, forfeit: 0, none: 0 };
      list.forEach((a) => { counts[a.stages[stage].internal?.result || 'none']++; });
      const canDraft = s.state === 'draft' && ['recruiter', 'approver'].includes(me.role);
      const isApprover = me.role === 'approver';
      return html`
        ${pageHead('결과 확정·발표', '작성 중 → 확정 → 공개 순서로 관리합니다. ‘합격’을 고른다고 바로 공개되거나 메일이 가지 않습니다.', jobOptions(jobId))}
        <div class="tabs">${['screening', 'final'].map((k) => { const [l, tn] = STAGE_STATE[ss[k].state]; return html`<a class="tabs__tab ${stage === k ? 'is-active' : ''}" href="#/admin/publish?job=${jobId}&stage=${k}">${STAGES[k].label} ${badge(l, tn)}</a>`; })}</div>
        <ol class="state-flow" aria-label="발표 단계">
          ${['draft', 'confirmed', 'published'].map((k, i) => html`<li class="${s.state === k ? 'is-current' : ['draft', 'confirmed', 'published'].indexOf(s.state) > i ? 'is-done' : ''}"><strong>${STAGE_STATE[k][0]}</strong><span>${k === 'draft' ? (s.draftAt ? `최근 수정 ${fmtShort(s.draftAt)}` : '결과안 작성') : k === 'confirmed' ? (s.confirmedAt ? `${st.staff(s.confirmedBy)?.name} · ${fmtShort(s.confirmedAt)}` : '책임자 확정') : (s.publishedAt ? `${st.staff(s.publishedBy)?.name} · ${fmtShort(s.publishedAt)}` : '발표 실행')}</span></li>`)}
        </ol>
        <div class="card">
          <div class="card__head">
            <p>대상 <strong>${list.length}명</strong> · 합격 ${counts.pass} · 예비 ${counts.reserve} · 불합격 ${counts.fail}${counts.forfeit ? ` · 참여 포기 ${counts.forfeit}` : ''}${counts.none ? html` · <span class="text-warn">미정 ${counts.none}</span>` : ''}</p>
            <div class="row gap wrap">
              ${canDraft && stage === 'final' ? html`<button type="button" class="btn btn--ghost btn--sm" data-action="suggest" data-stage="${stage}">점수 기준 결과안 채우기</button>` : ''}
              ${s.state === 'draft' && isApprover ? html`<button type="button" class="btn btn--primary btn--sm" data-action="confirm-stage" data-stage="${stage}">결과 확정</button>` : ''}
              ${s.state === 'confirmed' && isApprover ? html`<button type="button" class="btn btn--ghost btn--sm" data-action="unconfirm" data-stage="${stage}">확정 취소</button><button type="button" class="btn btn--primary btn--sm" data-action="preview-publish" data-stage="${stage}">발표 미리보기·실행</button>` : ''}
              ${!isApprover && s.state !== 'published' ? html`<span class="muted small">확정과 발표는 채용 책임자가 합니다.</span>` : ''}
            </div>
          </div>
          ${list.length ? html`<div class="table-wrap"><table class="table">
            <thead><tr><th scope="col">이름</th><th scope="col">직무</th>${stage === 'final' ? html`<th scope="col">면접 응답·참석</th><th scope="col">증빙</th>` : ''}<th scope="col">평균 (제출/필요)</th><th scope="col">결과안 (내부)</th><th scope="col">공개 결과</th>${s.state === 'published' && isApprover ? html`<th scope="col"></th>` : ''}</tr></thead>
            <tbody>${list.sort((x, y) => x.positionId.localeCompare(y.positionId) || (st.reviewStats(y, stage).avg ?? -1) - (st.reviewStats(x, stage).avg ?? -1)).map((a) => { const rs = st.reviewStats(a, stage); const cur = a.stages[stage].internal?.result || ''; return html`<tr>
              <td><a href="#/admin/applicants/${a.id}?tab=review">${a.form.name}</a></td><td>${POSITIONS[a.positionId].code}</td>
              ${stage === 'final' ? html`<td>${badge(st.IV_RESP[a.interview?.response ?? 'null'].label, st.IV_RESP[a.interview?.response ?? 'null'].tone)} ${a.interview?.attendance ? html`<span class="small">${a.interview.attendance === 'attended' ? '참석' : '불참'}</span>` : ''}</td><td>${badge(st.evidenceSummary(a).label, st.evidenceSummary(a).tone)}</td>` : ''}
              <td>${rs.avg != null ? rs.avg.toFixed(1) : '-'} <span class="muted small">(${rs.done}/${rs.needed})</span></td>
              <td>${canDraft ? html`<select class="input input--sm" data-onchange="set-result" data-id="${a.id}" data-stage="${stage}" aria-label="${a.form.name} 결과안"><option value="">미정</option>${Object.entries(st.RESULT).map(([k, v]) => html`<option value="${k}" ${cur === k ? 'selected' : ''}>${v.label}</option>`)}</select>` : resultBadge(a.stages[stage].internal)}</td>
              <td>${a.stages[stage].public ? html`${resultBadge(a.stages[stage].public)}${a.stages[stage].public.corrected ? html` <span class="muted small">정정</span>` : ''}` : html`<span class="muted small">비공개</span>`}</td>
              ${s.state === 'published' && isApprover ? html`<td><button type="button" class="link-btn" data-action="correct" data-id="${a.id}" data-stage="${stage}">정정</button></td>` : ''}
            </tr>`; })}</tbody></table></div>` : empty(stage === 'final' ? '서류 합격자가 없습니다.' : '최종 제출된 지원서가 없습니다.')}
        </div>
        ${s.corrections.length ? html`<section class="card section-sm"><h2 class="h3">정정 이력</h2><ul class="log-list">${s.corrections.map((c) => html`<li><time>${fmtShort(c.at)}</time> ${st.app(c.appId).form.name}: ${st.RESULT[c.from]?.label} → ${st.RESULT[c.to].label} · ${c.reason} (${st.staff(c.by)?.name})</li>`)}</ul></section>` : ''}
        <p class="muted small">공개용 결과와 내부 평가 메모는 분리되어 있어 안내문에 내부 메모가 섞이지 않습니다. 메일 발송이 실패해도 공개된 결과는 지원자 화면에서 확인됩니다.</p>`;
    });
  },
  changes: {
    ...pickJobChange,
    'set-result': (el, e, p, q) => {
      const r = st.setInternal(q.job || 'J26H2', el.dataset.stage, el.dataset.id, el.value || null);
      if (!r.ok) toast(r.error, 'danger');
    },
  },
  actions: {
    suggest: (el, e, p, q) => {
      const jobId = q.job || 'J26H2';
      const stage = el.dataset.stage;
      const list = st.stageCandidates(jobId, stage);
      const byPos = {};
      list.forEach((a) => (byPos[a.positionId] = byPos[a.positionId] || []).push(a));
      let blank = 0;
      for (const as of Object.values(byPos)) {
        const scored = as.filter((a) => a.interview?.response !== 'no' && a.interview?.attendance !== 'absent').map((a) => ({ a, s: st.reviewStats(a, stage) })).filter((x) => x.s.done > 0).sort((x, y) => y.s.avg - x.s.avg);
        as.forEach((a) => { if (a.interview?.response === 'no' || a.interview?.attendance === 'absent') st.setInternal(jobId, stage, a.id, 'forfeit'); });
        scored.forEach((x, i) => st.setInternal(jobId, stage, x.a.id, i === 0 ? 'pass' : i === 1 ? 'reserve' : 'fail'));
        blank += as.filter((a) => !a.stages[stage].internal).length;
      }
      toast(blank ? `점수가 있는 지원자만 채웠습니다. 면접 평가가 없는 ${blank}명은 미정으로 남았습니다. (심사위원 화면에서 면접 평가를 입력해 보세요)` : '결과안을 채웠습니다. 확인 후 책임자가 확정합니다.', blank ? 'warn' : 'success');
      rerender();
    },
    'confirm-stage': (el, e, p, q) => {
      const r = st.confirmStage(q.job || 'J26H2', el.dataset.stage);
      if (!r.ok) { toast(r.error, 'danger'); return; }
      toast('결과를 확정했습니다. 아직 지원자에게 공개되지 않았습니다.', 'success'); rerender();
    },
    unconfirm: (el, e, p, q) => { st.unconfirmStage(q.job || 'J26H2', el.dataset.stage); rerender(); },
    'preview-publish': (el, e, p, q) => {
      const jobId = q.job || 'J26H2';
      const stage = el.dataset.stage;
      const list = st.stageCandidates(jobId, stage);
      const c = {}; list.forEach((a) => { const k = a.stages[stage].internal.result; c[k] = (c[k] || 0) + 1; });
      const bounce = list.filter((a) => st.account(a.accountId).bounce).length;
      openModal(html`
        <p>발표를 실행하면 아래 대상자에게 결과가 공개되고 알림 발송 작업이 등록됩니다. 다른 공고·전형의 지원자 상태는 바뀌지 않습니다.</p>
        ${kv([['대상', `${list.length}명`], ['구분', Object.entries(c).map(([k, n]) => `${st.RESULT[k].label} ${n}`).join(' · ')], ['알림', `${list.length}건 (반송 예상 ${bounce}건)`], ['공개 시각', fmtDT(st.now(), { tz: true })]])}
        <div class="notice-box small"><strong>안내문 예시</strong><br>[아산나눔재단] ${STAGES[stage].label} 결과가 발표되었습니다. 채용 사이트에 로그인해 결과와 다음 안내를 확인해 주세요.<br><span class="muted">— 메일에는 결과 확인 링크만 넣고 결과·내부 평가는 첨부하지 않습니다.</span></div>
        <div class="row gap end"><button type="button" class="btn btn--ghost" data-action="close-modal">취소</button><button type="button" class="btn btn--primary" data-action="do-publish" data-stage="${stage}">발표 실행</button></div>`, { title: `${STAGES[stage].label} 발표 미리보기` });
    },
    'do-publish': (el, e, p, q) => {
      const r = st.publishStage(q.job || 'J26H2', el.dataset.stage);
      closeModal();
      if (!r.ok) { toast(r.error, 'danger'); return; }
      toast(`${r.count}명에게 공개했습니다. 알림 성공 ${r.sent} · 실패/반송 ${r.failed} (실패 건만 재발송할 수 있습니다)`, r.failed ? 'warn' : 'success');
      rerender();
    },
    correct: (el) => {
      const a = st.app(el.dataset.id);
      openModal(html`<form data-form="correct" data-id="${a.id}" data-stage="${el.dataset.stage}">
        <p><strong>${a.form.name}</strong> · 현재 공개 결과: ${st.RESULT[a.stages[el.dataset.stage].public.result].label}</p>
        <label class="field"><span class="field__label">정정 결과</span><select class="input" name="result">${Object.entries(st.RESULT).map(([k, v]) => html`<option value="${k}">${v.label}</option>`)}</select></label>
        <label class="field"><span class="field__label">정정 사유 (지원자 안내에 표시)</span><input class="input" name="reason" required></label>
        <p class="muted small">기존 이력은 덮어쓰지 않고 정정 기록과 정정 안내 알림을 남깁니다.</p>
        <div class="row gap end"><button type="button" class="btn btn--ghost" data-action="close-modal">취소</button><button class="btn btn--danger">정정 실행</button></div></form>`, { title: '발표 결과 정정' });
    },
  },
  forms: {
    correct: (f, e, p, q) => {
      if (!f.reason.value.trim()) { toast('정정 사유를 입력해 주세요.', 'danger'); return; }
      st.correctResult(q.job || 'J26H2', f.dataset.stage, f.dataset.id, f.result.value, f.reason.value.trim());
      closeModal(); toast('정정했습니다.', 'success'); rerender();
    },
  },
};

// ───────── 알림 ─────────
const NSTAT = {
  queued: { label: '발송 대기', tone: 'neutral' },
  sent: { label: '전송 성공', tone: 'success' },
  failed: { label: '실패', tone: 'danger' },
  bounced: { label: '반송', tone: 'danger' },
  skipped: { label: '발송 제외', tone: 'neutral' },
};

function jobAlertPanel(me) {
  const subs = st.alertSubs();
  const sends = st.alertSends();
  const openJobs = JOBS.filter((j) => ['open', 'upcoming'].includes(st.jobStatus(j).key));
  return html`<section class="section-sm">
    <h2 class="h2">채용 공고 알림 구독</h2>
    <p class="muted small">채용 홈의 ‘채용 공고 알림 받기’로 신청한 사람입니다. 관심 직군이 겹치는 공고만, 공고당 한 번씩 보냅니다. 수신 거부 시 목록에서 바로 빠집니다.</p>
    ${me.role === 'recruiter' ? html`<div class="row gap wrap" style="margin-bottom:12px">${openJobs.map((j) => html`<button type="button" class="btn btn--secondary btn--sm" data-action="send-job-alert" data-id="${j.id}" ${subs.length ? '' : 'disabled'}>‘${j.title}’ 알림 발송</button>`)}</div>` : ''}
    ${subs.length ? html`<div class="table-wrap"><table class="table table--compact">
      <thead><tr><th scope="col">신청</th><th scope="col">이메일</th><th scope="col">관심 직군</th><th scope="col">받은 공고 알림</th></tr></thead>
      <tbody>${subs.map((x) => html`<tr><td>${fmtShort(x.createdAt)}</td><td>${maskEmail(x.email)}</td><td>${x.categories.join(', ')}</td><td>${sends.filter((s) => s.subId === x.id).length}건</td></tr>`)}</tbody>
    </table></div>` : empty('아직 신청한 사람이 없습니다. 채용 홈 하단의 알림 신청 양식으로 시험해 보세요.')}
  </section>`;
}

export const notifications = {
  title: '알림',
  render(p, q) {
    return guard(['recruiter', 'approver'], 'notifications', (me) => {
      const f = q.f || '';
      let list = st.S().notifications.slice().reverse();
      if (f === 'problem') list = list.filter((n) => ['bounced', 'failed'].includes(n.status));
      else if (f) list = list.filter((n) => n.status === f);
      const all = st.S().notifications;
      const c = (k) => (k === 'problem' ? all.filter((n) => ['bounced', 'failed'].includes(n.status)).length : all.filter((n) => n.status === k).length);
      return html`
        ${pageHead('알림', '전송 성공은 열람을 뜻하지 않습니다. 결과 확인은 웹사이트가 기준입니다.', me.role === 'recruiter' ? html`<button type="button" class="btn btn--primary btn--sm" data-action="run-reminders" ${c('queued') ? '' : 'disabled'}>예약 안내 지금 실행 (${c('queued')})</button>` : '')}
        <div class="tabs">${[['', `전체 ${all.length}`], ['problem', `실패·반송 ${c('problem')}`], ['queued', `발송 대기 ${c('queued')}`], ['sent', `성공 ${c('sent')}`], ['skipped', `제외 ${c('skipped')}`]].map(([k, l]) => html`<a class="tabs__tab ${f === k ? 'is-active' : ''}" href="#/admin/notifications${k ? `?f=${k}` : ''}">${l}</a>`)}</div>
        <div class="table-wrap"><table class="table table--compact">
          <thead><tr><th scope="col">등록</th><th scope="col">수신자</th><th scope="col">안내</th><th scope="col">상태</th><th scope="col">시도</th><th scope="col">최근 시도</th><th scope="col"></th></tr></thead>
          <tbody>${list.slice(0, 200).map((n) => { const a = st.app(n.appId); const acc = st.account(n.accountId); const s = NSTAT[n.status]; return html`<tr>
            <td>${fmtShort(n.createdAt)}</td>
            <td><a href="#/admin/applicants/${a.id}?tab=log">${a.form.name}</a> <span class="muted small">${maskEmail(acc.email)}</span></td>
            <td>${n.template}</td>
            <td>${badge(s.label, s.tone)}${n.error ? html`<br><span class="muted small">${n.error}</span>` : ''}</td>
            <td>${n.attempts}</td><td>${n.lastAt ? fmtShort(n.lastAt) : '-'}</td>
            <td>${me.role === 'recruiter' && ['bounced', 'failed'].includes(n.status) ? html`<button type="button" class="link-btn" data-action="fix-email" data-acc="${acc.id}">연락처 수정</button> · <button type="button" class="link-btn" data-action="resend" data-id="${n.id}">재발송</button>` : ''}</td>
          </tr>`; })}</tbody>
        </table></div>
        ${list.length > 200 ? html`<p class="muted small">최근 200건만 표시합니다.</p>` : ''}
        ${jobAlertPanel(me)}`;
    });
  },
  actions: {
    resend: (el) => { const r = st.resendNotification(el.dataset.id); toast(r.ok ? '재발송했습니다.' : r.error || '다시 반송되었습니다. 연락처를 확인해 주세요.', r.ok ? 'success' : 'danger'); rerender(); },
    'fix-email': (el) => {
      const acc = st.account(el.dataset.acc);
      openModal(html`<form data-form="fix-email" data-acc="${acc.id}"><p>${acc.name} · 현재 ${acc.email}</p>
        <label class="field"><span class="field__label">확인된 이메일 (본인 확인 후 수정)</span><input type="email" class="input" name="email" required value="${acc.email}"></label>
        <div class="row gap end"><button type="button" class="btn btn--ghost" data-action="close-modal">취소</button><button class="btn btn--primary">수정</button></div></form>`, { title: '연락처 수정' });
    },
    'send-job-alert': (el) => { const r = st.sendJobAlert(el.dataset.id); toast(`채용 알림 발송 ${r.sent}건${r.skipped ? ` · 이미 받은 ${r.skipped}명 제외` : ''} (데모: 실제 메일 없음)`, 'success'); rerender(); },
    'run-reminders': () => { const r = st.runReminders(); toast(`발송 직전 제출 상태를 다시 확인했습니다. 발송 ${r.sent}건 · 제외 ${r.skipped}건`, 'success'); rerender(); },
  },
  forms: {
    'fix-email': (f) => { st.fixEmail(f.dataset.acc, f.email.value); closeModal(); toast('연락처를 수정했습니다. 이제 재발송할 수 있습니다.'); rerender(); },
  },
};

// ───────── 감사 기록 ─────────
export const audit = {
  title: '감사 기록',
  render(p, q) {
    return guard(['recruiter', 'approver'], 'audit', () => {
      const k = q.q || '';
      const list = st.S().audit.slice().reverse().filter((l) => !k || `${l.action} ${st.actorName(l.actor)} ${l.detail} ${l.target}`.includes(k));
      return html`
        ${pageHead('감사 기록', '평가 수정, 결과 확정·발표, 열람·다운로드, 연락처 변경 등의 행위자·시각·대상·사유를 남깁니다.')}
        <form class="filters" data-form="audit-filter"><input class="input input--sm" type="search" name="q" value="${k}" placeholder="행위·담당자·대상 검색" aria-label="감사 기록 검색"><button class="btn btn--primary btn--sm">검색</button></form>
        <div class="table-wrap"><table class="table table--compact">
          <thead><tr><th scope="col">시각</th><th scope="col">행위자</th><th scope="col">행위</th><th scope="col">대상</th><th scope="col">내용</th></tr></thead>
          <tbody>${list.slice(0, 300).map((l) => html`<tr><td>${fmtShort(l.at)}</td><td>${st.actorName(l.actor)}</td><td>${l.action}</td><td class="mono small">${l.target}</td><td class="small">${l.detail}</td></tr>`)}</tbody>
        </table></div>
        <p class="muted small">운영 로그에는 지원서 본문, 증빙 내용, 인증번호, 다운로드 토큰을 남기지 않습니다.</p>`;
    });
  },
  forms: { 'audit-filter': (f) => navigate(`/admin/audit${f.q.value ? `?q=${encodeURIComponent(f.q.value)}` : ''}`) },
};

// ───────── 가상 지원자 75 ─────────
export const personas = {
  title: '가상 지원자 75',
  render(p, q) {
    return guard(['recruiter', 'approver'], 'personas', () => {
      const accs = st.S().accounts.filter((a) => a.persona);
      return html`
        ${pageHead('가상 지원자 페르소나 75명', '모든 이름·연락처·학교·기관은 지어낸 값입니다. 각 페르소나는 검수 시나리오(#번호)를 재현하도록 설계했습니다.', html`<button type="button" class="btn btn--secondary btn--sm" data-action="persona-csv">CSV 내려받기</button>`)}
        <input type="search" class="input" placeholder="이름·직무·유형·상황 검색" data-oninput="filter-rows" aria-label="페르소나 검색">
        <div class="table-wrap section-sm"><table class="table table--compact" id="persona-table">
          <thead><tr><th scope="col">#</th><th scope="col">이름</th><th scope="col">지원분야</th><th scope="col">유형 · 경력</th><th scope="col">기기 · 숙련도</th><th scope="col">배경</th><th scope="col">니즈·우려</th><th scope="col">시나리오</th><th scope="col"></th></tr></thead>
          <tbody>${accs.map((acc) => { const per = acc.persona; const a = st.appsOfAccount(acc.id).find((x) => !x.past); return html`<tr data-search="${acc.name} ${posName(a?.positionId)} ${per.archetype} ${per.summary} ${per.need} ${per.tags.map((t) => t.label).join(' ')}">
            <td>${per.no}</td><td><strong>${acc.name}</strong><br><span class="muted small">${acc.email}</span></td><td>${POSITIONS[a?.positionId]?.code || '-'}</td>
            <td>${per.archetype}<br><span class="muted small">경력 ${per.years}년</span></td><td>${per.device} · ${per.literacy}</td>
            <td class="small">${per.summary}</td><td class="small">${per.need}</td><td>${tagChips(per.tags)}</td>
            <td><button type="button" class="btn btn--ghost btn--sm" data-action="view-as" data-acc="${acc.id}" data-app="${a?.id}">지원자 화면</button></td></tr>`; })}</tbody>
        </table></div>`;
    });
  },
  inputs: {
    'filter-rows': (el) => { const v = el.value.trim(); for (const tr of document.querySelectorAll('#persona-table tbody tr')) tr.hidden = v && !tr.dataset.search.includes(v); },
  },
  actions: {
    'view-as': (el) => { st.loginAs(el.dataset.acc); navigate(el.dataset.app ? `/me/${el.dataset.app}` : '/me'); },
    'persona-csv': () => {
      const head = ['번호', '이름', '이메일(가상)', '연락처(가상)', '지원분야', '유형', '경력연수', '주 사용기기', '디지털 숙련도', '배경', '니즈·우려', '서류 결과', '증빙 상태', '면접 응답', '시나리오 태그', '검수 시나리오 번호', '학력', '경력'];
      const rows = st.S().accounts.filter((x) => x.persona).map((acc) => {
        const per = acc.persona; const a = st.appsOfAccount(acc.id).find((x) => !x.past);
        return [per.no, acc.name, acc.email, acc.phone, posName(a?.positionId), per.archetype, per.years, per.device, per.literacy, per.summary, per.need,
          { pass: '합격', fail: '불합격', reserve: '예비합격', withdrawn: '지원 철회', draft: '임시저장(미제출)' }[per.outcome], per.evidence || '', per.interview || '',
          per.tags.map((t) => t.label).join(' / '), [...new Set(per.tags.flatMap((t) => t.sc))].sort((x, y) => x - y).map((n) => `#${n}`).join(' '),
          a.form.education.map(eduText).join(' | '), a.form.career.map(carText).join(' | ')];
      });
      download('가상지원자_페르소나_75명.csv', csv([head, ...rows]));
    },
  },
};

export { NSTAT };
