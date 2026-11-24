// 데모 상태 저장소
// ⚠ 시제품 전용: 모든 데이터는 이 브라우저의 localStorage에만 저장된다.
//    운영 버전에서는 서버·DB·비공개 파일 저장소와 서버 측 권한 검사로 대체해야 한다(기획서 11·12장).

import { DATA_VERSION, DEMO_CLOCK_DEFAULT, JOBS, POSITIONS, STAFF, STAGES, kst, UPLOAD_POLICY, CONSENT_VERSION } from './data/seed.js';
import { buildDataset } from './data/personas.js';

const KEY = 'anf-recruit-demo';
let state = null;

function initialState() {
  const ds = buildDataset();
  return {
    version: DATA_VERSION,
    clock: { base: DEMO_CLOCK_DEFAULT, realAt: Date.now() },
    session: null, // { accountId }
    staffSession: null, // { staffId }
    pendingCode: null,
    flags: { autosaveFail: false },
    accounts: ds.accounts,
    applications: ds.applications,
    notifications: ds.notifications,
    audit: ds.audit,
    stageState: {
      J26H2: {
        screening: { state: 'published', draftAt: kst(2026, 11, 20, 16, 30), confirmedAt: kst(2026, 11, 20, 17, 10), confirmedBy: 'S2', publishedAt: kst(2026, 11, 21, 10, 0), publishedBy: 'S2', corrections: [] },
        final: { state: 'draft', corrections: [] },
      },
      J26MARU: {
        screening: { state: 'draft', corrections: [] },
        final: { state: 'draft', corrections: [] },
      },
    },
    seq: ds.seq,
  };
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (s && s.version === DATA_VERSION) { state = s; return; }
    }
  } catch { /* 저장소 접근 불가 시 새로 생성 */ }
  state = initialState();
  save();
}

export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* 사파리 사생활 보호 모드 등 */ }
}

export function resetAll() {
  state = initialState();
  save();
}

export const S = () => state;

// ───────── 시계 ─────────
export function now() {
  return new Date(new Date(state.clock.base).getTime() + (Date.now() - state.clock.realAt));
}
export const nowISO = () => now().toISOString();
export function setClock(iso) {
  state.clock = { base: iso, realAt: Date.now() };
  save();
}

// ───────── 조회 ─────────
export const job = (id) => JOBS.find((j) => j.id === id);
export const position = (id) => POSITIONS[id];
export const staff = (id) => STAFF.find((s) => s.id === id);
export const account = (id) => state.accounts.find((a) => a.id === id);
export const app = (id) => state.applications.find((a) => a.id === id);
export const appsOfAccount = (accId) => state.applications.filter((a) => a.accountId === accId);
export const appsOfJob = (jobId) => state.applications.filter((a) => a.jobId === jobId);
export const currentAccount = () => (state.session ? account(state.session.accountId) : null);
export const currentStaff = () => (state.staffSession ? staff(state.staffSession.staffId) : null);

export function jobStatus(j, at = now()) {
  if (j.closed) return { key: 'ended', label: '채용 종료', tone: 'neutral' };
  const t = new Date(at);
  if (t < new Date(j.apply.from)) return { key: 'upcoming', label: '접수 예정', tone: 'info' };
  if (!j.apply.to || t <= new Date(j.apply.to)) return { key: 'open', label: '접수 중', tone: 'success' };
  return { key: 'closed', label: '접수 마감', tone: 'neutral' };
}

export function actorName(actor) {
  if (!actor) return '';
  if (actor.startsWith('U:')) { const a = account(actor.slice(2)); return a ? `지원자 ${a.name}` : '지원자'; }
  if (actor === 'system') return '시스템';
  const s = staff(actor);
  return s ? `${s.name} (${s.title})` : actor;
}

// ───────── 감사·알림 ─────────
function log(actor, action, target, detail = '') {
  state.audit.push({ id: `L${String(state.seq.audit++).padStart(4, '0')}`, at: nowISO(), actor, action, target, detail });
}
export function logView(action, target, detail) { log(state.staffSession?.staffId || 'system', action, target, detail); save(); }

