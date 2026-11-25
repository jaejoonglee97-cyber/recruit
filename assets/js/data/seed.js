// 데모 설정값
// 이 파일의 공고·직무·담당자·일정은 모두 시제품 시연용 가상 정보입니다.
// 실제 채용 운영 전에는 기획서 17장 '운영자가 확정할 항목'을 반영해 바꿔야 합니다.

/** 한국시간(KST) 일시를 UTC ISO 문자열로 변환 — 내부 저장은 UTC, 표시는 Asia/Seoul (기획서 8.2) */
export const kst = (y, m, d, h = 0, mi = 0, s = 0) =>
  new Date(Date.UTC(y, m - 1, d, h - 9, mi, s)).toISOString();

export const ORG = {
  name: '아산나눔재단',
  siteTitle: '아산나눔재단 채용',
  contact: '채용 담당자 recruit@example.com (데모용 가상 주소)',
  /** 재단 공식 채널 — 푸터에 표시 */
  sns: [
    { key: 'facebook', label: '페이스북', url: 'https://www.facebook.com/TheAsanNanum' },
    { key: 'blog', label: '네이버 블로그', url: 'https://blog.naver.com/asan_nanum' },
    { key: 'youtube', label: '유튜브', url: 'https://www.youtube.com/channel/UCGcV3lb8krcPJqxW4Pi0ofg' },
  ],
};

export const DATA_VERSION = 4;

/** 데모 기준 시각. 실제 시계 대신 이 값부터 흐른다. */
export const DEMO_CLOCK_DEFAULT = kst(2026, 11, 24, 10, 0);
export const CLOCK_PRESETS = [
  { id: 'default', label: '기본: 증빙 제출 기간 중 (11/24 10:00)', at: kst(2026, 11, 24, 10, 0) },
  { id: 'before-deadline', label: '증빙 마감 1분 전 (11/25 11:58)', at: kst(2026, 11, 25, 11, 58, 0) },
  { id: 'after-deadline', label: '증빙 마감 직후 (11/25 12:00)', at: kst(2026, 11, 25, 12, 0, 0) },
  { id: 'interview-day', label: '면접 당일 아침 (11/26 09:00)', at: kst(2026, 11, 26, 9, 0) },
  { id: 'after-interview', label: '면접 종료 후 (11/28 10:00)', at: kst(2026, 11, 28, 10, 0) },
  { id: 'apply-open', label: '하반기 공채 접수 기간 (11/10 14:00)', at: kst(2026, 11, 10, 14, 0) },
];

export const ESSAY_LIMITS = { short: 700, long: 1000 };

