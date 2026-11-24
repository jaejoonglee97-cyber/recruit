// 가상 채용지원자 페르소나 75명
// - 이름·연락처·학교·기관·경력은 모두 지어낸 값이며 실존 인물·기관과 무관합니다.
// - 이메일은 예시용 예약 도메인(example.com), 전화번호는 010-0000-XXXX 형식의 더미 값입니다.
// - 각 페르소나는 기획서 16장 검수 시나리오(임시저장, 마감, 보완, 반송 등)를 재현하도록 설계했습니다.
//
// 필드: n 이름, p 지원분야, a 유형, y 경력연수, s 한 줄 배경, dev 주 사용기기, lit 디지털 숙련도,
//       need 지원 과정의 니즈·우려, r 서류 결과(pass/reserve/fail/withdrawn/draft),
//       e 증빙 상태(합격자만), i 면접 응답(합격자만), f 시나리오 플래그, deg 학력 예외, cur 재직 여부,
//       mj·gmj 학부·대학원 전공 지정

import { kst, JOBS, POSITIONS, STAFF, RUBRIC, INTERVIEW_PLACE, CONSENT_VERSION } from './seed.js';

export const PERSONA_ROWS = [
  // ── P1 기업가정신 교육 사업 매니저 (22명) ──
  { n: '김서연', p: 'P1', a: 'npo', y: 6, s: '청소년 진로교육 비영리단체에서 6년간 기업가정신 캠프와 교사 연수를 기획·운영', dev: 'PC', lit: '상', need: '근무처 2곳의 경력증명서 발급 일정 확인 필요', r: 'pass', e: 'verified', i: 'yes', f: ['reapplicant'] },
  { n: '이준혁', p: 'P1', a: 'edu', y: 4, s: '교육 스타트업에서 고교 창업동아리 커리큘럼을 개발하고 강사 40명을 관리', dev: '모두', lit: '상', need: '재직 중이라 면접 시간 조율이 필요할 수 있음', r: 'pass', e: 'pending', i: 'yes', f: ['last-minute'] },
  { n: '박지안', p: 'P1', a: 'research', y: 3, s: '교육학 석사 후 청소년 정책 연구소에서 기업가정신 교육 효과성 연구 수행', dev: 'PC', lit: '중', need: '학사·석사 학력증명을 모두 내야 하는지 궁금함', r: 'pass', e: 'revision', i: 'none', deg: 'ma' },
  { n: '최유나', p: 'P1', a: 'sw', y: 5, s: '종합사회복지관에서 청소년 진로 프로그램을 5년 운영하고 지역 창업가 멘토링을 연계', dev: '모바일', lit: '중', need: 'PC가 없어 휴대폰으로 서류를 촬영해 업로드', r: 'pass', e: 'partial', i: 'yes', f: ['encrypted', 'mobile'] },
  { n: '정민재', p: 'P1', a: 'startup', y: 4, s: '에듀테크 스타트업 운영 매니저로 온라인 창업교육 수강생 3천 명을 관리', dev: '모두', lit: '상', need: '증빙을 항목별로 따로 올리고 싶어 함', r: 'pass', e: 'none', i: 'ask' },
  { n: '강하은', p: 'P1', a: 'public', y: 7, s: '지자체 청년센터에서 7년간 청년 창업교육과 공모사업을 담당', dev: 'PC', lit: '중', need: '기존 방식대로 모든 증빙을 PDF 하나로 합쳐 제출', r: 'pass', e: 'merged', i: 'yes' },
  { n: '조성훈', p: 'P1', a: 'edu', y: 3, s: '평생교육원에서 성인 대상 창업 기초과정을 3년간 기획', dev: 'PC', lit: '중', need: '예비합격의 의미와 이후 연락 시점이 궁금함', r: 'reserve' },
  { n: '윤소희', p: 'P1', a: 'grad', mj: '경영학', y: 0, s: '경영학 전공 신입, 대학 창업동아리 회장과 교육 NGO 인턴 6개월 경험', dev: '모바일', lit: '상', need: '다른 기관 최종 합격으로 지원 철회', r: 'withdrawn', f: ['intern'] },
  { n: '장도현', p: 'P1', a: 'grad', mj: '교육학', y: 0, s: '교육학 전공 졸업예정자, 지원서 작성 중 자기소개 단계에서 이탈', dev: '모바일', lit: '중', need: '글자 수 제한과 임시저장 여부를 확인하지 못함', r: 'draft', deg: 'ba-expected' },
  { n: '임채원', p: 'P1', a: 'career_break', y: 6, s: '출산·육아로 4년 경력 단절 후 이전 교육기관 6년 경력으로 재도전', dev: 'PC', lit: '하', need: '임시저장 후 접수 마감 시각을 놓침', r: 'draft', cur: false },
  { n: '한승민', p: 'P1', a: 'csr', y: 3, s: '대기업 사회공헌팀에서 임직원 봉사 프로그램을 3년 운영', dev: 'PC', lit: '상', need: '기업가정신 교육과의 직무 연관성 설명이 부족했음', r: 'fail' },
  { n: '오지현', p: 'P1', a: 'grad', mj: '사회학', y: 0, s: '사회학 전공 신입, 교육봉사 동아리 2년 활동', dev: '모바일', lit: '상', need: '이메일 주소 오타로 결과 메일이 반송됨', r: 'fail', f: ['bounce'] },
  { n: '서예린', p: 'P1', a: 'edu', y: 2, s: '초등 방과후 코딩 강사 2년', dev: '모두', lit: '중', need: '프리랜서 강의 경력의 증빙 방법이 궁금함', r: 'fail' },
  { n: '신동혁', p: 'P1', a: 'startup', y: 2, s: '커머스 스타트업 마케팅 2년, 교육 분야로 전환 희망', dev: 'PC', lit: '상', need: '직무 전환 사유를 어떻게 쓸지 고민', r: 'fail' },
  { n: '권나래', p: 'P1', a: 'npo', y: 2, s: '환경 NGO 교육팀에서 2년간 시민교육 프로그램 운영', dev: 'PC', lit: '중', need: '', r: 'fail' },
  { n: '황민지', p: 'P1', a: 'master_new', mj: '경영학', gmj: '경영학', y: 0, s: '경영학 석사 신입, 사회적기업 연구 조교 경험', dev: 'PC', lit: '상', need: '서술형에 출신 학교를 적어 블라인드 심사에서 가림 처리 필요', r: 'fail', f: ['blind-risk'] },
  { n: '안재석', p: 'P1', a: 'public', y: 5, s: '구청 일자리센터 상담원 5년', dev: 'PC', lit: '하', need: '온라인 지원서가 익숙하지 않아 전화로 문의', r: 'fail' },
  { n: '송다인', p: 'P1', a: 'sw', y: 3, s: '지역아동센터 사회복지사 3년, 아동 경제교육 진행', dev: '모바일', lit: '중', need: '', r: 'fail' },
  { n: '전우진', p: 'P1', a: 'founder', y: 3, s: '대학생 때 공유 스터디카페를 창업했다가 폐업, 창업 경험을 강점으로 제시', dev: '모두', lit: '상', need: '실패 경험을 어떻게 서술할지 고민', r: 'fail', cur: false },
  { n: '홍수아', p: 'P1', a: 'grad', mj: '교육공학', y: 0, s: '교육공학 전공 신입, 교육 콘텐츠 공모전 수상', dev: '모바일', lit: '상', need: '', r: 'fail' },
  { n: '고은비', p: 'P1', a: 'consult', y: 3, s: '교육 컨설팅사 연구원 3년, 학교 진로교육 컨설팅', dev: 'PC', lit: '상', need: '', r: 'fail' },
  { n: '문태윤', p: 'P1', a: 'csr', y: 6, s: '금융사 CSR 담당 6년, 청소년 금융교육 사업 운영', dev: 'PC', lit: '중', need: '공고에 처우 정보가 없어 문의', r: 'fail' },

  // ── P2 청년창업 지원(MARU) 프로그램 매니저 (20명) ──
  { n: '양지훈', p: 'P2', a: 'ac', y: 5, s: '액셀러레이터 심사역 5년, 초기 스타트업 120개 사 보육 프로그램 운영', dev: 'PC', lit: '상', need: '', r: 'pass', e: 'verified', i: 'yes' },
  { n: '손가영', p: 'P2', a: 'startup', y: 6, s: '핀테크 스타트업 공동창업 멤버이자 운영 총괄로 6년 근무', dev: '모두', lit: '상', need: '현재 회사 재직증명서는 바로 발급 가능', r: 'pass', e: 'verified', i: 'yes' },
  { n: '배현철', p: 'P2', a: 'ac', y: 4, s: '창업보육센터 매니저 4년, 데모데이·투자 연계 행사 30회 운영', dev: 'PC', lit: '중', need: '메일 주소를 잘못 입력해 결과 메일이 반송됐지만 웹에서 결과 확인', r: 'pass', e: 'pending', i: 'yes', f: ['bounce'] },
  { n: '백서윤', p: 'P2', a: 'startup', y: 3, s: '커뮤니티 기반 스타트업에서 창업가 네트워킹 프로그램을 3년 기획', dev: '모바일', lit: '상', need: '보완 요청을 받고 발급일이 최신인 재직증명서로 다시 제출', r: 'pass', e: 'resubmitted', i: 'none', f: ['mobile'] },
  { n: '허준영', p: 'P2', a: 'founder', y: 4, s: '푸드테크 창업 4년 후 회사를 매각하고 창업가 지원 직무로 전환', dev: '모두', lit: '상', need: '법인 대표 경력을 무엇으로 증빙할지 불명확', r: 'pass', e: 'partial', i: 'yes', cur: false },
  { n: '유하린', p: 'P2', a: 'startup', y: 3, s: '3년 근무한 스타트업이 폐업해 경력증명서 대신 4대보험 자격득실확인서를 제출', dev: '모두', lit: '중', need: '회사 폐업으로 경력증명서 발급 불가', r: 'pass', e: 'substitute', i: 'no', cur: false },
  { n: '남기현', p: 'P2', a: 'public', y: 4, s: '중소벤처 지원기관에서 창업지원 사업을 4년 담당', dev: 'PC', lit: '중', need: '', r: 'reserve' },
  { n: '심예지', p: 'P2', a: 'ac', y: 2, s: 'VC 애널리스트 2년, 지원서 제출 후 개인 사정으로 철회', dev: 'PC', lit: '상', need: '철회 후 재지원 가능 여부 문의', r: 'withdrawn' },
  { n: '노승민', p: 'P2', a: 'grad', mj: '창업학', y: 0, s: '창업학 연계전공 신입, 마감 하루 전 작성 시작', dev: '모바일', lit: '중', need: '모바일에서 경력 항목 추가 버튼을 찾지 못함', r: 'draft' },
  { n: '하윤서', p: 'P2', a: 'startup', y: 2, s: 'SaaS 스타트업 CS 매니저 2년', dev: 'PC', lit: '상', need: '', r: 'fail' },
  { n: '곽민호', p: 'P2', a: 'csr', y: 4, s: '제조 대기업 오픈이노베이션팀 4년, 스타트업 협업 프로그램 담당', dev: 'PC', lit: '상', need: '', r: 'fail' },
  { n: '성다은', p: 'P2', a: 'grad', mj: '경영학', y: 0, s: '경영학 신입, 창업경진대회 수상 2회', dev: '모바일', lit: '상', need: '', r: 'fail' },
  { n: '차준혁', p: 'P2', a: 'founder', y: 2, s: '1인 콘텐츠 창업 2년, 창업가 커뮤니티 운영', dev: '모두', lit: '상', need: '', r: 'fail' },
  { n: '주은정', p: 'P2', a: 'npo', y: 3, s: '사회적기업 지원 중간지원조직 3년', dev: 'PC', lit: '중', need: '', r: 'fail' },
  { n: '우상현', p: 'P2', a: 'consult', y: 5, s: '경영컨설팅사 5년, 스타트업 사업계획 자문', dev: 'PC', lit: '상', need: '', r: 'fail' },
  { n: '구혜린', p: 'P2', a: 'master_new', gmj: '기술경영학', y: 0, s: '기술경영 석사 신입', dev: 'PC', lit: '상', need: '', r: 'fail' },
  { n: '민경호', p: 'P2', a: 'public', y: 6, s: '공공기관 R&D 사업 관리 6년', dev: 'PC', lit: '중', need: '', r: 'fail' },
  { n: '진소율', p: 'P2', a: 'startup', y: 1, s: '스타트업 인턴 포함 경력 1년', dev: '모바일', lit: '상', need: '', r: 'fail' },
  { n: '나현우', p: 'P2', a: 'ac', y: 3, s: '지역 창업보육센터 3년', dev: 'PC', lit: '중', need: '', r: 'fail' },
  { n: '지수빈', p: 'P2', a: 'grad', mj: '시각디자인학', y: 0, s: '디자인 전공 신입, 창업 동아리 운영', dev: '모바일', lit: '상', need: '', r: 'fail' },

  // ── P3 사회혁신 사업 매니저 (18명) ──
  { n: '엄태호', p: 'P3', a: 'npo', y: 8, s: '지역 사회혁신 중간지원조직 8년, 리빙랩 프로젝트 20건 운영', dev: 'PC', lit: '상', need: '', r: 'pass', e: 'verified', i: 'yes' },
  { n: '채윤아', p: 'P3', a: 'research', y: 4, s: '사회혁신 정책연구소 연구원 4년, 사회적가치 측정 연구', dev: 'PC', lit: '상', need: '박사과정 수료 학력의 증빙 범위 확인 필요', r: 'pass', e: 'pending', i: 'yes', deg: 'phd-c' },
  { n: '원지수', p: 'P3', a: 'sw', y: 6, s: '장애인복지관 6년, 돌봄 문제 해결 시민참여 프로젝트 기획', dev: '모바일', lit: '중', need: '', r: 'pass', e: 'pending', i: 'none', f: ['mobile'] },
  { n: '천승현', p: 'P3', a: 'consult', y: 5, s: '임팩트 투자사 심사역 5년, 사회적경제 기업 실사', dev: 'PC', lit: '상', need: '경력증명서에 주민등록번호 뒷자리가 그대로 노출됨', r: 'pass', e: 'revision', i: 'yes', f: ['rrn-exposed'] },
  { n: '방서진', p: 'P3', a: 'csr', y: 5, s: '기업 재단 사회공헌 사업 PM 5년, 공모사업 운영', dev: '모두', lit: '상', need: '면접 일정과 기존 출장이 겹쳐 문의', r: 'pass', e: 'none', i: 'ask' },
  { n: '공민준', p: 'P3', a: 'npo', y: 3, s: '청년 사회혁신가 네트워크 활동가 3년', dev: '모바일', lit: '상', need: '', r: 'reserve' },
  { n: '현채린', p: 'P3', a: 'grad', mj: '도시계획학', y: 0, s: '도시계획 전공 신입, 접수 마감 4분 뒤 제출 버튼을 누름', dev: '모바일', lit: '중', need: '마감 이후 제출을 시도해 접수되지 않음', r: 'draft', f: ['late-apply'] },
  { n: '함도윤', p: 'P3', a: 'npo', y: 2, s: '주거권 NGO 활동가 2년', dev: 'PC', lit: '중', need: '', r: 'fail' },
  { n: '변수정', p: 'P3', a: 'public', y: 4, s: '시청 협치 담당 주무관 4년', dev: 'PC', lit: '중', need: '상반기 채용에도 지원했던 재지원자', r: 'fail', f: ['reapplicant'] },
  { n: '염재훈', p: 'P3', a: 'research', y: 2, s: '사회적경제 연구센터 연구보조원 2년', dev: 'PC', lit: '상', need: '', r: 'fail' },
  { n: '여은서', p: 'P3', a: 'grad', mj: '사회복지학', y: 0, s: '사회복지학 전공 신입', dev: '모바일', lit: '상', need: '', r: 'fail' },
  { n: '추민성', p: 'P3', a: 'startup', y: 3, s: '소셜벤처 운영 매니저 3년', dev: '모두', lit: '상', need: '', r: 'fail' },
  { n: '도하영', p: 'P3', a: 'csr', y: 2, s: 'ESG 컨설팅 주니어 2년', dev: 'PC', lit: '상', need: '', r: 'fail' },
  { n: '소정우', p: 'P3', a: 'sw', y: 4, s: '노인복지관 사회복지사 4년', dev: '모바일', lit: '하', need: '파일 업로드 방식이 낯섦', r: 'fail' },
  { n: '석지아', p: 'P3', a: 'master_new', gmj: '공공정책학', y: 0, s: '공공정책 석사 신입', dev: 'PC', lit: '상', need: '', r: 'fail' },
  { n: '선우진', p: 'P3', a: 'founder', y: 3, s: '로컬 크리에이터 창업 3년', dev: '모두', lit: '상', need: '', r: 'fail' },
  { n: '설예준', p: 'P3', a: 'npo', y: 5, s: '국제개발 NGO 5년', dev: 'PC', lit: '상', need: '', r: 'fail' },
  { n: '마서현', p: 'P3', a: 'career_break', y: 5, s: '경력 단절 3년 후 재취업 준비, 이전 NPO 경력 5년', dev: 'PC', lit: '중', need: '', r: 'fail', cur: false },

  // ── P4 경영지원(재무·회계) 담당 (15명) ──
  { n: '길현정', p: 'P4', a: 'finance', y: 7, s: '제조업 재무팀 7년, 결산·세무신고 실무', dev: 'PC', lit: '상', need: '', r: 'pass', e: 'verified', i: 'yes' },
  { n: '연준기', p: 'P4', a: 'npo_fin', y: 5, s: '공익법인 회계 담당 5년, 결산 공시와 기부금 영수증 관리', dev: 'PC', lit: '상', need: '', r: 'pass', e: 'verified', i: 'yes' },
  { n: '위다현', p: 'P4', a: 'finance', y: 4, s: '회계법인 감사본부 4년', dev: 'PC', lit: '상', need: '', r: 'pass', e: 'pending', i: 'none' },
  { n: '표승아', p: 'P4', a: 'npo_fin', y: 3, s: '사회복지법인 회계 3년', dev: '모두', lit: '중', need: '어학성적표는 선택 서류라 제출하지 않음', r: 'pass', e: 'partial', i: 'yes', f: ['no-optional'] },
  { n: '명재윤', p: 'P4', a: 'finance', y: 5, s: 'IT 기업 경영지원 5년, 급여·4대보험 관리', dev: 'PC', lit: '중', need: '', r: 'pass', e: 'none', i: 'yes' },
  { n: '기은지', p: 'P4', a: 'finance', y: 3, s: '스타트업 재무 담당 3년', dev: 'PC', lit: '상', need: '', r: 'reserve' },
  { n: '반태민', p: 'P4', a: 'finance', y: 2, s: '세무사무소 2년', dev: 'PC', lit: '중', need: '메일함 용량 초과로 결과 메일 반송', r: 'fail', f: ['bounce'] },
  { n: '왕지혜', p: 'P4', a: 'grad', mj: '회계학', y: 0, s: '회계학 전공 신입, 전산회계 1급 보유', dev: '모바일', lit: '상', need: '', r: 'fail' },
  { n: '금소연', p: 'P4', a: 'npo_fin', y: 2, s: '지역 재단 회계 보조 2년', dev: 'PC', lit: '중', need: '상반기 채용에도 지원했던 재지원자', r: 'fail', f: ['reapplicant'] },
  { n: '옥준서', p: 'P4', a: 'finance', y: 6, s: '유통사 자금팀 6년', dev: 'PC', lit: '상', need: '', r: 'fail' },
  { n: '육민아', p: 'P4', a: 'career_break', y: 4, s: '경력 단절 후 재취업, 회계 실무 4년', dev: 'PC', lit: '하', need: '', r: 'fail', cur: false },
  { n: '인하늘', p: 'P4', a: 'grad', mj: '경영학', y: 0, s: '경영학 전공 신입, 재경관리사 보유', dev: '모바일', lit: '상', need: '', r: 'fail' },
  { n: '제서우', p: 'P4', a: 'finance', y: 3, s: '건설사 원가관리 3년', dev: 'PC', lit: '중', need: '', r: 'fail' },
  { n: '탁건우', p: 'P4', a: 'public', y: 5, s: '공공기관 예산 담당 5년', dev: 'PC', lit: '중', need: '', r: 'fail' },
  { n: '봉수진', p: 'P4', a: 'npo_fin', y: 4, s: '협동조합 회계 4년', dev: '모두', lit: '중', need: '', r: 'fail' },
];

