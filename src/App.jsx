import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { 
  Zap,
  ChevronRight, 
  Check, 
  RotateCcw, 
  Download, 
  Share2, 
  ArrowRight, 
  Target, 
  TrendingUp, 
  Users, 
  PieChart, 
  Briefcase, 
  User, 
  GraduationCap, 
  Code,
  Star,
  Activity,
  Award,
  AlertCircle,
  MousePointer2,
  Calendar,
  MessageSquare,
  Layout,
  Settings,
  Bot,
  FileText,
  BarChart2,
  X,
  RefreshCw
} from 'lucide-react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer,
  Tooltip
} from 'recharts';

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyBTQniqZqVhmWstvSLc3BfgpcL1cwmrCHQ",
  authDomain: "mbti-test-28f5c.firebaseapp.com",
  projectId: "mbti-test-28f5c",
  storageBucket: "mbti-test-28f5c.firebasestorage.app",
  messagingSenderId: "987516872468",
  appId: "1:987516872468:web:ef641ecd7ccf2760500401",
  measurementId: "G-24M9XK3V1X"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Data Models ---

const MAJORS = [
  "경영학과",
  "경제학과",
  "무역학과",
  "회계학과",
  "세무학과",
  "금융학과",
  "국제통상학과",
  "호텔경영학과",
  "관광경영학과",
  "마케팅학과",
  "광고홍보학과",
  "산업공학과 (상경 우대)",
  "통계학과",
  "기타 상경계열"
];

const DETAILED_SURVEY_QUESTIONS = {
  BUSINESS: [
    { id: 'b1', text: '기획서나 제안서 작성 시 논리적인 목차 구성이 가능한가요?' },
    { id: 'b2', text: '회의록을 작성하고 핵심 내용을 요약하여 공유하는 데 능숙한가요?' },
    { id: 'b3', text: '비즈니스 이메일 작성 시 격식과 예절을 지킬 수 있나요?' },
    { id: 'b4', text: '산업 동향이나 시장 조사를 통해 시사점을 도출해 본 경험이 있나요?' },
    { id: 'b5', text: '손익계산서 등 기초적인 재무 제표를 읽고 이해할 수 있나요?' }
  ],
  DATA: [
    { id: 'd1', text: 'Excel의 VLOOKUP, Pivot Table 등을 자유롭게 활용하나요?' },
    { id: 'd2', text: 'SQL을 사용하여 데이터베이스에서 원하는 데이터를 추출할 수 있나요?' },
    { id: 'd3', text: '데이터를 보고 유의미한 패턴이나 이상치를 발견할 수 있나요?' },
    { id: 'd4', text: 'Python/R 등을 활용한 데이터 전처리 및 분석 경험이 있나요?' },
    { id: 'd5', text: 'Tableau, PowerBI 등을 활용해 데이터를 시각화할 수 있나요?' }
  ],
  COMM: [
    { id: 'c1', text: '팀 프로젝트 수행 시 갈등 상황을 중재해 본 경험이 있나요?' },
    { id: 'c2', text: '자신의 의견을 논리적으로 말하여 타인을 설득할 수 있나요?' },
    { id: 'c3', text: '발표(프레젠테이션) 시 청중의 반응을 살피며 진행할 수 있나요?' },
    { id: 'c4', text: '피드백을 감정적으로 받아들이지 않고 업무에 반영하나요?' },
    { id: 'c5', text: '타 부서(또는 타 전공) 사람들과 원활하게 소통할 수 있나요?' }
  ],
  GLOBAL: [
    { id: 'g1', text: '영어(또는 제2외국어)로 일상적인 대화가 가능한가요?' },
    { id: 'g2', text: '외국어 이메일이나 문서를 읽고 핵심 내용을 파악할 수 있나요?' },
    { id: 'g3', text: '외국어로 진행되는 회의에서 의견을 제시할 수 있나요?' },
    { id: 'g4', text: '해외 문화나 비즈니스 매너에 대한 이해도가 있나요?' },
    { id: 'g5', text: 'OPIc IH/AL 또는 TOEIC 900점 이상의 어학 성적을 보유 중인가요?' }
  ],
  PROBLEM: [
    { id: 'p1', text: '복잡한 문제를 작은 단위로 쪼개어 구조화할 수 있나요?' },
    { id: 'p2', text: '예상치 못한 문제 발생 시 당황하지 않고 대안을 찾나요?' },
    { id: 'p3', text: '기존의 방식에 의문을 제기하고 새로운 방식을 제안해 본 적이 있나요?' },
    { id: 'p4', text: '문제 해결을 위해 필요한 리소스를 스스로 찾아낼 수 있나요?' },
    { id: 'p5', text: '실패한 경험에서 원인을 분석하고 교훈을 얻는 편인가요?' }
  ]
};

const JOB_TYPES = {
  SALES: { 
    id: 'sales', 
    name: '영업/영업관리', 
    desc: '매출 목표 달성을 위한 고객 관리 및 협상 전문가',
    subRoles: [
      { name: '기술 영업 (Technical Sales)', condition: 'DATA', desc: '제품의 기술적 특징을 데이터로 증명하여 설득하는 영업' },
      { name: '해외 영업 (Global Sales)', condition: 'GLOBAL', desc: '해외 시장을 개척하고 글로벌 바이어를 관리하는 영업' },
      { name: '기업 영업 (B2B Sales)', condition: 'COMM', desc: '기업 고객과의 장기적인 신뢰 관계를 구축하는 영업' }
    ]
  },
  MARKETING: { 
    id: 'mkt', 
    name: '마케팅/그로스', 
    desc: '시장 트렌드 분석 및 브랜드 전략 수립 기획자',
    subRoles: [
      { name: '퍼포먼스 마케터', condition: 'DATA', desc: '광고 데이터를 분석하여 효율을 극대화하는 마케터' },
      { name: '콘텐츠 마케터', condition: 'COMM', desc: '매력적인 스토리텔링으로 브랜드 팬덤을 만드는 마케터' },
      { name: '브랜드 마케터', condition: 'BUSINESS', desc: '브랜드의 중장기적인 전략과 이미지를 구축하는 마케터' }
    ]
  },
  STRATEGY: { 
    id: 'strategy', 
    name: '전략기획', 
    desc: '전사적 사업 방향성 수립 및 신사업 발굴 전략가',
    subRoles: [
      { name: '사업 기획', condition: 'PROBLEM', desc: '신규 사업 모델을 발굴하고 타당성을 검토하는 기획자' },
      { name: '경영 전략', condition: 'DATA', desc: '전사 데이터를 분석하여 경영 의사결정을 지원하는 전략가' },
      { name: '투자 심사 (VC)', condition: 'BUSINESS', desc: '유망한 스타트업이나 기업의 가치를 평가하는 심사역' }
    ]
  },
  FINANCE: { 
    id: 'finance', 
    name: '재무/회계', 
    desc: '자금 리스크 관리 및 재무 건전성 확보 전문가',
    subRoles: [
      { name: '재무 분석가 (FP&A)', condition: 'DATA', desc: '재무 데이터를 분석하여 미래 실적을 예측하는 전문가' },
      { name: '회계사 (CPA)', condition: 'BUSINESS', desc: '회계 감사를 수행하고 세무 이슈를 다루는 전문가' },
      { name: '자금 담당 (Treasury)', condition: 'PROBLEM', desc: '기업의 현금 유동성을 관리하고 자금을 조달하는 전문가' }
    ]
  },
  HR: { 
    id: 'hr', 
    name: '인사/HR', 
    desc: '조직 문화 구축 및 인적 자원 육성 전문가',
    subRoles: [
      { name: 'HR Analytics', condition: 'DATA', desc: '인사 데이터를 분석하여 채용과 평가를 고도화하는 전문가' },
      { name: '채용 담당 (Recruiter)', condition: 'COMM', desc: '우수한 인재를 발굴하고 입사를 설득하는 채용 전문가' },
      { name: '조직 문화 (Culture)', condition: 'PROBLEM', desc: '건강한 사내 문화를 만들고 직원 몰입을 돕는 전문가' }
    ]
  }
};