export const JOBS = [
  {
    id: 'J26H2',
    title: '2026년 하반기 신규 직원 채용',
    employment: '정규직 (수습 3개월)',
    filter: { category: ['사업 매니저', '경영지원'], career: '신입·경력', type: '정규직', place: '서울' },
    place: '서울 (재단 사무실)',
    apply: { from: kst(2026, 11, 3, 10, 0), to: kst(2026, 11, 16, 23, 59, 59) },
    positions: ['P1', 'P2', 'P3', 'P4'],
    allowResubmit: false,
    allowDuplicate: false,
    evidenceDeadline: kst(2026, 11, 25, 11, 59, 59),
    summary: '기업가정신 교육, 청년창업 지원, 사회혁신 사업과 경영지원을 함께할 동료를 찾습니다.',
    schedule: [
      { key: 'apply', label: '서류 접수', from: kst(2026, 11, 3, 10, 0), to: kst(2026, 11, 16, 23, 59, 59) },
      { key: 'screening', label: '서류심사', from: kst(2026, 11, 17), to: kst(2026, 11, 20, 18, 0) },
      { key: 'screening_result', label: '서류전형 결과 발표', at: kst(2026, 11, 21, 10, 0) },
      { key: 'evidence', label: '증빙서류 제출 마감', at: kst(2026, 11, 25, 11, 59, 59) },
      { key: 'interview', label: '면접전형', from: kst(2026, 11, 26), to: kst(2026, 11, 27, 18, 0), note: '개인별 일시 안내' },
      { key: 'final_result', label: '최종 결과 발표', at: kst(2026, 12, 4, 10, 0), tentative: true },
    ],
    questions: [
      { key: 'intro', label: '자기소개', min: 300, limit: 1000, help: '본인을 잘 보여주는 경험과 강점을 중심으로 작성해 주세요.' },
      { key: 'motive', label: '지원동기', min: 300, limit: 1000, help: '재단과 지원 직무를 선택한 이유를 작성해 주세요.' },
      { key: 'experience', label: '직무 관련 경험', min: 300, limit: 1000, help: '지원 직무와 관련된 경험과 그 결과를 구체적으로 작성해 주세요.' },
    ],
    changes: [
      { at: kst(2026, 11, 3, 10, 0), text: '공고 게시' },
      { at: kst(2026, 11, 6, 15, 20), text: '증빙서류 안내에 “경력증명서 제출이 어려운 경우 4대보험 자격득실확인서로 대체 가능” 문구 추가' },
    ],
  },
  {
    id: 'J26MARU',
    title: '2026 MARU 커뮤니티 매니저 수시채용',
    employment: '계약직 (1년, 평가 후 연장 가능)',
    filter: { category: ['사업 매니저'], career: '경력 1년 이상', type: '계약직', place: '서울' },
    place: '서울 (MARU 공간)',
    apply: { from: kst(2026, 11, 20, 10, 0), to: kst(2026, 12, 7, 23, 59, 59) },
    positions: ['M1'],
    allowResubmit: true,
    allowDuplicate: false,
    evidenceDeadline: null,
    summary: '창업가 커뮤니티 프로그램을 기획·운영할 커뮤니티 매니저를 찾습니다.',
    schedule: [
      { key: 'apply', label: '서류 접수', from: kst(2026, 11, 20, 10, 0), to: kst(2026, 12, 7, 23, 59, 59) },
      { key: 'screening', label: '서류심사', tbd: true },
      { key: 'screening_result', label: '서류전형 결과 발표', tbd: true },
      { key: 'interview', label: '면접전형', tbd: true },
      { key: 'final_result', label: '최종 결과 발표', tbd: true },
    ],
    questions: [
      { key: 'intro', label: '자기소개', limit: 700, help: '본인을 소개해 주세요.' },
      { key: 'motive', label: '지원동기', limit: 700, help: '이 직무에 지원한 이유를 작성해 주세요.' },
      { key: 'experience', label: '커뮤니티 운영 경험', limit: 1000, help: '모임·커뮤니티를 기획하거나 운영한 경험을 작성해 주세요.' },
    ],
    changes: [{ at: kst(2026, 11, 20, 10, 0), text: '공고 게시' }],
  },
  {
    id: 'J27H1',
    title: '2027년 상반기 신입·경력 공개채용',
    employment: '정규직',
    filter: { category: ['사업 매니저', '경영지원'], career: '신입·경력', type: '정규직', place: '서울' },
    place: '서울',
    apply: { from: kst(2027, 1, 12, 10, 0), to: null },
    positions: [],
    allowResubmit: false,
    allowDuplicate: false,
    evidenceDeadline: null,
    summary: '모집 직무와 세부 일정은 추후 안내합니다.',
    schedule: [
      { key: 'apply', label: '서류 접수', from: kst(2027, 1, 12, 10, 0), to: null, note: '마감일 추후 안내' },
      { key: 'screening', label: '서류심사', tbd: true },
      { key: 'interview', label: '면접전형', tbd: true },
      { key: 'final_result', label: '최종 결과 발표', tbd: true },
    ],
    questions: [],
    changes: [{ at: kst(2026, 11, 18, 9, 0), text: '사전 안내 게시' }],
  },
  {
    id: 'J26H1',
    title: '2026년 상반기 경력직 채용',
    employment: '정규직',
    filter: { category: ['사업 매니저'], career: '경력 3년 이상', type: '정규직', place: '서울' },
    place: '서울',
    apply: { from: kst(2026, 5, 11, 10, 0), to: kst(2026, 5, 24, 23, 59, 59) },
    positions: ['H1'],
    closed: true,
    allowResubmit: false,
    allowDuplicate: false,
    evidenceDeadline: null,
    summary: '채용이 종료된 공고입니다.',
    schedule: [
      { key: 'apply', label: '서류 접수', from: kst(2026, 5, 11, 10, 0), to: kst(2026, 5, 24, 23, 59, 59) },
      { key: 'final_result', label: '최종 결과 발표', at: kst(2026, 6, 19, 10, 0) },
    ],
    questions: [],
    changes: [{ at: kst(2026, 5, 11, 10, 0), text: '공고 게시' }],
  },
];