// ───────────────────────── 생성 규칙 ─────────────────────────

const ARCH = {
  npo: { label: '비영리 사업 경력', orgs: ['(사)푸른내일', '사단법인 함께걷는길', '재단법인 내일학교', '(사)청소년미래네트워크', '사단법인 마을온', '비영리법인 다음세대랩'], titles: ['사업 매니저', '선임 매니저', '프로그램 코디네이터', '팀장'], duties: ['공모사업 기획·운영', '참여자 모집과 성과 관리', '후원기관 보고서 작성', '지역 파트너십 구축'], certs: ['사회복지사 2급', '평생교육사 2급'], ma: 0.2 },
  edu: { label: '교육 기획·운영', orgs: ['꿈틀교육협동조합', '주식회사 러닝스테이션', '내일진로교육센터', '한울평생교육원'], titles: ['교육기획 매니저', '커리큘럼 개발자', '교육운영 팀장', '강사'], duties: ['교육과정 설계', '강사 섭외·관리', '교육 만족도 분석', '학교 협력 프로그램 운영'], certs: ['평생교육사 2급', '청소년지도사 2급'], major: '교육학', ma: 0.3 },
  startup: { label: '스타트업 실무', orgs: ['주식회사 스텝업랩', '주식회사 모아데이', '주식회사 로컬픽', '주식회사 코드온', '주식회사 바른식탁'], titles: ['운영 매니저', '커뮤니티 매니저', '프로덕트 매니저', '사업개발 매니저'], duties: ['서비스 운영 지표 관리', '고객·커뮤니티 운영', '신규 사업 기획', '파트너 제휴'], certs: ['컴퓨터활용능력 1급'], ma: 0.1 },
  ac: { label: '액셀러레이터·투자', orgs: ['씨앗파트너스', '주식회사 넥스트런치', '그로우업벤처스', '오픈스프링 액셀러레이터', '한빛창업보육센터'], titles: ['심사역', '보육 매니저', '프로그램 매니저', '애널리스트'], duties: ['초기 기업 발굴·심사', '보육 프로그램 운영', '데모데이 기획', '투자 연계'], certs: ['투자자산운용사', '경영지도사'], ma: 0.35 },
  csr: { label: '기업 사회공헌·ESG', orgs: ['한결건설 사회공헌팀', '미래생명보험 CSR팀', '주식회사 다온유통 ESG팀', '가온금융 사회공헌재단'], titles: ['CSR 담당', '사회공헌 PM', 'ESG 매니저', '대리'], duties: ['임직원 봉사 프로그램 운영', '사회공헌 성과 보고', '공모사업 운영', '파트너 NPO 관리'], certs: ['사회조사분석사 2급'], ma: 0.15 },
  public: { label: '공공·지자체 사업', orgs: ['가람시청 청년정책과', '한빛구 일자리센터', '지역혁신진흥원', '누리시 청년센터'], titles: ['주무관', '사업 담당', '전문위원', '상담원'], duties: ['청년 정책사업 운영', '공모·보조사업 관리', '예산 집행 관리', '민관 협력 회의 운영'], certs: ['직업상담사 2급', '컴퓨터활용능력 2급'], ma: 0.2 },
  sw: { label: '사회복지 현장', orgs: ['늘푸른종합사회복지관', '해밀지역아동센터', '한마음장애인복지관', '다솜노인복지관'], titles: ['사회복지사', '팀장', '주임'], duties: ['사례관리', '지역사회 조직화', '프로그램 기획·평가', '자원 연계'], certs: ['사회복지사 1급', '사회복지사 2급'], major: '사회복지학', ma: 0.2 },
  research: { label: '정책·연구', orgs: ['사회혁신정책연구소', '한빛대학교 사회적경제연구센터', '미래공익연구원'], titles: ['연구원', '선임연구원', '연구보조원'], duties: ['정책 연구 보고서 작성', '설문·인터뷰 조사 설계', '성과 측정 지표 개발'], certs: ['사회조사분석사 2급'], ma: 1 },
  grad: { label: '신입', orgs: [], titles: [], duties: [], certs: ['컴퓨터활용능력 1급', '한국사능력검정 1급'], ma: 0 },
  master_new: { label: '석사 신입', orgs: [], titles: [], duties: [], certs: ['사회조사분석사 2급'], ma: 1 },
  finance: { label: '재무·회계', orgs: ['주식회사 한솔물산 재무팀', '세움회계법인', '주식회사 가온테크 경영지원팀', '다온유통 자금팀', '한결건설 원가관리팀', '바름세무회계사무소'], titles: ['재무 담당', '회계 감사', '경영지원 매니저', '대리', '과장'], duties: ['월·연 결산', '세무 신고', '자금 집행 관리', '급여·4대보험 관리', '내부통제 점검'], certs: ['전산회계 1급', '재경관리사', '세무회계 2급'], major: '회계학', ma: 0.1 },
  npo_fin: { label: '비영리 회계', orgs: ['재단법인 나눔빛 경영지원팀', '(사)희망연대 회계팀', '사회복지법인 온누리', '한빛지역재단'], titles: ['회계 담당', '경영지원 주임', '회계 보조'], duties: ['공익법인 결산 공시', '기부금 영수증 발급 관리', '보조금 정산', '예산 편성 지원'], certs: ['전산회계 1급'], major: '회계학', ma: 0.05 },
  consult: { label: '컨설팅·임팩트 투자', orgs: ['임팩트브릿지컨설팅', '소셜밸류파트너스', '한빛교육컨설팅'], titles: ['컨설턴트', '선임 컨설턴트', '심사역'], duties: ['사업 진단·전략 수립', '임팩트 실사', '성과 측정 보고서 작성'], certs: ['경영지도사'], ma: 0.4 },
  founder: { label: '창업 경험', orgs: ['주식회사 오늘의텃밭', '주식회사 리필스테이션', '주식회사 스터디하우스', '주식회사 바이트랩', '주식회사 로컬그로서'], titles: ['대표', '공동창업자'], duties: ['사업 총괄', '투자 유치', '팀 빌딩'], certs: [], ma: 0.05 },
  career_break: { label: '경력 단절 후 재도전', orgs: [], titles: [], duties: [], certs: ['컴퓨터활용능력 2급'], ma: 0 },
};
const BREAK_BASE = { P1: 'edu', P2: 'startup', P3: 'npo', P4: 'npo_fin' };

