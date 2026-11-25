import { html, fmtDT, remaining } from '../util.js';
import * as st from '../store.js';
import { JOBS, POSITIONS, UPLOAD_POLICY, JOB_FILTERS, ALERT_CATEGORIES, CAREER_SITE } from '../data/seed.js';
import { formData, toast, openModal, closeModal, navigate } from '../ui.js';
import { publicShell, badge, kv, scheduleText, empty } from './common.js';

function jobCard(j) {
  const s = st.jobStatus(j);
  const t = st.now();
  const f = j.filter || {};
  return html`<a class="job-card" href="#/jobs/${j.id}">
    <div class="job-card__top">${badge(s.label, s.tone)}${s.key === 'open' && j.apply.to ? html`<strong class="job-card__remain">${remaining(j.apply.to, t)}</strong>` : ''}</div>
    <h3 class="job-card__title">${j.title}</h3>
    <ul class="job-card__tags">${[f.type, f.career, f.place].filter(Boolean).map((x) => html`<li>${x}</li>`)}</ul>
  </a>`;
}

const STATE_FILTER = [['open', '접수 중'], ['upcoming', '접수 예정'], ['past', '마감·종료']];

function filterJobs(q) {
  return JOBS.filter((j) => {
    const sk = st.jobStatus(j).key;
    if (q.state === 'past' ? !['closed', 'ended'].includes(sk) : q.state && sk !== q.state) return false;
    return JOB_FILTERS.every(({ key }) => {
      if (!q[key]) return true;
      const v = j.filter?.[key];
      return Array.isArray(v) ? v.includes(q[key]) : v === q[key];
    });
  });
}

function filterBar(q) {
  const opts = (key) => [...new Set(JOBS.flatMap((j) => [].concat(j.filter?.[key] || [])))].map((v) => [v, v]);
  const sel = (key, label, options) => html`<label class="fsel"><span class="sr-only">${label}</span>
    <select class="input fsel__select ${q[key] ? 'is-on' : ''}" data-onchange="filter" name="${key}">
      <option value="">${label} 전체</option>
      ${options.map(([v, l]) => html`<option value="${v}" ${q[key] === v ? 'selected' : ''}>${l}</option>`)}
    </select></label>`;
  return html`<div class="filter">
    ${sel('state', '진행 상태', STATE_FILTER)}
    ${JOB_FILTERS.map(({ key, label }) => sel(key, label, opts(key)))}
  </div>`;
}

function alertBox() {
  return html`<form class="alert-bar" data-form="alert-sub" novalidate aria-labelledby="alert-title">
    <strong class="alert-bar__title" id="alert-title">새 공고 알림 받기</strong>
    <div class="alert-bar__row">
      <label class="sr-only" for="alert-email">이메일</label>
      <input id="alert-email" type="email" class="input" name="email" autocomplete="email" required placeholder="이메일 주소">
      <button class="btn btn--primary">신청</button>
    </div>
    <div class="alert-bar__foot">
      <label class="check small"><input type="checkbox" name="consent" required> 알림 수신 동의 (필수)</label>
      <button type="button" class="link-btn small" data-action="alert-unsub">수신 거부</button>
    </div>
  </form>`;
}

const HOME_NAV = [['jobs', '채용공고'], ['about', '재단 소개'], ['culture', '일하는 방식'], ['benefits', '근무 환경'], ['faq', 'FAQ']];