// 실제 공모전/서포터즈/프로젝트 데이터 (링커리어 스타일) - 실제 로고 이미지 포함
const ACTIVITIES_DATA = {
  SALES: [
    { type: '대외활동', title: '[UNIQLO] GLOBAL MANAGEMENT PROGRAM 2026', company: '에프알엘코리아 유니클로', deadline: 'D-87', views: 12471, comments: 3, prize: '글로벌 인턴십', tags: ['영업', '리테일'], logo: 'https://logo.clearbit.com/uniqlo.com', color: '#FF0000', isHot: true },
    { type: '대외활동', title: '2025 삼성전자 갤럭시 캠퍼스 앰배서더 6기', company: '삼성전자', deadline: 'D-5', views: 22715, comments: 41, prize: '활동비 월 30만원', tags: ['브랜드홍보', '영업'], logo: 'https://logo.clearbit.com/samsung.com', color: '#1428A0', isHot: true },
    { type: '인턴', title: 'B2B SaaS 스타트업 영업 인턴십', company: '토스페이먼츠', deadline: 'D-14', views: 3842, comments: 12, prize: '월 250만원', tags: ['B2B', '핀테크'], logo: 'https://logo.clearbit.com/toss.im', color: '#0064FF', isHot: false },
    { type: '공모전', title: '현대자동차 영업 아이디어 공모전', company: '현대자동차', deadline: 'D-30', views: 8921, comments: 7, prize: '총 상금 2,000만원', tags: ['모빌리티', '영업전략'], logo: 'https://logo.clearbit.com/hyundai.com', color: '#002C5F', isHot: false },
    { type: '교육', title: '제11회 대학생 세일즈 챌린지', company: '한국세일즈협회', deadline: 'D-21', views: 4521, comments: 8, prize: '총 상금 1,000만원', tags: ['B2B영업', '프레젠테이션'], logo: 'https://logo.clearbit.com/korcham.net', color: '#003B71', isHot: false },
    { type: '대외활동', title: 'TJ 대학생 서포터즈 10기 모집', company: 'TJ미디어', deadline: 'D-12', views: 5940, comments: 1, prize: '활동비 지급', tags: ['마케팅', '영업지원'], logo: 'https://logo.clearbit.com/tjmedia.com', color: '#E31837', isHot: false }
  ],
  MARKETING: [
    { type: '공모전', title: '제22회 대홍기획 광고대상', company: '대홍기획', deadline: 'D-45', views: 15832, comments: 23, prize: '총 상금 3,000만원', tags: ['광고기획', '크리에이티브'], logo: 'https://logo.clearbit.com/daehong.com', color: '#E4002B', isHot: true },
    { type: '대외활동', title: '2025 네이버 대학생 마케터', company: '네이버', deadline: 'D-8', views: 28471, comments: 56, prize: '정규직 전환 기회', tags: ['디지털마케팅', '콘텐츠'], logo: 'https://logo.clearbit.com/naver.com', color: '#03C75A', isHot: true },
    { type: '인턴', title: '무신사 브랜드 마케팅 인턴', company: '무신사', deadline: 'D-18', views: 12453, comments: 19, prize: '월 280만원', tags: ['패션', '퍼포먼스'], logo: 'https://logo.clearbit.com/musinsa.com', color: '#000000', isHot: false },
    { type: '공모전', title: 'CJ 브랜드 마케팅 챌린지', company: 'CJ제일제당', deadline: 'D-32', views: 9876, comments: 11, prize: '총 상금 1,500만원', tags: ['FMCG', '브랜딩'], logo: 'https://logo.clearbit.com/cj.net', color: '#F26522', isHot: false },
    { type: '대외활동', title: '업비트 서포터즈 업투(UP!TO) 4기', company: '업비트', deadline: '오늘마감', views: 23960, comments: 3, prize: '활동비 + 코인 지급', tags: ['핀테크', '콘텐츠'], logo: 'https://logo.clearbit.com/upbit.com', color: '#093687', isHot: true },
    { type: '교육', title: '퍼포먼스 마케팅 실전 부트캠프', company: '패스트캠퍼스', deadline: 'D-25', views: 3241, comments: 5, prize: '수료증 발급', tags: ['GA', '광고분석'], logo: 'https://logo.clearbit.com/fastcampus.co.kr', color: '#ED234B', isHot: false }
  ],
  STRATEGY: [
    { type: '공모전', title: '제15회 BCG 전략 케이스 대회', company: 'Boston Consulting Group', deadline: 'D-60', views: 18234, comments: 45, prize: '인턴십 + 상금 500만원', tags: ['컨설팅', '전략기획'], logo: 'https://logo.clearbit.com/bcg.com', color: '#00A94F', isHot: true },
    { type: '대외활동', title: '2025 스타트업 전략 멘토링', company: '중소벤처기업부', deadline: 'D-22', views: 6721, comments: 8, prize: '수료증 + 네트워킹', tags: ['스타트업', '사업기획'], logo: 'https://logo.clearbit.com/mss.go.kr', color: '#003366', isHot: false },
    { type: '인턴', title: 'McKinsey 전략컨설팅 인턴십', company: 'McKinsey & Company', deadline: 'D-35', views: 24521, comments: 67, prize: '글로벌 경험', tags: ['컨설팅', '전략'], logo: 'https://logo.clearbit.com/mckinsey.com', color: '#0A2540', isHot: true },
    { type: '공모전', title: 'LG 신사업 아이디어 공모전', company: 'LG', deadline: 'D-40', views: 11234, comments: 15, prize: '총 상금 2,500만원', tags: ['신사업', '혁신'], logo: 'https://logo.clearbit.com/lg.com', color: '#A50034', isHot: false },
    { type: '교육', title: 'SK SUNNY 소셜 이노베이터', company: 'SK행복나눔재단', deadline: 'D-12', views: 9826, comments: 1, prize: '수료증 + 채용우대', tags: ['사회혁신', '기획'], logo: 'https://logo.clearbit.com/sk.com', color: '#EA002C', isHot: false },
    { type: '대외활동', title: '2026 삼성 금융연수프로그램 9기', company: '삼성생명', deadline: 'D-17', views: 2796, comments: 2, prize: '금융권 커리어 기회', tags: ['금융', '전략'], logo: 'https://logo.clearbit.com/samsunglife.com', color: '#1428A0', isHot: false }
  ],
  FINANCE: [
    { type: '공모전', title: '제8회 KB 금융 아이디어 공모전', company: 'KB금융그룹', deadline: 'D-38', views: 14532, comments: 21, prize: '총 상금 2,000만원', tags: ['핀테크', '금융혁신'], logo: 'https://logo.clearbit.com/kbfg.com', color: '#FFBC00', isHot: true },
    { type: '대외활동', title: '2025 삼성증권 영 애널리스트', company: '삼성증권', deadline: 'D-15', views: 8934, comments: 14, prize: '채용 우대', tags: ['증권', '리서치'], logo: 'https://logo.clearbit.com/samsungsecurities.com', color: '#1428A0', isHot: false },
    { type: '인턴', title: '카카오페이 Finance PM 인턴', company: '카카오페이', deadline: 'D-25', views: 16782, comments: 32, prize: '월 300만원', tags: ['핀테크', 'PM'], logo: 'https://logo.clearbit.com/kakaopay.com', color: '#FFCD00', isHot: true },
    { type: '공모전', title: '한국은행 경제논문 공모전', company: '한국은행', deadline: 'D-52', views: 5621, comments: 6, prize: '총 상금 1,000만원', tags: ['경제분석', '리서치'], logo: 'https://logo.clearbit.com/bok.or.kr', color: '#003B5C', isHot: false },
    { type: '대외활동', title: '[신한투자증권] 프로디지털아카데미', company: '신한투자증권', deadline: 'D-13', views: 3473, comments: 0, prize: '금융 IT 역량', tags: ['금융IT', '디지털'], logo: 'https://logo.clearbit.com/shinhaninvest.com', color: '#0046FF', isHot: false },
    { type: '교육', title: '미래에셋 TAMS 글로벌 금융인 양성', company: '미래에셋', deadline: 'D-3', views: 7135, comments: 0, prize: '채용 연계', tags: ['자산관리', '글로벌'], logo: 'https://logo.clearbit.com/miraeasset.com', color: '#F37021', isHot: true }
  ],
  HR: [
    { type: '공모전', title: '제6회 HR 이노베이션 어워드', company: '대한상공회의소', deadline: 'D-48', views: 4521, comments: 7, prize: '총 상금 1,000만원', tags: ['HR혁신', '조직문화'], logo: 'https://logo.clearbit.com/korcham.net', color: '#003B71', isHot: false },
    { type: '대외활동', title: '2025 링크드인 캠퍼스 앰배서더', company: 'LinkedIn', deadline: 'D-10', views: 11234, comments: 18, prize: '프리미엄 계정', tags: ['채용', '커리어'], logo: 'https://logo.clearbit.com/linkedin.com', color: '#0A66C2', isHot: true },
    { type: '인턴', title: '배달의민족 People팀 인턴십', company: '우아한형제들', deadline: 'D-20', views: 13421, comments: 25, prize: '월 280만원', tags: ['조직문화', 'HR'], logo: 'https://logo.clearbit.com/woowahan.com', color: '#2AC1BC', isHot: true },
    { type: '공모전', title: 'SK 행복 경영 아이디어 공모전', company: 'SK', deadline: 'D-28', views: 7832, comments: 9, prize: '총 상금 1,500만원', tags: ['ESG', '조직문화'], logo: 'https://logo.clearbit.com/sk.com', color: '#EA002C', isHot: false },
    { type: '대외활동', title: '정보통신정책연구원 키플크루 2기', company: 'KISDI', deadline: 'D-10', views: 85, comments: 0, prize: '연구 참여 기회', tags: ['정책', 'HR리서치'], logo: 'https://logo.clearbit.com/kisdi.re.kr', color: '#1E3A8A', isHot: false },
    { type: '교육', title: 'KT 에이블 스쿨 9기', company: 'KT', deadline: 'D-43', views: 58, comments: 0, prize: '취업 연계', tags: ['AI', 'HR테크'], logo: 'https://logo.clearbit.com/kt.com', color: '#E4002B', isHot: false }
  ]
};

// 추가 추천 활동 (공통)
const GENERAL_ACTIVITIES = [
  { type: '대외활동', title: 'KOICA 청년중기봉사단 1차 모집', company: 'KOICA', deadline: 'D-5', views: 3679, comments: 1, prize: '해외봉사 경험', tags: ['글로벌', '봉사'], logo: 'https://logo.clearbit.com/koica.go.kr', color: '#00A651', isHot: false },
  { type: '교육', title: '새싹(SeSAC) SW 개발자 양성과정', company: '서울경제진흥원', deadline: 'D-3', views: 516, comments: 0, prize: '취업 연계', tags: ['SW개발', '부트캠프'], logo: 'https://logo.clearbit.com/seoul.go.kr', color: '#003F87', isHot: false },
  { type: '대외활동', title: '현대카드 디지털러버스 7기', company: '현대카드', deadline: 'D-7', views: 8216, comments: 12, prize: '활동비 지급', tags: ['디지털', '마케팅'], logo: 'https://logo.clearbit.com/hyundaicard.com', color: '#000000', isHot: true }
];