const SCHOOLS = ['한빛대학교', '누리대학교', '가온대학교', '다솜대학교', '미르대학교', '한결대학교', '새솔대학교', '아라대학교', '온새미대학교', '해든대학교', '보람대학교', '늘봄대학교'];
const MAJORS = {
  P1: ['교육학', '경영학', '사회학', '청소년지도학', '교육공학', '심리학'],
  P2: ['경영학', '경제학', '산업공학', '창업학', '컴퓨터공학', '국제통상학'],
  P3: ['사회학', '행정학', '도시계획학', '사회복지학', '정치외교학', '환경공학'],
  P4: ['회계학', '경영학', '세무학', '경제학'],
};
const GRAD_MAJORS = { P1: '교육학', P2: '기술경영학', P3: '공공정책학', P4: '회계학' };
const LANGS = [['TOEIC', '865점'], ['TOEIC', '920점'], ['OPIc', 'IH'], ['OPIc', 'AL'], ['TOEFL iBT', '98점'], ['JLPT', 'N2'], ['HSK', '5급'], ['TOEIC Speaking', 'Level 7']];

const MOTIVE = {
  P1: '청소년과 청년이 스스로 문제를 발견하고 해결해 보는 기업가정신 교육의 가치를 현장에서 확인했습니다.',
  P2: '초기 창업가에게 필요한 것은 자금만큼이나 함께 고민할 동료와 네트워크라는 점을 실무에서 배웠습니다.',
  P3: '지역의 문제를 가장 잘 아는 사람들이 직접 해결책을 만들 때 변화가 오래간다는 것을 경험했습니다.',
  P4: '공익 사업이 신뢰를 얻으려면 투명한 재무 관리와 정확한 공시가 뒷받침되어야 한다고 생각합니다.',
};
const MOTIVE_END = {
  P1: '재단의 교육 프로그램이 더 많은 학교와 지역으로 확장되는 데 기여하고 싶습니다.',
  P2: 'MARU의 창업가 커뮤니티가 더 많은 팀의 성장으로 이어지도록 현장에서 뛰고 싶습니다.',
  P3: '재단의 사회혁신 지원사업이 현장의 변화로 이어지도록 파트너들과 함께 일하고 싶습니다.',
  P4: '재단 사업이 안정적으로 운영되도록 재무 기반을 단단하게 만드는 역할을 하고 싶습니다.',
};
const STRENGTH = ['사람과 자원을 연결해 성과를 만드는 일에 강점이 있습니다.', '숫자와 기록으로 일의 결과를 설명하는 습관을 가지고 있습니다.', '처음 하는 일도 빠르게 구조를 잡고 동료와 역할을 나누는 편입니다.', '현장의 목소리를 듣고 운영 방식을 고쳐 나가는 일을 좋아합니다.', '마감과 약속을 지키는 것을 가장 중요하게 생각합니다.'];
const ACHIEVE = ['참여자 만족도 4.6점(5점 만점)을 기록했습니다', '연간 운영 예산 3억 원 규모를 차질 없이 집행했습니다', '누적 참여자 1,200명 규모로 사업을 키웠습니다', '파트너 기관을 8곳에서 21곳으로 늘렸습니다', '운영 업무 시간을 주 6시간가량 줄였습니다', '결산 일정을 5영업일 단축했습니다'];
const GRAD_ACT = ['대학 창업동아리', '교육봉사 동아리', '지역 청년 공모전 팀', '학과 학생회 기획국'];