export const home = {
  title: '채용공고',
  render(p, q = {}) {
    const order = { open: 0, upcoming: 1, closed: 2, ended: 3 };
    const jobs = filterJobs(q).sort((a, b) => order[st.jobStatus(a).key] - order[st.jobStatus(b).key]);
    const filtered = q.state || JOB_FILTERS.some(({ key }) => q[key]);
    const C = CAREER_SITE;
    return publicShell(html`
      <section class="hero">
        <div class="container hero__inner">
          <h1 class="hero__title">${C.vision}</h1>
          <div class="hero__actions">
            <a href="#jobs" class="btn btn--primary btn--lg" data-action="scroll-to" data-target="jobs">채용공고 보기</a>
            <a href="#/me" class="btn btn--light btn--lg">내 지원현황</a>
          </div>
        </div>
      </section>
      <nav class="subnav" aria-label="페이지 내 이동"><div class="container subnav__inner">
        ${HOME_NAV.map(([id, l]) => html`<a href="#${id}" class="subnav__link" data-action="scroll-to" data-target="${id}">${l}</a>`)}
      </div></nav>

      <section class="container section" id="jobs" aria-labelledby="jobs-title">
        <div class="section-head">
          <h2 class="section-title" id="jobs-title">채용공고 <span class="section-count">${jobs.length}</span></h2>
          ${filtered ? html`<a class="small" href="#/">필터 초기화</a>` : ''}
        </div>
        ${filterBar(q)}
        ${jobs.length ? html`<div class="job-grid">${jobs.map(jobCard)}</div>` : empty('조건에 맞는 공고가 없습니다.')}
        ${alertBox()}
      </section>

      <section class="band" id="about" aria-labelledby="about-title"><div class="container section">
        <h2 class="section-title" id="about-title">재단 소개</h2>
        <p class="lead">${C.about}</p>
        <ul class="kw-grid kw-grid--4">${C.areas.map((a) => html`<li class="kw kw--lg">${a.name}</li>`)}</ul>
      </div></section>

      <section class="container section" id="culture" aria-labelledby="culture-title">
        <h2 class="section-title" id="culture-title">일하는 방식</h2>
        <ol class="kw-grid principles">${C.principles.map((x, i) => html`<li class="kw principle"><span class="principle__n">${String(i + 1).padStart(2, '0')}</span><strong>${x.ko}</strong><span class="principle__en">${x.en}</span></li>`)}</ol>
      </section>

      <section class="band" id="benefits" aria-labelledby="benefits-title"><div class="container section">
        <h2 class="section-title" id="benefits-title">근무 환경</h2>
        <ul class="pill-list">${C.benefits.map((b) => html`<li class="pill">${b.name}</li>`)}</ul>
      </div></section>

      <section class="container section" aria-labelledby="flow-title">
        <h2 class="section-title" id="flow-title">채용 절차</h2>
        <ol class="steps">${['지원서 제출', '서류전형', '증빙서류 제출', '면접', '최종 발표'].map((x, i) => html`<li><span class="steps__n">${i + 1}</span>${x}</li>`)}</ol>
      </section>

      <section class="container section" id="faq" aria-labelledby="faq-title">
        <h2 class="section-title" id="faq-title">자주 묻는 질문</h2>
        <div class="faq">
          ${C.faq.map((x) => html`<details><summary>${x.q}</summary><p>${x.a}</p></details>`)}
          <details><summary>마감 시각은 어떻게 판정하나요?</summary><p>‘최종 제출’을 누른 시각(한국시간)이 기준입니다. 마감 뒤에 누르면 지연 제출로 처리됩니다.</p></details>
          <details><summary>증빙서류는 언제 내나요?</summary><p>서류 합격자에게만 제출 화면이 열립니다. ${UPLOAD_POLICY.exts.join(', ').toUpperCase()} 형식, 1개당 ${UPLOAD_POLICY.maxFile / 1024 / 1024}MB 이하입니다.</p></details>
        </div>
      </section>`, 'jobs');
  },
  changes: {
    filter: (el, e, p, q) => {
      const next = { ...q, [el.name]: el.value };
      const qs = new URLSearchParams(Object.entries(next).filter(([, v]) => v)).toString();
      navigate(`/${qs ? `?${qs}` : ''}`);
    },
  },
  actions: {
    'scroll-to': (el) => document.getElementById(el.dataset.target)?.scrollIntoView({ behavior: 'smooth' }),
    'alert-unsub': () => openModal(html`<form data-form="alert-unsub">
      <label class="field"><span class="field__label">알림을 신청한 이메일</span><input type="email" class="input" name="email" required autocomplete="email"></label>
      <div class="row gap end"><button type="button" class="btn btn--ghost" data-action="close-modal">취소</button><button class="btn btn--primary">수신 거부</button></div>
    </form>`, { title: '채용 알림 수신 거부' }),
  },
  forms: {
    'alert-sub': (f) => {
      const d = formData(f);
      const r = st.subscribeAlert(d.email, ALERT_CATEGORIES, d.consent);
      if (!r.ok) { toast(r.error, 'danger'); return; }
      f.reset();
      toast(r.updated ? '이미 신청한 이메일입니다.' : '알림을 신청했습니다. (데모)', 'success');
    },
    'alert-unsub': (f) => {
      const r = st.unsubscribeAlert(f.email.value);
      if (!r.ok) { toast(r.error, 'danger'); return; }
      closeModal(); toast('수신 거부를 처리했습니다.', 'success');
    },
  },
};