const SCENARIOS = [
  {
    id: 1,
    title: "첫 단톡방 개설",
    context: [
      { sender: '민수', text: "단톡 만들었음~ 다 들어왔지?" },
      { sender: '지은', text: "ㅇㅇ 근데 이 팀플 비중 크다던데… 우리 대충 하면 안 될 듯;;" },
      { sender: '민수', text: "맞아. 어떻게 할지 대충 방향은 정해야 할 듯?" }
    ],
    options: [
      { type: 'PLANNER', text: "과제 안내문부터 보고 전체 틀이랑 구조 먼저 짜보자." },
      { type: 'ANALYST', text: "예전 레포트랑 사례 자료부터 모아서 방향 잡자. 자료 조사는 내가 할게." },
      { type: 'FACILITATOR', text: "일단 각자 스케줄이랑 잘하는 것부터 공유해서 역할 맞춰볼까?" },
      { type: 'CREATOR', text: "일단 재밌는 컨셉부터 하나 잡자! 우리만의 느낌이 있어야 해." }
    ]
  },
  {
    id: 2,
    title: "역할 나누기",
    context: [
      { sender: '민수', text: "근데 발표는 좀… 나 진짜 떨려서 못 하겠음" },
      { sender: '지은', text: "엑셀은 난 포기… 누가 좀 해주라 ㅠㅠ" },
      { sender: '민수', text: "역할 어떻게 나눌까?" }
    ],
    options: [
      { type: 'PLANNER', text: "중요도/난이도 별로 쪼개서 나누자. 난 총괄 기획이랑 일정 관리 맡을게." },
      { type: 'ANALYST', text: "이론/데이터/사례로 나누자. 난 자료 파고드는 이론이랑 분석 맡을게." },
      { type: 'FACILITATOR', text: "각자 잘하는 거랑 기피하는 거 말해봐. 내가 최대한 공평하게 조율해볼게." },
      { type: 'CREATOR', text: "발표랑 PPT는 내가 할게. 대신 너네가 내용(소스)만 많이 던져줘." }
    ]
  },
  {
    id: 3,
    title: "마감 폭탄 & 일정",
    context: [
      { sender: '민수', text: "야 이번 달에 시험+다른 팀플까지 겹쳐서 지옥이네…" },
      { sender: '지은', text: "우리 이거도 비중 크잖아… 일정 어떻게 짤까?" }
    ],
    options: [
      { type: 'PLANNER', text: "각자 마감 날짜 공유해줘. 최소 작업만 뽑아서 효율적인 일정 다시 짤게." },
      { type: 'ANALYST', text: "각자 쓸 수 있는 시간 적어봐. 숫자로 계산해서 파트 분배 다시 해볼게." },
      { type: 'FACILITATOR', text: "다들 언제 바쁜지 말해줘. 여유 있는 사람이 좀 더 돕는 걸로 내가 맞출게." },
      { type: 'CREATOR', text: "분량은 줄이더라도 임팩트 있게 가자. 난 컨셉이랑 퀄리티에 집중할게." }
    ]
  },
  {
    id: 4,
    title: "회의 진행 스타일",
    context: [
      { sender: '민수', text: "우리 주 1회 정도는 회의할까?" },
      { sender: '지은', text: "좋지. 근데 매번 말만 하다 흐지부지 끝나면 안 되니까…" }
    ],
    options: [
      { type: 'PLANNER', text: "회의 전에 안건이랑 목표 내가 정리해갈게. 결론 딱 나오게 진행하자." },
      { type: 'ANALYST', text: "난 아이디어랑 결정사항 기록하고, 근거 자료 채우는 팩트 담당 할게." },
      { type: 'FACILITATOR', text: "난 말 못 하는 사람 없게 진행이랑 시간 조율 맡을게." },
      { type: 'CREATOR', text: "난 회의에서 나온 키워드들 뽑아서 나중에 컨셉으로 묶을게." }
    ]
  },
  {
    id: 5,
    title: "자료 조사 시작",
    context: [
      { sender: '민수', text: "이번 주부터 자료 좀 찾아야 할 듯" },
      { sender: '지은', text: "누가 뭐부터 볼래?" }
    ],
    options: [
      { type: 'PLANNER', text: "먼저 '질문 리스트'부터 만들고 R&R 나누자. 전체 방향 설계는 내가 할게." },
      { type: 'ANALYST', text: "공식 보고서, 논문, 통계는 내가 볼게. 숫자랑 근거 모으는 건 자신 있어." },
      { type: 'FACILITATOR', text: "난 실제 사용자들 얘기 듣는 인터뷰나 설문 쪽 맡아서 정리할게." },
      { type: 'CREATOR', text: "난 레퍼런스 사례, 이미지, 캠페인 모을게. 그걸로 컨셉 잡자." }
    ]
  },
  {
    id: 6,
    title: "아이디어 결정",
    context: [
      { sender: '민수', text: "아이디어 두 개 다 괜찮은데… 뭘로 갈지 모르겠네" },
      { sender: '지은', text: "시간도 없는데 빨리 정해야 할 듯" }
    ],
    options: [
      { type: 'PLANNER', text: "점수, 난이도, 실현 가능성 기준표 만들어서 점수 매겨보고 고르자." },
      { type: 'ANALYST', text: "각 아이디어 장단점이랑 리스크 정리해서 데이터로 비교해볼게." },
      { type: 'FACILITATOR', text: "둘 다 왜 좋은지 솔직하게 얘기해보고, 모두가 납득하는 쪽으로 합쳐볼게." },
      { type: 'CREATOR', text: "발표했을 때 그림을 상상해봐. 제일 임팩트 있고 쎄게 나오는 쪽으로 가자." }
    ]
  },
  {
    id: 7,
    title: "뒤처지는 팀원",
    context: [
      { sender: '민수', text: "근데 ㅇㅇ는 거의 아무것도 못 하고 있는 거 같지…?" },
      { sender: '지은', text: "말은 하는데 결과물이 계속 늦어 ㅠㅠ" }
    ],
    options: [
      { type: 'PLANNER', text: "그 친구한텐 쉬운 것만 잘게 쪼개서 맡기고, 전체 플랜 다시 수정할게." },
      { type: 'ANALYST', text: "지금까지 결과물 보고, 살릴 수 있는 거랑 버릴 거 냉정하게 구분해볼게." },
      { type: 'FACILITATOR', text: "내가 따로 연락해서 상황 들어보고, 할 수 있는 범위로 역할 다시 조정할게." },
      { type: 'CREATOR', text: "그 친구한텐 자료 찾기나 사진 찍기 시키고, 내가 내용 더 보강할게." }
    ]
  },
  {
    id: 8,
    title: "팀 내 갈등 발생",
    context: [
      { sender: '민수', text: "야 방금 회의 너무 싸우는 분위기 아니었냐…" },
      { sender: '지은', text: "ㅇㅇ이랑 ㅁㅁ 완전 정반대라 둘이 말 아예 안 통하는 듯" }
    ],
    options: [
      { type: 'PLANNER', text: "감정 빼고 장단점이랑 기준표 다시 정리해서, 그 틀 안에서 얘기하게 하자." },
      { type: 'ANALYST', text: "둘 다 근거가 부족해. 내가 팩트(데이터) 찾아보고 사실 기준으로 정리할게." },
      { type: 'FACILITATOR', text: "일단 식히고 나중에 각각 의견 따로 들어볼게. 공통 목표로 다시 묶어보자." },
      { type: 'CREATOR', text: "두 아이디어 섞어서 아예 새로운 컨셉으로 만들어볼게. '우리 아이디어'로!" }
    ]
  },
  {
    id: 9,
    title: "퀄리티 vs 시간",
    context: [
      { sender: '민수', text: "솔직히 이 정도면 됐는데 자꾸 더 하자고 하면… 체력 고갈될 듯" },
      { sender: '지은', text: "나도 욕심은 있는데 우리 시간도 한계가 있잖아" }
    ],
    options: [
      { type: 'PLANNER', text: "현실적인 목표선 정하고 그 안에서만 끝까지 하자. 기준은 내가 정할게." },
      { type: 'ANALYST', text: "과거 사례 봤을 때 이 정도면 점수 잘 나와. 객관적인 수준을 보여줄게." },
      { type: 'FACILITATOR', text: "욕심 있는 친구, 힘든 친구 둘 다 얘기 들어보고 내가 중간선 찾을게." },
      { type: 'CREATOR', text: "전체보단 딱 하나, 오프닝이나 한 장면에만 힘줘서 기억에 남게 만들자." }
    ]
  },
  {
    id: 10,
    title: "팀플 주특기",
    context: [
      { sender: '민수', text: "야 근데 너네 팀플할 때 솔직히 뭐가 제일 자신 있음?" },
      { sender: '지은', text: "궁금하다 ㅋㅋ" }
    ],
    options: [
      { type: 'PLANNER', text: "난 혼란스러운 거 정리해서 체계적인 플랜으로 만드는 게 제일 편해." },
      { type: 'ANALYST', text: "난 자료 파고들어서 탄탄한 근거랑 논리 만드는 게 제일 자신 있어." },
      { type: 'FACILITATOR', text: "난 사람들 말 들어주고 조율해서 팀 안 터지게 만드는 거." },
      { type: 'CREATOR', text: "난 아이디어 던지고 그걸 말과 그림으로 예쁘게 포장하는 거." }
    ]
  },
  {
    id: 11,
    title: "발표 당일 사고",
    context: [
      { sender: '민수', text: "와… 방금 파일 깨진 거 실화냐…?" },
      { sender: '지은', text: "어쩔 수 없이 몇 장은 그냥 말로 때워야 할 듯 ㅠㅠ" }
    ],
    options: [
      { type: 'PLANNER', text: "지금 꼭 말해야 하는 핵심만 남기고 발표 흐름 다시 짜자. 내가 재구성할게." },
      { type: 'ANALYST', text: "정확히 설명 가능한 부분이랑 넘길 부분 구분해줄게. 예상 질문도 체크하자." },
      { type: 'FACILITATOR', text: "일단 다들 멘탈 잡아! ㅋㅋ 교수님께 상황 짧게 설명하는 건 내가 할게." },
      { type: 'CREATOR', text: "이왕 이렇게 된 거 즉흥으로 스토리텔링 섞자. 오히려 더 재밌게 살려볼게." }
    ]
  },
  {
    id: 12,
    title: "나만 아는 정보",
    context: [
      { sender: '민수', text: "근데 과제 안내문 다시 보니까, 숨겨진 조건 있던데…" },
      { sender: 'system', text: "(사실 나는 어제 미리 봤던 상황)" }
    ],
    options: [
      { type: 'PLANNER', text: "나 어제 봤어. 전체 방향에 영향 줄 거 같아서 플랜 다시 수정해왔어." },
      { type: 'ANALYST', text: "나도 봤는데 중요도가 애매해서 근거 더 찾아보고 있었어. 같이 확인해보자." },
      { type: 'FACILITATOR', text: "아 나도 봤는데 타이밍 놓침 ㅠㅠ 미안. 지금이라도 다 같이 얘기해보자." },
      { type: 'CREATOR', text: "그 조건 살리면 발표 때 반전 포인트 될 듯? 그걸로 컨셉 새로 짜보자." }
    ]
  },
  {
    id: 13,
    title: "업무 스타일",
    context: [
      { sender: '민수', text: "너네 팀플할 때 스타일 어때? 모여서? 각자?" },
      { sender: '지은', text: "나 밤샘 몰아치기파…" }
    ],
    options: [
      { type: 'PLANNER', text: "마감 거꾸로 계산해서 중간중간 끊어서 하는 스타일. 계획대로 가야 함." },
      { type: 'ANALYST', text: "혼자 조용히 파고들 시간이 필요해. 분석 다 끝내고 결과만 공유하는 편." },
      { type: 'FACILITATOR', text: "자주 짧게 만나서 얘기하면서 하는 스타일. 사람 만나야 일이 굴러감." },
      { type: 'CREATOR', text: "필 꽂혔을 때 몰아서 하는 타입. 감 올 때 디자인까지 쭉 빼야 해." }
    ]
  },
  {
    id: 14,
    title: "부정적 피드백",
    context: [
      { sender: '민수', text: "교수님이 '이 부분은 별로다'라고 콕 찝어서 말하셨다…" },
      { sender: '지은', text: "살짝 기분 상할 뻔;;" }
    ],
    options: [
      { type: 'PLANNER', text: "전체 전략이랑 어떻게 안 맞는지 보고, 필요한 만큼만 방향 수정하자." },
      { type: 'ANALYST', text: "구체적인 이유 여쭤보자. 그거 듣고 근거랑 데이터 보강하는 건 내가 할게." },
      { type: 'FACILITATOR', text: "피드백 감사합니다~ 하고 넘기자. 우리끼리 기 죽지 말게 분위기 띄울게." },
      { type: 'CREATOR', text: "오케이, 더 세게 바꾸라는 뜻으로 접수. 완전 다른 각도로 재밌게 바꿔볼게." }
    ]
  },
  {
    id: 15,
    title: "한 줄 자기소개",
    context: [
      { sender: '민수', text: "야 이번 팀플 기준으로 자기소개 한 줄씩 하자면?" },
      { sender: '지은', text: "ㅋㅋ 재밌다 해보자" }
    ],
    options: [
      { type: 'PLANNER', text: "난 '팀의 혼란을 플랜으로 바꾸는 사람'. 구조랑 일정 책임짐." },
      { type: 'ANALYST', text: "난 '팀 말에 근거를 깔아주는 사람'. 논리와 팩트로 받쳐줌." },
      { type: 'FACILITATOR', text: "난 '팀이 안 터지게 붙들고 가는 사람'. 소통과 조율 담당." },
      { type: 'CREATOR', text: "난 '팀플을 기억에 남게 만드는 사람'. 아이디어와 한 방 담당." }
    ]
  }
];

// Result Types Mapping
const RESULT_TYPES = {
  PLANNER: {
    title: "전략·기획형 (Planner)",
    tagline: "혼란 속에 질서를 부여하는 설계자",
    desc: "복잡한 상황을 구조화하고, 실행 가능한 계획으로 만드는 데 탁월합니다. 팀이 우왕좌왕할 때 명확한 방향을 제시합니다.",
    roles: ["PM", "전략기획", "사업기획", "서비스기획"],
    color: "#10B981"
  },
  ANALYST: {
    title: "데이터·분석형 (Analyst)",
    tagline: "팩트로 승부하는 논리왕",
    desc: "감정보다는 근거와 데이터를 중시합니다. 리스크를 사전에 파악하고, 팀의 주장을 뒷받침할 탄탄한 논리를 만듭니다.",
    roles: ["데이터분석", "재무/회계", "리서치", "시장분석"],
    color: "#3B82F6"
  },
  FACILITATOR: {
    title: "관계·조율형 (Facilitator)",
    tagline: "팀워크를 완성하는 윤활유",
    desc: "팀원들의 성향을 파악하고 갈등을 중재하는 능력이 뛰어납니다. 모두가 만족할 수 있는 합의점을 찾아냅니다.",
    roles: ["HR/인사", "커뮤니케이션", "조율형 PM", "영업관리"],
    color: "#F59E0B"
  },
  CREATOR: {
    title: "크리에이티브형 (Creator)",
    tagline: "임팩트를 만드는 아이디어 뱅크",
    desc: "평범한 것을 특별하게 포장하는 능력이 있습니다. 매력적인 스토리텔링과 시각화로 결과물의 가치를 높입니다.",
    roles: ["마케팅", "브랜딩", "콘텐츠 기획", "디자인"],
    color: "#8B5CF6"
  }
};