function notify(appId, template, event, dedupeKey) {
  const a = app(appId);
  const acc = account(a.accountId);
  const key = dedupeKey || `${event}:${appId}`;
  if (state.notifications.some((n) => n.dedupeKey === key && n.status !== 'failed')) return null; // 같은 사건·수신자 중복 발송 방지
  const n = {
    id: `N${String(state.seq.notif++).padStart(4, '0')}`, appId, accountId: acc.id, template, event, dedupeKey: key,
    createdAt: nowISO(), lastAt: nowISO(), attempts: 1,
    status: acc.bounce ? 'bounced' : 'sent', error: acc.bounce ? '수신 주소 확인 필요' : null,
  };
  state.notifications.push(n);
  return n;
}

// ───────── 지원자 인증 (데모: 실제 메일 발송 없음) ─────────
export function requestCode(email) {
  const e = String(email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return { ok: false, error: '이메일 형식을 확인해 주세요.' };
  const code = String(Math.floor(100000 + Math.random() * 900000));
  state.pendingCode = { email: e, code, expiresAt: new Date(now().getTime() + 10 * 60000).toISOString(), attempts: 0 };
  save();
  return { ok: true, code, email: e };
}

export function verifyCode(email, code) {
  const p = state.pendingCode;
  const e = String(email || '').trim().toLowerCase();
  if (!p || p.email !== e) return { ok: false, error: '인증번호를 먼저 요청해 주세요.' };
  if (now() > new Date(p.expiresAt)) { state.pendingCode = null; save(); return { ok: false, error: '인증번호가 만료되었습니다. 다시 요청해 주세요.' }; }
  if (p.attempts >= 5) { state.pendingCode = null; save(); return { ok: false, error: '시도 횟수를 넘었습니다. 인증번호를 다시 요청해 주세요.' }; }
  if (String(code).trim() !== p.code) { p.attempts++; save(); return { ok: false, error: `인증번호가 일치하지 않습니다. (${p.attempts}/5)` }; }
  state.pendingCode = null; // 재사용 방지
  let acc = state.accounts.find((a) => a.email === e);
  if (!acc) {
    acc = { id: `U${String(state.accounts.length + 1).padStart(3, '0')}N`, email: e, name: '', phone: '', createdAt: nowISO(), verifiedAt: nowISO(), bounce: false, persona: null };
    state.accounts.push(acc);
  }
  state.session = { accountId: acc.id };
  save();
  return { ok: true, account: acc };
}

export function loginAs(accountId) { state.session = { accountId }; save(); }
export function logout() { state.session = null; save(); }
export function staffLogin(staffId) { state.staffSession = { staffId }; log(staffId, '관리자 로그인', '-', '데모 로그인 (운영 시 추가 인증 필요)'); save(); }
export function staffLogout() { state.staffSession = null; save(); }
export function setFlag(k, v) { state.flags[k] = v; save(); }

// ───────── 지원서 ─────────
export function draftFor(accountId, jobId) {
  return state.applications.find((a) => a.accountId === accountId && a.jobId === jobId && !a.past);
}

export function saveDraft(accountId, jobId, form) {
  if (state.flags.autosaveFail) return { ok: false, error: '서버에 저장하지 못했습니다. (데모: 저장 실패 시뮬레이션)' };
  let a = draftFor(accountId, jobId);
  if (!a) {
    const no = state.applications.filter((x) => !x.past).length + 1;
    a = {
      id: `A${String(no).padStart(3, '0')}N`, jobId, positionId: form.positionId || null, accountId,
      status: 'draft', receiptNo: null, submittedAt: null, savedAt: null, versions: [], form,
      stages: { screening: { internal: null, public: null }, final: { internal: null, public: null } },
      reviews: { screening: [], final: [] },
      evidence: { required: false, items: [], finalizedAt: null, deadline: null, late: false },
      interview: null, memos: [], withdrawnAt: null, lateAttemptAt: null,
    };
    state.applications.push(a);
  }
  if (a.status === 'submitted') a.pendingForm = form; // 재제출용 수정본 (제출본은 고정)
  else { a.form = form; a.positionId = form.positionId || a.positionId; }
  a.savedAt = nowISO();
  const acc = account(accountId);
  if (acc && form.name) { acc.name = acc.name || form.name; }
  save();
  return { ok: true, savedAt: a.savedAt, app: a };
}

export function validateForm(j, form) {
  const errors = {};
  if (!form.positionId) errors.positionId = '지원분야를 선택해 주세요.';
  if (!form.name?.trim()) errors.name = '성명을 입력해 주세요.';
  if (!/^01[016789]-?\d{3,4}-?\d{4}$/.test(form.phone || '')) errors.phone = '휴대전화 번호를 010-0000-0000 형식으로 입력해 주세요.';
  if (!form.education?.length) errors.education = '학력을 1개 이상 입력해 주세요.';
  (form.education || []).forEach((e, i) => { if (!e.school?.trim() || !e.major?.trim()) errors[`edu-${i}`] = `학력 ${i + 1}의 학교명과 전공을 입력해 주세요.`; });
  (form.career || []).forEach((c, i) => { if (!c.org?.trim() || !c.from) errors[`car-${i}`] = `경력 ${i + 1}의 기관명과 시작 시점을 입력해 주세요.`; });
  for (const q of j.questions) {
    const v = form.essays?.[q.key] || '';
    if (!v.trim()) errors[`essay-${q.key}`] = `${q.label}을(를) 작성해 주세요.`;
    else if (v.length > q.limit) errors[`essay-${q.key}`] = `${q.label}이(가) ${q.limit}자를 넘었습니다. (${v.length}자)`;
  }
  if (!form.consent?.agreed) errors.consent = '채용 진행을 위한 개인정보 안내에 동의해야 제출할 수 있습니다.';
  return errors;
}

export function submitApplication(appId) {
  const a = app(appId);
  const j = job(a.jobId);
  const t = now();
  if (a.status === 'submitted' && !a.pendingForm) return { ok: true, already: true, app: a }; // 중복 클릭·재시도
  if (j.apply.to && t > new Date(j.apply.to)) {
    a.lateAttemptAt = t.toISOString();
    log(`U:${a.accountId}`, '마감 후 제출 시도', a.id, `서버 접수 시각 ${t.toISOString()}`);
    save();
    return { ok: false, error: 'deadline' };
  }
  const form = a.pendingForm || a.form;
  const errors = validateForm(j, form);
  if (Object.keys(errors).length) return { ok: false, error: 'invalid', errors };
  form.consent = { ...form.consent, version: CONSENT_VERSION, at: t.toISOString() };
  a.form = form;
  delete a.pendingForm;
  a.positionId = form.positionId;
  if (!a.receiptNo) {
    const prefix = j.id === 'J26MARU' ? '2026MR' : '2026H2';
    const n = state.applications.filter((x) => x.jobId === j.id && x.receiptNo).length + 1;
    a.receiptNo = `${prefix}-${String(n).padStart(4, '0')}`;
  }
  a.status = 'submitted';
  a.submittedAt = t.toISOString();
  a.versions.push({ no: a.versions.length + 1, at: a.submittedAt });
  const acc = account(a.accountId);
  if (acc) { acc.name = form.name; acc.phone = form.phone; }
  notify(a.id, a.versions.length > 1 ? '재제출 접수 확인' : '접수 확인', 'submit', `submit:${a.id}:v${a.versions.length}`);
  log(`U:${a.accountId}`, a.versions.length > 1 ? '지원서 재제출' : '지원서 최종 제출', a.id, `접수번호 ${a.receiptNo} · v${a.versions.length}`);
  save();
  return { ok: true, app: a };
}

export function startEdit(appId) {
  const a = app(appId);
  a.pendingForm = JSON.parse(JSON.stringify(a.form));
  save();
}
export function cancelEdit(appId) { const a = app(appId); delete a.pendingForm; save(); }

export function withdraw(appId, reason) {
  const a = app(appId);
  a.status = 'withdrawn';
  a.withdrawnAt = nowISO();
  a.withdrawReason = reason || '사유 미기재';
  log(`U:${a.accountId}`, '지원 철회', a.id, a.withdrawReason);
  save();
}

// ───────── 증빙 ─────────
export function fileCheck(file) {
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  if (!UPLOAD_POLICY.exts.includes(ext)) return { ok: false, error: 'type', message: 'PDF, JPG, PNG 파일만 올릴 수 있습니다.' };
  if (file.size > UPLOAD_POLICY.maxFile) return { ok: false, error: 'size', message: `파일 하나는 ${UPLOAD_POLICY.maxFile / 1024 / 1024}MB 이하만 올릴 수 있습니다.` };
  if (/암호|encrypt|password|비번/i.test(file.name)) return { ok: false, error: 'encrypted', message: '비밀번호가 걸린 PDF는 열 수 없습니다. 비밀번호를 해제한 파일로 다시 올려 주세요.' };
  if (/손상|corrupt|broken/i.test(file.name)) return { ok: false, error: 'corrupt', message: '파일이 손상되어 열 수 없습니다. 원본을 다시 저장해 올려 주세요.' };
  if (file.size === 0) return { ok: false, error: 'corrupt', message: '빈 파일입니다.' };
  return { ok: true };
}

export function totalEvidenceBytes(a) {
  const seen = new Set();
  let n = 0;
  for (const it of a.evidence.items) {
    for (const f of it.files) if (!seen.has(f.id)) { seen.add(f.id); n += f.size || 0; }
    if (it.temp?.state === 'uploaded' && !seen.has(it.temp.fileId)) { seen.add(it.temp.fileId); n += it.temp.size || 0; }
  }
  return n;
}

export function setTemp(appId, itemIds, temp) {
  const a = app(appId);
  for (const id of itemIds) {
    const it = a.evidence.items.find((x) => x.id === id);
    if (!it || it.status === 'verified') continue; // 확인 완료 항목은 교체 불가
    it.temp = temp ? { ...temp } : null;
    if (temp?.state === 'error') it.history.push({ at: nowISO(), text: `업로드 파일 검사 실패: ${temp.message}` });
  }
  save();
}

export function setSubstitute(appId, itemId, sub) {
  const it = app(appId).evidence.items.find((x) => x.id === itemId);
  it.pendingSubstitute = sub;
  save();
}

export function setDifficulty(appId, itemId, reason) {
  const it = app(appId).evidence.items.find((x) => x.id === itemId);
  it.difficulty = reason || null;
  save();
}

export function evidenceMissing(a) {
  return a.evidence.items.filter((it) => it.required && !['pending', 'verified', 'na'].includes(it.status) && it.temp?.state !== 'uploaded' && !it.difficulty);
}

export function finalizeEvidence(appId, { allowPartial = false } = {}) {
  const a = app(appId);
  const t = now();
  const staged = a.evidence.items.filter((it) => it.temp?.state === 'uploaded');
  const diff = a.evidence.items.filter((it) => it.difficulty && !['pending', 'verified'].includes(it.status));
  if (!staged.length && !diff.length) return { ok: false, error: 'nothing' };
  const missing = evidenceMissing(a);
  if (missing.length && !allowPartial) return { ok: false, error: 'missing', missing };
  const late = a.evidence.deadline && t > new Date(a.evidence.deadline);
  for (const it of staged) {
    const v = it.files.length ? Math.max(...it.files.map((f) => f.version || 1)) + 1 : 1;
    const f = { id: it.temp.fileId, name: it.temp.name, size: it.temp.size, pages: it.temp.pages || 1, version: v, uploadedAt: it.temp.at, scan: 'passed', range: it.temp.range || null, merged: !!it.temp.merged };
    it.files.push(f);
    it.prevReview = it.review || it.prevReview || null;
    it.review = null; // 새 파일에는 이전 확인 결과를 승계하지 않음
    it.status = 'pending';
    it.submittedAt = t.toISOString();
    it.late = !!late;
    if (it.pendingSubstitute) { it.substitute = it.pendingSubstitute; it.pendingSubstitute = null; }
    it.history.push({ at: t.toISOString(), text: `${f.name}${f.range ? ` (${f.range})` : ''} 제출 확정 (v${v})${late ? ' · 지연 제출' : ''}${it.substitute ? ' · 대체 서류' : ''}` });
    it.temp = null;
  }
  for (const it of diff) {
    it.status = 'pending';
    it.submittedAt = t.toISOString();
    it.history.push({ at: t.toISOString(), text: `제출 곤란 사유 제출: ${it.difficulty}` });
  }
  if (late) a.evidence.late = true;
  a.evidence.finalizedAt = t.toISOString();
  notify(a.id, '증빙 제출 확인', 'evidence_submitted', `evidence:${a.id}:${t.getTime()}`);
  log(`U:${a.accountId}`, '증빙 제출 확정', a.id, `${staged.length + diff.length}개 항목${late ? ' · 지연 제출' : ''}`);
  save();
  return { ok: true, count: staged.length + diff.length, late };
}

export function reviewEvidence(appId, itemId, result, opts = {}) {
  const a = app(appId);
  const it = a.evidence.items.find((x) => x.id === itemId);
  const by = state.staffSession?.staffId;
  const at = nowISO();
  const labels = { verified: '확인 완료', revision: '보완 요청', substitute_ok: '대체 서류 확인', na: '해당 없음' };
  it.review = { result, by, at, reason: opts.reason || '', due: opts.due || null, note: opts.note || '' };
  it.status = result === 'revision' ? 'revision' : result === 'na' ? 'na' : 'verified';
  it.history.push({ at, text: `${labels[result]}${opts.reason ? `: ${opts.reason}` : ''}` });
  log(by, `증빙 ${labels[result]}`, a.id, `${it.label}${opts.reason ? ` · ${opts.reason}` : ''}`);
  if (result === 'revision') notify(a.id, '증빙 보완 요청', 'evidence_revision', `revision:${a.id}:${it.id}:${at}`);
  save();
}

export function reopenEvidence(appId, itemId, reason) {
  const a = app(appId);
  const it = a.evidence.items.find((x) => x.id === itemId);
  const by = state.staffSession?.staffId;
  it.status = 'revision';
  it.review = { result: 'revision', by, at: nowISO(), reason: `재개방: ${reason}`, due: null };
  it.history.push({ at: nowISO(), text: `담당자 재개방: ${reason}` });
  log(by, '증빙 항목 재개방', a.id, `${it.label} · ${reason}`);
  save();
}

// ───────── 면접 ─────────
export function respondInterview(appId, response, note) {
  const a = app(appId);
  a.interview.response = response;
  a.interview.responseNote = note || '';
  a.interview.responseAt = nowISO();
  a.interview.responseHandled = false;
  log(`U:${a.accountId}`, '면접 참석 응답', a.id, { yes: '참석 예정', no: '불참', ask: '일정 문의' }[response]);
  save();
}

export function rescheduleInterview(appId, whenISO, reason) {
  const a = app(appId);
  const by = state.staffSession?.staffId;
  const iv = a.interview;
  iv.version += 1;
  iv.at = whenISO;
  iv.arriveBy = new Date(new Date(whenISO).getTime() - 15 * 60000).toISOString();
  iv.history.push({ version: iv.version, at: nowISO(), when: whenISO, text: `일정 변경: ${reason}` });
  iv.response = null; iv.responseNote = ''; iv.responseAt = null; iv.responseHandled = false;
  notify(a.id, '면접 일정 변경 안내', 'interview_change', `interview:${a.id}:v${iv.version}`);
  log(by, '면접 일정 변경', a.id, `v${iv.version} · ${reason}`);
  save();
}

export function handleAsk(appId) {
  const a = app(appId);
  a.interview.responseHandled = true;
  log(state.staffSession?.staffId, '면접 문의 확인', a.id, '담당자 확인 처리 (일정은 자동 변경되지 않음)');
  save();
}

export function markAttendance(appId, v) {
  const a = app(appId);
  a.interview.attendance = v;
  log(state.staffSession?.staffId, '면접 참석 기록', a.id, v === 'attended' ? '참석' : '불참');
  save();
}

// ───────── 심사 ─────────
export function myReview(a, stage, evaluatorId) {
  return a.reviews[stage].find((r) => r.evaluatorId === evaluatorId);
}

export function saveReview(stage, appId, evaluatorId, scores, comment, submit) {
  const a = app(appId);
  let r = myReview(a, stage, evaluatorId);
  if (r && r.status === 'submitted') return { ok: false, error: '이미 제출한 평가표입니다. 수정하려면 채용 담당자에게 재개방을 요청해 주세요.' };
  if (state.stageState[a.jobId]?.[stage]?.state !== 'draft') return { ok: false, error: '결과가 확정된 전형은 평가를 수정할 수 없습니다.' };
  const total = Object.values(scores).reduce((x, y) => x + (Number(y) || 0), 0);
  if (!r) { r = { evaluatorId, history: [] }; a.reviews[stage].push(r); }
  Object.assign(r, { scores, total, comment, status: submit ? 'submitted' : 'draft', at: nowISO() });
  r.history = r.history || [];
  r.history.push({ at: nowISO(), text: submit ? '평가 제출' : '임시저장' });
  if (submit) log(evaluatorId, `${STAGES[stage].label} 평가 제출`, a.id, `합계 ${total}점`);
  save();
  return { ok: true };
}

export function reopenReview(stage, appId, evaluatorId, reason) {
  const a = app(appId);
  const r = myReview(a, stage, evaluatorId);
  if (!r) return;
  r.status = 'draft';
  r.history = r.history || [];
  r.history.push({ at: nowISO(), text: `재개방: ${reason}` });
  log(state.staffSession?.staffId, '평가 재개방', a.id, `${staff(evaluatorId)?.name} · ${reason}`);
  save();
}

export function reviewStats(a, stage) {
  const needed = STAFF.filter((s) => s.role === 'evaluator' && s.assigned.includes(a.positionId)).length;
  const done = a.reviews[stage].filter((r) => r.status === 'submitted');
  const avg = done.length ? done.reduce((x, r) => x + r.total, 0) / done.length : null;
  return { needed, done: done.length, avg };
}

// ───────── 결과 확정·발표 ─────────
export function stageCandidates(jobId, stage) {
  return appsOfJob(jobId).filter((a) => !a.past && a.status === 'submitted' && (stage === 'screening' || a.stages.screening.public?.result === 'pass'));
}

export function setInternal(jobId, stage, appId, result) {
  const st = state.stageState[jobId][stage];
  if (st.state !== 'draft') return { ok: false, error: '확정된 결과는 결과안을 수정할 수 없습니다.' };
  const a = app(appId);
  a.stages[stage].internal = result ? { result, at: nowISO(), by: state.staffSession?.staffId } : null;
  st.draftAt = nowISO();
  save();
  return { ok: true };
}

export function confirmStage(jobId, stage) {
  const st = state.stageState[jobId][stage];
  const c = stageCandidates(jobId, stage);
  const missing = c.filter((a) => !a.stages[stage].internal);
  if (missing.length) return { ok: false, error: `결과안이 비어 있는 지원자가 ${missing.length}명 있습니다.` };
  st.state = 'confirmed';
  st.confirmedAt = nowISO();
  st.confirmedBy = state.staffSession?.staffId;
  log(st.confirmedBy, `${STAGES[stage].label} 결과 확정`, jobId, `${c.length}명 · 확정·비공개`);
  save();
  return { ok: true };
}

export function unconfirmStage(jobId, stage) {
  const st = state.stageState[jobId][stage];
  st.state = 'draft';
  log(state.staffSession?.staffId, `${STAGES[stage].label} 확정 취소`, jobId, '결과안 작성 단계로 되돌림');
  save();
}

export function publishStage(jobId, stage) {
  const st = state.stageState[jobId][stage];
  if (st.state !== 'confirmed') return { ok: false, error: '확정된 결과만 공개할 수 있습니다.' };
  const by = state.staffSession?.staffId;
  const at = nowISO();
  const c = stageCandidates(jobId, stage);
  let sent = 0; let failed = 0;
  for (const a of c) {
    a.stages[stage].public = { result: a.stages[stage].internal.result, at };
    const n = notify(a.id, `${STAGES[stage].label} 결과 안내`, `${stage}_result`, `${stage}_result:${a.id}`);
    if (n && n.status === 'sent') sent++; else if (n) failed++;
  }
  st.state = 'published';
  st.publishedAt = at;
  st.publishedBy = by;
  log(by, `${STAGES[stage].label} 결과 공개`, jobId, `${c.length}명 공개 · 알림 성공 ${sent} · 실패/반송 ${failed}`);
  save();
  return { ok: true, count: c.length, sent, failed };
}

export function correctResult(jobId, stage, appId, result, reason) {
  const a = app(appId);
  const st = state.stageState[jobId][stage];
  const by = state.staffSession?.staffId;
  const from = a.stages[stage].public?.result;
  a.stages[stage].internal = { result, at: nowISO(), by };
  a.stages[stage].public = { result, at: nowISO(), corrected: { from, reason } };
  st.corrections.push({ appId, from, to: result, reason, at: nowISO(), by });
  notify(a.id, `${STAGES[stage].label} 결과 정정 안내`, 'correction', `correction:${a.id}:${nowISO()}`);
  log(by, '발표 결과 정정', a.id, `${from} → ${result} · ${reason}`);
  save();
}

// ───────── 알림 ─────────
export function resendNotification(id) {
  const n = state.notifications.find((x) => x.id === id);
  const acc = account(n.accountId);
  if (n.attempts >= 3) return { ok: false, error: '재시도 한도(3회)에 도달했습니다. 연락처를 확인해 주세요.' };
  n.attempts += 1;
  n.lastAt = nowISO();
  n.status = acc.bounce ? 'bounced' : 'sent';
  n.error = acc.bounce ? n.error : null;
  log(state.staffSession?.staffId, '알림 재발송', n.appId, `${n.template} · ${n.status === 'sent' ? '성공' : '반송'}`);
  save();
  return { ok: n.status === 'sent' };
}

export function fixEmail(accountId, email) {
  const acc = account(accountId);
  const before = acc.email;
  acc.email = email.trim().toLowerCase();
  acc.bounce = false;
  log(state.staffSession?.staffId, '연락처 수정', accountId, `${before} → ${acc.email} (본인 확인 후)`);
  save();
}

export function runReminders() {
  const at = nowISO();
  let sent = 0; let skipped = 0;
  for (const n of state.notifications.filter((x) => x.event === 'reminder' && x.status === 'queued')) {
    const a = app(n.appId);
    // 발송 직전 최신 제출 상태 재확인
    if (evidenceMissing(a).length === 0) { n.status = 'skipped'; n.error = '발송 전 재확인: 필수 서류 제출 완료로 발송 제외'; skipped++; }
    else { const acc = account(n.accountId); n.status = acc.bounce ? 'bounced' : 'sent'; n.attempts = 1; if (n.status === 'sent') sent++; }
    n.lastAt = at;
  }
  log(state.staffSession?.staffId, '마감 전 미제출 안내 실행', 'J26H2', `발송 ${sent} · 제외 ${skipped}`);
  save();
  return { sent, skipped };
}

/** 데모 편의: 면접 종료 상황을 만든다 (참석 기록 + 배정 위원 면접 평가 제출) */
export function demoFillInterviews(jobId = 'J26H2') {
  const list = stageCandidates(jobId, 'final');
  let n = 0;
  list.forEach((a, idx) => {
    if (!a.interview) return;
    if (a.interview.response === 'no') { a.interview.attendance = 'absent'; return; }
    a.interview.attendance = 'attended';
    const evs = STAFF.filter((s) => s.role === 'evaluator' && s.assigned.includes(a.positionId));
    const base = 70 + ((idx * 37) % 25);
    for (const ev of evs) {
      if (a.reviews.final.some((r) => r.evaluatorId === ev.id && r.status === 'submitted')) continue;
      const scores = { pro: Math.min(40, Math.round(40 * (base + ((ev.id.charCodeAt(1) * 7 + idx) % 9) - 4) / 100)), comm: Math.min(30, Math.round(30 * (base + (idx % 5) - 2) / 100)), value: Math.min(30, Math.round(30 * (base + ((idx * 3) % 7) - 3) / 100)) };
      const total = scores.pro + scores.comm + scores.value;
      a.reviews.final = a.reviews.final.filter((r) => r.evaluatorId !== ev.id);
      a.reviews.final.push({ evaluatorId: ev.id, scores, total, comment: total >= 85 ? '직무 이해와 실행 경험이 구체적임.' : total >= 75 ? '역량은 충분하나 차별점이 약함.' : '직무 연관 경험 설명이 부족함.', status: 'submitted', at: nowISO(), history: [{ at: nowISO(), text: '평가 제출 (데모 자동 입력)' }] });
      n++;
    }
  });
  log('system', '데모: 면접 평가 샘플 입력', jobId, `평가표 ${n}건`);
  save();
  return n;
}

export function addMemo(appId, text) {
  const a = app(appId);
  a.memos.push({ at: nowISO(), by: state.staffSession?.staffId, text });
  log(state.staffSession?.staffId, '내부 메모 작성', appId, '');
  save();
}

// ───────── 상태 요약 (화면 공용) ─────────
export const ITEM_STATUS = {
  none: { label: '미제출', tone: 'neutral' },
  error: { label: '오류', tone: 'danger' },
  pending: { label: '제출 완료 · 확인 대기', tone: 'info' },
  revision: { label: '보완 요청', tone: 'warn' },
  verified: { label: '확인 완료', tone: 'success' },
  na: { label: '해당 없음', tone: 'neutral' },
};

export function evidenceSummary(a, at = now()) {
  if (!a.evidence?.required) return { key: 'na', label: '대상 아님', tone: 'neutral' };
  const req = a.evidence.items.filter((i) => i.required);
  const submitted = req.filter((i) => ['pending', 'verified', 'na', 'revision'].includes(i.status) || (i.status === 'error' && i.files.length));
  const verified = req.filter((i) => ['verified', 'na'].includes(i.status));
  const revision = a.evidence.items.filter((i) => i.status === 'revision');
  const pending = a.evidence.items.filter((i) => i.status === 'pending');
  const overdue = a.evidence.deadline && at > new Date(a.evidence.deadline);
  const base = { total: req.length, submitted: submitted.length, verified: verified.length, revision: revision.length, pending: pending.length, late: a.evidence.late };
  if (revision.length) return { ...base, key: 'revision', label: '보완 요청', tone: 'warn' };
  if (req.length && verified.length === req.length) return { ...base, key: 'verified', label: '확인 완료', tone: 'success' };
  if (submitted.length === req.length) return { ...base, key: 'submitted', label: '제출 완료 · 확인 대기', tone: 'info' };
  if (submitted.length > 0) return { ...base, key: 'partial', label: overdue ? '일부 제출 · 기한 초과' : '일부 제출', tone: 'warn' };
  return { ...base, key: overdue ? 'overdue' : 'none', label: overdue ? '미제출 · 기한 초과' : '미제출', tone: 'danger' };
}

export const RESULT = {
  pass: { label: '합격', tone: 'success' },
  fail: { label: '불합격', tone: 'neutral' },
  reserve: { label: '예비합격', tone: 'info' },
  forfeit: { label: '참여 포기', tone: 'neutral' },
};

export const IV_RESP = {
  yes: { label: '참석 예정', tone: 'success' },
  no: { label: '불참', tone: 'neutral' },
  ask: { label: '일정 문의', tone: 'warn' },
  null: { label: '미응답', tone: 'neutral' },
};