const COMMENTS = {
  high: ['직무 관련 경험이 구체적이며 재단 사업 이해도가 높음.', '성과를 수치로 제시해 역량 확인이 쉬움.', '지원동기와 직무 경험의 연결이 자연스러움.'],
  mid: ['경험은 충분하나 직무 연관성 서술이 다소 부족함.', '기본 역량은 확인되나 차별점이 약함.'],
  low: ['지원 직무와 경험의 연관성이 낮음.', '서술이 추상적이고 근거가 부족함.', '재단 사업 이해도가 낮게 보임.'],
};

// 시나리오 태그 — 기획서 16장 검수 시나리오 번호와 연결
export const SCENARIO_TAGS = {
  'r:draft': { label: '임시저장만', tone: 'neutral', sc: [1, 8] },
  'r:withdrawn': { label: '지원 철회', tone: 'neutral', sc: [] },
  'r:reserve': { label: '예비합격', tone: 'info', sc: [4, 5] },
  'e:verified': { label: '증빙 확인 완료', tone: 'success', sc: [] },
  'e:pending': { label: '증빙 확인 대기', tone: 'info', sc: [] },
  'e:revision': { label: '보완 요청', tone: 'warn', sc: [10] },
  'e:resubmitted': { label: '보완 후 재제출', tone: 'warn', sc: [10] },
  'e:partial': { label: '일부 제출', tone: 'warn', sc: [7, 8] },
  'e:none': { label: '증빙 미제출', tone: 'danger', sc: [7] },
  'e:substitute': { label: '대체 서류(4대보험)', tone: 'info', sc: [] },
  'e:merged': { label: '통합 PDF 제출', tone: 'info', sc: [] },
  'i:ask': { label: '면접 일정 문의', tone: 'warn', sc: [12] },
  'i:no': { label: '면접 불참 응답', tone: 'neutral', sc: [] },
  'i:none': { label: '면접 응답 없음', tone: 'neutral', sc: [] },
  'f:last-minute': { label: '마감 직전 접수', tone: 'info', sc: [3] },
  'f:late-apply': { label: '마감 후 제출 시도', tone: 'danger', sc: [3] },
  'f:bounce': { label: '메일 반송', tone: 'danger', sc: [11] },
  'f:encrypted': { label: '암호화 PDF 오류', tone: 'danger', sc: [9] },
  'f:reapplicant': { label: '재지원자', tone: 'neutral', sc: [] },
  'f:blind-risk': { label: '서술형 학교명 기재', tone: 'warn', sc: [13] },
  'f:rrn-exposed': { label: '주민번호 노출 서류', tone: 'danger', sc: [] },
  'f:no-optional': { label: '선택 서류 미제출', tone: 'neutral', sc: [7] },
  'f:mobile': { label: '모바일 업로드', tone: 'neutral', sc: [] },
};