// --- Components ---

const StepPill = ({ current }) => {
  const steps = [
    { id: 'LANDING', label: '홈' },
    { id: 'SPEC_CHECK', label: '역량 진단' },
    { id: 'SCENARIO_TEST', label: '성향 진단' },
    { id: 'RESULT', label: '결과 리포트' }
  ];
  
  const currentIdx = steps.findIndex(s => s.id === current);
  
  return (
    <div className="flex items-center gap-2 bg-gray-100/80 p-1 rounded-full backdrop-blur-sm">
      {steps.map((step, idx) => {
        const isActive = idx === currentIdx;
        // Special case: If we are in SPEC_CHECK, both 'BASIC_INFO' logical step and 'SPEC_CHECK' map to it.
        // But here 'BASIC_INFO' logic is merged into 'SPEC_CHECK'.
        
        const isPast = idx < currentIdx;
        return (
          <div 
            key={step.id}
            className={`
              px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300
              ${isActive ? 'bg-[#111] text-white shadow-sm' : isPast ? 'text-[#2F5233]' : 'text-gray-400'}
            `}
          >
            {step.label}
          </div>
        );
      })}
    </div>
  );
};

// Chat Bubble Component
const ChatBubble = ({ msg }) => {
  const isMe = msg.sender === '나';
  const isSystem = msg.sender === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <span className="bg-gray-800/50 text-gray-400 text-xs px-3 py-1 rounded-full">
          {msg.text}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex w-full mb-4 ${isMe ? 'justify-end' : 'justify-start'}`}>
      {!isMe && (
        <div className="flex flex-col items-center mr-3 mt-1">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm ${msg.sender === '민수' ? 'bg-indigo-500' : 'bg-pink-500'}`}>
            {msg.sender === '민수' ? '민수' : '지은'}
          </div>
        </div>
      )}
      <div className={`max-w-[85%] md:max-w-[70%] relative group`}>
        {!isMe && <p className="text-xs text-gray-500 mb-1 ml-1">{msg.sender}</p>}
        <div 
          className={`
            px-5 py-3.5 text-[15px] leading-relaxed shadow-sm font-medium
            ${isMe 
              ? 'bg-[#00C781] text-white rounded-2xl rounded-tr-sm' // User: Bright Green
              : 'bg-white text-[#111] rounded-2xl rounded-tl-sm border border-gray-100'} // Bot: White
          `}
        >
          {msg.text}
        </div>
        <span className={`text-[10px] text-gray-400 absolute bottom-0 ${isMe ? '-left-12 text-right w-10' : '-right-12 w-10'}`}>
          {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
        </span>
      </div>
    </div>
  );
};

const BSideBar = ({ label, myScore, avgScore, expScore, description, strengths, weaknesses }) => {
  return (
    <div className="bg-white border-b border-gray-100 py-8 last:border-0">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left: Description */}
        <div className="flex-1">
          <h4 className="text-xl font-bold text-[#111] mb-2">{label}</h4>
          <p className="text-gray-500 text-sm leading-relaxed mb-6">
            {description}
          </p>
          
          <div className="space-y-4">
            <div>
              <span className="text-blue-600 font-bold text-sm block mb-1">강점</span>
              <p className="text-gray-700 text-sm">{strengths || '-'}</p>
            </div>
            <div>
              <span className="text-red-500 font-bold text-sm block mb-1">보완점</span>
              <p className="text-gray-700 text-sm">{weaknesses || '-'}</p>
            </div>
          </div>
        </div>

        {/* Right: Chart */}
        <div className="flex-1 pt-2">
          <div className="flex justify-end items-end mb-4">
            <span className="text-3xl font-bold text-[#111]">{myScore.toFixed(1)}</span>
            <span className="text-gray-400 font-bold text-lg mb-1 ml-1">/ 5점</span>
            <span className="ml-3 px-2 py-1 bg-gray-100 rounded text-xs font-bold text-gray-500 mb-1">
              상위 {Math.max(1, 100 - (myScore * 20)).toFixed(0)}%
            </span>
          </div>

          <div className="flex justify-end gap-4 text-xs mb-2 font-bold">
             <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-blue-500"></div>나</div>
             <div className="flex items-center gap-1.5"><div className="w-0.5 h-3 bg-gray-400"></div>참여자 평균</div>
             <div className="flex items-center gap-1.5"><div className="w-0.5 h-3 bg-[#2F5233]"></div>업계 기대 수준</div>
          </div>

          <div className="relative h-12 bg-gray-100 rounded flex items-center px-1">
            <div 
              className={`h-8 rounded transition-all duration-1000 ${myScore >= 3.5 ? 'bg-blue-500' : 'bg-red-400'}`}
              style={{ width: `${(myScore / 5) * 100}%` }}
            />
            
            <div className="absolute inset-0 w-full h-full flex pointer-events-none">
               {[1,2,3,4,5].map(i => (
                 <div key={i} className="flex-1 border-r border-white/50 h-full last:border-0"></div>
               ))}
            </div>

            <div 
              className="absolute h-14 w-0.5 bg-gray-400 top-1/2 transform -translate-y-1/2"
              style={{ left: `${(avgScore / 5) * 100}%` }}
            >
              <div className="absolute -top-1 -left-[3px] w-2 h-2 rounded-full bg-gray-400" />
            </div>

            <div 
              className="absolute h-14 w-0.5 bg-[#2F5233] border-dashed border-l border-[#2F5233] top-1/2 transform -translate-y-1/2"
              style={{ left: `${(expScore / 5) * 100}%` }}
            >
              <div className="absolute -bottom-1 -left-[3px] w-2 h-2 bg-[#2F5233] rotate-45" />
            </div>
          </div>
          
          <div className="flex justify-between mt-2 text-xs text-gray-400 font-medium px-1">
             <span>0</span>
             <span>2.5</span>
             <span>5.0</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const useSafeTransition = () => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const safeNavigate = (callback, delay = 0) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      callback();
      setIsTransitioning(false);
    }, delay);
  };
  return { isTransitioning, safeNavigate };
};

