// 화면 공용 기능 — 다시 그리기, 이동, 알림 토스트, 모달
import { html } from './util.js';

let renderer = () => {};
export function setRenderer(fn) { renderer = fn; }
export function rerender(opts) { renderer(opts); }

export function navigate(path) {
  if (location.hash === `#${path}`) rerender();
  else location.hash = path;
}

export function toast(message, tone = 'info') {
  const root = document.getElementById('toast-root');
  const el = document.createElement('div');
  el.className = `toast toast--${tone}`;
  el.setAttribute('role', tone === 'danger' ? 'alert' : 'status');
  el.textContent = message;
  root.appendChild(el);
  setTimeout(() => el.classList.add('is-out'), 3800);
  setTimeout(() => el.remove(), 4300);
}

let lastFocus = null;
export function openModal(content, { title = '', wide = false } = {}) {
  const root = document.getElementById('modal-root');
  lastFocus = document.activeElement;
  root.innerHTML = String(html`
    <div class="modal-backdrop" data-action="close-modal"></div>
    <div class="modal ${wide ? 'modal--wide' : ''}" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div class="modal__head">
        <h2 id="modal-title" class="modal__title">${title}</h2>
        <button type="button" class="icon-btn" data-action="close-modal" aria-label="닫기">✕</button>
      </div>
      <div class="modal__body">${content}</div>
    </div>`);
  root.hidden = false;
  const focusable = root.querySelector('input, select, textarea, button:not(.icon-btn)');
  (focusable || root.querySelector('.modal')).focus();
}
export function closeModal() {
  const root = document.getElementById('modal-root');
  root.innerHTML = '';
  root.hidden = true;
  if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
}

/** 폼 → 객체 (같은 이름 checkbox는 배열) */
export function formData(form) {
  const o = {};
  for (const el of form.elements) {
    if (!el.name || el.disabled) continue;
    if (el.type === 'checkbox') {
      if (form.querySelectorAll(`[name="${el.name}"]`).length > 1) { o[el.name] = o[el.name] || []; if (el.checked) o[el.name].push(el.value); }
      else o[el.name] = el.checked;
    } else if (el.type === 'radio') { if (el.checked) o[el.name] = el.value; }
    else o[el.name] = el.value;
  }
  return o;
}