export function personaTags(row) {
  const keys = [`r:${row.r}`];
  if (row.e) keys.push(`e:${row.e}`);
  if (row.i && row.i !== 'yes') keys.push(`i:${row.i}`);
  for (const f of row.f || []) if (SCENARIO_TAGS[`f:${f}`]) keys.push(`f:${f}`);
  return keys.filter((k) => SCENARIO_TAGS[k]).map((k) => ({ key: k, ...SCENARIO_TAGS[k] }));
}

// ───────────────────────── 생성기 ─────────────────────────

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function tools(seed) {
  const rng = mulberry32(seed);
  return {
    rng,
    pick: (arr) => arr[Math.floor(rng() * arr.length)],
    int: (a, b) => a + Math.floor(rng() * (b - a + 1)),
    chance: (p) => rng() < p,
    shuffle: (arr) => { const c = arr.slice(); for (let i = c.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [c[i], c[j]] = [c[j], c[i]]; } return c; },
  };
}
const pad = (n, w = 2) => String(n).padStart(w, '0');
const ym = (y, m) => `${y}.${pad(m)}`;
const addMin = (iso, min) => new Date(new Date(iso).getTime() + min * 60000).toISOString();

function buildEducation(row, t) {
  const arch = ARCH[row.a];
  const edu = [];
  const majorPool = MAJORS[row.p];
  const baMajor = row.mj || arch.major || t.pick(majorPool);
  let hasMa = row.deg === 'ma' || row.deg === 'phd-c' || t.chance(arch.ma);
  if (row.a === 'grad' || row.a === 'career_break') hasMa = false;
  const extraGap = t.int(0, 1);
  const careerStartYear = 2026 - row.y - (row.y === 0 ? 0 : extraGap) - (row.cur === false && row.a === 'career_break' ? 3 : 0);
  let baEnd = careerStartYear;
  if (hasMa) baEnd -= 2;
  if (row.deg === 'phd-c') baEnd -= 3;
  const schoolA = t.pick(SCHOOLS);
  if (row.deg === 'ba-expected') {
    edu.push({ id: 'e1', school: schoolA, major: baMajor, degree: '학사', status: '졸업예정', from: ym(2023, 3), to: ym(2027, 2) });
  } else {
    edu.push({ id: 'e1', school: schoolA, major: baMajor, degree: '학사', status: '졸업', from: ym(baEnd - 4, 3), to: ym(baEnd, 2) });
  }
  if (hasMa) {
    const schoolB = t.chance(0.5) ? schoolA : t.pick(SCHOOLS);
    const maMajor = row.gmj || (row.a === 'research' && row.p !== 'P1' ? '사회정책학' : GRAD_MAJORS[row.p]);
    edu.push({ id: 'e2', school: `${schoolB} 대학원`, major: maMajor, degree: '석사', status: '졸업', from: ym(baEnd, 3), to: ym(baEnd + 2, 2) });
    if (row.deg === 'phd-c') {
      edu.push({ id: 'e3', school: `${schoolB} 대학원`, major: maMajor, degree: '박사', status: '수료', from: ym(baEnd + 2, 3), to: ym(baEnd + 5, 2) });
    }
  }
  return { edu, careerStartYear };
}

function buildCareer(row, t, careerStartYear) {
  const base = row.a === 'career_break' ? ARCH[BREAK_BASE[row.p]] : ARCH[row.a];
  const career = [];
  if (row.f?.includes('intern')) {
    career.push({ id: 'c1', org: '재단법인 내일학교', title: '인턴', from: ym(2025, 7), to: ym(2025, 12), current: false, duties: '교육 프로그램 운영 지원, 참여자 설문 정리', intern: true });
    return career;
  }
  if (row.y === 0) return career;
  const months = row.y * 12 + t.int(0, 5);
  const n = row.y <= 2 ? 1 : row.y <= 5 ? (t.chance(0.5) ? 2 : 1) : t.chance(0.5) ? 3 : 2;
  const current = row.cur !== false;
  // 종료 시점: 재직 중이면 2026.11, 아니면 과거
  let endY = 2026, endM = 11;
  if (!current) {
    if (row.a === 'career_break') { endY = 2026 - (row.p === 'P1' ? 4 : 3); endM = 2; }
    else { endY = 2026; endM = t.int(3, 8); }
  }
  // 경력 시작은 졸업 후로 맞춘다
  let cursor = endY * 12 + endM;
  const startLimit = careerStartYear * 12 + 3;
  if (cursor - months < startLimit) cursor = startLimit + months;
  const orgs = t.shuffle(base.orgs.length ? base.orgs : ['주식회사 한빛']);
  const split = [];
  let remain = months;
  for (let k = 0; k < n; k++) {
    const share = k === n - 1 ? remain : Math.max(12, Math.round(months / n + t.int(-6, 6)));
    split.push(share); remain -= share;
  }
  const entries = [];
  for (let k = 0; k < n; k++) {
    const len = split[k];
    const toIdx = cursor;
    const fromIdx = cursor - len + 1;
    cursor = fromIdx - 1;
    const isLatest = k === 0;
    let org = orgs[k % orgs.length];
    const title = row.a === 'founder' && isLatest ? t.pick(base.titles) : t.pick(base.titles.length ? base.titles : ['매니저']);
    const duty = t.shuffle(base.duties.length ? base.duties : ['사업 운영']).slice(0, 2).join(', ');
    entries.push({
      org,
      title,
      from: ym(Math.floor((fromIdx - 1) / 12), ((fromIdx - 1) % 12) + 1),
      to: isLatest && current ? null : ym(Math.floor((toIdx - 1) / 12), ((toIdx - 1) % 12) + 1),
      current: isLatest && current,
      duties: isLatest ? `${duty} 등. ${row.s}` : duty,
    });
  }
  entries.forEach((e, i) => career.push({ id: `c${i + 1}`, ...e }));
  return career;
}

