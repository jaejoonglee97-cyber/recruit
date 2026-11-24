import * as st from './store.js';
import { setRenderer, navigate, rerender, toast, openModal, closeModal } from './ui.js';
import { fmtShort, fromKstInput } from './util.js';
import { demoPanel } from './views/common.js';
import * as pub from './views/public.js';
import * as ap from './views/applicant.js';
import * as ad from './views/admin.js';

const routes = [
  ['/', pub.home],
  ['/jobs/:id', pub.jobDetail],
  ['/login', ap.login],
  ['/apply/:jobId', ap.apply],
  ['/me', ap.me],
  ['/me/:appId', ap.status],
  ['/me/:appId/evidence', ap.evidence],
  ['/me/:appId/interview', ap.interview],
  ['/me/:appId/application', ap.submitted],
  ['/admin/login', ad.staffLogin],
  ['/admin', ad.dashboard],
  ['/admin/applicants', ad.applicants],
  ['/admin/applicants/:appId', ad.applicantDetail],
  ['/admin/review', ad.review],
  ['/admin/review/:stage/:appId', ad.reviewForm],
  ['/admin/evidence', ad.evidenceList],
  ['/admin/evidence/:appId', ad.evidenceDetail],
  ['/admin/interviews', ad.interviews],
  ['/admin/publish', ad.publish],
  ['/admin/notifications', ad.notifications],
  ['/admin/audit', ad.audit],
  ['/admin/personas', ad.personas],
].map(([pattern, view]) => {
  const keys = [];
  const re = new RegExp(`^${pattern.replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([^/]+)'; })}$`);
  return { re, keys, view };
});

let current = { view: null, params: {}, query: {}, path: '' };

function parseHash() {
  const h = location.hash.slice(1) || '/';
  const [path, qs] = h.split('?');
  const query = Object.fromEntries(new URLSearchParams(qs || ''));
  return { path: path || '/', query };
}

function render({ keepScroll = true } = {}) {
  const { path, query } = parseHash();
  let match = null;
  for (const r of routes) {
    const m = r.re.exec(path);
    if (m) { match = { view: r.view, params: Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])])) }; break; }
  }
  if (!match) match = { view: pub.home, params: {} };
  const pathChanged = path !== current.path;
  current = { view: match.view, params: match.params, query, path };
  const root = document.getElementById('app');
  const y = window.scrollY;
  root.innerHTML = String(match.view.render(match.params, query));
  document.title = `${match.view.title} · 아산나눔재단 채용 (데모)`;
  if (pathChanged) { window.scrollTo(0, 0); document.getElementById('main')?.focus({ preventScroll: true }); }
  else if (keepScroll) window.scrollTo(0, y);
  match.view.mounted?.(match.params, query);
}

const globalActions = {
  skip: () => document.getElementById('main')?.focus(),
  logout: () => { st.logout(); toast('로그아웃했습니다.'); navigate('/'); },
  'staff-logout': () => { st.staffLogout(); navigate('/admin/login'); },
  'open-demo': () => openModal(demoPanel(), { title: '데모 설정', wide: true }),
  'close-modal': () => closeModal(),
  'close-modal-link': () => closeModal(),
  'set-clock': (el) => { st.setClock(el.dataset.at); closeModal(); toast(`데모 기준 시각을 ${fmtShort(el.dataset.at)}(으)로 바꿨습니다.`); rerender(); },
  'toggle-autosave-fail': (el) => { st.setFlag('autosaveFail', el.checked); toast(el.checked ? '자동저장 실패를 재현합니다.' : '자동저장을 정상으로 되돌렸습니다.'); },
  'reset-demo': () => {
    if (!confirm('데모 데이터를 처음 상태로 되돌릴까요? 이 브라우저에서 진행한 지원·심사·발표 기록이 사라집니다.')) return;
    st.resetAll(); closeModal(); toast('데모 데이터를 초기화했습니다.'); navigate('/');
  },
  'demo-fill-interviews': () => {
    st.setClock('2026-11-28T01:00:00.000Z');
    const n = st.demoFillInterviews();
    closeModal();
    toast(`면접 평가 ${n}건을 채우고 시각을 11/28 10:00으로 옮겼습니다.`, 'success');
    rerender();
  },
  'quick-staff': (el) => { st.staffLogin(el.dataset.id); closeModal(); const me = st.currentStaff(); navigate(me.role === 'evaluator' ? '/admin/review' : me.role === 'verifier' ? '/admin/evidence' : '/admin'); },
};
const globalForms = {
  'custom-clock': (f) => { const iso = fromKstInput(f.at.value); if (!iso) return; st.setClock(iso); closeModal(); toast(`데모 기준 시각을 ${fmtShort(iso)}(으)로 바꿨습니다.`); rerender(); },
};

function handler(kind, name) {
  return current.view?.[kind]?.[name] || (kind === 'actions' ? globalActions[name] : kind === 'forms' ? globalForms[name] : null);
}

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const fn = handler('actions', el.dataset.action);
  if (!fn) return;
  if (el.type === 'checkbox') { fn(el, e, current.params, current.query); return; }
  if (el.tagName === 'A' && el.dataset.action === 'close-modal-link') { closeModal(); return; }
  e.preventDefault();
  fn(el, e, current.params, current.query);
});

document.addEventListener('submit', (e) => {
  const f = e.target.closest('form[data-form]');
  if (!f) return;
  e.preventDefault();
  const fn = handler('forms', f.dataset.form);
  if (fn) fn(f, e, current.params, current.query);
});

document.addEventListener('input', (e) => {
  const el = e.target.closest('[data-oninput]');
  if (!el) return;
  const fn = current.view?.inputs?.[el.dataset.oninput];
  if (fn) fn(el, e, current.params, current.query);
});

document.addEventListener('change', (e) => {
  const el = e.target.closest('[data-onchange]');
  if (!el) return;
  const fn = current.view?.changes?.[el.dataset.onchange];
  if (fn) fn(el, e, current.params, current.query);
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !document.getElementById('modal-root').hidden) closeModal();
});

// 데모 시계 표시 갱신
setInterval(() => {
  const t = fmtShort(st.now());
  document.querySelectorAll('[data-clock]').forEach((el) => { el.textContent = t; });
}, 15000);

st.load();
setRenderer(render);
window.addEventListener('hashchange', () => { closeModal(); render(); });
render();