export default function JobPrepLog() {
  const [user, setUser] = useState(null);
  const [currentStep, setCurrentStep] = useState('LANDING'); 
  const [isLoading, setIsLoading] = useState(true);
  const { safeNavigate } = useSafeTransition();
  const [specStep, setSpecStep] = useState(0); 
  const [surveyPage, setSurveyPage] = useState(0);

  // Data States
  const [profile, setProfile] = useState({
    name: '', university: '', major: '', gpa: '', status: '재학'
  });
  const [surveyResults, setSurveyResults] = useState({});
  const [unanswered, setUnanswered] = useState([]); 
  const [scores, setScores] = useState({ PLANNER: 0, ANALYST: 0, FACILITATOR: 0, CREATOR: 0 });
  
  // Scenario Test State
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [chatHistory, setChatHistory] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [canSelect, setCanSelect] = useState(false); // 선택 가능 여부
  const chatEndRef = useRef(null);
  const [resultTab, setResultTab] = useState('detail'); // 'summary', 'detail'

  // AI Chat Logic States (Using chatHistory state above)
  const [selectedJob, setSelectedJob] = useState(null);
  const [recommendedSubRole, setRecommendedSubRole] = useState(null);

  // Feedback Survey States
  const [feedbackSurvey, setFeedbackSurvey] = useState({
    overall: 0,        // 전체 만족도 (1-5)
    ui: 0,             // UI/UX 만족도
    accuracy: 0,       // 진단 정확도
    usefulness: 0,     // 활동추천 유용성
    recommend: 0,      // 추천 의향
    feedback: ''       // 자유 피드백
  });
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const initialToken = typeof window !== 'undefined' && window.__initial_auth_token;
        if (initialToken) {
          await signInWithCustomToken(auth, initialToken);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) {
        console.error("Auth Error:", e);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- Helpers ---
  const handleSurveyChange = (questionId, value) => {
    setSurveyResults(prev => ({ ...prev, [questionId]: value }));
    if (unanswered.includes(questionId)) {
      setUnanswered(prev => prev.filter(id => id !== questionId));
    }
  };

  const getCategoryScores = () => {
    const cats = { BUSINESS: 0, DATA: 0, COMM: 0, GLOBAL: 0, PROBLEM: 0 };
    const counts = { BUSINESS: 0, DATA: 0, COMM: 0, GLOBAL: 0, PROBLEM: 0 };
    
    Object.entries(DETAILED_SURVEY_QUESTIONS).forEach(([cat, questions]) => {
      questions.forEach(q => {
        if (surveyResults[q.id]) {
          cats[cat] += surveyResults[q.id];
          counts[cat]++;
        }
      });
    });

    Object.keys(cats).forEach(key => {
      if (counts[key] > 0) cats[key] = parseFloat((cats[key] / counts[key]).toFixed(1));
    });
    return cats;
  };



  // --- Scenario Logic ---
  const startScenario = () => {
    setScenarioIndex(0);
    setScores({ PLANNER: 0, ANALYST: 0, FACILITATOR: 0, CREATOR: 0 });
    setChatHistory([]);
    playScenario(0);
  };

  const playScenario = (index) => {
    const scenario = SCENARIOS[index];
    if (!scenario) return;

    // 대화 시작 시 선택 비활성화
    setCanSelect(false);
    setIsTyping(true);

    if (index === 0) {
      setChatHistory([{ type: 'divider', text: new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }) }]);
    }

    let delay = 0;
    const totalMessages = scenario.context.length;
    
    scenario.context.forEach((msg, i) => {
      delay += 800;
      setTimeout(() => {
        setChatHistory(prev => [...prev, { ...msg, id: `msg-${index}-${i}` }]);
        scrollToBottom();
        
        // 마지막 메시지가 표시되면 선택 활성화
        if (i === totalMessages - 1) {
          setTimeout(() => {
            setIsTyping(false);
            setCanSelect(true);
          }, 500);
        }
      }, delay);
    });
  };

  const handleOptionSelect = (option) => {
    // 선택 불가 상태면 무시
    if (!canSelect) return;
    
    // 선택 후 즉시 비활성화
    setCanSelect(false);
    setIsTyping(true);
    
    setChatHistory(prev => [...prev, { sender: '나', text: option.text }]);
    setScores(prev => ({ ...prev, [option.type]: prev[option.type] + 1 }));

    if (scenarioIndex < SCENARIOS.length - 1) {
      const nextIdx = scenarioIndex + 1;
      setScenarioIndex(nextIdx);
      setTimeout(() => {
        playScenario(nextIdx);
      }, 1000);
    } else {
      finishTest();
    }
  };

  const finishTest = async () => {
    // Save scenario test results
    saveUserData('SCENARIO_COMPLETE');
    
    safeNavigate(() => {
      setCurrentStep('AI_CHAT');
      startAiChat(); // Go to Job Matching chat after scenario
    }, 1500);
  };

  // --- Job Matching Chat Logic ---
  const startAiChat = () => {
    setChatHistory([]); // Clear scenario history for new context
    // Use specific bot message type
    setChatHistory([{ sender: 'Bot', text: `${profile.name}님, 성향 진단이 완료되었습니다. 이어서 직무 매칭을 시작합니다.` }]);
    
    setTimeout(() => {
      setChatHistory(prev => [...prev, { sender: 'Bot', text: `가장 관심 있는 직무 분야를 선택해주세요. 진단 결과를 바탕으로 세부 직무(Sub-role)를 추천해 드립니다.` }]);
      setTimeout(() => {
        setChatHistory(prev => [...prev, { type: 'job_select' }]);
        scrollToBottom();
      }, 500);
    }, 1000);
  };

  const handleJobSelect = (jobKey) => {
    const job = JOB_TYPES[jobKey];
    setSelectedJob(job);
    setChatHistory(prev => [...prev, { sender: '나', text: `${job.name} 직무에 관심이 있습니다.` }]);

    const cats = getCategoryScores();
    let bestSubRole = job.subRoles[0];
    let maxScore = -1;

    job.subRoles.forEach(sub => {
      const score = cats[sub.condition] || 0;
      if (score > maxScore) {
        maxScore = score;
        bestSubRole = sub;
      }
    });

    setRecommendedSubRole(bestSubRole);

    // Save job selection to Firebase
    setTimeout(() => {
      saveUserData('JOB_SELECTED', { 
        selectedJobKey: jobKey, 
        selectedJobName: job.name,
        recommendedSubRoleName: bestSubRole.name 
      });
    }, 100);

    setTimeout(() => {
      setChatHistory(prev => [...prev, { sender: 'Bot', text: `분석 중입니다...` }]);
      setTimeout(() => {
        setChatHistory(prev => [...prev, { 
          sender: 'Bot', 
          text: `${profile.name}님의 역량 데이터(특히 **${bestSubRole.condition === 'DATA' ? '데이터 분석' : bestSubRole.condition === 'COMM' ? '커뮤니케이션' : bestSubRole.condition === 'BUSINESS' ? '비즈니스' : bestSubRole.condition === 'GLOBAL' ? '글로벌' : '문제해결'}** 역량)를 분석한 결과, ${job.name} 내에서도 **[${bestSubRole.name}]** 직무가 가장 적합합니다.` 
        }]);
        
        setTimeout(() => {
           setChatHistory(prev => [...prev, { sender: 'Bot', text: `이 직무 역량을 키울 수 있는 **추천 활동**을 준비했어요! 👇` }]);
           // 해당 직무의 활동 데이터 추가
           setChatHistory(prev => [...prev, { type: 'activity_cards', jobKey: jobKey }]);
           setTimeout(() => {
             setChatHistory(prev => [...prev, { sender: 'Bot', text: `관심 있는 활동에 지원해보세요. 상세 리포트에서 더 자세한 역량 분석을 확인할 수 있습니다.` }]);
             setChatHistory(prev => [...prev, { type: 'result_btn' }]);
             scrollToBottom();
           }, 1000);
        }, 1500);
      }, 1500);
    }, 1000);
  };

  const finishMatching = async () => {
    // Save final matching data
    saveUserData('MATCHING_COMPLETE');
    
    safeNavigate(() => {
      setCurrentStep('RESULT');
    }, 1500);
  };

  // --- Handlers ---
  const handleStart = () => safeNavigate(() => {
    // Move directly to SPEC_CHECK, Step 0 (Basic Info)
    setCurrentStep('SPEC_CHECK');
    setSpecStep(0);
  });

  const handleBasicInfoSubmit = () => {
    // Validation
    if (!profile.name || profile.name.trim() === '') {
      alert("이름을 입력해주세요.");
      return;
    }
    if (!profile.university || profile.university.trim() === '') {
      alert("대학교를 입력해주세요.");
      return;
    }
    if (!profile.major || profile.major.trim() === '') {
      alert("전공을 선택해주세요.");
      return;
    }

    // Save basic info to Firebase
    saveUserData('BASIC_INFO_COMPLETE');

    setSpecStep(1);
    setSurveyPage(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNextSurveyPage = () => {
    const categories = Object.keys(DETAILED_SURVEY_QUESTIONS);
    const currentCategory = categories[surveyPage];
    const currentQuestions = DETAILED_SURVEY_QUESTIONS[currentCategory];
    
    const missing = currentQuestions.filter(q => !surveyResults[q.id]).map(q => q.id);
    
    if (missing.length > 0) {
      setUnanswered(missing);
      return;
    }

    if (surveyPage < categories.length - 1) {
      setSurveyPage(p => p + 1);
      setUnanswered([]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // After Survey, save and go to Scenario
      saveUserData('SURVEY_COMPLETE');
      safeNavigate(() => {
        setCurrentStep('SCENARIO_TEST');
        startScenario();
      });
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      if (chatEndRef.current) {
        chatEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }, 100);
  };

  // Auto scroll when chat history changes
  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isTyping]);

  // --- Save Data to Firebase ---
  const saveUserData = async (step, additionalData = {}) => {
    if (!user) return;
    try {
      const baseData = {
        step,
        profile,
        surveyResults,
        scores,
        selectedJob: selectedJob?.id || null,
        recommendedSubRole: recommendedSubRole?.name || null,
        updatedAt: serverTimestamp()
      };
      
      await setDoc(doc(db, 'users', user.uid), {
        ...baseData,
        ...additionalData,
        createdAt: serverTimestamp()
      }, { merge: true });
      
      console.log(`Data saved at step: ${step}`);
    } catch (e) {
      console.error("Save error:", e);
    }
  };

  // --- Submit Feedback Survey ---
  const submitFeedbackSurvey = async () => {
    if (!user) return;
    
    // Validation
    if (feedbackSurvey.overall === 0) {
      alert("전체 만족도를 선택해주세요.");
      return;
    }
    
    try {
      await setDoc(doc(db, 'feedback', user.uid), {
        ...feedbackSurvey,
        profile: {
          name: profile.name,
          university: profile.university,
          major: profile.major
        },
        selectedJob: selectedJob?.name || null,
        recommendedSubRole: recommendedSubRole?.name || null,
        createdAt: serverTimestamp()
      });
      
      setFeedbackSubmitted(true);
      console.log("Feedback submitted successfully");
    } catch (e) {
      console.error("Feedback save error:", e);
      alert("피드백 저장 중 오류가 발생했습니다.");
    }
  };

  // --- Helpers for Result ---
  const getResults = () => {
    const sorted = Object.entries(scores).sort(([,a], [,b]) => b - a);
    const mainTypeKey = sorted[0][0];
    const subTypeKey = sorted[1][0];
    return {
      main: RESULT_TYPES[mainTypeKey],
      sub: RESULT_TYPES[subTypeKey],
      scoreData: [
        { subject: '기획/전략', A: scores.PLANNER * 7, fullMark: 100 }, 
        { subject: '분석/논리', A: scores.ANALYST * 7, fullMark: 100 },
        { subject: '소통/조율', A: scores.FACILITATOR * 7, fullMark: 100 },
        { subject: '창의/표현', A: scores.CREATOR * 7, fullMark: 100 },
      ]
    };
  };

  if (isLoading) return <div className="min-h-screen bg-[#FDFDFD]" />;
  const cats = getCategoryScores();
  const categories = Object.keys(DETAILED_SURVEY_QUESTIONS);
  const currentCategory = categories[surveyPage];
  const currentQuestions = DETAILED_SURVEY_QUESTIONS[currentCategory];
  const catTitles = { BUSINESS: '비즈니스 감각', DATA: '데이터 리터러시', COMM: '소통 및 협업', GLOBAL: '글로벌 역량', PROBLEM: '문제 해결력' };

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-[#111] font-sans selection:bg-[#2F5233] selection:text-white">
      
      {/* Header */}
      <header className="fixed w-full top-0 z-50 bg-[#FDFDFD]/90 backdrop-blur-md border-b border-gray-100/50 h-16 flex items-center justify-between px-6 md:px-12">
        <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setCurrentStep('LANDING')}>
          <div className="w-8 h-8 bg-[#111] rounded-lg flex items-center justify-center text-white font-bold group-hover:bg-[#2F5233] transition-colors">
            J
          </div>
          <span className="text-lg font-bold tracking-tight">취준<span className="text-[#2F5233]">로그</span></span>
        </div>
        
        {currentStep !== 'LANDING' && (
          <div className="hidden md:block">
            <StepPill current={currentStep} />
          </div>
        )}

        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
            <User className="w-4 h-4" />
          </div>
        </div>
      </header>

      <main className="pt-24 pb-12 px-4 md:px-12 max-w-7xl mx-auto">
        
        {/* VIEW: LANDING */}
        {currentStep === 'LANDING' && (
          <div className="flex flex-col items-center justify-center min-h-[75vh] text-center animate-fade-in">
            <div className="mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 text-sm font-semibold text-gray-600">
              <Star className="w-4 h-4 text-[#2F5233] fill-current" />
              <span>Job Career Solution 3.0</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-[#111] mb-8 leading-[1.1] break-keep">
              나의 팀플 성향으로 찾는<br/>
              <span className="text-[#2F5233]">숨겨진 직무 역량</span>
            </h1>
            
            <p className="text-xl text-gray-500 mb-12 max-w-2xl font-medium leading-relaxed break-keep">
              15가지 리얼한 팀플 상황 속에서<br/>
              당신의 사고방식과 행동 패턴을 분석해드립니다.
            </p>
            
            <button 
              onClick={handleStart}
              className="group relative inline-flex items-center justify-center px-12 py-6 text-xl font-bold text-white transition-all duration-300 bg-[#111] rounded-full hover:bg-[#2F5233] hover:scale-105 hover:shadow-2xl hover:shadow-[#2F5233]/20"
            >
              성향 진단 시작하기
              <ArrowRight className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}

        {/* VIEW: SPEC CHECK */}
        {currentStep === 'SPEC_CHECK' && (
          <div className="animate-fade-in max-w-3xl mx-auto">
            {/* Phase 1: Basic Info */}
            {specStep === 0 && (
              <div className="animate-slide-in-right">
                <div className="text-center mb-12">
                  <h2 className="text-4xl font-extrabold text-[#111] mb-4">기본 정보</h2>
                  <p className="text-gray-500 text-lg">본격적인 진단에 앞서 기본 정보를 입력해주세요.</p>
                </div>

                <div className="bg-white p-8 md:p-12 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/50 space-y-8">
                   <div>
                      <label className="block text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <User className="w-4 h-4 text-[#2F5233]" /> 이름
                      </label>
                      <input 
                        type="text" 
                        value={profile.name}
                        onChange={e => setProfile({...profile, name: e.target.value})}
                        className="w-full p-5 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-[#2F5233] outline-none transition-all text-xl font-bold placeholder-gray-300"
                        placeholder="이름 입력"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                          <GraduationCap className="w-4 h-4 text-[#2F5233]" /> 대학교
                        </label>
                        <input 
                          type="text" 
                          value={profile.university}
                          onChange={e => setProfile({...profile, university: e.target.value})}
                          className="w-full p-5 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-[#2F5233] outline-none transition-all font-semibold"
                          placeholder="학교명"
                        />
                      </div>
                      <div>
                         <label className="block text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-[#2F5233]" /> 전공
                        </label>
                        <select
                          value={profile.major}
                          onChange={e => setProfile({...profile, major: e.target.value})}
                          className="w-full p-5 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-[#2F5233] outline-none transition-all font-semibold text-gray-700 appearance-none cursor-pointer"
                        >
                          <option value="" disabled>전공 선택 (상경계열)</option>
                          {MAJORS.map((major, idx) => (
                            <option key={idx} value={major}>{major}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                  <button 
                    onClick={handleBasicInfoSubmit}
                    className="w-full py-6 bg-[#111] text-white font-bold rounded-2xl hover:bg-[#2F5233] transition-all text-lg flex items-center justify-center gap-2 mt-4 hover:shadow-lg hover:shadow-[#2F5233]/20"
                  >
                    역량 체크 시작
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Phase 2: Skills Survey (25 Questions) */}
            {specStep === 1 && currentQuestions && (
              <div className="animate-slide-in-right">
                <div className="text-center mb-8">
                  <div className="inline-block bg-[#E8F5E9] text-[#2F5233] font-bold px-3 py-1 rounded-full text-xs uppercase mb-2">
                    Step {surveyPage + 1} / {categories.length}
                  </div>
                  <h2 className="text-3xl font-extrabold text-[#111] mb-2">{catTitles[currentCategory]} 진단</h2>
                  <p className="text-gray-500">각 항목에 대해 본인의 수준을 솔직하게 평가해주세요.</p>
                </div>

                <div className="space-y-6">
                  {currentQuestions.map((q, idx) => {
                    const isError = unanswered.includes(q.id);
                    return (
                      <div key={q.id} className={`bg-white p-6 rounded-[1.5rem] border ${isError ? 'border-red-400 ring-1 ring-red-400' : 'border-gray-100'} shadow-sm hover:shadow-md transition-all`}>
                        <div className="flex flex-col gap-4">
                          <h3 className="font-bold text-lg text-[#111] leading-snug break-keep">
                            <span className="text-[#2F5233] mr-2">Q{idx + 1}.</span>
                            {q.text}
                          </h3>
                          
                          <div className="flex justify-between items-center gap-2 bg-gray-50 p-2 rounded-xl">
                            <span className="text-xs font-bold text-gray-400 pl-2">부족</span>
                            <div className="flex gap-2">
                              {[1, 2, 3, 4, 5].map((score) => (
                                <button
                                  key={score}
                                  onClick={() => handleSurveyChange(q.id, score)}
                                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-base font-bold transition-all duration-200 ${
                                    surveyResults[q.id] === score
                                      ? 'bg-[#111] text-white shadow-md scale-105'
                                      : 'text-gray-400 hover:bg-white hover:text-[#111]'
                                  }`}
                                >
                                  {score}
                                </button>
                              ))}
                            </div>
                            <span className="text-xs font-bold text-gray-400 pr-2">탁월</span>
                          </div>
                        </div>
                        {isError && <p className="text-red-500 text-xs mt-2 pl-2 font-bold flex items-center gap-1"><AlertCircle className="w-3 h-3"/> 응답이 필요합니다.</p>}
                      </div>
                    );
                  })}

                  <div className="flex gap-4 pt-6">
                     <button 
                      onClick={() => {
                        if (surveyPage > 0) setSurveyPage(p => p - 1);
                        else setSpecStep(0);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="w-1/3 py-5 bg-white border-2 border-gray-100 text-gray-500 font-bold rounded-2xl hover:bg-gray-50 transition-all"
                    >
                      이전
                    </button>
                    <button 
                      onClick={handleNextSurveyPage}
                      className="w-2/3 py-5 bg-[#111] text-white font-bold rounded-2xl hover:bg-[#2F5233] transition-all shadow-xl shadow-gray-200 flex items-center justify-center gap-2"
                    >
                      {surveyPage < categories.length - 1 ? '다음 영역으로' : '진단 완료 및 다음 단계'}
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW: SCENARIO TEST */}
        {currentStep === 'SCENARIO_TEST' && (
          <div className="fixed inset-0 z-[100] bg-gradient-to-br from-gray-50 to-gray-100 animate-fade-in flex flex-col">
            {/* Modern Header */}
            <div className="bg-white/80 backdrop-blur-xl px-6 py-4 flex items-center justify-between border-b border-gray-200/50 shadow-sm">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setCurrentStep('LANDING')} 
                  className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-[#111] rotate-180" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#2F5233] to-[#1a2e1f] flex items-center justify-center shadow-lg shadow-[#2F5233]/20">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-[#111] font-bold text-lg">팀플 성향 진단</h2>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        <span>질문 {scenarioIndex + 1}/{SCENARIOS.length}</span>
                      </div>
                      <span>•</span>
                      <span>{Math.round(((scenarioIndex + 1) / SCENARIOS.length) * 100)}% 완료</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="hidden md:flex items-center gap-3">
                <div className="w-48 h-2.5 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#2F5233] to-[#4a7c4e] transition-all duration-500 ease-out rounded-full"
                    style={{ width: `${((scenarioIndex + 1) / SCENARIOS.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Chat Area - Modern style */}
            <div className="flex-1 overflow-y-auto px-6 py-6 scroll-smooth">
              <div className="max-w-4xl mx-auto space-y-4">
                {chatHistory.map((msg, idx) => {
                  if (msg.type === 'divider') {
                    return (
                      <div key={idx} className="flex justify-center my-8">
                        <span className="bg-white/60 backdrop-blur-sm text-gray-600 text-xs px-5 py-2 rounded-full font-medium shadow-sm border border-gray-200/50">
                          {msg.text}
                        </span>
                      </div>
                    );
                  }
                  return <ChatBubble key={idx} msg={msg} />;
                })}
                {isTyping && !canSelect && (
                  <div className="flex w-full justify-start mb-4 animate-pulse">
                    <div className="bg-white text-gray-400 px-6 py-3.5 rounded-2xl rounded-tl-sm text-[15px] shadow-md border border-gray-100">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"></span>
                        <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                        <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} className="h-4"></div>
              </div>
            </div>

            {/* Bottom Options Panel - Modern style */}
            <div className="bg-white/90 backdrop-blur-xl border-t border-gray-200/50 px-6 py-6 shadow-2xl">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-center gap-2 mb-5">
                  <MousePointer2 className={`w-4 h-4 ${!canSelect ? 'text-gray-400' : 'text-[#2F5233]'}`} />
                  <span className={`font-bold text-sm ${!canSelect ? 'text-gray-400' : 'text-[#111]'}`}>
                    {!canSelect ? '대화를 기다려주세요...' : '선택지를 골라주세요'}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {SCENARIOS[scenarioIndex].options.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleOptionSelect(option)}
                      disabled={!canSelect}
                      className={`relative flex items-start gap-4 p-5 border-2 rounded-2xl transition-all duration-300 text-left shadow-sm ${
                        !canSelect 
                          ? 'bg-gray-100 border-gray-200 cursor-not-allowed opacity-50' 
                          : 'bg-white hover:bg-gradient-to-br hover:from-[#E8F5E9] hover:to-white border-gray-200 hover:border-[#2F5233] group hover:shadow-xl hover:shadow-[#2F5233]/10 hover:-translate-y-1 cursor-pointer'
                      }`}
                    >
                      <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm transition-all duration-300 shadow-sm ${
                        !canSelect 
                          ? 'bg-gray-200 text-gray-400' 
                          : 'bg-gradient-to-br from-gray-100 to-gray-50 group-hover:from-[#2F5233] group-hover:to-[#1a2e1f] text-gray-600 group-hover:text-white'
                      }`}>
                        {idx + 1}
                      </div>
                      <span className={`flex-1 font-medium text-[15px] leading-relaxed pt-0.5 ${!canSelect ? 'text-gray-400' : 'text-[#111]'}`}>{option.text}</span>
                      <ChevronRight className={`flex-shrink-0 w-5 h-5 mt-1 ${!canSelect ? 'text-gray-300' : 'text-gray-300 group-hover:text-[#2F5233]'} transition-colors`} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: AI CHAT (Job Matching) */}
        {currentStep === 'AI_CHAT' && (
          <div className="animate-fade-in max-w-4xl mx-auto px-4">
            {/* Quick Navigation - Only show if job is already selected */}
            {selectedJob && (
              <div className="flex items-center justify-end gap-2 mb-4">
                <span className="text-sm text-gray-500 mr-2">바로가기:</span>
                <button 
                  onClick={() => setCurrentStep('ACTIVITY_RECOMMEND')} 
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm font-bold text-[#111] transition-colors"
                >
                  🎯 활동추천
                </button>
                <button 
                  onClick={() => setCurrentStep('RESULT')} 
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm font-bold text-[#111] transition-colors"
                >
                  📊 역량리포트
                </button>
              </div>
            )}
            
            <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-2xl shadow-gray-200/50 overflow-hidden h-[75vh] min-h-[500px] flex flex-col relative">
              {/* Header */}
              <div className="px-8 py-6 border-b border-gray-100 bg-white/90 backdrop-blur sticky top-0 z-10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-[#111] rounded-2xl flex items-center justify-center shadow-lg shadow-gray-200">
                     <Bot className="w-6 h-6 text-white" />
                   </div>
                   <div>
                     <span className="font-extrabold text-[#111] text-lg block">AI 커리어 분석관</span>
                     <span className="text-sm text-gray-400 font-medium">
                       {selectedJob ? `${selectedJob.name} 직무 매칭 완료` : '직무 적합도 매칭 중...'}
                     </span>
                   </div>
                </div>
                {selectedJob && (
                  <button 
                    onClick={() => {
                      setSelectedJob(null);
                      setRecommendedSubRole(null);
                      startAiChat();
                    }}
                    className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm font-medium text-gray-700 transition-colors flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    다른 직무 선택
                  </button>
                )}
              </div>

              {/* Chat Body */}
              <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-[#FAFAFA] scroll-smooth">
                {chatHistory.map((msg, idx) => {
                  if (msg.type === 'job_select') {
                    // Calculate job scores based on category scores
                    const cats = getCategoryScores();
                    const jobScores = Object.entries(JOB_TYPES).map(([key, job]) => {
                      let maxScore = 0;
                      job.subRoles.forEach(sub => {
                        const score = cats[sub.condition] || 0;
                        if (score > maxScore) maxScore = score;
                      });
                      return { key, job, score: maxScore };
                    }).sort((a, b) => b.score - a.score);

                    return (
                      <div key={idx} className="animate-fade-in-up space-y-4">
                        <div className="pl-4 border-l-4 border-[#2F5233]">
                          <p className="font-bold text-[#111] text-lg mb-1">가장 관심 있는 직무 분야를 선택해주세요.</p>
                          <p className="text-sm text-gray-500">진단 결과를 바탕으로 세부 직무(Sub-role)를 추천해 드립니다.</p>
                        </div>
                        <div className="space-y-3">
                          {jobScores.map(({ key, job }, rankIdx) => {
                            const isTop = rankIdx < 2;
                            const rankLabel = rankIdx === 0 ? '1순위' : rankIdx === 1 ? '2순위' : `${rankIdx + 1}순위`;
                            const rankColor = rankIdx === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white' : 
                                             rankIdx === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-white' : 
                                             'bg-gray-100 text-gray-600';
                            
                            return (
                              <button
                                key={key}
                                onClick={() => handleJobSelect(key)}
                                className={`relative w-full text-left p-5 bg-white border-2 rounded-2xl transition-all shadow-sm hover:shadow-lg group ${
                                  isTop ? 'border-[#2F5233] hover:border-[#1a2e1f]' : 'border-gray-200 hover:border-[#2F5233]'
                                }`}
                              >
                                <div className="flex items-start gap-4">
                                  <div className={`flex-shrink-0 px-3 py-1 rounded-lg text-xs font-bold shadow-sm ${rankColor}`}>
                                    {rankLabel}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-bold text-[#111] text-lg">{job.name}</span>
                                      {isTop && (
                                        <span className="text-xs px-2 py-0.5 bg-[#E8F5E9] text-[#2F5233] rounded-full font-bold">
                                          추천
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-sm text-gray-600">{job.desc}</span>
                                  </div>
                                  <ChevronRight className="flex-shrink-0 w-5 h-5 text-gray-300 group-hover:text-[#2F5233] transition-colors mt-1" />
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }
                  if (msg.type === 'activity_cards') {
                    const activities = (ACTIVITIES_DATA[msg.jobKey] || []).slice(0, 3); // 미리보기로 3개만
                    return (
                      <div key={idx} className="animate-fade-in-up space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Award className="w-5 h-5 text-[#2F5233]" />
                            <span className="font-bold text-[#111]">맞춤 활동 미리보기</span>
                          </div>
                          <span className="text-xs text-gray-500">
                            총 {(ACTIVITIES_DATA[msg.jobKey] || []).length + GENERAL_ACTIVITIES.length}개
                          </span>
                        </div>
                        
                        {/* 간단한 카드 미리보기 */}
                        <div className="space-y-2">
                          {activities.map((activity, actIdx) => {
                            const typeColors = {
                              '대외활동': 'bg-blue-100 text-blue-700',
                              '공모전': 'bg-purple-100 text-purple-700',
                              '인턴': 'bg-orange-100 text-orange-700',
                              '교육': 'bg-green-100 text-green-700'
                            };
                            return (
                              <div 
                                key={actIdx}
                                className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:border-[#2F5233] transition-all cursor-pointer group"
                              >
                                <div 
                                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-lg shadow-md"
                                  style={{ backgroundColor: activity.color || '#2F5233' }}
                                >
                                  {activity.company.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${typeColors[activity.type]}`}>
                                      {activity.type}
                                    </span>
                                    {activity.isHot && (
                                      <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded">HOT</span>
                                    )}
                                  </div>
                                  <h4 className="font-bold text-[#111] text-sm truncate group-hover:text-[#2F5233] transition-colors">
                                    {activity.title}
                                  </h4>
                                  <p className="text-xs text-gray-500 truncate">{activity.company}</p>
                                </div>
                                <div className="text-right shrink-0">
                                  <span className={`text-xs font-bold ${activity.deadline === '오늘마감' || activity.deadline === 'D-1' ? 'text-red-500' : 'text-[#2F5233]'}`}>
                                    {activity.deadline}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        
                        {/* 더보기 버튼 */}
                        <button 
                          onClick={() => setCurrentStep('ACTIVITY_RECOMMEND')}
                          className="w-full py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-bold text-[#111] transition-colors flex items-center justify-center gap-2"
                        >
                          전체 활동 보기 ({(ACTIVITIES_DATA[msg.jobKey] || []).length + GENERAL_ACTIVITIES.length}개)
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  }
                  if (msg.type === 'result_btn') {
                    return (
                      <div key={idx} className="animate-fade-in-up flex flex-col items-center gap-3 pt-4">
                        <button 
                          onClick={finishMatching}
                          className="w-full max-w-md px-8 py-4 bg-[#111] text-white font-bold rounded-2xl hover:bg-[#2F5233] transition-all shadow-lg flex items-center justify-center gap-2"
                        >
                          📊 역량 리포트 확인하기
                        </button>
                        <button 
                          onClick={() => setCurrentStep('ACTIVITY_RECOMMEND')}
                          className="w-full max-w-md px-8 py-4 bg-gradient-to-r from-[#2F5233] to-[#4a7c4e] text-white font-bold rounded-2xl hover:from-[#1a2e1f] hover:to-[#2F5233] transition-all shadow-lg flex items-center justify-center gap-2"
                        >
                          🎯 맞춤 활동 추천받기 <ArrowRight className="w-4 h-4"/>
                        </button>
                      </div>
                    );
                  }
                  return (
                    <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
                      <div 
                        className={`max-w-[85%] md:max-w-[80%] p-6 text-[15px] leading-relaxed font-medium shadow-sm transition-all ${
                          msg.type === 'user' 
                            ? 'bg-[#111] text-white rounded-3xl rounded-tr-sm' 
                            : 'bg-white text-[#111] rounded-3xl rounded-tl-sm border border-gray-100'
                        }`}
                      >
                         <div dangerouslySetInnerHTML={{ 
                           __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-[#2F5233]">$1</strong>') 
                         }} />
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} className="h-4" />
              </div>
            </div>
          </div>
        )}

        {/* VIEW: ACTIVITY_RECOMMEND - 링커리어 스타일 */}
        {currentStep === 'ACTIVITY_RECOMMEND' && (
          <div className="animate-fade-in pb-20">
            {/* Navigation Bar */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setCurrentStep('AI_CHAT')} 
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors text-sm font-medium text-gray-700"
                >
                  <ChevronRight className="w-4 h-4 rotate-180" />
                  직무 다시 선택
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentStep('ACTIVITY_RECOMMEND')} 
                  className="px-4 py-2 rounded-xl bg-[#2F5233] text-white text-sm font-bold"
                >
                  🎯 활동추천
                </button>
                <button 
                  onClick={() => setCurrentStep('RESULT')} 
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm font-bold text-[#111] transition-colors"
                >
                  📊 역량리포트
                </button>
              </div>
            </div>
            
            {/* Header */}
            <div className="mb-8">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                  <span className="text-[#2F5233] font-bold text-xs tracking-widest uppercase bg-[#E8F5E9] px-3 py-1 rounded-full">
                    Recommended Activities
                  </span>
                  <h2 className="text-3xl md:text-4xl font-extrabold text-[#111] mt-4 leading-tight">
                    <span className="text-[#2F5233]">{profile.name}</span>님을 위한<br/>
                    맞춤 활동 추천
                  </h2>
                  <p className="text-gray-500 mt-2">
                    {selectedJob?.name} 직무 역량을 키울 수 있는 활동들이에요
                  </p>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500">검색결과</span>
                  <span className="font-bold text-[#2F5233]">{(ACTIVITIES_DATA[Object.keys(JOB_TYPES).find(k => JOB_TYPES[k].id === selectedJob?.id)] || []).length + GENERAL_ACTIVITIES.length}건</span>
                </div>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {['전체', '대외활동', '공모전', '인턴', '교육'].map((filter) => (
                <button
                  key={filter}
                  className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                    filter === '전체' 
                      ? 'bg-[#2F5233] text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Activity Cards Grid - 링커리어 스타일 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...(ACTIVITIES_DATA[Object.keys(JOB_TYPES).find(k => JOB_TYPES[k].id === selectedJob?.id)] || []), ...GENERAL_ACTIVITIES].map((activity, idx) => {
                const typeColors = {
                  '대외활동': 'bg-blue-500',
                  '공모전': 'bg-purple-500',
                  '인턴': 'bg-orange-500',
                  '교육': 'bg-green-500'
                };
                const isUrgent = activity.deadline === '오늘마감' || activity.deadline === 'D-1' || activity.deadline === 'D-3';
                
                return (
                  <div 
                    key={idx}
                    className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl hover:border-[#2F5233] transition-all cursor-pointer group relative"
                  >
                    {/* Hot Badge */}
                    {activity.isHot && (
                      <div className="absolute top-3 right-3 z-10">
                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md">
                          HOT
                        </span>
                      </div>
                    )}
                    
                    {/* Card Header with Logo */}
                    <div className="relative h-28 bg-gradient-to-br from-gray-50 to-white flex items-center justify-center overflow-hidden border-b border-gray-100">
                      <div 
                        className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-2xl group-hover:scale-110 transition-transform shadow-lg"
                        style={{ backgroundColor: activity.color || '#2F5233' }}
                      >
                        {activity.company.charAt(0)}
                      </div>
                      <div className={`absolute top-3 left-3 ${typeColors[activity.type]} text-white text-xs font-bold px-2.5 py-1 rounded-md shadow-sm`}>
                        {activity.type}
                      </div>
                    </div>
                    
                    {/* Card Body */}
                    <div className="p-5">
                      {/* Title */}
                      <h3 className="font-bold text-[#111] text-[15px] leading-snug mb-2 group-hover:text-[#2F5233] transition-colors line-clamp-2 min-h-[44px]">
                        {activity.title}
                      </h3>
                      
                      {/* Company */}
                      <p className="text-gray-500 text-sm mb-3 truncate">
                        {activity.company}
                      </p>
                      
                      {/* Tags */}
                      <div className="flex flex-wrap gap-1 mb-4">
                        {activity.tags.map((tag, tagIdx) => (
                          <span key={tagIdx} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                            #{tag}
                          </span>
                        ))}
                      </div>
                      
                      {/* Footer Info */}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className={`font-bold ${isUrgent ? 'text-red-500' : 'text-[#2F5233]'}`}>
                            {activity.deadline}
                          </span>
                          <span>조회 {activity.views.toLocaleString()}</span>
                          <span>댓글 {activity.comments}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Prize Banner */}
                    <div className="px-5 py-3 bg-gradient-to-r from-[#E8F5E9] to-white border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <span className="text-[#2F5233] font-bold text-sm">
                          🎁 {activity.prize}
                        </span>
                        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#2F5233] transition-colors" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Bottom CTA */}
            <div className="mt-12 text-center">
              <p className="text-gray-500 mb-4">더 많은 활동을 찾고 계신가요?</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a 
                  href="https://linkareer.com/list/activity" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#2F5233] text-white font-bold rounded-xl hover:bg-[#1a2e1f] transition-colors"
                >
                  링커리어에서 더 보기
                  <ArrowRight className="w-4 h-4" />
                </a>
                <button 
                  onClick={() => setCurrentStep('RESULT')}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-[#111] font-bold rounded-xl hover:bg-gray-200 transition-colors"
                >
                  📊 역량 리포트 보기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: RESULT */}
        {currentStep === 'RESULT' && (
          <div className="animate-fade-in pb-20">
            {(() => {
              const { main, scoreData } = getResults();
              return (
                <>
                  {/* Navigation Bar */}
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setCurrentStep('AI_CHAT')} 
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors text-sm font-medium text-gray-700"
                      >
                        <ChevronRight className="w-4 h-4 rotate-180" />
                        직무 다시 선택
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setCurrentStep('ACTIVITY_RECOMMEND')} 
                        className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm font-bold text-[#111] transition-colors"
                      >
                        🎯 활동추천
                      </button>
                      <button 
                        onClick={() => setCurrentStep('RESULT')} 
                        className="px-4 py-2 rounded-xl bg-[#2F5233] text-white text-sm font-bold"
                      >
                        📊 역량리포트
                      </button>
                    </div>
                  </div>
                  
                  {/* Header */}
                  <div className="flex flex-col md:flex-row justify-between items-end mb-12 pb-8 border-b border-gray-100">
                    <div>
                      <span className="text-[#2F5233] font-extrabold text-xs tracking-widest uppercase bg-[#E8F5E9] px-4 py-2 rounded-full">
                        Analysis Report
                      </span>
                      <h2 className="text-4xl md:text-5xl font-extrabold text-[#111] mt-6 leading-tight">
                        <span className="text-[#2F5233]">{profile.name}</span>님의<br/>
                        역량 리포트
                      </h2>
                    </div>
                    <div className="flex gap-3 mt-6 md:mt-0">
                      <button onClick={() => window.print()} className="px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-[#111] font-bold text-sm transition-colors flex items-center gap-2">
                        <Download className="w-4 h-4" /> PDF 저장
                      </button>
                    </div>
                  </div>

                  {/* Tab Navigation */}
                  <div className="bg-[#111] text-white p-1 rounded-full inline-flex gap-1 mb-10 overflow-x-auto max-w-full">
                    {[
                      { id: 'detail', label: '상세 역량' },
                      { id: 'summary', label: '종합 분석' },
                    ].map(tab => (
                       <button
                         key={tab.id}
                         onClick={() => setResultTab(tab.id)}
                         className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
                           resultTab === tab.id ? 'bg-[#2F5233] text-white shadow-lg' : 'text-gray-400 hover:text-white'
                         }`}
                       >
                         {tab.label}
                       </button>
                    ))}
                  </div>

                  {/* CONTENT: DETAIL TAB */}
                  {resultTab === 'detail' && (
                    <div className="space-y-4 animate-fade-in">
                       <BSideBar 
                         label="비즈니스 감각"
                         description="문서 작성, 재무 이해, 시장 분석 등 비즈니스의 기본이 되는 역량입니다."
                         myScore={cats.BUSINESS || 0}
                         avgScore={3.2}
                         expScore={4.0}
                         strengths={cats.BUSINESS >= 3.5 ? "논리적인 문서 작성 및 시장 흐름 파악 능력 우수" : ""}
                         weaknesses={cats.BUSINESS < 3.5 ? "재무 제표 이해 및 비즈니스 매너 보완 필요" : ""}
                       />
                       <BSideBar 
                         label="데이터 리터러시"
                         description="데이터를 추출, 가공, 분석하여 인사이트를 도출하는 능력입니다."
                         myScore={cats.DATA || 0}
                         avgScore={3.0}
                         expScore={4.2}
                         strengths={cats.DATA >= 3.5 ? "데이터 기반 의사결정 및 툴 활용 능력 탁월" : ""}
                         weaknesses={cats.DATA < 3.5 ? "SQL/Python 등 분석 툴 활용 경험 부족" : ""}
                       />
                       <BSideBar 
                         label="소통 및 협업"
                         description="팀원 및 유관부서와 원활하게 소통하고 갈등을 관리하는 능력입니다."
                         myScore={cats.COMM || 0}
                         avgScore={3.5}
                         expScore={4.0}
                         strengths={cats.COMM >= 3.8 ? "적극적인 커뮤니케이션 및 갈등 관리 능력 보유" : ""}
                         weaknesses={cats.COMM < 3.8 ? "논리적 설득 및 피드백 수용 태도 보완 필요" : ""}
                       />
                       <BSideBar 
                         label="글로벌 역량"
                         description="외국어 구사 능력 및 타 문화에 대한 이해도입니다."
                         myScore={cats.GLOBAL || 0}
                         avgScore={2.8}
                         expScore={3.5}
                         strengths={cats.GLOBAL >= 3.5 ? "비즈니스 영어 회화 및 문서 작성 가능" : ""}
                         weaknesses={cats.GLOBAL < 3.5 ? "어학 성적 및 실전 회화 경험 부족" : ""}
                       />
                       <BSideBar 
                         label="문제 해결력"
                         description="복잡한 문제를 구조화하고 대안을 제시하는 능력입니다."
                         myScore={cats.PROBLEM || 0}
                         avgScore={3.3}
                         expScore={4.1}
                         strengths={cats.PROBLEM >= 3.8 ? "이슈 구조화 및 대안 제시 능력 우수" : ""}
                         weaknesses={cats.PROBLEM < 3.8 ? "돌발 상황 대처 및 리소스 관리 능력 보완 필요" : ""}
                       />
                    </div>
                  )}

                  {/* CONTENT: SUMMARY TAB */}
                  {resultTab === 'summary' && (
                    <div className="space-y-12 animate-fade-in">
                      {/* Main Result Card */}
                      <div className="bg-[#111] text-white rounded-[2.5rem] p-10 md:p-14 shadow-2xl relative overflow-hidden">
                         <div className="absolute top-0 right-0 w-96 h-96 bg-[#2F5233] rounded-full opacity-20 blur-[100px] transform translate-x-1/3 -translate-y-1/3"></div>
                         
                         <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                           <div>
                             <div className="text-[#2F5233] font-bold mb-2 text-lg">Main Character</div>
                             <h3 className="text-3xl md:text-5xl font-extrabold mb-4 leading-tight">
                               {main.tagline}
                             </h3>
                             <p className="text-2xl font-bold text-white/90 mb-6">
                               [{main.title}]
                             </p>
                             <p className="text-gray-400 text-lg leading-relaxed mb-8">
                               {main.desc}
                             </p>
                             
                             <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm border border-white/5">
                               <h4 className="text-sm font-bold text-gray-300 mb-3 uppercase tracking-wider">추천 직무</h4>
                               <div className="flex flex-wrap gap-2">
                                 {main.roles.map(role => (
                                   <span key={role} className="px-3 py-1.5 bg-[#2F5233] rounded-lg text-sm font-bold">
                                     #{role}
                                   </span>
                                 ))}
                               </div>
                             </div>
                           </div>

                           <div className="h-[300px] w-full bg-white/5 rounded-3xl p-4 border border-white/5">
                              <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={scoreData}>
                                  <PolarGrid stroke="#444" />
                                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#aaa', fontSize: 12, fontWeight: 'bold' }} />
                                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                  <Radar name="내 성향" dataKey="A" stroke="#2F5233" strokeWidth={4} fill="#2F5233" fillOpacity={0.4} />
                                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', background: '#222', color: '#fff' }} />
                                </RadarChart>
                              </ResponsiveContainer>
                           </div>
                         </div>
                      </div>

                      {/* Recommendation from Chat */}
                      {selectedJob && recommendedSubRole && (
                        <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-xl">
                          <h3 className="text-2xl font-extrabold text-[#111] mb-6 flex items-center gap-3">
                            <Bot className="w-8 h-8 text-[#2F5233]" /> AI 직무 추천
                          </h3>
                          <div className="flex flex-col md:flex-row gap-8">
                            <div className="flex-1">
                              <div className="text-sm font-bold text-gray-400 uppercase mb-2">관심 분야</div>
                              <div className="text-2xl font-bold text-[#111] mb-6">{selectedJob.name}</div>
                              <div className="text-sm font-bold text-[#2F5233] uppercase mb-2">Best Fit</div>
                              <div className="text-4xl font-extrabold text-[#111] mb-4">{recommendedSubRole.name}</div>
                              <p className="text-gray-600 leading-relaxed">
                                {recommendedSubRole.desc}
                              </p>
                            </div>
                            <div className="flex-1 bg-gray-50 rounded-3xl p-6">
                              <h4 className="font-bold text-[#111] mb-4">추천 이유</h4>
                              <p className="text-gray-600 text-sm leading-7">
                                지원자님의 역량 데이터 분석 결과, <strong>{recommendedSubRole.condition === 'DATA' ? '데이터 분석' : recommendedSubRole.condition === 'COMM' ? '소통' : recommendedSubRole.condition === 'BUSINESS' ? '비즈니스' : recommendedSubRole.condition === 'GLOBAL' ? '글로벌' : '문제해결'}</strong> 점수가 가장 높게 나타났습니다. 
                                <br/>
                                이는 해당 직무 수행 시 큰 강점이 될 것입니다. 남들과 다른 본인만의 강점을 살려 <strong>{recommendedSubRole.name}</strong> 전문가로 성장해보세요.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Feedback Survey Section */}
                  <div className="bg-gradient-to-br from-[#2F5233] to-[#1a2e1f] rounded-[2.5rem] p-10 mt-12 text-white">
                    <h3 className="text-2xl font-extrabold mb-2 flex items-center gap-3">
                      📝 서비스 피드백
                    </h3>
                    <p className="text-white/70 mb-8">취준로그를 이용해 주셔서 감사합니다. 더 나은 서비스를 위해 피드백을 남겨주세요!</p>
                    
                    {feedbackSubmitted ? (
                      <div className="bg-white/10 rounded-2xl p-8 text-center">
                        <div className="text-5xl mb-4">🎉</div>
                        <h4 className="text-xl font-bold mb-2">피드백이 제출되었습니다!</h4>
                        <p className="text-white/70">소중한 의견 감사합니다. 더 나은 서비스로 보답하겠습니다.</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Rating Questions */}
                        {[
                          { key: 'overall', label: '전체 만족도', desc: '취준로그 서비스 전반에 대한 만족도' },
                          { key: 'ui', label: 'UI/UX 만족도', desc: '디자인과 사용 편의성' },
                          { key: 'accuracy', label: '진단 정확도', desc: '역량 진단 및 성향 분석의 정확성' },
                          { key: 'usefulness', label: '활동 추천 유용성', desc: '추천된 활동들의 유용성' },
                          { key: 'recommend', label: '추천 의향', desc: '주변에 이 서비스를 추천할 의향' }
                        ].map((item) => (
                          <div key={item.key} className="bg-white/10 rounded-2xl p-5">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div>
                                <h4 className="font-bold text-lg">{item.label}</h4>
                                <p className="text-white/60 text-sm">{item.desc}</p>
                              </div>
                              <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((rating) => (
                                  <button
                                    key={rating}
                                    onClick={() => setFeedbackSurvey(prev => ({ ...prev, [item.key]: rating }))}
                                    className={`w-12 h-12 rounded-xl font-bold text-lg transition-all ${
                                      feedbackSurvey[item.key] === rating
                                        ? 'bg-white text-[#2F5233] scale-110 shadow-lg'
                                        : 'bg-white/20 hover:bg-white/30'
                                    }`}
                                  >
                                    {rating}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* Free Feedback */}
                        <div className="bg-white/10 rounded-2xl p-5">
                          <h4 className="font-bold text-lg mb-2">자유 의견</h4>
                          <p className="text-white/60 text-sm mb-4">개선 사항이나 추가 의견이 있다면 자유롭게 작성해주세요</p>
                          <textarea
                            value={feedbackSurvey.feedback}
                            onChange={(e) => setFeedbackSurvey(prev => ({ ...prev, feedback: e.target.value }))}
                            placeholder="예: 직무별 더 세분화된 활동 추천이 있으면 좋겠어요..."
                            className="w-full h-32 bg-white/20 rounded-xl p-4 text-white placeholder-white/40 resize-none focus:outline-none focus:ring-2 focus:ring-white/50"
                          />
                        </div>

                        {/* Submit Button */}
                        <button
                          onClick={submitFeedbackSurvey}
                          className="w-full py-4 bg-white text-[#2F5233] font-bold text-lg rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                        >
                          <Check className="w-5 h-5" />
                          피드백 제출하기
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Footer Action */}
                  <div className="flex justify-center gap-4 mt-12 pb-10">
                    <button onClick={() => window.location.reload()} className="group px-8 py-4 bg-[#111] text-white rounded-full hover:bg-[#2F5233] transition-all font-bold text-lg shadow-xl shadow-gray-200 flex items-center gap-2">
                      <RotateCcw className="w-5 h-5 group-hover:-rotate-180 transition-transform duration-500" /> 
                      다시 진단하기
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        )}

      </main>
    </div>
  );
}