export const jobDetail = {
  title: '공고 상세',
  render({ id }) {
    const j = st.job(id);
    if (!j) return publicShell(html`<div class="container section">${empty('공고를 찾을 수 없습니다.', html`<a class="btn btn--secondary" href="#/">공고 목록</a>`)}</div>`, 'jobs');
    const s = st.jobStatus(j);
    const acc = st.currentAccount();
    const mine = acc ? st.draftFor(acc.id, j.id) : null;
    let cta;
    if (s.key === 'open') {
      if (mine?.status === 'submitted') cta = html`<a class="btn btn--primary btn--lg" href="#/me/${mine.id}">접수 내역 확인</a>`;
      else cta = html`<a class="btn btn--primary btn--lg" href="#/apply/${j.id}">${mine ? '이어서 작성하기' : '지원하기'}</a>`;
    } else cta = html`<button class="btn btn--primary btn--lg" disabled>${s.label}</button>`;
    return publicShell(html`
      <div class="container section">
        <nav class="crumbs" aria-label="위치"><a href="#/">채용공고</a> <span aria-hidden="true">›</span> <span>${j.title}</span></nav>
        <div class="job-head">
          <div>
            <div class="job-head__badges">${badge(s.label, s.tone)} ${badge('데모용 가상 공고', 'neutral')}</div>
            <h1 class="page-title">${j.title}</h1>
            <p class="page-sub">${j.summary}</p>
          </div>
          <div class="job-head__cta">${cta}${s.key === 'open' && j.apply.to ? html`<p class="muted small">${remaining(j.apply.to, st.now())}</p>` : ''}</div>
        </div>
        <div class="grid-2">
          <section class="card">
            <h2 class="h2">모집 개요</h2>
            ${kv([
              ['고용 형태', j.employment],
              ['근무지', j.place],
              ['접수 기간', html`${fmtDT(j.apply.from)} ~ ${j.apply.to ? fmtDT(j.apply.to, { tz: true }) : '추후 안내'}`],
              ['접수 방법', '이 사이트에서 이메일 인증 후 온라인 지원서 작성'],
              ['재제출', j.allowResubmit ? '마감 전까지 수정 후 재제출 가능 (마지막 제출본이 유효)' : '최종 제출 후 수정 불가'],
            ])}
          </section>
          <section class="card">
            <h2 class="h2">전형 절차와 일정</h2>
            <ol class="schedule">
              ${j.schedule.map((x) => html`<li><span class="schedule__label">${x.label}</span><span class="schedule__value">${scheduleText(x)}</span></li>`)}
            </ol>
            <p class="muted small">일정이 바뀌면 변경 시각과 내용을 아래 ‘공고 변경 이력’에 남깁니다.</p>
          </section>
        </div>
        ${j.positions.length ? html`<section class="section-sm">
          <h2 class="h2">모집 직무</h2>
          <div class="position-list">${j.positions.map((pid) => { const p = POSITIONS[pid]; return html`<article class="card position">
            <h3 class="h3">${p.name} <span class="muted small">${p.headcount}명</span></h3>
            <div class="grid-3">
              <div><h4 class="h4">주요 업무</h4><ul>${p.duties.map((d) => html`<li>${d}</li>`)}</ul></div>
              <div><h4 class="h4">자격 요건</h4><ul>${p.quals.map((d) => html`<li>${d}</li>`)}</ul></div>
              <div><h4 class="h4">우대 사항</h4><ul>${p.prefs.length ? p.prefs.map((d) => html`<li>${d}</li>`) : html`<li>없음</li>`}</ul></div>
            </div></article>`; })}</div>
        </section>` : ''}
        ${j.id === 'J26H2' ? html`<section class="card section-sm">
          <h2 class="h2">서류 합격 후 제출할 증빙서류</h2>
          <p>서류전형 합격자에게만 제출 화면이 열립니다. 지원서에 적은 항목별로 연결해 제출합니다.</p>
          <ul>
            <li><strong>학력(필수):</strong> 기재한 학력(학사·석사·박사) 전부의 졸업증명서와 성적증명서</li>
            <li><strong>경력(필수):</strong> 기재한 경력별 경력증명서 또는 재직증명서 — 발급이 어려우면 4대보험 자격득실확인서로 대체 가능</li>
            <li><strong>선택:</strong> 어학성적표, 자격증 사본 (내지 않아도 접수됩니다)</li>
          </ul>
          <p class="muted small">제출 마감: ${fmtDT(j.evidenceDeadline, { tz: true })} · 주민등록번호 뒷자리는 가린 뒤 제출해 주세요.</p>
        </section>` : ''}
        <section class="card section-sm">
          <h2 class="h2">개인정보 안내 (요약)</h2>
          <p>채용 진행에 필요한 정보만 받고, 증빙서류는 서류 합격자에게만 요청합니다. 보유 기간과 파기 방식은 운영 기관이 확정한 정책에 따릅니다. <span class="muted">(데모: 실제 정책 문구 아님)</span></p>
        </section>
        <section class="card section-sm">
          <h2 class="h2">공고 변경 이력</h2>
          <ul class="log-list">${j.changes.map((c) => html`<li><time>${fmtDT(c.at)}</time> ${c.text}</li>`)}</ul>
        </section>
      </div>`, 'jobs');
  },
};
