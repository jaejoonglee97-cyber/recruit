import { html, fmtDT, remaining } from '../util.js';
import * as st from '../store.js';
import { JOBS, POSITIONS, UPLOAD_POLICY, JOB_FILTERS, ALERT_CATEGORIES, CAREER_SITE } from '../data/seed.js';
import { formData, toast, openModal, closeModal } from '../ui.js';
import { publicShell, badge, kv, scheduleText, empty } from './common.js';

function jobCard(j) {
  const s = st.jobStatus(j);
  const t = st.now();
  return html`<article class="job-card">
    <div class="job-card__top">${badge(s.label, s.tone)} <span class="muted small">${j.employment}</span></div>
    <h3 class="job-card__title"><a href="#/jobs/${j.id}">${j.title}</a></h3>
    <p class="job-card__summary">${j.summary}</p>
    ${j.positions.length ? html`<ul class="job-card__positions">${j.positions.map((p) => html`<li>${POSITIONS[p].name}</li>`)}</ul>` : ''}
    <div class="job-card__meta">
      <span>접수 ${fmtDT(j.apply.from)} ~ ${j.apply.to ? fmtDT(j.apply.to) : '추후 안내'}</span>
      ${s.key === 'open' && j.apply.to ? html`<strong class="job-card__remain">${remaining(j.apply.to, t)}</strong>` : ''}
    </div>
  </article>`;
}

const STATE_FILTER = [['', '전체'], ['open', '접수 중'], ['upcoming', '접수 예정'], ['past', '마감·종료']];

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

function filterHref(q, key, value) {
  const next = { ...q, [key]: value };
  const qs = new URLSearchParams(Object.entries(next).filter(([, v]) => v)).toString();
  return `#/${qs ? `?${qs}` : ''}`;
}

function filterBar(q) {
  const opts = (key) => [...new Set(JOBS.flatMap((j) => [].concat(j.filter?.[key] || [])))];
  const count = (key, v) => filterJobs({ ...q, [key]: v }).length;
  const group = (key, label, options) => html`<div class="filter__group" role="group" aria-label="${label}">
    <span class="filter__label">${label}</span>
    <div class="filter__chips">
      <a class="fchip ${!q[key] ? 'is-on' : ''}" href="${filterHref(q, key, '')}" ${!q[key] ? html`aria-current="true"` : ''}>전체</a>
      ${options.map(([v, l]) => html`<a class="fchip ${q[key] === v ? 'is-on' : ''}" href="${filterHref(q, key, v)}" ${q[key] === v ? html`aria-current="true"` : ''}>${l} <span class="fchip__n">${count(key, v)}</span></a>`)}
    </div>
  </div>`;
  return html`<div class="filter">
    ${group('state', '진행 상태', STATE_FILTER.slice(1))}
    ${JOB_FILTERS.map(({ key, label }) => group(key, label, opts(key).map((v) => [v, v])))}
  </div>`;
}

function alertBox() {
  return html`<section class="alert-box" aria-labelledby="alert-title">
    <div class="alert-box__text">
      <h2 class="h2" id="alert-title">채용 공고 알림 받기</h2>
      <p>관심 직군의 새 공고가 열리면 이메일로 알려 드립니다. 외부 설문 없이 이 사이트에서 바로 신청하고, 언제든 수신을 거부할 수 있습니다.</p>
      <button type="button" class="link-btn small" data-action="alert-unsub">알림 수신 거부</button>
    </div>
    <form class="alert-box__form" data-form="alert-sub" novalidate>
      <label class="field"><span class="field__label">이메일</span><input type="email" class="input" name="email" autocomplete="email" required placeholder="name@example.com"></label>
      <fieldset class="field"><legend class="field__label">관심 직군</legend>
        <div class="row gap wrap">${ALERT_CATEGORIES.map((c) => html`<label class="check"><input type="checkbox" name="cats" value="${c}" checked> ${c}</label>`)}</div>
      </fieldset>
      <label class="check small"><input type="checkbox" name="consent" required> (필수) 채용 알림 발송을 위해 이메일 주소를 수집·이용하는 데 동의합니다. 수신 거부 시 즉시 삭제합니다. <span class="muted">(데모 문구)</span></label>
      <button class="btn btn--primary">알림 신청</button>
    </form>
  </section>`;
}