function buildCerts(row, t) {
  const arch = row.a === 'career_break' ? ARCH[BREAK_BASE[row.p]] : ARCH[row.a];
  const certs = [];
  const pool = t.shuffle(arch.certs);
  const nc = Math.min(pool.length, t.int(0, 2));
  for (let k = 0; k < nc; k++) certs.push({ id: `q${certs.length + 1}`, kind: 'cert', name: pool[k], issuer: pool[k].includes('사회복지사') ? '보건복지부(가상 표기)' : '발급기관(가상)', date: ym(t.int(2015, 2025), t.int(1, 12)), score: '' });
  if (t.chance(0.6) || row.f?.includes('no-optional')) {
    const [name, score] = t.pick(LANGS);
    certs.push({ id: `q${certs.length + 1}`, kind: 'lang', name, issuer: '시험기관', date: ym(t.int(2024, 2026), t.int(1, 10)), score });
  }
  return certs;
}

function buildEssays(row, t, edu, career) {
  const latest = career[0];
  const strength = t.pick(STRENGTH);
  const blindSchool = row.f?.includes('blind-risk') ? `${edu[edu.length - 1].school}에서 공부하며 ` : '';
  const intro = `${blindSchool}${row.s}해 왔습니다. ${strength} ${row.y > 0 ? `${row.y}년 동안 일하며 가장 중요하게 배운 것은 참여하는 사람의 입장에서 과정을 설계하는 일입니다.` : '사회에 첫발을 내딛는 만큼 배우는 속도와 성실함으로 기여하겠습니다.'}`;
  const motive = `${MOTIVE[row.p]} ${ARCH[row.a].label} 경험을 바탕으로 ${POSITIONS[row.p].duties[0]} 업무에서 바로 기여할 수 있다고 생각합니다. ${MOTIVE_END[row.p]}`;
  let experience;
  if (latest && !latest.intern) {
    experience = `${latest.org}에서 ${latest.title}(으)로 일하며 ${latest.duties.split('.')[0]}을(를) 맡았습니다. 이 과정에서 ${t.pick(ACHIEVE)}. 일이 막힐 때마다 현장의 의견을 다시 듣고 운영 방식을 고친 경험이 이 직무에서도 도움이 될 것입니다.`;
  } else {
    const act = t.pick(GRAD_ACT);
    experience = `${act}에서 ${t.int(1, 3)}년간 활동하며 행사 기획과 참여자 모집을 맡았습니다. 참여자 의견을 설문으로 모아 다음 회차 운영에 반영했고, 그 결과 재참여율이 높아졌습니다. 작은 규모였지만 처음부터 끝까지 책임지고 운영해 본 경험입니다.`;
  }
  return { intro, motive, experience };
}

function screeningTarget(row, rankInOutcome) {
  if (row.r === 'pass') return 91 - rankInOutcome * 1.5;
  if (row.r === 'reserve') return 78;
  return Math.max(50, 72 - rankInOutcome * 1.6);
}

function makeScores(target, rubric, t) {
  const scores = {};
  let total = 0;
  for (const c of rubric) {
    const ratio = Math.min(1, Math.max(0.3, (target + t.int(-3, 3)) / 100));
    const v = Math.round(c.max * ratio);
    scores[c.key] = v; total += v;
  }
  return { scores, total };
}

function evidenceRequirements(app) {
  const items = [];
  for (const e of app.form.education) {
    const label = `${e.school} ${e.major} ${e.degree}`;
    if (e.status === '졸업') {
      items.push({ id: `${e.id}-grad`, group: 'education', link: e.id, type: '졸업증명서', label: `${label} 졸업증명서`, required: true });
      items.push({ id: `${e.id}-tr`, group: 'education', link: e.id, type: '성적증명서', label: `${label} 성적증명서`, required: true });
    } else if (e.status === '수료') {
      items.push({ id: `${e.id}-grad`, group: 'education', link: e.id, type: '수료증명서', label: `${label} 수료증명서`, required: true });
      items.push({ id: `${e.id}-tr`, group: 'education', link: e.id, type: '성적증명서', label: `${label} 성적증명서`, required: true });
    } else {
      items.push({ id: `${e.id}-grad`, group: 'education', link: e.id, type: '졸업예정증명서', label: `${label} 졸업예정증명서`, required: true });
    }
  }
  for (const c of app.form.career) {
    if (c.intern) continue;
    items.push({ id: `${c.id}-cert`, group: 'career', link: c.id, type: '경력증명서 또는 재직증명서', alt: '4대보험 자격득실확인서', label: `${c.org} 경력증명서 또는 재직증명서`, required: true });
  }
  for (const q of app.form.certs) {
    items.push({ id: `${q.id}-copy`, group: 'optional', link: q.id, type: q.kind === 'lang' ? '어학성적표' : '자격증 사본', label: `${q.name} ${q.kind === 'lang' ? '성적표' : '사본'}`, required: false });
  }
  return items.map((it) => ({ ...it, status: 'none', files: [], temp: null, review: null, history: [], substitute: null }));
}

let fileSeq = 1;
function fakeFile(name, t, at, extra = {}) {
  return { id: `F${pad(fileSeq++, 4)}`, name, size: t.int(140, 2600) * 1024, pages: t.int(1, 3), version: 1, uploadedAt: at, scan: 'passed', ...extra };
}

