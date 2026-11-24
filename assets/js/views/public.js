import { html, fmtDT, remaining } from '../util.js';
import * as st from '../store.js';
import { JOBS, POSITIONS, UPLOAD_POLICY } from '../data/seed.js';
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

export const home = {
  title: '채용공고',
  render() {
    const order = { open: 0, upcoming: 1, closed: 2, ended: 3 };
    const jobs = JOBS.slice().sort((a, b) => order[st.jobStatus(a).key] - order[st.jobStatus(b).key]);
    return publicShell(html`
      <section class="hero">
        <div class="container hero__inner">
          <p class="hero__eyebrow">아산나눔재단 채용</p>
          <h1 class="hero__title">기업가정신으로<br>더 나은 내일을 함께 만들 동료를 찾습니다</h1>
          <p class="hero__lead">공고 확인부터 지원서 작성, 결과 확인, 증빙서류 제출, 면접 안내까지<br class="hide-sm">이 사이트 한곳에서 이어집니다.</p>
          <div class="hero__actions">
            <a href="#/me" class="btn btn--primary btn--lg">내 지원현황 확인</a>
            <a href="#jobs" class="btn btn--light btn--lg" data-action="scroll-jobs">채용공고 보기</a>
          </div>
        </div>
      </section>
      <section class="container section" id="jobs" aria-labelledby="jobs-title">
        <h2 class="section-title" id="jobs-title">채용공고</h2>
        <div class="job-grid">${jobs.map(jobCard)}</div>
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
      <section class="container section" aria-labelledby="faq-title">
        <h2 class="section-title" id="faq-title">지원 전 확인해 주세요</h2>
        <div class="faq">
          <details><summary>마감 시각은 어떻게 판정하나요?</summary><p>서버가 최종 제출을 접수한 시각을 기준으로 판정합니다. 업로드를 마감 전에 시작했더라도 ‘제출’ 버튼을 마감 뒤에 누르면 지연 제출로 처리됩니다. 모든 시각은 한국시간입니다.</p></details>
          <details><summary>임시저장만 해도 접수되나요?</summary><p>아니요. 미리보기에서 ‘최종 제출’을 눌러 접수번호가 발급되어야 접수가 완료됩니다.</p></details>
          <details><summary>증빙서류는 언제, 어떻게 내나요?</summary><p>서류전형 합격자에게만 제출 화면이 열립니다. 지원서에 적은 학력·경력 항목별로 파일을 올리고 ‘제출 확정’을 누릅니다. 한 파일에 여러 서류를 합친 PDF도 받을 수 있습니다. 파일은 ${UPLOAD_POLICY.exts.join(', ').toUpperCase()} 형식, 1개당 ${UPLOAD_POLICY.maxFile / 1024 / 1024}MB 이하입니다.</p></details>
          <details><summary>‘제출 완료’와 ‘확인 완료’는 무엇이 다른가요?</summary><p>제출 완료는 파일이 접수되었다는 뜻이고, 확인 완료는 담당자가 지원서 내용과 대조를 마쳤다는 뜻입니다. 보완이 필요하면 항목별로 사유와 기한을 안내합니다.</p></details>
          <details><summary>메일을 못 받았어요.</summary><p>발표된 결과는 메일 수신 여부와 관계없이 로그인 후 ‘내 지원현황’에서 확인할 수 있습니다.</p></details>
        </div>
      </section>`, 'jobs');
  },
  actions: {
    'scroll-jobs': () => document.getElementById('jobs')?.scrollIntoView({ behavior: 'smooth' }),
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