const HOME_NAV = [['jobs', '채용공고'], ['about', '재단 소개'], ['culture', '일하는 방식'], ['benefits', '근무 환경'], ['stories', '직원 이야기'], ['faq', 'FAQ']];

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
          <p class="hero__eyebrow">아산나눔재단 채용</p>
          <h1 class="hero__title">${C.vision}</h1>
          <p class="hero__lead">${C.about}<br class="hide-sm">공고 확인부터 지원, 결과 확인, 증빙 제출, 면접 안내까지 이 사이트 한곳에서 이어집니다.</p>
          <div class="hero__actions">
            <a href="#jobs" class="btn btn--primary btn--lg" data-action="scroll-to" data-target="jobs">채용 중인 공고 보기</a>
            <a href="#/me" class="btn btn--light btn--lg">내 지원현황 확인</a>
          </div>
        </div>
      </section>
      <nav class="subnav" aria-label="페이지 내 이동"><div class="container subnav__inner">
        ${HOME_NAV.map(([id, l]) => html`<a href="#${id}" class="subnav__link" data-action="scroll-to" data-target="${id}">${l}</a>`)}
      </div></nav>

      <section class="container section" id="jobs" aria-labelledby="jobs-title">
        <h2 class="section-title" id="jobs-title">채용공고</h2>
        ${filterBar(q)}
        <p class="muted small" aria-live="polite">${jobs.length}개 공고${filtered ? html` · <a href="#/">필터 초기화</a>` : ''}</p>
        ${jobs.length ? html`<div class="job-grid">${jobs.map(jobCard)}</div>` : empty('조건에 맞는 공고가 없습니다. 채용 알림을 신청하면 새 공고가 열릴 때 알려 드립니다.')}
        ${alertBox()}
      </section>

      <section class="band" id="about" aria-labelledby="about-title"><div class="container section">
        <h2 class="section-title" id="about-title">재단 소개</h2>
        <p class="lead">${C.aboutDetail}</p>
        <div class="tile-grid tile-grid--4">${C.areas.map((a) => html`<article class="tile"><h3 class="h3">${a.name}</h3><p>${a.text}</p></article>`)}</div>
      </div></section>

      <section class="container section" id="culture" aria-labelledby="culture-title">
        <h2 class="section-title" id="culture-title">우리가 일하는 방식</h2>
        <ol class="principles">${C.principles.map((x, i) => html`<li class="principle"><span class="principle__n">${String(i + 1).padStart(2, '0')}</span><div><p class="principle__en">${x.en}</p><h3 class="h3">${x.ko}</h3><p>${x.text}</p></div></li>`)}</ol>
      </section>

      <section class="band" id="benefits" aria-labelledby="benefits-title"><div class="container section">
        <h2 class="section-title" id="benefits-title">근무 환경</h2>
        <div class="tile-grid">${C.benefits.map((b) => html`<article class="tile tile--sm"><h3 class="h4">${b.name}</h3><p>${b.text}</p></article>`)}</div>
      </div></section>

      <section class="container section" id="stories" aria-labelledby="stories-title">
        <h2 class="section-title" id="stories-title">직원 이야기</h2>
        <div class="tile-grid tile-grid--3">${C.stories.map((x) => html`<article class="tile story">
          <p class="story__team">${x.team}</p><h3 class="h3">${x.team} 인터뷰</h3>
          ${x.url ? html`<a href="${x.url}" target="_blank" rel="noopener noreferrer">인터뷰 읽기 (새 창)</a>` : html`<span class="muted small">블로그 글 연결 예정</span>`}
        </article>`)}</div>
      </section>

      <section class="container section" aria-labelledby="flow-title">
        <h2 class="section-title" id="flow-title">채용 절차</h2>
        <ol class="flow">
          <li><span class="flow__n">1</span><strong>지원서 제출</strong><span>이메일 인증 후 작성 · 자동 임시저장</span></li>
          <li><span class="flow__n">2</span><strong>서류전형</strong><span>심사 결과는 발표 후 이 사이트에서 확인</span></li>
          <li><span class="flow__n">3</span><strong>증빙서류 제출</strong><span>서류 합격자만 · 항목별 업로드와 보완</span></li>
          <li><span class="flow__n">4</span><strong>면접전형</strong><span>개인별 일시·장소 안내 · 참석 응답</span></li>
          <li><span class="flow__n">5</span><strong>최종 발표</strong><span>결과와 후속 안내 확인</span></li>
        </ol>
      </section>
      <section class="container section" id="faq" aria-labelledby="faq-title">
        <h2 class="section-title" id="faq-title">자주 묻는 질문</h2>
        <div class="faq">
          ${C.faq.map((x) => html`<details><summary>${x.q}</summary><p>${x.a}</p></details>`)}
          <details><summary>마감 시각은 어떻게 판정하나요?</summary><p>서버가 최종 제출을 접수한 시각을 기준으로 판정합니다. 업로드를 마감 전에 시작했더라도 ‘제출’ 버튼을 마감 뒤에 누르면 지연 제출로 처리됩니다. 모든 시각은 한국시간입니다.</p></details>
          <details><summary>임시저장만 해도 접수되나요?</summary><p>아니요. 미리보기에서 ‘최종 제출’을 눌러 접수번호가 발급되어야 접수가 완료됩니다.</p></details>
          <details><summary>지원서를 제출한 뒤 고칠 수 있나요?</summary><p>공고마다 다릅니다. 재제출을 허용한 공고는 마감 전까지 고쳐서 다시 낼 수 있고 마지막 제출본이 유효합니다. 허용하지 않는 공고는 제출 후 수정할 수 없습니다. 공고 상세의 ‘재제출’ 항목을 확인해 주세요.</p></details>
          <details><summary>증빙서류는 언제, 어떻게 내나요?</summary><p>서류전형 합격자에게만 제출 화면이 열립니다. 지원서에 적은 학력·경력 항목별로 파일을 올리고 ‘제출 확정’을 누릅니다. 한 파일에 여러 서류를 합친 PDF도 받을 수 있습니다. 파일은 ${UPLOAD_POLICY.exts.join(', ').toUpperCase()} 형식, 1개당 ${UPLOAD_POLICY.maxFile / 1024 / 1024}MB 이하입니다.</p></details>
          <details><summary>‘제출 완료’와 ‘확인 완료’는 무엇이 다른가요?</summary><p>제출 완료는 파일이 접수되었다는 뜻이고, 확인 완료는 담당자가 지원서 내용과 대조를 마쳤다는 뜻입니다. 보완이 필요하면 항목별로 사유와 기한을 안내합니다.</p></details>
        </div>
      </section>`, 'jobs');
  },
  actions: {
    'scroll-to': (el) => document.getElementById(el.dataset.target)?.scrollIntoView({ behavior: 'smooth' }),
    'alert-unsub': () => openModal(html`<form data-form="alert-unsub">
      <p>알림을 신청한 이메일을 입력하면 즉시 구독을 해지하고 주소를 지웁니다.</p>
      <label class="field"><span class="field__label">이메일</span><input type="email" class="input" name="email" required autocomplete="email"></label>
      <div class="row gap end"><button type="button" class="btn btn--ghost" data-action="close-modal">취소</button><button class="btn btn--primary">수신 거부</button></div>
    </form>`, { title: '채용 알림 수신 거부' }),
  },
  forms: {
    'alert-sub': (f) => {
      const d = formData(f);
      const r = st.subscribeAlert(d.email, d.cats, d.consent);
      if (!r.ok) { toast(r.error, 'danger'); return; }
      f.reset();
      toast(r.updated ? '관심 직군을 바꿨습니다.' : '채용 알림을 신청했습니다. (데모: 실제 메일은 가지 않습니다)', 'success');
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