function applyEvidenceState(app, row, t, persona) {
  const items = app.evidence.items;
  const deadline = JOBS[0].evidenceDeadline;
  app.evidence.deadline = deadline;
  const reqs = items.filter((i) => i.required);
  const opts = items.filter((i) => !i.required);
  const subAt = (d, h, m) => kst(2026, 11, d, h, m);
  const submitItem = (it, at, status = 'pending') => {
    const fname = `${it.type.split(' ')[0]}_${persona.name}.pdf`;
    it.files.push(fakeFile(fname, t, at));
    it.status = status;
    it.submittedAt = at;
    it.history.push({ at, text: `${fname} 제출 (v1)` });
  };
  const verify = (it, at) => { it.status = 'verified'; it.review = { result: 'verified', by: 'S3', at }; it.history.push({ at, text: '담당자 확인 완료' }); };
  const e = row.e;
  if (e === 'verified') {
    const at = subAt(21, t.int(13, 22), t.int(0, 59));
    reqs.forEach((it) => submitItem(it, at));
    opts.forEach((it) => submitItem(it, at));
    [...reqs, ...opts].forEach((it) => verify(it, subAt(22, t.int(10, 17), t.int(0, 59))));
    app.evidence.finalizedAt = at;
  } else if (e === 'pending') {
    const at = subAt(t.int(22, 23), t.int(9, 23), t.int(0, 59));
    reqs.forEach((it) => submitItem(it, at));
    opts.forEach((it) => { if (t.chance(0.6)) submitItem(it, at); });
    app.evidence.finalizedAt = at;
  } else if (e === 'revision' || e === 'resubmitted') {
    const at = subAt(22, t.int(9, 20), t.int(0, 59));
    reqs.forEach((it) => submitItem(it, at));
    opts.forEach((it) => submitItem(it, at));
    const target = row.f?.includes('rrn-exposed') ? reqs.find((i) => i.group === 'career') || reqs[0] : reqs.find((i) => i.type === '성적증명서') || reqs[0];
    reqs.forEach((it) => { if (it !== target) verify(it, subAt(23, 11, t.int(0, 59))); });
    const reason = row.f?.includes('rrn-exposed')
      ? '주민등록번호 뒷자리가 보입니다. 뒷자리를 가린 파일로 다시 제출해 주세요.'
      : e === 'resubmitted' ? '발급일이 3개월을 넘었습니다. 최근 3개월 안에 발급한 서류로 다시 제출해 주세요.' : '일부 학기 성적이 누락되어 있습니다. 전체 학기가 포함된 성적증명서를 제출해 주세요.';
    const revAt = subAt(23, 15, 0);
    target.status = 'revision';
    target.review = { result: 'revision', by: 'S3', at: revAt, reason, due: kst(2026, 11, 25, 18, 0) };
    target.history.push({ at: revAt, text: `보완 요청: ${reason}` });
    if (e === 'resubmitted') {
      const reAt = subAt(24, 9, 12);
      const f2 = fakeFile(`${target.type.split(' ')[0]}_${persona.name}_재발급.pdf`, t, reAt, { version: 2 });
      target.files.push(f2);
      target.status = 'pending';
      target.submittedAt = reAt;
      target.history.push({ at: reAt, text: `${f2.name} 재제출 (v2) · 이전 확인 결과는 승계되지 않음` });
      target.review = { ...target.review, superseded: true };
    }
    app.evidence.finalizedAt = at;
  } else if (e === 'partial') {
    const at = subAt(23, t.int(19, 23), t.int(0, 59));
    const half = Math.max(1, Math.floor(reqs.length / 2));
    reqs.slice(0, half).forEach((it) => submitItem(it, at));
    if (!row.f?.includes('no-optional')) opts.slice(0, 1).forEach((it) => submitItem(it, at));
    if (row.f?.includes('encrypted')) {
      const it = reqs[half] || reqs[0];
      it.temp = { name: `${it.type.split(' ')[0]}_${persona.name}_암호.pdf`, size: 812 * 1024, state: 'error', error: 'encrypted', at: subAt(24, 8, 41) };
      it.status = 'error';
      it.history.push({ at: subAt(24, 8, 41), text: '업로드 파일 검사 실패: 비밀번호가 걸린 PDF' });
    }
    app.evidence.finalizedAt = at;
  } else if (e === 'substitute') {
    const at = subAt(22, 20, 31);
    reqs.forEach((it) => {
      if (it.group === 'career') {
        it.files.push(fakeFile(`4대보험자격득실확인서_${persona.name}.pdf`, t, at));
        it.substitute = { doc: '4대보험 자격득실확인서', reason: '근무했던 회사가 폐업해 경력증명서 발급이 불가능합니다.' };
        it.status = 'pending'; it.submittedAt = at;
        it.history.push({ at, text: '대체 서류(4대보험 자격득실확인서) 제출' });
      } else submitItem(it, at);
    });
    app.evidence.finalizedAt = at;
  } else if (e === 'merged') {
    const at = subAt(22, 23, 47);
    const all = [...reqs, ...opts];
    const merged = fakeFile(`${POSITIONS[row.p].code}_${persona.name}.pdf`, t, at, { pages: all.length * 2, size: 6710886, merged: true });
    let page = 1;
    all.forEach((it) => {
      const span = it.type === '성적증명서' ? 2 : 1;
      it.files.push({ ...merged, range: `${page}${span > 1 ? `~${page + span - 1}` : ''}쪽` });
      page += span;
      it.status = 'pending'; it.submittedAt = at;
      it.history.push({ at, text: `통합 PDF ${merged.name}의 ${it.files[0].range}에 연결` });
    });
    app.evidence.finalizedAt = at;
  }
  // none: 아무것도 제출하지 않음
}