export const POSITIONS = {
  P1: {
    id: 'P1', jobId: 'J26H2', name: '기업가정신 교육 사업 매니저', code: '기업가정신교육', headcount: 1,
    duties: ['청소년·청년 대상 기업가정신 교육 프로그램 기획·운영', '학교·지역 교육 파트너 협력', '교육 성과 측정과 보고'],
    quals: ['교육 또는 비영리 사업 운영 경력 3년 이상 (신입 지원 가능)', '이해관계자와 원활하게 소통하는 분'],
    prefs: ['기업가정신·창업교육 운영 경험', '교육 성과 분석 경험'],
  },
  P2: {
    id: 'P2', jobId: 'J26H2', name: '청년창업 지원(MARU) 프로그램 매니저', code: '청년창업지원', headcount: 1,
    duties: ['초기 창업팀 보육 프로그램 운영', '창업가 커뮤니티·네트워킹 행사 기획', '투자·파트너 연계'],
    quals: ['창업 지원, 액셀러레이팅 또는 스타트업 실무 경력 3년 이상'],
    prefs: ['창업 경험', '데모데이·투자 연계 행사 운영 경험'],
  },
  P3: {
    id: 'P3', jobId: 'J26H2', name: '사회혁신 사업 매니저', code: '사회혁신', headcount: 1,
    duties: ['사회혁신 지원사업 기획·운영', '공모·선정·성과관리', '사회혁신 생태계 파트너십'],
    quals: ['비영리·공공·사회적경제 분야 사업 경력 3년 이상'],
    prefs: ['리빙랩·시민참여 프로젝트 경험', '사회적가치 측정 경험'],
  },
  P4: {
    id: 'P4', jobId: 'J26H2', name: '경영지원(재무·회계) 담당', code: '경영지원', headcount: 1,
    duties: ['결산·세무 신고', '예산 편성과 집행 관리', '공익법인 공시와 기부금 관리'],
    quals: ['재무·회계 실무 경력 2년 이상 (신입 지원 가능)'],
    prefs: ['공익법인·비영리 회계 경험', '전산회계·재경관리사 등 관련 자격'],
  },
  M1: {
    id: 'M1', jobId: 'J26MARU', name: 'MARU 커뮤니티 매니저', code: 'MARU커뮤니티', headcount: 1,
    duties: ['창업가 커뮤니티 프로그램 기획·운영', '입주·멤버십 운영 지원', '커뮤니티 콘텐츠 제작'],
    quals: ['커뮤니티·행사 운영 경험 1년 이상'],
    prefs: ['스타트업 생태계 이해', '디자인 툴 활용 가능'],
  },
  H1: {
    id: 'H1', jobId: 'J26H1', name: '사업 매니저(경력)', code: '사업매니저', headcount: 1,
    duties: ['사업 기획·운영'], quals: ['관련 경력 3년 이상'], prefs: [],
  },
};

/** 담당자·심사위원 (가상 인물) */
export const STAFF = [
  { id: 'S1', name: '한지수', role: 'recruiter', title: '채용 담당자', team: '경영지원실' },
  { id: 'S2', name: '오민석', role: 'approver', title: '채용 책임자', team: '경영지원실' },
  { id: 'S3', name: '윤가람', role: 'verifier', title: '증빙 확인 담당자', team: '경영지원실' },
  { id: 'E1', name: '이도경', role: 'evaluator', title: '심사위원', team: '사업총괄', assigned: ['P1', 'P2', 'P3', 'M1'] },
  { id: 'E2', name: '최유진', role: 'evaluator', title: '심사위원', team: '경영지원실', assigned: ['P1', 'P2', 'P4', 'M1'] },
  { id: 'E3', name: '정하늘', role: 'evaluator', title: '외부 심사위원', team: '교육 분야', assigned: ['P1', 'P3', 'P4'] },
  { id: 'E4', name: '박현우', role: 'evaluator', title: '외부 심사위원', team: '창업 분야', assigned: ['P2', 'P3', 'P4', 'M1'] },
];