/** 75명 페르소나 → 계정·지원서·평가·증빙·면접·알림·감사 기록 */
export function buildDataset() {
  fileSeq = 1;
  const accounts = [];
  const applications = [];
  const notifications = [];
  const audit = [];
  let notifSeq = 1;
  let auditSeq = 1;
  const pushNotif = (n) => notifications.push({ id: `N${pad(notifSeq++, 4)}`, attempts: 1, ...n });
  const pushAudit = (a) => audit.push({ id: `L${pad(auditSeq++, 4)}`, ...a });
  const staff = (id) => STAFF.find((s) => s.id === id);

  pushAudit({ at: kst(2026, 11, 2, 15, 0), actor: 'S1', action: '공고 등록', target: 'J26H2', detail: '2026년 하반기 신규 직원 채용 (4개 직무)' });
  pushAudit({ at: kst(2026, 11, 6, 15, 20), actor: 'S1', action: '공고 수정', target: 'J26H2', detail: '증빙 대체 서류 안내 문구 추가 (변경 이력 공개)' });

  // 결과별 순위 (점수 생성용)
  const rankCounter = {};
  const rowsWithIdx = PERSONA_ROWS.map((row, idx) => ({ row, idx }));
  let receipt = 1;

  for (const { row, idx } of rowsWithIdx) {
    const t = tools(20261124 + idx * 7919);
    const no = pad(idx + 1, 3);
    const accId = `U${no}`;
    const email = `applicant${no}@example.com`;
    const persona = {
      no: idx + 1, name: row.n, archetype: ARCH[row.a].label, years: row.y, summary: row.s,
      device: row.dev, literacy: row.lit, need: row.need || '특이사항 없음', tags: personaTags(row),
      outcome: row.r, evidence: row.e || null, interview: row.i || null,
    };
    accounts.push({ id: accId, email, name: row.n, phone: `010-0000-${pad(idx + 1, 4)}`, createdAt: kst(2026, 11, 3 + (idx % 10), 9, idx % 60), verifiedAt: kst(2026, 11, 3 + (idx % 10), 9, idx % 60), bounce: row.f?.includes('bounce') || false, persona });

    const { edu, careerStartYear } = buildEducation(row, t);
    const career = buildCareer(row, t, careerStartYear);
    const certs = buildCerts(row, t);
    const essays = buildEssays(row, t, edu, career);
    const form = { positionId: row.p, name: row.n, email, phone: `010-0000-${pad(idx + 1, 4)}`, education: edu, career, certs, essays, consent: { version: CONSENT_VERSION, at: null } };

    const app = {
      id: `A${no}`, jobId: 'J26H2', positionId: row.p, accountId: accId,
      status: 'draft', receiptNo: null, submittedAt: null, savedAt: null, versions: [], form,
      stages: { screening: { internal: null, public: null }, final: { internal: null, public: null } },
      reviews: { screening: [], final: [] },
      evidence: { required: false, items: [], finalizedAt: null, deadline: null, late: false },
      interview: null, memos: [], withdrawnAt: null, lateAttemptAt: null,
    };

    // 접수 시각
    let subAt;
    if (row.f?.includes('last-minute')) subAt = kst(2026, 11, 16, 23, 58, 12);
    else {
      const day = Math.min(16, 3 + Math.floor(Math.pow(t.rng(), 0.6) * 14));
      subAt = kst(2026, 11, day, t.int(day === 3 ? 10 : 7, 23), t.int(0, 59), t.int(0, 59));
    }

    if (row.r === 'draft') {
      const savedAt = row.f?.includes('late-apply') ? kst(2026, 11, 16, 23, 41, 5) : kst(2026, 11, t.int(12, 16), t.int(9, 22), t.int(0, 59));
      app.savedAt = savedAt;
      if (row.f?.includes('late-apply')) app.lateAttemptAt = kst(2026, 11, 17, 0, 3, 22);
      if (row.n === '장도현') { form.essays = { intro: '저는 교육학을 전공하며 ', motive: '', experience: '' }; }
      if (row.n === '노승민') { form.career = []; form.essays.experience = ''; }
      applications.push(app);
      continue;
    }

    form.consent.at = addMin(subAt, -3);
    app.status = 'submitted';
    app.submittedAt = subAt;
    app.savedAt = addMin(subAt, -3);
    app.receiptNo = `2026H2-${pad(receipt++, 4)}`;
    app.versions.push({ no: 1, at: subAt });
    pushNotif({ appId: app.id, accountId: accId, template: '접수 확인', event: 'submit', createdAt: addMin(subAt, 1), status: 'sent', lastAt: addMin(subAt, 1) });

    if (row.r === 'withdrawn') {
      app.status = 'withdrawn';
      app.withdrawnAt = row.n === '심예지' ? kst(2026, 11, 14, 9, 30) : kst(2026, 11, 18, 14, 20);
      app.withdrawReason = row.n === '심예지' ? '개인 사정' : '다른 기관 최종 합격';
      pushAudit({ at: app.withdrawnAt, actor: `U:${accId}`, action: '지원 철회', target: app.id, detail: app.withdrawReason });
      applications.push(app);
      continue;
    }

    // 서류심사 평가
    const key = `${row.p}:${row.r}`;
    const rank = rankCounter[key] = (rankCounter[key] ?? -1) + 1;
    const target = screeningTarget(row, rank);
    const evaluators = STAFF.filter((s) => s.role === 'evaluator' && s.assigned.includes(row.p));
    for (const ev of evaluators) {
      const { scores, total } = makeScores(target, RUBRIC.screening, t);
      const band = target >= 84 ? 'high' : target >= 74 ? 'mid' : 'low';
      app.reviews.screening.push({ evaluatorId: ev.id, scores, total, comment: t.pick(COMMENTS[band]), status: 'submitted', at: kst(2026, 11, t.int(17, 20), t.int(9, 17), t.int(0, 59)) });
    }
    app.stages.screening.internal = { result: row.r, at: kst(2026, 11, 20, 16, 30), by: 'S1' };
    app.stages.screening.public = { result: row.r, at: kst(2026, 11, 21, 10, 0) };
    const acc = accounts[accounts.length - 1];
    pushNotif({ appId: app.id, accountId: accId, template: row.r === 'pass' ? '서류전형 결과 · 증빙 제출·면접 안내' : '서류전형 결과 안내', event: 'screening_result', createdAt: kst(2026, 11, 21, 10, 0), status: acc.bounce ? 'bounced' : 'sent', lastAt: kst(2026, 11, 21, 10, 0, 30), error: acc.bounce ? (row.n === '반태민' ? '수신 메일함 용량 초과' : '수신 주소 없음 (오타 추정)') : null });

    if (row.r === 'pass') {
      app.evidence.required = true;
      app.evidence.items = evidenceRequirements(app);
      applyEvidenceState(app, row, t, { name: row.n });
      if (app.evidence.finalizedAt) {
        pushNotif({ appId: app.id, accountId: accId, template: '증빙 제출 확인', event: 'evidence_submitted', createdAt: addMin(app.evidence.finalizedAt, 1), status: 'sent', lastAt: addMin(app.evidence.finalizedAt, 1) });
      }
      if (row.e === 'revision' || row.e === 'resubmitted') {
        pushNotif({ appId: app.id, accountId: accId, template: '증빙 보완 요청', event: 'evidence_revision', createdAt: kst(2026, 11, 23, 15, 0), status: 'sent', lastAt: kst(2026, 11, 23, 15, 0, 20) });
        pushAudit({ at: kst(2026, 11, 23, 15, 0), actor: 'S3', action: '증빙 보완 요청', target: app.id, detail: '항목 1건' });
      }
      if (row.e === 'none' || row.e === 'partial') {
        pushNotif({ appId: app.id, accountId: accId, template: '증빙 마감 전 미제출 안내', event: 'reminder', createdAt: kst(2026, 11, 24, 18, 0), status: 'queued', lastAt: null, attempts: 0, scheduledAt: kst(2026, 11, 24, 18, 0) });
      }
    }
    applications.push(app);
  }

  // 면접 일정 (합격자, 직무별 순서)
  const slotStart = { P1: kst(2026, 11, 26, 10, 0), P2: kst(2026, 11, 26, 13, 15), P3: kst(2026, 11, 27, 10, 0), P4: kst(2026, 11, 27, 13, 30) };
  const slotIdx = { P1: 0, P2: 0, P3: 0, P4: 0 };
  for (const app of applications) {
    if (app.stages.screening.public?.result !== 'pass') continue;
    const row = PERSONA_ROWS[Number(app.id.slice(1)) - 1];
    const at = addMin(slotStart[app.positionId], 25 * slotIdx[app.positionId]++);
    app.interview = {
      at, arriveBy: addMin(at, -15), ...INTERVIEW_PLACE, version: 1,
      response: row.i === 'none' ? null : row.i,
      responseAt: row.i === 'none' ? null : kst(2026, 11, 21, 11 + (slotIdx[app.positionId] % 8), 12),
      responseNote: row.i === 'ask' ? (row.n === '방서진' ? '11/27 오전에 기존 출장 일정이 있어 오후 시간으로 조정이 가능한지 문의드립니다.' : '재직 중이라 오전 일정이 어렵습니다. 같은 날 오후로 조정이 가능할까요?') : row.i === 'no' ? '개인 사정으로 면접 참석이 어렵습니다. 기회를 주셔서 감사합니다.' : '',
      responseHandled: false,
      history: [{ version: 1, at: kst(2026, 11, 21, 10, 0), when: at, text: '면접 일정 최초 안내' }],
      attendance: null,
    };
  }

  // 감사 기록 요약
  pushAudit({ at: kst(2026, 11, 17, 9, 0), actor: 'S1', action: '심사위원 배정', target: 'J26H2', detail: '심사위원 4명 · 직무별 3명 배정' });
  pushAudit({ at: kst(2026, 11, 20, 16, 30), actor: 'S1', action: '서류전형 결과안 작성', target: 'J26H2', detail: '합격 22 · 예비 4 · 불합격 43' });
  pushAudit({ at: kst(2026, 11, 20, 17, 10), actor: 'S2', action: '서류전형 결과 확정', target: 'J26H2', detail: '확정·비공개' });
  pushAudit({ at: kst(2026, 11, 21, 10, 0), actor: 'S2', action: '서류전형 결과 공개', target: 'J26H2', detail: '69명 공개 · 알림 69건 등록' });
  pushAudit({ at: kst(2026, 11, 22, 17, 40), actor: 'S3', action: '증빙 파일 열람', target: 'A023', detail: '졸업증명서 외 3건' });
  pushAudit({ at: kst(2026, 11, 23, 11, 5), actor: 'S1', action: '내보내기', target: 'J26H2', detail: '내부 공유용 집계(연락처·서술형 제외) CSV' });

  // 재지원자의 지난 지원 건 (채용 종료 공고)
  let pastNo = 1;
  for (const row of PERSONA_ROWS) {
    if (!row.f?.includes('reapplicant')) continue;
    const idx = PERSONA_ROWS.indexOf(row);
    const base = applications[idx];
    const at = kst(2026, 5, 20 + pastNo, 14, 10);
    applications.push({
      id: `H${pad(pastNo, 3)}`, jobId: 'J26H1', positionId: 'H1', accountId: base.accountId, status: 'submitted',
      receiptNo: `2026H1-${pad(30 + pastNo, 4)}`, submittedAt: at, savedAt: at, versions: [{ no: 1, at }],
      form: { ...base.form, positionId: 'H1' },
      stages: { screening: { internal: { result: 'fail', at }, public: { result: 'fail', at: kst(2026, 6, 5, 10, 0) } }, final: { internal: null, public: null } },
      reviews: { screening: [], final: [] }, evidence: { required: false, items: [], finalizedAt: null, deadline: null, late: false },
      interview: null, memos: [], withdrawnAt: null, lateAttemptAt: null, past: true,
    });
    pastNo++;
  }

  notifications.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  audit.sort((a, b) => a.at.localeCompare(b.at));
  return { accounts, applications, notifications, audit, seq: { notif: notifSeq, audit: auditSeq, file: fileSeq, receiptMaru: 1 } };
}