export const ROLES = {
  recruiter: { label: '채용 담당자', nav: ['dashboard', 'applicants', 'review-status', 'evidence', 'interviews', 'publish', 'notifications', 'audit', 'personas'] },
  approver: { label: '채용 책임자', nav: ['dashboard', 'applicants', 'interviews', 'publish', 'notifications', 'audit', 'personas'] },
  verifier: { label: '증빙 확인 담당자', nav: ['evidence'] },
  evaluator: { label: '심사위원', nav: ['review'] },
};

export const RUBRIC = {
  screening: [
    { key: 'fit', label: '직무 적합성', max: 30 },
    { key: 'exp', label: '경험·역량', max: 30 },
    { key: 'mission', label: '미션 이해·지원동기', max: 20 },
    { key: 'doc', label: '서술 완성도', max: 20 },
  ],
  final: [
    { key: 'pro', label: '직무 전문성', max: 40 },
    { key: 'comm', label: '소통·협업', max: 30 },
    { key: 'value', label: '가치 적합성', max: 30 },
  ],
};

export const STAGES = {
  screening: { label: '서류전형', short: '서류' },
  final: { label: '면접·최종', short: '최종' },
};

export const CONSENT_VERSION = '채용 진행 개인정보 안내 v2026.11 (데모)';

export const UPLOAD_POLICY = {
  exts: ['pdf', 'jpg', 'jpeg', 'png'],
  maxFile: 20 * 1024 * 1024,
  maxTotal: 100 * 1024 * 1024,
};

export const INTERVIEW_PLACE = {
  place: '재단 사무실 3층 회의실 (데모용 가상 정보)',
  waiting: '3층 라운지에서 대기',
  mode: '대면 개인 면접 (약 20분)',
  bring: '신분증',
};

/** 공고 필터 분류 — 그리팅 채용 홈의 직군·경력사항·고용형태·근무지 필터에 대응 */
export const JOB_FILTERS = [
  { key: 'category', label: '직군' },
  { key: 'career', label: '경력사항' },
  { key: 'type', label: '고용형태' },
  { key: 'place', label: '근무지' },
];

/** 채용 알림 구독 시 고를 수 있는 관심 직군 */
export const ALERT_CATEGORIES = ['사업 매니저', '경영지원', '체험형 인턴'];
export const ALERT_CONSENT_VERSION = '채용 알림 수신 동의 v2026.11 (데모)';

/**
 * 채용 브랜드 홈 콘텐츠.
 * 일하는 방식·근무 환경·FAQ 문구는 현재 운영 중인 그리팅 채용 홈(asannanum.career.greetinghr.com)의
 * 공개 문구를 요약해 옮긴 것입니다. 실제 게시 전 재단 담당자의 최신 문구 확인이 필요합니다.
 * 이 파일만 고치면 화면이 바뀌므로, 운영 버전에서는 관리자 화면(CMS)에서 편집하도록 옮기면 됩니다.
 */
export const CAREER_SITE = {
  vision: '할 수 있다고 생각하면 이룰 수 있는 세상',
  about: '청년 창업가와 사회혁신가가 도전하고, 성장하고, 나누는 기반을 만들고자 합니다.',
  aboutDetail: '아산나눔재단은 2011년 10월, 아산 정주영 명예회장의 10주기를 맞아 출범한 공익재단입니다. 기업가정신 교육, 청년창업 지원, 사회혁신 지원, 혁신 생태계 조성 사업으로 기업가정신을 확산합니다.',
  areas: [
    { name: '기업가정신 교육', text: '청소년·청년이 문제를 발견하고 해결해 보는 경험을 만듭니다.' },
    { name: '청년창업 지원', text: '창업 플랫폼 MARU에서 공간·네트워크·교육을 제공합니다.' },
    { name: '사회혁신 지원', text: '사회문제를 새로운 방식으로 푸는 혁신가를 지원합니다.' },
    { name: '혁신 생태계 조성', text: '연구·콘텐츠·네트워크로 기업가정신 생태계를 넓힙니다.' },
  ],
  principles: [
    { en: 'Strategic Social Impact', ko: '전략적 사회성과', text: '우리가 하는 모든 활동은 재단의 미션과 비전을 달성하기 위함입니다.' },
    { en: 'Aim Higher', ko: '담대한 목표 추구', text: '더 나은 결과물에 대한 표준을 세우기 위한 작은 시도들을 멈추지 않습니다.' },
    { en: 'Self-directed Learning', ko: '주도적 학습', text: '새로운 것에 대한 호기심과 배우고 성장하려는 욕구가 나와 조직을 함께 키웁니다.' },
    { en: 'Disciplined Autonomy', ko: '자율 속의 규율', text: '공익법인의 일원으로서 엄격한 윤리의식을 바탕으로 품격 있게 말하고 행동합니다.' },
    { en: 'Diversity & Inclusivity', ko: '다양성 존중과 포용', text: '개개인의 강점과 몰입하는 방식이 다르다는 점을 인정하고 배려합니다.' },
    { en: 'Extreme Transparency', ko: '최고 수준의 정보 공유', text: '최고 수준의 자율성은 최고 수준의 공유에서 나옵니다.' },
    { en: 'One ASAN', ko: '경계 없는 협업', text: '높은 목표를 위해 팀의 경계 없이 협업합니다.' },
  ],
  benefits: [
    { name: '선택 근무제', text: '10분 단위로 출퇴근 시각을 정하고, 4시간 이후에는 유연하게 조정합니다.' },
    { name: '하이브리드 근무', text: '그날의 업무에 맞춰 일할 장소를 고릅니다.' },
    { name: '워케이션 지원', text: '휴양지에서 일할 수 있도록 숙박·식비 일부를 지원합니다.' },
    { name: '자유로운 휴가', text: '2시간 단위부터 장기 휴가까지 필요한 만큼 나눠 씁니다.' },
    { name: '수평적 소통', text: '상호 존댓말과 ‘님’ 호칭을 기본으로 합니다.' },
    { name: '동호회 지원', text: '자발적으로 꾸린 취미 모임을 지원합니다.' },
    { name: '교육 지원', text: '외부 교육·세미나·컨퍼런스 참가비, 장기근속자 대학원 학비를 지원합니다.' },
    { name: '팀 워크숍', text: '팀이 스스로 기획하는 워크숍을 지원합니다.' },
    { name: '출산·양육 지원', text: '임신·육아기 근로시간 단축, 자녀 교육비를 지원합니다.' },
    { name: '장기근속 리프레시', text: '3·6·10년 근속 시 휴가와 포상금을 드립니다.' },
    { name: '신규입사자 적응 지원', text: '3개월간 버디 프로그램으로 적응을 돕습니다.' },
    { name: '건강검진', text: '매년 본인과 가족 2인의 종합검진을 지원합니다.' },
  ],
  faq: [
    { q: '여러 공고에 중복 지원할 수 있나요?', a: '한 공고에만 지원할 수 있습니다. 인턴 채용은 한 팀에만 지원할 수 있습니다.' },
    { q: '자격 요건의 경력 기준에 맞지 않아도 지원할 수 있나요?', a: '네. 기재한 요건은 일반적인 기준이며, 그에 준하는 경험과 역량이 있다면 지원할 수 있습니다.' },
    { q: '포트폴리오·경력기술서 같은 추가 서류를 내지 않으면 불이익이 있나요?', a: '없습니다. 추가 서류는 선택이며 심사 결과에 영향을 주지 않습니다.' },
    { q: '서류전형 결과는 어떻게 알 수 있나요?', a: '발표일에 이 사이트의 ‘내 지원현황’에서 확인할 수 있고, 이메일로도 안내합니다. 메일을 받지 못해도 사이트에서 결과를 확인할 수 있습니다. 일정이 바뀌면 전체 지원자에게 알립니다.' },
  ],
};
