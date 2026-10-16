/**
 * TrustClause™ | 지능형 위·수탁 계약 자동 생성 및 컴플라이언스 플랫폼
 * 개인정보보호위원회 표준계약서(법 제26조) 및 행정안전부/지자체 민간위탁 표준협약서 통합 엔진
 */

const state = {
  track: 'HYBRID', // 'HYBRID' | 'PRIVACY' | 'PUBLIC'
  activeDocTab: 'MAIN_CONTRACT',
  showAnnotations: true,
  subProcessors: [
    {
      company: '(주)클라우드인프라코리아',
      task: '클라우드 서버(IaaS) 호스팅 및 암호화 DB 백업 운영',
      items: '암호화된 입주·신청자 DB 일체',
      period: '위탁계약 기간과 동일'
    },
    {
      company: '(주)비즈메시지네트웍스',
      task: '창업지원 사업 안내 알림톡 및 SMS 발송 대행',
      items: '성명, 휴대전화번호',
      period: '발송 목적 달성 후 즉시 파기(최대 3개월)'
    }
  ]
};

// 숫자를 한글 금액으로 변환
function formatKoreanCurrency(num) {
  if (!num || isNaN(num) || num <= 0) return '금 영원정 (₩0)';
  const units = ['', '만', '억', '조'];
  const digits = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
  const smallUnits = ['', '십', '백', '천'];

  let result = '';
  let unitIdx = 0;
  let temp = Math.floor(num);

  while (temp > 0) {
    const part = temp % 10000;
    if (part > 0) {
      let partStr = '';
      let p = part;
      let sIdx = 0;
      while (p > 0) {
        const d = p % 10;
        if (d > 0) {
          const digitChar = (d === 1 && sIdx > 0) ? '' : digits[d];
          partStr = digitChar + smallUnits[sIdx] + partStr;
        }
        p = Math.floor(p / 10);
        sIdx++;
      }
      result = partStr + units[unitIdx] + result;
    }
    temp = Math.floor(temp / 10000);
    unitIdx++;
  }
  return `금 ${result}원정 (₩${Number(num).toLocaleString('ko-KR')})`;
}

// 날짜 가감 헬퍼
function addDays(dateStr, days) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function formatKoreanDate(dateStr) {
  if (!dateStr) return '2026년 10월 25일';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[0]}년 ${parseInt(parts[1], 10)}월 ${parseInt(parts[2], 10)}일`;
}

// 선택된 개인정보 태그 조회
function getSelectedTags(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return [];
  return Array.from(container.querySelectorAll('.data-tag.active')).map(btn => btn.dataset.item);
}

// 폼 입력값 전체 스냅샷 수집
function getFormData() {
  return {
    track: state.track,
    contractTitle: document.getElementById('contractTitle').value.trim(),
    startDate: document.getElementById('startDate').value,
    endDate: document.getElementById('endDate').value,
    contractDate: document.getElementById('contractDate').value,
    consignorName: document.getElementById('consignorName').value.trim(),
    consignorRep: document.getElementById('consignorRep').value.trim(),
    consignorBizNo: document.getElementById('consignorBizNo').value.trim(),
    consignorAddress: document.getElementById('consignorAddress').value.trim(),
    consignorManager: document.getElementById('consignorManager').value.trim(),
    consigneeName: document.getElementById('consigneeName').value.trim(),
    consigneeRep: document.getElementById('consigneeRep').value.trim(),
    consigneeBizNo: document.getElementById('consigneeBizNo').value.trim(),
    consigneeAddress: document.getElementById('consigneeAddress').value.trim(),
    consigneeCpo: document.getElementById('consigneeCpo').value.trim(),
    taskPurpose: document.getElementById('taskPurpose').value.trim(),
    dataScale: document.getElementById('dataScale').value,
    accessControlLevel: document.getElementById('accessControlLevel').value,
    generalItems: getSelectedTags('generalDataTags'),
    uniqueItems: getSelectedTags('uniqueDataTags'),
    sensitiveItems: getSelectedTags('sensitiveDataTags'),
    inspectionFreq: document.getElementById('inspectionFreq').value,
    destructionDays: parseInt(document.getElementById('destructionDays').value, 10),
    liabilityClause: document.getElementById('liabilityClause').value,
    subPolicy: document.getElementById('subPolicy').value,
    subProcessors: state.subProcessors,
    budgetAmount: parseInt(document.getElementById('budgetAmount').value, 10) || 0,
    settlementType: document.getElementById('settlementType').value,
    employmentRate: document.getElementById('employmentRate').value,
    perfEvalDays: parseInt(document.getElementById('perfEvalDays').value, 10),
    jurisdictionCourt: document.getElementById('jurisdictionCourt').value.trim()
  };
}

// 10대 법정 컴플라이언스 검증 룰셋 평가
function evaluateCompliance(data) {
  const checks = [];
  const isPrivacyIncluded = data.track === 'PRIVACY' || data.track === 'HYBRID';
  const isPublicIncluded = data.track === 'PUBLIC' || data.track === 'HYBRID';

  // R-01: 양측 관리·감독 책임자 및 CPO 지정 여부
  const r01Pass = data.consignorManager.length >= 4 && data.consigneeCpo.length >= 4;
  checks.push({
    id: 'R01',
    title: '양측 관리감독관 · CPO 실명/연락처 특정',
    law: '개인정보보호법 제31조 · 위수탁 안내서',
    weight: 10,
    pass: r01Pass,
    failMsg: '책임자 미지정 시 사후 점검·유출 통지가 단절됩니다.',
    fixFn: () => {
      if (data.consignorManager.length < 4) {
        document.getElementById('consignorManager').value = '이감독 사무관 (02-2133-0000 / audit@seoul.go.kr)';
      }
      if (data.consigneeCpo.length < 4) {
        document.getElementById('consigneeCpo').value = '최보안 개인정보보호책임자 (02-555-8899 / cpo@kin.or.kr)';
      }
    }
  });

  // R-02: 위탁업무 목적 및 범위 구체성
  const r02Pass = data.taskPurpose.length >= 25 && !data.taskPurpose.includes('기타 일체');
  checks.push({
    id: 'R02',
    title: '위탁업무의 목적 및 범위 구체적 특정',
    law: '개인정보보호법 제26조 제1항 제2호',
    weight: 10,
    pass: r02Pass,
    failMsg: '포괄적·모호한 업무 기재는 법정 필수사항 누락에 해당합니다.',
    fixFn: () => {
      document.getElementById('taskPurpose').value =
        '1. 청년창업지원센터 시설 운영 및 입주기업 보육·멘토링 프로그램 운영 사무\n2. 창업지원 사업 신청자 접수, 자격 심사, 만족도 조사 및 민원 상담 시스템 운영\n3. 창업지원금 정산 관리 및 센터 정보시스템(웹사이트·알림톡) 유지관리';
    }
  });

  // R-03: 개인정보 항목 최소 수집·특정
  const totalPrivacyItems = data.generalItems.length + data.uniqueItems.length + data.sensitiveItems.length;
  const r03Pass = !isPrivacyIncluded || totalPrivacyItems > 0;
  checks.push({
    id: 'R03',
    title: '처리 개인정보 항목(일반·고유식별) 명시',
    law: '개인정보보호법 시행령 제28조 제1항',
    weight: 10,
    pass: r03Pass,
    failMsg: '위탁 처리 대상 개인정보 항목이 1개 이상 특정되어야 합니다.',
    fixFn: () => {
      const defaults = ['성명', '생년월일', '휴대전화번호', '이메일 주소'];
      document.querySelectorAll('#generalDataTags .data-tag').forEach(btn => {
        if (defaults.includes(btn.dataset.item)) btn.classList.add('active');
      });
    }
  });

  // R-04: 재위탁 제한 및 사전 서면승인 통제
  const r04Pass =
    data.subPolicy === 'STRICT_PROHIBIT' ||
    (data.subPolicy === 'PRE_APPROVED_LIST' && data.subProcessors.length > 0 && data.subProcessors.every(s => s.company.trim() !== ''));
  checks.push({
    id: 'R04',
    title: '무단 재위탁 금지 및 재수탁사 사전승인 연동',
    law: '개인정보보호법 제26조 제6항 · 민간위탁 지침',
    weight: 15,
    pass: r04Pass,
    failMsg: '임의 재위탁 허용 또는 승인 명세 누락은 최다 유출·적발 원인입니다.',
    fixFn: () => {
      document.getElementById('subPolicy').value = 'PRE_APPROVED_LIST';
      if (state.subProcessors.length === 0) {
        state.subProcessors.push({
          company: '(주)클라우드인프라코리아',
          task: '클라우드 서버 호스팅 및 암호화 DB 백업 운영',
          items: '암호화된 DB 일체',
          period: '위탁계약 기간과 동일'
        });
      }
      renderSubProcessorInputs();
    }
  });

  // R-05: 안전성 확보조치(암호화·접근통제) 적정성
  const hasHighRiskData = data.uniqueItems.length > 0 || data.sensitiveItems.length > 0 || data.dataScale === 'OVER_100K';
  const r05Pass = !isPrivacyIncluded || (data.accessControlLevel !== 'WEAK' && (!hasHighRiskData || data.accessControlLevel === 'STRICT_MFA'));
  checks.push({
    id: 'R05',
    title: '위험도 비례 기술적·관리적 안전성 확보조치',
    law: '안전성 확보조치 기준 고시 제6조·제7조',
    weight: 15,
    pass: r05Pass,
    failMsg: '고유식별·대량 정보 처리 시 VPN/MFA 및 암호화 조항이 필수입니다.',
    fixFn: () => {
      document.getElementById('accessControlLevel').value = 'STRICT_MFA';
    }
  });

  // R-06: 정기 실태점검 및 연 1회 교육 의무화
  const r06Pass = !isPrivacyIncluded || data.inspectionFreq !== 'NONE';
  checks.push({
    id: 'R06',
    title: '정기 현장·서면 실태점검 및 보안교육 의무',
    law: '개인정보보호법 제26조 제4항 · 시행령 제28조',
    weight: 10,
    pass: r06Pass,
    failMsg: '형식적 계약을 막기 위해 연 1~2회 정기 실태점검 주기를 명시해야 합니다.',
    fixFn: () => {
      document.getElementById('inspectionFreq').value = 'SEMI_ANNUAL';
    }
  });

  // R-07: 계약 종료 후 파기 기한 및 파기확인서 징구
  const r07Pass = !isPrivacyIncluded || data.destructionDays > 0;
  checks.push({
    id: 'R07',
    title: '계약 종료 후 즉시 파기 기한 & 파기확인서 제출',
    law: '개인정보보호법 제21조 · 표준계약서 제7조',
    weight: 10,
    pass: r07Pass,
    failMsg: '종료 후 파기 기한(예: 5일 이내) 및 확인서 제출 의무가 누락되었습니다.',
    fixFn: () => {
      document.getElementById('destructionDays').value = '5';
    }
  });

  // R-08: 손해배상 및 소속직원 간주(법 제26조 제6항)
  const r08Pass = data.liabilityClause === 'STRICT';
  checks.push({
    id: 'R08',
    title: '손해배상 책임 및 위탁자 소속직원 간주 조항',
    law: '개인정보보호법 제26조 제6항 · 민법 제756조',
    weight: 10,
    pass: r08Pass,
    failMsg: '법 제26조 제6항의 사용자배상책임 및 구상권 조항이 누락되었습니다.',
    fixFn: () => {
      document.getElementById('liabilityClause').value = 'STRICT';
    }
  });

  // R-09: 민간위탁 노동자 고용승계 및 근로조건 보호
  const r09Pass = !isPublicIncluded || data.employmentRate !== 'NONE';
  checks.push({
    id: 'R09',
    title: '민간위탁 노동자 고용승계(80%↑) 및 임금보호',
    law: '국무조정실·고용노동부 근로조건 보호 가이드라인',
    weight: 5,
    pass: r09Pass,
    failMsg: '수탁기관 교체 시 고용불안 방지를 위한 고용승계 조항이 누락되었습니다.',
    fixFn: () => {
      document.getElementById('employmentRate').value = '80';
    }
  });

  // R-10: 민간위탁 사업비 정산·회계감사 및 성과평가 연동
  const r10Pass = !isPublicIncluded || (data.settlementType !== 'LUMP_SUM' && data.perfEvalDays > 0);
  checks.push({
    id: 'R10',
    title: '투명한 사업비 정산·회계감사 및 성과평가 연동',
    law: '행안부 지방자치단체 민간위탁 관리지침',
    weight: 5,
    pass: r10Pass,
    failMsg: '총액도급 방치 및 관행적 재계약을 막기 위해 정산·성과평가가 필수입니다.',
    fixFn: () => {
      document.getElementById('settlementType').value = 'AUDIT_SETTLE';
      document.getElementById('perfEvalDays').value = '90';
    }
  });

  const totalScore = checks.reduce((acc, c) => acc + (c.pass ? c.weight : 0), 0);
  return { totalScore, checks };
}

// 린터 UI 렌더링
function renderLinterUI(evalResult) {
  const { totalScore, checks } = evalResult;
  const scoreEl = document.getElementById('complianceScore');
  const barEl = document.getElementById('complianceProgressBar');
  const cardEl = document.getElementById('linterCard');
  const statusEl = document.getElementById('linterStatusText');
  const listEl = document.getElementById('linterChecklist');
  const fixAllBtn = document.getElementById('btnAutoFixAll');

  scoreEl.innerHTML = `${totalScore}<span class="score-unit">/100</span>`;
  barEl.style.width = `${totalScore}%`;

  const failedChecks = checks.filter(c => !c.pass);

  cardEl.classList.remove('warn', 'danger');
  if (totalScore === 100) {
    scoreEl.style.color = 'var(--status-ok)';
    barEl.style.background = 'linear-gradient(90deg, #10B981, #059669)';
    statusEl.className = 'linter-status-ok';
    statusEl.textContent = '✅ 10대 법정 필수 기재사항 및 단점 개선 조항이 100% 충족되었습니다.';
    fixAllBtn.style.display = 'none';
  } else if (totalScore >= 75) {
    cardEl.classList.add('warn');
    scoreEl.style.color = 'var(--status-warn)';
    barEl.style.background = 'linear-gradient(90deg, #F59E0B, #D97706)';
    statusEl.className = 'linter-status-warn';
    statusEl.textContent = `⚠️ ${failedChecks.length}건의 법령 권고·필수 항목 보완이 필요합니다.`;
    fixAllBtn.style.display = 'inline-flex';
  } else {
    cardEl.classList.add('danger');
    scoreEl.style.color = 'var(--status-danger)';
    barEl.style.background = 'linear-gradient(90deg, #EF4444, #DC2626)';
    statusEl.className = 'linter-status-warn';
    statusEl.textContent = `🚨 주의: ${failedChecks.length}건의 법정 필수조항 누락·독소 설정이 감지되었습니다! (과태료·감사 지적 위험)`;
    fixAllBtn.style.display = 'inline-flex';
  }

  listEl.innerHTML = checks
    .map(c => {
      if (c.pass) {
        return `
          <div class="lint-item pass">
            <div class="lint-item-text">
              <span class="lint-item-title">✔ ${c.title}</span>
              <span class="lint-item-law">${c.law} (+${c.weight}점)</span>
            </div>
          </div>
        `;
      } else {
        return `
          <div class="lint-item fail">
            <div class="lint-item-text">
              <span class="lint-item-title">✖ ${c.title}</span>
              <span class="lint-item-law" style="color:#B91C1C;">${c.failMsg}</span>
            </div>
            <button type="button" class="lint-fix-btn" data-check-id="${c.id}">즉시 보완</button>
          </div>
        `;
      }
    })
    .join('');

  // 개별 즉시 보완 버튼 이벤트 연결
  listEl.querySelectorAll('.lint-fix-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const checkId = btn.dataset.checkId;
      const target = checks.find(item => item.id === checkId);
      if (target && target.fixFn) {
        target.fixFn();
        updateAll();
        showToast(`✅ [${target.title}] 항목이 법령 기준에 맞게 자동 보완되었습니다.`);
      }
    });
  });
}

// 재수탁사 입력 리스트 렌더링
function renderSubProcessorInputs() {
  const container = document.getElementById('subProcessorContainer');
  const listEl = document.getElementById('subProcessorList');
  const subPolicy = document.getElementById('subPolicy').value;

  if (subPolicy === 'STRICT_PROHIBIT') {
    container.style.opacity = '0.55';
  } else {
    container.style.opacity = '1';
  }

  if (state.subProcessors.length === 0) {
    listEl.innerHTML = `<div style="font-size:12px; color:#64748B; padding:6px;">등록된 재수탁사가 없습니다. 우측 상단 [+ 재수탁사 행 추가]를 눌러 클라우드·외주 업체를 등록하세요.</div>`;
    return;
  }

  listEl.innerHTML = state.subProcessors
    .map(
      (sub, idx) => `
      <div class="subprocessor-row" data-idx="${idx}">
        <input type="text" class="form-input sub-company" placeholder="재수탁사명 (예: AWS코리아)" value="${sub.company}" />
        <input type="text" class="form-input sub-task" placeholder="재위탁 업무 내용" value="${sub.task}" />
        <input type="text" class="form-input sub-items" placeholder="취급 개인정보 항목" value="${sub.items}" />
        <input type="text" class="form-input sub-period" placeholder="보유·이용 기간" value="${sub.period}" />
        <button type="button" class="btn-del-sub" title="삭제">&times;</button>
      </div>
    `
    )
    .join('');

  listEl.querySelectorAll('.subprocessor-row').forEach(row => {
    const idx = parseInt(row.dataset.idx, 10);
    row.querySelector('.sub-company').addEventListener('input', e => {
      state.subProcessors[idx].company = e.target.value;
      updateAll(false);
    });
    row.querySelector('.sub-task').addEventListener('input', e => {
      state.subProcessors[idx].task = e.target.value;
      updateAll(false);
    });
    row.querySelector('.sub-items').addEventListener('input', e => {
      state.subProcessors[idx].items = e.target.value;
      updateAll(false);
    });
    row.querySelector('.sub-period').addEventListener('input', e => {
      state.subProcessors[idx].period = e.target.value;
      updateAll(false);
    });
    row.querySelector('.btn-del-sub').addEventListener('click', () => {
      state.subProcessors.splice(idx, 1);
      renderSubProcessorInputs();
      updateAll(false);
    });
  });
}

// 개선 해설 배지 헬퍼
function badgeHTML(text, isWarn = false) {
  if (!state.showAnnotations) return '';
  return `<span class="improvement-badge ${isWarn ? 'warn' : ''}">${text}</span>`;
}

// 1. 본 위·수탁 계약서(협약서) HTML 생성
function generateMainContractHTML(d) {
  const isPrivacy = d.track === 'PRIVACY' || d.track === 'HYBRID';
  const isPublic = d.track === 'PUBLIC' || d.track === 'HYBRID';

  const trackLabel =
    d.track === 'HYBRID'
      ? '공공 행정사무 민간위탁 및 개인정보 처리 위·수탁 통합 표준협약서'
      : d.track === 'PRIVACY'
      ? '개인정보 처리 위·수탁 표준계약서 (개인정보 보호법 제26조 준거)'
      : '지방자치단체 행정사무 민간위탁 표준 위·수탁 협약서';

  const allPrivacyItems = [
    ...d.generalItems,
    ...d.uniqueItems.map(i => `[고유식별] ${i}`),
    ...d.sensitiveItems.map(i => `[민감정보] ${i}`)
  ];

  const privacyItemsStr =
    allPrivacyItems.length > 0
      ? allPrivacyItems.join(', ')
      : '<span style="color:#DC2626; font-weight:700;">[⚠️ 누락: 처리할 개인정보 항목을 좌측 패널에서 특정해 주십시오]</span>';

  let clauseNum = 1;
  const nextClause = () => `제${clauseNum++}조`;

  // 재위탁 조항 문구 분기
  let subClauseContent = '';
  if (d.subPolicy === 'STRICT_PROHIBIT') {
    subClauseContent = `
      <ol>
        <li>“수탁자”는 “위탁자”의 사전 서면 승낙 없이는 본 계약에 따른 위탁업무의 전부 또는 일부를 제3자에게 재위탁(하도급)하거나 양도할 수 없다.</li>
        <li>“수탁자”가 클라우드 컴퓨팅 서비스, 문자발송 대행 등 불가피한 사유로 제3자에게 업무 일부를 재위탁하고자 할 경우, 재위탁 개시 최소 15일 전까지 재수탁자의 명칭, 재위탁 업무범위, 안전성 확보조치 계획서를 “위탁자”에게 제출하여 서면 승인을 득하여야 한다.</li>
      </ol>`;
  } else if (d.subPolicy === 'PRE_APPROVED_LIST') {
    const subRows =
      d.subProcessors.length > 0
        ? d.subProcessors
            .map(
              (s, i) => `
          <tr>
            <td style="text-align:center;">${i + 1}</td>
            <td><strong>${s.company || '(미입력)'}</strong></td>
            <td>${s.task || '-'}</td>
            <td>${s.items || '-'}</td>
            <td>${s.period || '-'}</td>
          </tr>`
            )
            .join('')
        : `<tr><td colspan="5" style="text-align:center; color:#DC2626;">사전 승인된 재수탁사 명세가 입력되지 않았습니다.</td></tr>`;

    subClauseContent = `
      <ol>
        <li>“수탁자”는 원칙적으로 “위탁자”의 사전 서면 승낙 없이 위탁업무의 전부 또는 일부를 제3자에게 재위탁할 수 없다. 단, 본 계약 체결 시 “위탁자”가 사전 심사하여 승인한 아래 <strong>[별표 1] 재위탁 승인 명세표</strong> 기재 업체에 한하여 제한적으로 재위탁을 승인한다.</li>
        <li>“수탁자”가 [별표 1] 이외의 제3자에게 추가 재위탁하거나 재수탁자를 변경하고자 할 때에는 즉시 “위탁자”에게 사전 서면 승인을 받아야 한다.</li>
        <li>“수탁자”는 재수탁자가 본 계약상 “수탁자”의 모든 의무(안전성 확보조치, 비밀유지, 점검 수인, 파기 의무 등)를 동일하게 준수하도록 서면 계약을 체결하고 관리·감독하여야 하며, 재수탁자의 과실로 발생한 모든 손해에 대하여 “위탁자”에게 연대하여 책임을 진다.</li>
      </ol>
      <table class="legal-table" style="margin-top:10px;">
        <thead>
          <tr>
            <th style="width:8%; text-align:center;">연번</th>
            <th style="width:22%;">재수탁사 명칭</th>
            <th style="width:30%;">재위탁 업무 내용</th>
            <th style="width:22%;">취급 개인정보 항목</th>
            <th style="width:18%;">보유·이용 기간</th>
          </tr>
        </thead>
        <tbody>${subRows}</tbody>
      </table>`;
  } else {
    subClauseContent = `
      <p style="color:#DC2626; font-weight:600;">
        [⚠️ 법령 위반 경고: 수탁자의 임의 재위탁을 허용하는 조항은 「개인정보 보호법」 제26조 제6항 및 민간위탁 지침에 위배됩니다. 좌측 패널에서 재위탁 통제 정책을 변경해 주십시오.]
      </p>`;
  }

  // 안전성 확보조치 문구 분기
  const logRetentionPeriod = d.dataScale === 'OVER_100K' ? '2년 이상' : '1년 이상';
  const securityMeasuresText =
    d.accessControlLevel === 'STRICT_MFA'
      ? `
      <ol>
        <li><strong>관리적 보호조치</strong>: 개인정보 내부관리계획 수립·시행, 개인정보 취급자 최소화 지정, 정기 보안교육(연 1회 이상) 실시 및 보안서약서 징구</li>
        <li><strong>기술적 보호조치 (고위험·강화 기준 적용)</strong>:
          <ul>
            <li>개인정보처리시스템에 대한 접근권한 차등 부여 및 퇴직·인사이동 시 지체 없는 권한 말소</li>
            <li>외부에서 개인정보처리시스템 접속 시 <strong>가상사설망(VPN) 또는 전용선</strong>을 통한 안전한 접속 수단 적용 및 <strong>2차 인증(MFA)</strong> 의무 적용</li>
            <li>고유식별정보·민감정보·비밀번호·바이오정보의 저장 시 <strong>안전한 암호화 알고리즘(AES-256 등)을 통한 암호화 저장</strong> 및 정보통신망 송·수신 구간(SSL/TLS) 전체 암호화</li>
            <li>개인정보취급자의 접속기록(계정, 접속일시, 접속자 IP, 수행업무)을 <strong>최소 ${logRetentionPeriod} 보관·관리</strong>하고, 월 1회 이상 이상행위 여부를 점검하며 위·변조 방지를 위한 백업 보관</li>
            <li>악성프로그램 방지 대책(백신 실시간 감시) 및 보안 패치 상시 적용</li>
          </ul>
        </li>
        <li><strong>물리적 보호조치</strong>: 전산실, 자료보관실 등 개인정보 보관장소에 대한 출입통제 절차 수립·운영 및 보조저장매체(USB 등)의 반출입 통제</li>
      </ol>`
      : d.accessControlLevel === 'STANDARD'
      ? `
      <ol>
        <li>“수탁자”는 「개인정보 보호법」 제23조·제24조·제29조 및 「개인정보의 안전성 확보조치 기준」 고시에 따라 내부관리계획 수립, 접근권한 관리, 비밀번호 및 고유식별정보 암호화, 접속기록(${logRetentionPeriod}) 보관, 보안프로그램 설치 등 기술적·관리적·물리적 보호조치를 이행하여야 한다.</li>
      </ol>`
      : `<p style="color:#DC2626; font-weight:600;">[⚠️ 경고: 안전성 확보조치 기준이 미흡하게 설정되었습니다. 고유식별정보 또는 대량 개인정보 취급 시 강화된 보호조치 설정이 필요합니다.]</p>`;

  return `
    <div class="doc-header-banner">
      <span>문서관리번호: TC-${new Date().getFullYear()}-${d.track}-001</span>
      <span>${trackLabel}</span>
    </div>

    <h1 class="doc-main-title">${d.contractTitle || '위·수탁 표준 계약서(협약서)'}</h1>

    <div class="doc-preamble">
      <strong>${d.consignorName}</strong>(이하 “위탁자”라 한다)와 <strong>${d.consigneeName}</strong>(이하 “수탁자”라 한다)는 “위탁자”의 업무(행정사무 및 개인정보 처리 업무)를 “수탁자”에게 위탁함에 있어, 상호 대등한 지위에서 신의성실의 원칙에 따라 권리와 의무를 명확히 규정하고 ${
        isPrivacy ? '「개인정보 보호법」 제26조 및 관계 법령' : ''
      }${isPrivacy && isPublic ? ', ' : ''}${
    isPublic ? '「지방자치법」 제117조 및 민간위탁 관련 조례·지침' : ''
  }을 철저히 준수하기 위하여 다음과 같이 위·수탁 계약(협약)을 체결한다.
    </div>

    <div class="clause-block">
      <div class="clause-title">${nextClause()} (목적)</div>
      <div class="clause-body">
        본 계약은 “위탁자”가 “수탁자”에게 제2조에 정한 업무를 위탁하고, “수탁자”가 이를 성실히 수행함에 있어 필요한 제반 사항, 안전성 확보조치, 사후 관리·감독 및 책임 관계를 규정함을 목적으로 한다.
      </div>
    </div>

    <div class="clause-block">
      <div class="clause-title">
        ${nextClause()} (위탁업무의 목적 및 범위)
        ${badgeHTML('단점개선 ① 포괄적 위탁 배제 · 법 제26조 제1항 특정')}
      </div>
      <div class="clause-body">
        <p>“위탁자”가 “수탁자”에게 위탁하는 업무의 구체적인 목적과 범위는 다음과 같으며, “수탁자”는 본 조에 명시된 목적과 범위를 초과하여 임의로 업무를 처리하거나 개인정보를 이용할 수 없다.</p>
        <table class="legal-table">
          <tbody>
            <tr>
              <th>위탁업무의 목적 및 내용</th>
              <td style="white-space:pre-line;">${d.taskPurpose || '(위탁업무 내용이 입력되지 않았습니다)'}</td>
            </tr>
            ${
              isPrivacy
                ? `
            <tr>
              <th>취급 대상 정보주체 규모</th>
              <td>${
                d.dataScale === 'OVER_100K'
                  ? '10만 명 이상 (대규모 처리 · 고위험 통제 등급)'
                  : d.dataScale === '10K_TO_100K'
                  ? '1만 명 이상 ~ 10만 명 미만 (중규모 표준 통제 등급)'
                  : '1만 명 미만 (소규모 기본 통제 등급)'
              }</td>
            </tr>
            <tr>
              <th>처리하는 개인정보 항목</th>
              <td>${privacyItemsStr}</td>
            </tr>`
                : ''
            }
          </tbody>
        </table>
      </div>
    </div>

    <div class="clause-block">
      <div class="clause-title">${nextClause()} (위탁계약 기간 및 관리책임자 지정) ${badgeHTML('단점개선 ② 감독 단절 방지를 위한 양측 실명 책임자 지정')}</div>
      <div class="clause-body">
        <ol>
          <li>본 위·수탁 계약기간은 <strong>${formatKoreanDate(d.startDate)}부터 ${formatKoreanDate(d.endDate)}까지</strong>로 한다.</li>
          <li>양 당사자는 위탁업무의 원활한 수행과 상시적 관리·감독 및 유출 사고 시 즉각적인 비상연락을 위하여 아래와 같이 전담 관리책임자(개인정보보호책임자)를 지정하여 운영한다.</li>
        </ol>
        <table class="legal-table">
          <tbody>
            <tr>
              <th>“위탁자” 관리·감독 책임자</th>
              <td>${d.consignorManager || '<span style="color:#DC2626;">[미지정 - 입력 필요]</span>'}</td>
            </tr>
            <tr>
              <th>“수탁자” 개인정보보호책임자(CPO)</th>
              <td>${d.consigneeCpo || '<span style="color:#DC2626;">[미지정 - 입력 필요]</span>'}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="clause-block">
      <div class="clause-title">
        ${nextClause()} (재위탁의 제한 및 사전 서면승인)
        ${badgeHTML('단점개선 ③ 무단 다단계 재위탁(Sub-processing) 사각지대 원천 차단', d.subPolicy === 'UNRESTRICTED')}
      </div>
      <div class="clause-body">
        ${subClauseContent}
      </div>
    </div>

    ${
      isPrivacy
        ? `
    <div class="clause-block">
      <div class="clause-title">
        ${nextClause()} (개인정보의 안전성 확보조치)
        ${badgeHTML('단점개선 ④ 취급 정보량·고유식별정보 위험도 비례 보안조치 자동 매핑', d.accessControlLevel === 'WEAK')}
      </div>
      <div class="clause-body">
        <p>“수탁자”는 「개인정보 보호법」 제23조 제2항, 제24조 제3항 및 제29조와 개인정보보호위원회 고시 「개인정보의 안전성 확보조치 기준」에 따라 다음 각 호의 기술적·관리적 및 물리적 조치를 취하여야 한다.</p>
        ${securityMeasuresText}
      </div>
    </div>

    <div class="clause-block">
      <div class="clause-title">
        ${nextClause()} (개인정보의 목적 외 처리 금지 및 유출 통지 의무)
      </div>
      <div class="clause-body">
        <ol>
          <li>“수탁자”는 계약기간은 물론 계약 종료 후에도 위탁업무 수행 목적 범위를 넘어 개인정보를 처리하거나 제3자에게 제공·누설하여서는 아니 된다.</li>
          <li>“수탁자”는 개인정보의 분실·도난·유출·위조·변조 또는 훼손 사실을 알게 된 때에는 <strong>인지 즉시(최대 24시간 이내)</strong> “위탁자”의 관리책임자에게 서면 및 유선으로 통지하고, 피해 최소화를 위한 긴급 차단 조치를 취하여야 한다.</li>
        </ol>
      </div>
    </div>

    <div class="clause-block">
      <div class="clause-title">
        ${nextClause()} (수탁자에 대한 실태점검·감독 및 교육)
        ${badgeHTML('단점개선 ⑤ 형식적 서면점검 탈피 · 정기 실태점검 및 시정요구권 명문화', d.inspectionFreq === 'NONE')}
      </div>
      <div class="clause-body">
        <ol>
          <li>“위탁자”는 「개인정보 보호법」 제26조 제4항에 따라 “수탁자”에 대하여 <strong>${
            d.inspectionFreq === 'SEMI_ANNUAL'
              ? '반기별 1회 이상(연 2회 이상)'
              : d.inspectionFreq === 'ANNUAL'
              ? '연 1회 이상'
              : '[⚠️ 점검주기 미지정]'
          }</strong> 정기적으로 다음 각 호의 사항에 관한 관리 현황 점검 및 현장 실사를 실시할 수 있으며, “수탁자”는 특별한 사유가 없는 한 이에 성실히 응하여야 한다.
            <ul>
              <li>개인정보의 처리 현황 및 접속기록 보관·점검 실태</li>
              <li>개인정보 접근권한 관리, 암호화 및 기술적 보호조치 이행 여부</li>
              <li>목적 외 이용·제3자 제공 및 무단 재위탁 금지 준수 여부</li>
              <li>계약 종료 또는 보유기간 경과 개인정보의 완전 파기 여부</li>
            </ul>
          </li>
          <li>“위탁자”는 점검 결과 미흡 사항이 발견될 경우 시정조치를 요구할 수 있으며, “수탁자”는 요구를 받은 날로부터 14일 이내에 시정조치 완료 결과보고서를 제출하여야 한다.</li>
          <li>“수탁자”는 소속 개인정보취급자를 대상으로 <strong>연 1회 이상 개인정보보호 교육</strong>을 실시하고 그 수료 증빙을 “위탁자”에게 제출하여야 한다.</li>
        </ol>
      </div>
    </div>

    <div class="clause-block">
      <div class="clause-title">
        ${nextClause()} (계약 종료 시 개인정보의 파기 및 파기확인서 제출)
        ${badgeHTML('단점개선 ⑥ 계약 종료 후 미파기 방치 예방 · 파기확인서 징구 기한 강제', d.destructionDays === 0)}
      </div>
      <div class="clause-body">
        <ol>
          <li>“수탁자”는 위탁계약 기간이 만료되거나 계약이 해지된 경우, 또는 위탁업무 목적이 달성된 경우에는 <strong>사유 발생일로부터 ${
            d.destructionDays > 0 ? `${d.destructionDays}일 이내` : '[⚠️ 기한 미지정]'
          }</strong>에 위탁업무와 관련하여 보유하고 있는 모든 개인정보(복사본, 백업본, 출력물 포함)를 복구 또는 재생할 수 없는 기술적 방법(로우레벨 포맷, 완전 덮어쓰기, 파쇄·소각 등)으로 영구 파기하거나 “위탁자”에게 반납하여야 한다.</li>
          <li>“수탁자”는 제1항에 따른 파기를 완료한 즉시 대표자 및 개인정보보호책임자(CPO)가 서명·날인한 <strong>[별첨 2] 개인정보 파기확인서</strong> 및 증빙자료(화면 캡처, 파쇄 사진 등)를 “위탁자”에게 제출하여 확인을 받아야 한다.</li>
        </ol>
      </div>
    </div>`
        : ''
    }

    ${
      isPublic
        ? `
    <div class="clause-block">
      <div class="clause-title">
        ${nextClause()} (위탁운영비의 교부 · 전용계좌 관리 및 회계감사 정산)
        ${badgeHTML('단점개선 ⑦ 한국지방행정연구원 지적사항 반영 · 정산 투명성 및 회계감사 의무화', d.settlementType === 'LUMP_SUM')}
      </div>
      <div class="clause-body">
        <ol>
          <li>본 위탁사무 수행을 위한 연간 위탁운영비 예산은 <strong>${formatKoreanCurrency(d.budgetAmount)}</strong>(부가가치세 등 일체 포함)으로 하되, 매 회계연도 지자체 의회 예산 심의 결과에 따라 조정될 수 있다.</li>
          <li>“수탁자”는 위탁운영비를 타 사업 자금과 명확히 구분하여 관리하기 위해 <strong>위탁사무 전용 독립 계좌</strong>를 개설·운영하여야 하며, 지방자치단체 회계관계규정 및 민간위탁 관리지침에 따라 지정된 용도로만 집행하여야 한다.</li>
          <li><strong>정산 및 회계감사</strong>: ${
            d.settlementType === 'AUDIT_SETTLE'
              ? '“수탁자”는 매 회계연도 종료 후(또는 협약 만료 후) 30일 이내에 <strong>독립된 외부 공인회계사(회계법인)의 회계감사보고서</strong>를 첨부한 사업비 정산서를 “위탁자”에게 제출하여야 하며, 정산 결과 발생한 집행잔액, 발생이자 및 부당집행액은 전액 지체 없이 “위탁자”에게 반납하여야 한다.'
              : d.settlementType === 'BASIC_SETTLE'
              ? '“수탁자”는 매 회계연도 종료 후 30일 이내에 증빙서류를 첨부한 사업비 정산보고서를 제출하고, 집행잔액 및 이자를 반납하여야 한다.'
              : '<span style="color:#DC2626;">[⚠️ 경고: 정산 의무가 배제된 총액도급 방식은 행정안전부 민간위탁 관리지침 및 감사원 감사 기준에 위배될 위험이 있습니다.]</span>'
          }</li>
        </ol>
      </div>
    </div>

    <div class="clause-block">
      <div class="clause-title">
        ${nextClause()} (민간위탁 노동자 고용승계 및 근로조건 보호)
        ${badgeHTML('단점개선 ⑧ 국무조정실·고용노동부 가이드라인 반영 · 고용승계 및 임금 보호 명문화', d.employmentRate === 'NONE')}
      </div>
      <div class="clause-body">
        ${
          d.employmentRate !== 'NONE'
            ? `
        <ol>
          <li>“수탁자”는 정부의 「민간위탁 노동자 근로조건 보호 가이드라인」을 성실히 준수하며, 수탁기관 변경 시 특별한 사정이 없는 한 기존 위탁사무 종사 근로자에 대하여 <strong>고용승계 비율 ${d.employmentRate}% 이상을 유지</strong>하도록 하여야 한다.</li>
          <li>“수탁자”는 원가계산서 및 예산서에 책정된 종사자 인건비 단가 기준을 준수하여 임금을 지급하여야 하며, <strong>분기별로 임금지급 명세서 및 4대 사회보험료 납부 확인서</strong>를 “위탁자”에게 제출하여야 한다.</li>
          <li>“수탁자”는 종사자의 퇴직급여 보장을 위하여 퇴직급여충당금을 별도 계좌에 적립·관리하여야 하며, 본 조의 의무를 확약하기 위하여 <strong>[별첨 4] 민간위탁 노동자 근로조건 보호 확약서</strong>를 체결 시 제출한다. (단, 본 조를 위반한 경우 “위탁자”는 차기 수탁기관 선정 심사 시 감점 부여 또는 협약을 해지할 수 있다.)</li>
        </ol>`
            : `<p style="color:#DC2626; font-weight:600;">[⚠️ 경고: 민간위탁 노동자 고용승계 및 근로조건 보호 조항이 누락되었습니다. 좌측 패널에서 고용승계 옵션을 활성화해 주십시오.]</p>`
        }
      </div>
    </div>

    <div class="clause-block">
      <div class="clause-title">
        ${nextClause()} (종합성과평가 및 재계약·재위탁 심사 연동)
        ${badgeHTML('단점개선 ⑨ 국회입법조사처 지적사항 반영 · 관행적 연장 차단 및 성과평가 연동', d.perfEvalDays === 0)}
      </div>
      <div class="clause-body">
        <ol>
          <li>“위탁자”는 민간위탁 서비스의 공공성과 품질 향상을 위하여 협약기간 만료 <strong>${
            d.perfEvalDays > 0 ? `${d.perfEvalDays}일 전까지` : '[⚠️ 기한 미지정]'
          }</strong> 외부 전문가가 참여하는 종합성과평가를 실시한다.</li>
          <li>종합성과평가 결과(서비스 만족도, 예산 집행 투명성, 근로자 처우 보호, 개인정보 보안 준수율)는 인터넷 홈페이지 등을 통해 공개하며, 차기 재계약(재위탁) 적격성 심사의 핵심 지표로 의무 반영한다.</li>
        </ol>
      </div>
    </div>`
        : ''
    }

    <div class="clause-block">
      <div class="clause-title">
        ${nextClause()} (계약의 해지 및 사전 소명 절차)
      </div>
      <div class="clause-body">
        <ol>
          <li>“위탁자”는 “수탁자”가 본 계약상의 중대한 의무(무단 재위탁, 개인정보 목적 외 이용·유출, 안전성 확보조치 불이행, 허위 정산, 근로조건 보호 확약 위반 등)를 위반하거나 시정요구를 이행하지 아니한 경우 본 계약을 해지할 수 있다.</li>
          <li>일방적인 해지 남용을 방지하기 위하여, “위탁자”가 제1항에 따라 계약을 해지하고자 할 때에는 해지 예정일 14일 전까지 그 사유를 서면으로 통보하고 “수탁자”에게 <strong>충분한 사전 소명(청문) 기회</strong>를 부여하여야 한다.</li>
        </ol>
      </div>
    </div>

    <div class="clause-block">
      <div class="clause-title">
        ${nextClause()} (손해배상 및 법적 책임)
        ${badgeHTML('단점개선 ⑩ 개인정보보호법 제26조 제6항 소속직원 간주 및 구상권 명확화', d.liabilityClause !== 'STRICT')}
      </div>
      <div class="clause-body">
        ${
          d.liabilityClause === 'STRICT'
            ? `
        <ol>
          <li>“수탁자” 또는 “수탁자”의 임직원(재수탁자 포함)이 본 계약에 따른 위탁업무를 수행함에 있어 고의 또는 과실로 본 계약이나 관계 법령(「개인정보 보호법」 등)을 위반하여 “위탁자”, 정보주체 또는 제3자에게 손해를 입힌 경우, “수탁자”는 그 손해를 배상할 책임을 진다.</li>
          <li>「개인정보 보호법」 제26조 제6항에 따라 “수탁자”가 위탁받은 업무와 관련하여 개인정보를 처리하면서 동법을 위반하여 정보주체에게 손해를 발생시킨 경우에는 <strong>“수탁자”를 “위탁자”의 소속 직원으로 간주</strong>한다. 이 경우 “위탁자”가 정보주체 등에게 손해배상금 또는 과징금 등을 선지급한 때에는 “수탁자”에 대하여 구상권을 행사할 수 있다.</li>
        </ol>`
            : `<p style="color:#DC2626; font-weight:600;">[⚠️ 법 제26조 제6항 누락 경고: 수탁자의 법 위반 시 위탁자의 소속직원으로 간주하는 법정 손해배상 조항이 누락되었습니다.]</p>`
        }
      </div>
    </div>

    <div class="clause-block">
      <div class="clause-title">${nextClause()} (관할법원 및 분쟁해결)</div>
      <div class="clause-body">
        본 계약에 관한 해석상 이의가 있거나 본 계약에 명시되지 아니한 사항은 관계 법령 및 상관례에 따르며, 분쟁이 원만히 해결되지 아니할 경우 소송의 관할법원은 <strong>${d.jurisdictionCourt || '위탁자 소재지 관할법원'}</strong>으로 한다.
      </div>
    </div>

    <p style="margin-top:24px; text-align:center; font-weight:600;">
      본 계약의 체결을 증명하고 제반 의무를 성실히 이행하기 위하여 계약서(협약서) 2통을 작성하고 “위탁자”와 “수탁자”가 기명날인한 후 각각 1통씩 보관한다. (단, [별첨 1~4]의 부속서류는 본 계약서의 일부로서 동일한 효력을 갖는다.)
    </p>

    <div class="signature-section">
      <div class="sig-date">${formatKoreanDate(d.contractDate)}</div>
      <div class="sig-grid">
        <div class="sig-card">
          <div class="sig-role">“위탁자” (위탁기관 / 도급인)</div>
          <div class="sig-line"><span>기관(기업)명:</span> <strong>${d.consignorName}</strong></div>
          <div class="sig-line"><span>사업자번호:</span> <span>${d.consignorBizNo}</span></div>
          <div class="sig-line"><span>소 재 지:</span> <span>${d.consignorAddress}</span></div>
          <div class="sig-line"><span>관리책임자:</span> <span>${d.consignorManager}</span></div>
          <div class="sig-line" style="margin-top:10px;">
            <span>대표자(기관장):</span>
            <strong>${d.consignorRep} <span class="seal-stamp">인</span></strong>
          </div>
        </div>

        <div class="sig-card">
          <div class="sig-role">“수탁자” (수탁기관 / 수급인)</div>
          <div class="sig-line"><span>기관(기업)명:</span> <strong>${d.consigneeName}</strong></div>
          <div class="sig-line"><span>사업자번호:</span> <span>${d.consigneeBizNo}</span></div>
          <div class="sig-line"><span>소 재 지:</span> <span>${d.consigneeAddress}</span></div>
          <div class="sig-line"><span>보호책임자(CPO):</span> <span>${d.consigneeCpo}</span></div>
          <div class="sig-line" style="margin-top:10px;">
            <span>대 표 자:</span>
            <strong>${d.consigneeRep} <span class="seal-stamp">인</span></strong>
          </div>
        </div>
      </div>
    </div>
  `;
}

// 2. [별첨 1] 개인정보 보호 및 보안서약서 생성
function generateSecurityPledgeHTML(d) {
  return `
    <div class="doc-header-banner">
      <span>부속서류 [별첨 1]</span>
      <span>위·수탁 계약 연동 보안서약서</span>
    </div>

    <h1 class="doc-main-title">수탁기관 대표자 및 취급자 개인정보 보호 · 보안서약서</h1>

    <div class="doc-preamble">
      당사(<strong>${d.consigneeName}</strong>) 및 소속 임직원 일동은 <strong>${d.consignorName}</strong>(이하 “위탁자”)로부터 위탁받은 <strong>「${d.contractTitle}」</strong> 업무를 수행함에 있어, 다음 사항을 철저히 준수할 것을 엄숙히 서약합니다.
    </div>

    <div class="clause-block">
      <div class="clause-title">1. 목적 외 이용 및 제3자 제공 절대 금지</div>
      <div class="clause-body">
        위탁업무 수행 중 알게 되거나 취급하게 된 개인정보(${[...d.generalItems, ...d.uniqueItems].join(', ') || '위탁 대상 개인정보 일체'}) 및 행정·영업 기밀을 위탁업무 목적 외로 이용하거나, “위탁자”의 사전 서면 승인 없이 제3자에게 제공·누설·유출하지 않겠습니다.
      </div>
    </div>

    <div class="clause-block">
      <div class="clause-title">2. 기술적·관리적·물리적 안전성 확보조치 이행</div>
      <div class="clause-body">
        「개인정보 보호법」 제29조 및 「개인정보의 안전성 확보조치 기준」에 따라 인가받지 않은 자의 접근을 통제하고, 개인정보 저장·전송 시 암호화 조치 및 접속기록 보관 의무를 성실히 이행하겠습니다.
      </div>
    </div>

    <div class="clause-block">
      <div class="clause-title">3. 무단 재위탁 금지 및 실태점검 성실 수용</div>
      <div class="clause-body">
        “위탁자”의 사전 서면 승낙 없이는 어떠한 경우에도 제3자에게 업무를 재위탁하지 않겠으며, “위탁자”가 실시하는 정기·수시 현장 실태점검 및 감사 요구에 지체 없이 응하겠습니다.
      </div>
    </div>

    <div class="clause-block">
      <div class="clause-title">4. 위탁 종료 시 지체 없는 완전 파기</div>
      <div class="clause-body">
        위탁기간 만료(${formatKoreanDate(d.endDate)}) 또는 계약 해지 시 <strong>${d.destructionDays || 5}일 이내</strong>에 보유 중인 모든 개인정보와 복제본을 복구 불가능한 방법으로 완전 파기하고 파기확인서를 제출하겠습니다.
      </div>
    </div>

    <p style="margin-top:20px; font-weight:600;">
      만약 위 서약 사항을 위반하여 개인정보 유출 사고나 손해가 발생할 경우, 「개인정보 보호법」 등 관계 법령에 따른 민·형사상 및 행정상의 모든 책임을 감수할 것을 서약합니다.
    </p>

    <div class="signature-section">
      <div class="sig-date">${formatKoreanDate(d.contractDate)}</div>
      <table class="legal-table">
        <tbody>
          <tr>
            <th>서약 기관(수탁자)</th>
            <td><strong>${d.consigneeName}</strong> (사업자번호: ${d.consigneeBizNo})</td>
          </tr>
          <tr>
            <th>개인정보보호책임자(CPO)</th>
            <td>${d.consigneeCpo} &nbsp;&nbsp; <strong>(서명 또는 인)</strong></td>
          </tr>
          <tr>
            <th>대표자 서명·날인</th>
            <td>대표자 <strong>${d.consigneeRep}</strong> &nbsp;&nbsp; <span class="seal-stamp">인</span></td>
          </tr>
          <tr>
            <th>제출처 (위탁자)</th>
            <td><strong>${d.consignorName} 귀하</strong></td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

// 3. [별첨 2] 개인정보 파기확인서 생성 (사후 미파기 방지용)
function generateDestructionCertHTML(d) {
  const dueStr = addDays(d.endDate, d.destructionDays || 5);
  return `
    <div class="doc-header-banner">
      <span>부속서류 [별첨 2] — 계약 종료 후 ${d.destructionDays || 5}일 이내 제출 의무</span>
      <span>개인정보 보호법 제21조 · 시행령 제16조 준거</span>
    </div>

    <h1 class="doc-main-title">개인정보 완전 파기(반납) 확인서</h1>

    <div class="doc-preamble">
      본 확인서는 <strong>「${d.contractTitle}」</strong>의 계약기간 만료(또는 위탁목적 달성)에 따라, 수탁자가 보유·처리하던 위탁 개인정보 일체를 복구 불가능한 방법으로 완전 파기(또는 반납)하였음을 증명하는 법정 증빙 문서입니다.
    </div>

    <table class="legal-table">
      <tbody>
        <tr>
          <th>1. 위탁 계약(협약)명</th>
          <td>${d.contractTitle}</td>
        </tr>
        <tr>
          <th>2. 위탁 계약 기간</th>
          <td>${formatKoreanDate(d.startDate)} ~ ${formatKoreanDate(d.endDate)}</td>
        </tr>
        <tr>
          <th>3. 법정 파기 완료 기한</th>
          <td><strong>${formatKoreanDate(dueStr)}까지</strong> (계약 종료 후 ${d.destructionDays || 5}일 이내)</td>
        </tr>
        <tr>
          <th>4. 파기 대상 개인정보 항목</th>
          <td>${[...d.generalItems, ...d.uniqueItems, ...d.sensitiveItems].join(', ') || '위탁 처리 개인정보 전체'}</td>
        </tr>
        <tr>
          <th>5. 파기 방식 및 기술적 조치</th>
          <td>
            ☑ 전자적 파일 형태: 복원이 불가능한 기술적 방법(로우레벨 포맷 / 3회 이상 덮어쓰기 / DB 테이블 완전 삭제)<br>
            ☑ 종이 문서·출력물: 분쇄기로 완전 파쇄 또는 소각 처리<br>
            ☑ 재수탁사(${d.subProcessors.map(s => s.company).join(', ') || '해당 없음'}) 보유분 파기 완료 여부: 확인 완료
          </td>
        </tr>
        <tr>
          <th>6. 파기 수행 책임자 및 입회자</th>
          <td>
            • 파기 수행 책임자(CPO): ${d.consigneeCpo}<br>
            • 위탁자 확인 감독관: ${d.consignorManager}
          </td>
        </tr>
        <tr>
          <th>7. 필수 첨부 증빙자료</th>
          <td>① DB 테이블/서버 파일 삭제 결과 로그 화면 캡처 1부 &nbsp; ② 문서 파쇄 현장 사진 1부 &nbsp; ③ 재수탁사 파기확인서 사본 1부</td>
        </tr>
      </tbody>
    </table>

    <p style="margin-top:20px; text-align:center; font-weight:600;">
      당사는 위탁업무와 관련하여 보유하고 있던 모든 개인정보를 위와 같이 남김없이 완전 파기하였으며, 향후 파기 누락으로 인해 발생하는 모든 법적 책임은 당사에 있음을 확인합니다.
    </p>

    <div class="signature-section">
      <div class="sig-date">파기 확인 일자: ${formatKoreanDate(dueStr)}</div>
      <div class="sig-grid">
        <div class="sig-card">
          <div class="sig-role">파기 이행 기관 (“수탁자”)</div>
          <div class="sig-line"><span>기관명:</span> <strong>${d.consigneeName}</strong></div>
          <div class="sig-line"><span>보호책임자(CPO):</span> <span>${d.consigneeCpo} (인)</span></div>
          <div class="sig-line"><span>대표자:</span> <strong>${d.consigneeRep} <span class="seal-stamp">인</span></strong></div>
        </div>
        <div class="sig-card">
          <div class="sig-role">파기 검수 기관 (“위탁자”)</div>
          <div class="sig-line"><span>기관명:</span> <strong>${d.consignorName}</strong></div>
          <div class="sig-line"><span>검수 감독관:</span> <span>${d.consignorManager} (확인)</span></div>
        </div>
      </div>
    </div>
  `;
}

// 4. [별첨 3] 수탁사 안전성 확보조치 실태점검 체크리스트 생성
function generateAuditChecklistHTML(d) {
  return `
    <div class="doc-header-banner">
      <span>부속서류 [별첨 3] — ${d.inspectionFreq === 'SEMI_ANNUAL' ? '반기 1회(연 2회)' : '연 1회'} 정기 점검표</span>
      <span>개인정보 보호법 제26조 제4항 · 안전성 확보조치 고시 준거</span>
    </div>

    <h1 class="doc-main-title">수탁사 개인정보 보호 및 안전성 확보조치 실태점검표</h1>

    <div class="doc-preamble">
      학술연구(금융·정보보호 수탁사 관리 연구)에서 지적된 ‘획일적·형식적 서면 점검’의 한계를 극복하기 위해, 본 계약의 위험도 등급(<strong>${d.dataScale}</strong>) 및 재위탁 현황에 맞춰 자동 구성된 맞춤형 현장·서면 실태점검표입니다.
    </div>

    <table class="legal-table">
      <tbody>
        <tr>
          <th>점검 대상 수탁사</th>
          <td><strong>${d.consigneeName}</strong> (CPO: ${d.consigneeCpo})</td>
          <th>점검 감독관(위탁자)</th>
          <td>${d.consignorManager}</td>
        </tr>
      </tbody>
    </table>

    <table class="legal-table">
      <thead>
        <tr>
          <th style="width:16%;">점검 영역</th>
          <th style="width:52%;">핵심 점검 항목 및 증빙 확인 기준</th>
          <th style="width:16%; text-align:center;">적정 여부</th>
          <th style="width:16%;">비고 / 증빙</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>1. 위탁계약 및 내부관리계획</strong></td>
          <td>• 개인정보 내부관리계획 수립 여부 및 취급자 최소화 지정 명부 현행화<br>• 전체 개인정보취급자 대상 보안서약서 징구 및 연 1회 이상 보안교육 수료증 확인</td>
          <td style="text-align:center;">□ 적정 &nbsp; □ 미흡</td>
          <td>교육수료증 확인</td>
        </tr>
        <tr>
          <td><strong>2. 재위탁 통제 (Sub-processing)</strong></td>
          <td>• 위탁자 사전 서면 승인 없는 무단 제3자 재위탁(클라우드·외주 등) 존재 여부<br>• 승인된 재수탁사(${d.subProcessors.map(s => s.company).join(', ') || '없음'})에 대한 정기 점검 실시 여부</td>
          <td style="text-align:center;">□ 적정 &nbsp; □ 미흡</td>
          <td>재위탁계약서 대조</td>
        </tr>
        <tr>
          <td><strong>3. 접근권한 및 접근통제</strong></td>
          <td>• 퇴직·전보 인력 발생 시 즉시 접근권한 말소 여부 (계정 대장 대조)<br>• ${
            d.accessControlLevel === 'STRICT_MFA'
              ? '외부 접속 시 VPN 적용 및 2차 인증(MFA) 강제 적용 여부'
              : '개인정보처리시스템 방화벽 및 안전한 비밀번호 작성규칙 적용 여부'
          }</td>
          <td style="text-align:center;">□ 적정 &nbsp; □ 미흡</td>
          <td>시스템 설정 화면</td>
        </tr>
        <tr>
          <td><strong>4. 개인정보 암호화</strong></td>
          <td>• 고유식별정보(${d.uniqueItems.join(', ') || '해당 시'}) 및 비밀번호·바이오정보의 안전한 알고리즘(AES-256/SHA-256) 암호화 저장 여부<br>• PC 내 개인정보 파일 보관 시 암호 설정 및 송수신 구간(SSL/TLS) 암호화</td>
          <td style="text-align:center;">□ 적정 &nbsp; □ 미흡</td>
          <td>DB 스키마/패킷 점검</td>
        </tr>
        <tr>
          <td><strong>5. 접속기록 보관 및 점검</strong></td>
          <td>• 취급자 접속기록(ID, 일시, IP, 수행업무, 열람대상) <strong>${d.dataScale === 'OVER_100K' ? '2년 이상' : '1년 이상'}</strong> 백업·보관 여부<br>• 월 1회 이상 접속기록 이상행위(대량 다운로드·업무시간 외 조회) 점검 대장 확인</td>
          <td style="text-align:center;">□ 적정 &nbsp; □ 미흡</td>
          <td>로그 점검대장 확인</td>
        </tr>
        <tr>
          <td><strong>6. 보유기간 경과분 파기</strong></td>
          <td>• 목적 달성 또는 보유기간 경과 개인정보(임시 엑셀파일, 이메일 첨부파일 포함) 즉시 파기 여부</td>
          <td style="text-align:center;">□ 적정 &nbsp; □ 미흡</td>
          <td>PC 스캔 결과</td>
        </tr>
      </tbody>
    </table>
  `;
}

// 5. [별첨 4] 민간위탁 노동자 근로조건 보호 확약서 및 청렴이행각서
function generateLaborPledgeHTML(d) {
  return `
    <div class="doc-header-banner">
      <span>부속서류 [별첨 4] — 공공·지자체 민간위탁 필수 부속서류</span>
      <span>국무조정실·고용노동부 민간위탁 노동자 근로조건 보호 가이드라인 준거</span>
    </div>

    <h1 class="doc-main-title">민간위탁 노동자 근로조건 보호 확약서 및 청렴이행각서</h1>

    <div class="doc-preamble">
      당사(<strong>${d.consigneeName}</strong>)는 <strong>${d.consignorName}</strong>로부터 <strong>「${d.contractTitle}」</strong> 사무를 수탁받아 운영함에 있어, 소속 근로자의 고용안정과 처우 개선 및 투명한 예산 집행을 위하여 다음 사항을 성실히 이행할 것을 확약합니다.
    </div>

    <div class="clause-block">
      <div class="clause-title">제1항 (책정 인건비 지급 및 임금 삭감 금지)</div>
      <div class="clause-body">
        원가계산서 및 협약 예산서(연간 총액 ${formatKoreanCurrency(d.budgetAmount)})에 책정된 종사자 인건비를 산정 기준대로 성실히 지급하며, 부당하게 임금을 삭감하거나 타 운영비로 전용하지 않겠습니다.
      </div>
    </div>

    <div class="clause-block">
      <div class="clause-title">제2항 (고용승계 의무 이행)</div>
      <div class="clause-body">
        특별한 사정이 없는 한 기존 수탁기관 소속으로 본 위탁업무에 종사하던 근로자에 대하여 <strong>고용승계 비율 ${d.employmentRate !== 'NONE' ? d.employmentRate : 80}% 이상</strong>을 유지하여 고용 안정을 보장하겠습니다.
      </div>
    </div>

    <div class="clause-block">
      <div class="clause-title">제3항 (근로기준법 준수 및 분기별 임금명세 제출)</div>
      <div class="clause-body">
        「근로기준법」, 「최저임금법」, 「근로자퇴직급여 보장법」 등 노동 관계 법령을 철저히 준수하고, 퇴직급여충당금을 별도 계좌로 적립하며, 매 분기별로 종사자 임금지급 명세서와 4대 보험 완납 증명서를 “위탁자”에게 제출하겠습니다.
      </div>
    </div>

    <div class="clause-block">
      <div class="clause-title">제4항 (청렴계약 이행 및 부당 수의계약·리베이트 금지)</div>
      <div class="clause-body">
        수탁기관 선정 및 협약 이행 전 과정에서 관계 공무원에게 금품·향응 등 부당한 이익을 제공하지 않으며, 사업비 집행 시 친인척·특수관계인과의 부당 수의계약을 일체 배제하겠습니다.
      </div>
    </div>

    <p style="margin-top:18px; font-weight:600; color:#1E40AF;">
      ※ 당사가 본 확약서 사항을 위반할 경우, “위탁자”로부터 협약 해지, 위탁운영비 환수 및 차기 민간위탁 수탁기관 선정 심사 시 감점·배제 처분을 받더라도 일체의 이의를 제기하지 않을 것을 서약합니다.
    </p>

    <div class="signature-section">
      <div class="sig-date">${formatKoreanDate(d.contractDate)}</div>
      <div class="sig-card" style="max-width:440px; margin:0 auto;">
        <div class="sig-role">확약 기관 (“수탁자”)</div>
        <div class="sig-line"><span>기관(법인)명:</span> <strong>${d.consigneeName}</strong></div>
        <div class="sig-line"><span>사업자번호:</span> <span>${d.consigneeBizNo}</span></div>
        <div class="sig-line"><span>대 표 자:</span> <strong>${d.consigneeRep} <span class="seal-stamp">인</span></strong></div>
      </div>
    </div>
  `;
}

// 6. 사후관리 이행 타임라인 & 사전조사 학술논문·매뉴얼·PDR 허브 생성
function generateLifecycleAndResearchHTML(d) {
  const kickOffEduDate = addDays(d.startDate, 14);
  const firstAuditDate = addDays(d.startDate, 180);
  const secondAuditDate = addDays(d.startDate, 350);
  const perfEvalDate = addDays(d.endDate, -(d.perfEvalDays || 90));
  const destructionDueDate = addDays(d.endDate, d.destructionDays || 5);

  return `
    <div class="hub-section">
      <div class="doc-header-banner">
        <span>LIFECYCLE GOVERNANCE & RESEARCH HUB</span>
        <span>사후관리 D-Day 스케줄러 · 학술논문 실태분석 · PDR</span>
      </div>

      <h2 class="hub-title">📅 1. 계약 체결 후 사후관리 의무 이행 타임라인 (자동 산출)</h2>
      <p class="hub-desc">
        기존 위·수탁 계약의 최대 단점인 <strong>‘체결 후 캐비닛 방치(사후 점검·성과평가·파기확인 누락)’</strong>를 방지하기 위해, 입력하신 계약기간(${d.startDate} ~ ${d.endDate})을 기준으로 법정 의무 이행 마일스톤을 자동 산출했습니다.
      </p>

      <div class="timeline-list">
        <div class="timeline-item">
          <div class="timeline-date">${d.startDate}</div>
          <div>
            <strong>위·수탁 계약(협약) 효력 개시 및 부속서류 징구</strong>
            <div style="font-size:12px; color:#475569;">[별첨 1] 보안서약서, [별첨 4] 근로조건 보호 확약서, 전용계좌 개설 통장사본 및 협약이행보증보험증권 징구</div>
          </div>
          <span class="timeline-badge">D-Day 개시</span>
        </div>

        <div class="timeline-item">
          <div class="timeline-date">${kickOffEduDate}</div>
          <div>
            <strong>수탁사 개인정보취급자 착수 보안교육 및 접근권한 점검</strong>
            <div style="font-size:12px; color:#475569;">VPN/2차인증(MFA) 적용 확인, 취급자 계정 부여 대장 및 착수 교육 실시 (시작 후 14일 이내)</div>
          </div>
          <span class="timeline-badge">초기 통제</span>
        </div>

        <div class="timeline-item">
          <div class="timeline-date">${firstAuditDate}</div>
          <div>
            <strong>제1차 정기 안전성 확보조치 실태점검 및 분기별 임금명세 점검</strong>
            <div style="font-size:12px; color:#475569;">[별첨 3] 실태점검표 기반 접속기록·암호화·무단 재위탁 점검 및 민간위탁 근로자 임금 지급 확인</div>
          </div>
          <span class="timeline-badge">법 제26조 제4항</span>
        </div>

        <div class="timeline-item">
          <div class="timeline-date">${secondAuditDate}</div>
          <div>
            <strong>제2차 정기 현장 실사 및 회계연도 외부 회계감사 정산</strong>
            <div style="font-size:12px; color:#475569;">연간 개인정보보호 교육 수료증 징구 및 공인회계사 회계감사 정산보고서 접수·잔액 반납</div>
          </div>
          <span class="timeline-badge">정기 감사</span>
        </div>

        <div class="timeline-item">
          <div class="timeline-date">${perfEvalDate}</div>
          <div>
            <strong>민간위탁 종합성과평가 실시 및 재계약(재위탁) 적격성 심사</strong>
            <div style="font-size:12px; color:#475569;">협약 만료 ${d.perfEvalDays || 90}일 전 종합성과평가 완료 및 의회 보고·재계약 여부 결정</div>
          </div>
          <span class="timeline-badge">만료 D-${d.perfEvalDays || 90}</span>
        </div>

        <div class="timeline-item" style="border-left-color:#DC2626; background:#FEF2F2;">
          <div class="timeline-date" style="color:#DC2626;">${destructionDueDate}</div>
          <div>
            <strong>계약 종료 후 개인정보 완전 파기 및 [별첨 2] 파기확인서 최종 징구 기한</strong>
            <div style="font-size:12px; color:#991B1B;">계약 만료(${d.endDate}) 후 ${d.destructionDays || 5}일 이내 수탁사·재수탁사 보유 데이터 영구 삭제 및 파기확인서 수취 완료</div>
          </div>
          <span class="timeline-badge" style="background:#FEE2E2; color:#991B1B;">만료 D+${d.destructionDays || 5} 필수</span>
        </div>
      </div>
    </div>

    <div class="hub-section">
      <h2 class="hub-title">📚 2. 사전조사: 위·수탁 계약 현실태 분석 학술논문 및 정부 연구보고서</h2>
      <p class="hub-desc">
        본 웹 플랫폼의 단점 개선 기능들은 아래의 KCI 학술논문, 국책연구기관(한국지방행정연구원·KISA), 국회입법조사처 보고서의 실태 분석을 직접 반영하여 설계되었습니다.
      </p>

      <div class="paper-card">
        <div class="paper-card-title">① 「개인정보 처리위탁, 제3자 제공, 공동처리자」</div>
        <div class="paper-card-meta">전승재 (2022) | 『정보법학』 제26권 제3호, 한국정보법학회 (KCI 등재)</div>
        <div class="paper-card-body">
          • <strong>현실태 및 문제점 분석</strong>: 현행 개인정보보호법이 ‘제3자 제공’과 ‘처리위탁’을 이분법적으로만 규율하여, 실무에서 수탁사의 독자적 이익(마케팅·플랫폼·AI 학습 등)이 혼재된 경우 계약 유형을 오판해 법 위반에 노출됨. 또한 계약 체결 단계에서 업무 범위와 통제권이 구체화되지 않으면 위탁자의 관리·감독 의무(법 제26조 제4항)가 사후적으로 작동할 수 없음을 규명.<br>
          • <strong>웹페이지 반영 개선점</strong>: 상단 <strong>[🧭 계약 유형 적격성 진단 마법사]</strong> 및 제2조 업무범위 구체성 린터 구현.
        </div>
      </div>

      <div class="paper-card">
        <div class="paper-card-title">② 「금융회사 개인신용정보 수탁사에 대한 관리·감독 현황 및 개선 방향에 대한 연구」 & 「위탁자의 개인정보보호 관리역량 제고에 관한 연구」</div>
        <div class="paper-card-meta">금융보안·정보보호 학계 KCI 연구 (2021~2023) & 개인정보보호위원회·KISA 『개인정보보호 실태조사』</div>
        <div class="paper-card-body">
          • <strong>현실태 및 문제점 분석</strong>: 수탁사를 통한 개인정보 유출 사고의 3대 원인은 <strong>① 무단 다단계 재위탁(클라우드·하도급 사각지대)</strong>, <strong>② 수탁사 규모·취급정보 위험도를 무시한 획일적·형식적 서면 체크리스트 점검</strong>, <strong>③ 계약 종료 후 미파기 방치</strong>임.<br>
          • <strong>웹페이지 반영 개선점</strong>: <strong>[재위탁 투명성 매트릭스 및 별표1 자동 연동]</strong>, <strong>[취급 정보량·고유식별정보 비례 안전성 확보조치 자동 매핑]</strong>, <strong>[별첨2 파기확인서 및 별첨3 맞춤형 실태점검표 동시 생성]</strong>.
        </div>
      </div>

      <div class="paper-card">
        <div class="paper-card-title">③ 『지방자치단체 민간위탁 운영실태 및 개선방안』 / 『민간위탁 제도의 문제점과 개선방안』</div>
        <div class="paper-card-meta">한국지방행정연구원(KRILA) 정책연구보고서 & 국회입법조사처(NARS) 현안분석 보고서</div>
        <div class="paper-card-body">
          • <strong>현실태 및 문제점 분석</strong>: ① 지자체 실무자가 ‘지방계약법상 일반 용역계약’과 ‘민간위탁 조례상 행정협약’을 혼동하여 부적절한 계약서를 작성함. ② 사업비 정산 기준(정산형 vs 총액도급형) 불명확으로 인한 사후 환수 분쟁. ③ 성과평가와 재계약의 단절 및 관행적 장기 연장. ④ 수탁기관 교체 시 현장 노동자 고용불안 및 임금 삭감.<br>
          • <strong>웹페이지 반영 개선점</strong>: <strong>[전용계좌·외부 회계감사 정산 조항]</strong>, <strong>[고용승계 80% 이상 및 분기별 임금명세 제출 조항]</strong>, <strong>[만료 90일 전 종합성과평가 의무 연동]</strong> 및 <strong>[별첨4 근로조건 보호 확약서]</strong> 자동 번들링.
        </div>
      </div>
    </div>
  `;
}

// 현재 탭에 맞춰 우측 문서 캔버스 업데이트
function renderActiveDocument(data) {
  const paperEl = document.getElementById('legalPaperContent');
  switch (state.activeDocTab) {
    case 'MAIN_CONTRACT':
      paperEl.innerHTML = generateMainContractHTML(data);
      break;
    case 'SECURITY_PLEDGE':
      paperEl.innerHTML = generateSecurityPledgeHTML(data);
      break;
    case 'DESTRUCTION_CERT':
      paperEl.innerHTML = generateDestructionCertHTML(data);
      break;
    case 'AUDIT_CHECKLIST':
      paperEl.innerHTML = generateAuditChecklistHTML(data);
      break;
    case 'LABOR_PLEDGE':
      paperEl.innerHTML = generateLaborPledgeHTML(data);
      break;
    case 'LIFECYCLE_RESEARCH':
      paperEl.innerHTML = generateLifecycleAndResearchHTML(data);
      break;
    default:
      paperEl.innerHTML = generateMainContractHTML(data);
  }
}

// 트랙 변경에 따른 좌측 섹션 가시성 조정
function updateTrackVisibility() {
  const secPrivacy = document.getElementById('sectionPrivacyScope');
  const secPublic = document.getElementById('sectionPublicTerms');

  if (state.track === 'PRIVACY') {
    secPrivacy.style.display = 'block';
    secPublic.style.display = 'none';
  } else if (state.track === 'PUBLIC') {
    secPrivacy.style.display = 'none';
    secPublic.style.display = 'block';
  } else {
    secPrivacy.style.display = 'block';
    secPublic.style.display = 'block';
  }
}

// 전체 상태 재계산 및 화면 갱신
function updateAll(rebuildSubInputs = false) {
  updateTrackVisibility();
  if (rebuildSubInputs) {
    renderSubProcessorInputs();
  }
  const data = getFormData();
  document.getElementById('budgetKoreanText').textContent = formatKoreanCurrency(data.budgetAmount);

  const evalResult = evaluateCompliance(data);
  renderLinterUI(evalResult);
  renderActiveDocument(data);
}

// 토스트 메시지 표시
let toastTimer = null;
function showToast(msg) {
  const toast = document.getElementById('toastNotification');
  toast.textContent = msg;
  toast.classList.remove('hidden');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.add('hidden');
  }, 3400);
}

// 시나리오 프리셋 로드 함수
function applyPreset(presetName) {
  if (presetName === 'FLAWED') {
    // 단점 체험용 구버전 부실 계약서 (42점)
    state.track = 'HYBRID';
    document.getElementById('contractTitle').value = '청년창업지원센터 운영 위수탁 계약서 (구버전 부실 양식 샘플)';
    document.getElementById('consignorManager').value = '';
    document.getElementById('consigneeCpo').value = '';
    document.getElementById('taskPurpose').value = '센터 운영 및 기타 부수 업무 일체';
    document.getElementById('accessControlLevel').value = 'WEAK';
    document.getElementById('inspectionFreq').value = 'NONE';
    document.getElementById('destructionDays').value = '0';
    document.getElementById('liabilityClause').value = 'OMIT';
    document.getElementById('subPolicy').value = 'UNRESTRICTED';
    document.getElementById('settlementType').value = 'LUMP_SUM';
    document.getElementById('employmentRate').value = 'NONE';
    document.getElementById('perfEvalDays').value = '0';
    updateTrackButtons();
    updateAll(true);
    showToast('⚠️ 구버전 부실 계약서 샘플(30점)을 불러왔습니다. 좌측 상단 [✨ 누락·독소조항 원클릭 자동 보완]을 눌러 개선 효과를 확인해 보세요!');
  } else if (presetName === 'PRIVACY_CS') {
    state.track = 'PRIVACY';
    document.getElementById('contractTitle').value = '통합 고객상담(CS) 시스템 운영 및 알림톡 발송 개인정보 처리 위·수탁 계약서';
    document.getElementById('consignorName').value = '(주)한울커머스플랫폼';
    document.getElementById('consignorRep').value = '정대표';
    document.getElementById('consignorBizNo').value = '120-88-99110';
    document.getElementById('consignorAddress').value = '서울특별시 성동구 아차산로 100';
    document.getElementById('consignorManager').value = '강보안 정보보호팀장 (02-3456-7890 / privacy@hanwool.kr)';
    document.getElementById('consigneeName').value = '(주)케이컨택솔루션';
    document.getElementById('consigneeRep').value = '윤수탁';
    document.getElementById('consigneeBizNo').value = '211-86-44210';
    document.getElementById('consigneeAddress').value = '서울특별시 구로구 디지털로 300';
    document.getElementById('consigneeCpo').value = '박수호 CPO 상무 (02-888-1234 / cpo@kcontact.co.kr)';
    document.getElementById('taskPurpose').value =
      '1. 고객센터 인·아웃바운드 민원 상담, 반품·환불 안내 및 해피콜 수행\n2. 주문·배송 상태 알림톡/SMS 발송 대행 및 상담 이력 DB 운영·유지보수';
    document.getElementById('dataScale').value = 'OVER_100K';
    document.getElementById('accessControlLevel').value = 'STRICT_MFA';
    document.getElementById('inspectionFreq').value = 'SEMI_ANNUAL';
    document.getElementById('destructionDays').value = '5';
    document.getElementById('liabilityClause').value = 'STRICT';
    document.getElementById('subPolicy').value = 'PRE_APPROVED_LIST';
    state.subProcessors = [
      {
        company: '아마존웹서비시즈코리아(유)',
        task: '클라우드 인프라(AWS 서울리전) 서버 및 암호화 DB 스토리지 운영',
        items: '암호화된 고객 상담 DB 일체',
        period: '위탁계약 종료 시까지'
      }
    ];
    updateTrackButtons();
    updateAll(true);
    showToast('🔒 개인정보보호법 제26조 기준 [IT·고객상담 개인정보 처리위탁 표준계약서]가 설정되었습니다.');
  } else if (presetName === 'PUBLIC_WELFARE') {
    state.track = 'HYBRID';
    document.getElementById('contractTitle').value = '서울특별시 청년창업지원센터 운영 민간위탁 및 개인정보 처리 위·수탁 협약서';
    document.getElementById('consignorName').value = '서울특별시 미래청년기획단';
    document.getElementById('consignorRep').value = '김서울';
    document.getElementById('consignorBizNo').value = '104-83-00469';
    document.getElementById('consignorAddress').value = '서울특별시 중구 세종대로 110';
    document.getElementById('consignorManager').value = '이감독 사무관 (02-2133-0000 / audit@seoul.go.kr)';
    document.getElementById('consigneeName').value = '(재)한국창업혁신네트워크';
    document.getElementById('consigneeRep').value = '박수탁';
    document.getElementById('consigneeBizNo').value = '214-82-15920';
    document.getElementById('consigneeAddress').value = '서울특별시 강남구 테헤란로 211, 8층';
    document.getElementById('consigneeCpo').value = '최보안 센터장 (02-555-8899 / cpo@kin.or.kr)';
    document.getElementById('taskPurpose').value =
      '1. 청년창업지원센터 시설 운영 및 입주기업 보육·멘토링 프로그램 운영 사무\n2. 창업지원 사업 신청자 접수, 자격 심사, 만족도 조사 및 민원 상담 시스템 운영\n3. 창업지원금 정산 관리 및 센터 정보시스템(웹사이트·알림톡) 유지관리';
    document.getElementById('dataScale').value = '10K_TO_100K';
    document.getElementById('accessControlLevel').value = 'STRICT_MFA';
    document.getElementById('inspectionFreq').value = 'SEMI_ANNUAL';
    document.getElementById('destructionDays').value = '5';
    document.getElementById('liabilityClause').value = 'STRICT';
    document.getElementById('subPolicy').value = 'PRE_APPROVED_LIST';
    document.getElementById('settlementType').value = 'AUDIT_SETTLE';
    document.getElementById('employmentRate').value = '80';
    document.getElementById('perfEvalDays').value = '90';
    state.subProcessors = [
      {
        company: '(주)클라우드인프라코리아',
        task: '클라우드 서버(IaaS) 호스팅 및 암호화 DB 백업 운영',
        items: '암호화된 입주·신청자 DB 일체',
        period: '위탁계약 기간과 동일'
      },
      {
        company: '(주)비즈메시지네트웍스',
        task: '창업지원 사업 안내 알림톡 및 SMS 발송 대행',
        items: '성명, 휴대전화번호',
        period: '발송 목적 달성 후 즉시 파기(최대 3개월)'
      }
    ];
    updateTrackButtons();
    updateAll(true);
    showToast('🏛️ 공공·지자체 민간위탁 + 개인정보 처리위탁 통합 협약서(100점)가 설정되었습니다.');
  }
}

function updateTrackButtons() {
  document.querySelectorAll('.track-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.track === state.track);
  });
}

// 사전 적격성·유형 진단 마법사 평가 로직
function evaluateWizard() {
  const q1 = document.querySelector('input[name="wiz_q1"]:checked')?.value;
  const q2 = document.querySelector('input[name="wiz_q2"]:checked')?.value;
  const q3 = document.querySelector('input[name="wiz_q3"]:checked')?.value;
  const q4 = document.querySelector('input[name="wiz_q4"]:checked')?.value;

  const box = document.getElementById('wizardResultBox');

  if (q1 === 'THIRD_PARTY') {
    box.style.background = '#FEF2F2';
    box.style.borderColor = '#FCA5A5';
    box.innerHTML = `
      <div style="font-weight:700; color:#B91C1C; margin-bottom:4px;">
        🚨 [진단 결과] 단순 '처리위탁'이 아닌 '개인정보 제3자 제공(법 제17조)' 또는 '공동처리'에 해당합니다!
      </div>
      <p style="color:#7F1D1D; font-size:12.5px;">
        전승재(2022, 『정보법학』) 연구가 지적하듯, 상대방이 자신의 독자적인 사업·마케팅·AI 학습 목적과 이익을 위해 데이터를 활용한다면 위·수탁 계약서만으로는 적법성이 인정되지 않으며, <strong>정보주체로부터 별도의 '제3자 제공 동의(법 제17조)'</strong>를 받아야 합니다.
      </p>
    `;
    return { recommendedTrack: 'PRIVACY', q3, q4 };
  }

  box.style.background = '#EFF6FF';
  box.style.borderColor = '#93C5FD';

  let recTrack = 'HYBRID';
  let titleText = '';
  let descText = '';

  if (q2 === 'PUBLIC_ADMIN' && q3 !== 'NO_PRIVACY') {
    recTrack = 'HYBRID';
    titleText = '✅ [진단 결과] 공공 행정사무 민간위탁 + 개인정보 처리위탁 통합 협약 (HYBRID 트랙)';
    descText =
      '지자체·공공기관의 대민 행정사무/시설 위탁이면서 시민의 개인정보를 처리하므로, 「지방자치법」상 민간위탁 표준협약서(사업비 정산·고용승계·성과평가)와 「개인정보 보호법」 제26조 필수 조항을 결합한 통합 협약서가 필요합니다.';
  } else if (q2 === 'PUBLIC_ADMIN' && q3 === 'NO_PRIVACY') {
    recTrack = 'PUBLIC';
    titleText = '✅ [진단 결과] 공공·지자체 행정사무 민간위탁 표준협약서 (PUBLIC 트랙)';
    descText =
      '개인정보 처리가 수반되지 않는 순수 행정사무 민간위탁이므로, 행정안전부 민간위탁 관리지침 및 근로자 근로조건 보호 가이드라인 중심의 표준협약서를 적용합니다.';
  } else {
    recTrack = 'PRIVACY';
    titleText = '✅ [진단 결과] 개인정보 처리 위·수탁 표준계약서 (PRIVACY 트랙 · 법 제26조)';
    descText =
      q2 === 'PUBLIC_PROCUREMENT'
        ? '한국지방행정연구원 보고서 기준, 본 건은 행정사무 민간위탁이 아닌 일반 조달·용역 계약에 해당하므로, 본 용역계약에 부수하여 「개인정보 보호법」 제26조 표준 개인정보처리위탁계약서를 체결해야 합니다.'
        : '민간 기업 간 업무위탁(B2B)으로서 위탁자의 본래 목적 범위 내에서만 개인정보를 대행 처리하므로, 개인정보보호위원회 표준 개인정보처리위탁계약서를 적용합니다.';
  }

  box.innerHTML = `
    <div style="font-weight:700; color:#1E40AF; margin-bottom:4px;">${titleText}</div>
    <p style="color:#1E3A8A; font-size:12.5px;">${descText}</p>
  `;
  return { recommendedTrack: recTrack, q3, q4 };
}

// Word/한글(.doc) 호환 파일 다운로드
function downloadAsWordDoc() {
  const data = getFormData();
  const contentHtml = document.getElementById('legalPaperContent').innerHTML;
  const fullHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:w="urn:schemas-microsoft-com:office:word"
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <title>${data.contractTitle}</title>
      <style>
        body { font-family: '바탕', 'Batang', 'Malgun Gothic', serif; font-size: 11pt; line-height: 1.65; color: #000000; }
        h1 { font-size: 18pt; text-align: center; margin-bottom: 18pt; }
        .doc-header-banner { border-bottom: 2px solid #000; padding-bottom: 6pt; margin-bottom: 16pt; font-size: 9pt; color: #444; }
        .doc-preamble { background: #F8FAFC; padding: 10pt; border-left: 3pt solid #1E40AF; margin-bottom: 14pt; }
        .clause-block { margin-bottom: 12pt; }
        .clause-title { font-weight: bold; font-size: 11.5pt; margin-bottom: 4pt; }
        .improvement-badge { display: none; }
        table { width: 100%; border-collapse: collapse; margin: 8pt 0; font-size: 10pt; }
        th, td { border: 1px solid #666666; padding: 6pt 8pt; text-align: left; }
        th { background-color: #F1F5F9; font-weight: bold; }
        .signature-section { margin-top: 24pt; padding-top: 12pt; border-top: 1px solid #999; }
        .sig-date { text-align: center; font-weight: bold; font-size: 12pt; margin-bottom: 16pt; }
        .sig-card { border: 1px solid #666; padding: 10pt; margin-bottom: 10pt; }
      </style>
    </head>
    <body>
      ${contentHtml}
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', fullHtml], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${data.contractTitle || '위수탁계약서'}_${state.activeDocTab}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('📝 Word 및 한글(HWP)에서 바로 열람·편집 가능한 .doc 파일이 다운로드되었습니다.');
}

// PDR(.md) 마크다운 파일 다운로드
function downloadPdrMarkdown() {
  const pdrContent = `# 위·수탁 계약 자동 생성 및 컴플라이언스 웹 플랫폼 PDR (PRD & 초기설계서)

> 버전: v1.0 | 작성일: 2026-10-16
> 적용 분야: ① 개인정보 처리 위·수탁 계약 (개인정보보호법 제26조) / ② 공공·지자체 행정사무 민간위탁 협약 (지방자치법 제117조 및 민간위탁 관리지침)

## 1. 사전조사 I: 정부 공식 매뉴얼 분석
1. **개인정보보호위원회 『개인정보 처리 위·수탁 안내서』 및 『표준 개인정보처리위탁 계약서』**
   - 법정 7대 필수 기재사항: ① 위탁업무의 목적 및 범위, ② 위탁기간, ③ 재위탁 제한(사전 서면승낙), ④ 안전성 확보조치(암호화·접근통제·접속기록 보관), ⑤ 관리·감독 및 정기 실태점검(법 제26조 제4항), ⑥ 계약 종료 후 즉시 파기 및 파기확인서 징구, ⑦ 손해배상 및 소속직원 간주(법 제26조 제6항).
2. **행정안전부 『지방자치단체 민간위탁 관리지침』 및 고용노동부 『민간위탁 노동자 근로조건 보호 가이드라인』**
   - 표준협약서 핵심사항: ① 위탁사무 범위 및 기간, ② 전용계좌 관리 및 회계연도 외부 회계감사 정산·반납, ③ 민간위탁 노동자 고용승계(80% 이상) 및 분기별 임금명세 제출, ④ 협약 만료 90일 전 종합성과평가 및 재계약 심사 연동, ⑤ 해지 전 사전 청문(소명) 절차 보장.

## 2. 사전조사 II: 학술 논문 및 실태조사 보고서 분석
1. **전승재 (2022), 「개인정보 처리위탁, 제3자 제공, 공동처리자」, 『정보법학』 제26권 제3호**
   - 위탁과 제3자 제공의 이분법적 규율로 인한 실무 오판 문제 및 계약 체결 단계에서의 구체적 업무 범위·통제권 특정 필요성 제시.
2. **금융보안·정보보호 KCI 논문 (2021~2023) 및 개인정보보호위원회·KISA 『개인정보보호 실태조사』**
   - 수탁사 유출 사고의 핵심 원인: ① 무단 다단계 재위탁(Sub-processing), ② 수탁사 규모·위험도를 무시한 형식적 서면 체크리스트 점검, ③ 계약 종료 후 미파기 방치.
3. **한국지방행정연구원(KRILA) 및 국회입법조사처(NARS) 민간위탁 실태분석 보고서**
   - 일반 용역계약과 행정사무 민간위탁 협약의 법적 혼선, 정산 기준 모호성, 성과평가와 재계약 단절, 수탁기관 변경 시 노동자 고용불안 지적.

## 3. 현행 단점 대비 웹 플랫폼 6대 핵심 개선 아키텍처 (As-Is vs To-Be)
- **[개선 1] 사전 적격성·유형 진단 마법사**: 4문항 의사결정 트리로 '제3자 제공 vs 처리위탁', '민간위탁 협약 vs 일반 용역' 오판 원천 차단.
- **[개선 2] 실시간 법령 컴플라이언스 린터 (100점 스코어링)**: 10개 법정 체크포인트를 실시간 감시하고 [원클릭 자동 보완]으로 누락·독소조항 즉시 치유.
- **[개선 3] 재위탁(Sub-processor) 투명성 매트릭스 빌더**: 사전 승인된 클라우드·하도급 재수탁사 명세를 본문 조항 및 [별표 1]로 실시간 연동.
- **[개선 4] 위험도 비례 안전성 확보조치 매퍼**: 취급 정보주체 규모 및 고유식별·민감정보 유무에 따라 VPN/MFA·암호화·접속기록 보관기간 자동 분기.
- **[개선 5] 4대 필수 부속서류(Annex) 원클릭 번들링**: 본 계약서 입력값으로 ① 보안서약서, ② 파기확인서, ③ 맞춤형 실태점검표, ④ 근로조건 보호 확약서 동시 생성.
- **[개선 6] 생애주기 사후관리 D-Day 타임라인 산출**: 착수 교육일, 반기 실태점검일, 만료 90일 전 성과평가일, 종료 후 5일 이내 파기확인서 제출 기한 자동 산출.
`;

  const blob = new Blob([pdrContent], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'PDR_위수탁계약_자동생성_웹플랫폼.md';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('📐 PDR(제품요구사항 및 초기설계서) 마크다운 파일이 다운로드되었습니다.');
}

// 초기화 및 이벤트 바인딩
document.addEventListener('DOMContentLoaded', () => {
  renderSubProcessorInputs();
  updateAll();

  // 모든 입력 폼 변경 감지
  document.querySelectorAll('.form-input, .form-select, .form-textarea').forEach(el => {
    el.addEventListener('input', () => updateAll(false));
    el.addEventListener('change', () => updateAll(false));
  });

  // 개인정보 항목 태그 토글
  document.querySelectorAll('.data-tag').forEach(tagBtn => {
    tagBtn.addEventListener('click', () => {
      tagBtn.classList.toggle('active');
      updateAll(false);
    });
  });

  // 트랙 선택 탭
  document.querySelectorAll('.track-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.track = btn.dataset.track;
      updateTrackButtons();
      updateAll(false);
    });
  });

  // 우측 문서 탭 전환
  document.querySelectorAll('.doc-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.doc-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.activeDocTab = tab.dataset.doc;
      updateAll(false);
    });
  });

  // 단점 개선 해설 배지 토글
  document.getElementById('toggleAnnotations').addEventListener('change', e => {
    state.showAnnotations = e.target.checked;
    updateAll(false);
  });

  // 재수탁사 추가 버튼
  document.getElementById('btnAddSubProcessor').addEventListener('click', () => {
    state.subProcessors.push({
      company: '',
      task: '',
      items: '성명, 연락처',
      period: '위탁계약 종료 시까지'
    });
    renderSubProcessorInputs();
    updateAll(false);
  });

  // 원클릭 전체 자동 보완 버튼
  document.getElementById('btnAutoFixAll').addEventListener('click', () => {
    const data = getFormData();
    const { checks } = evaluateCompliance(data);
    checks.forEach(c => {
      if (!c.pass && c.fixFn) c.fixFn();
    });
    updateAll(true);
    showToast('✨ 모든 법정 필수 누락사항 및 독소 설정이 100점 기준으로 일괄 개선되었습니다!');
  });

  // 시나리오 프리셋 버튼
  document.getElementById('presetFlawed').addEventListener('click', () => applyPreset('FLAWED'));
  document.getElementById('presetPrivacyCS').addEventListener('click', () => applyPreset('PRIVACY_CS'));
  document.getElementById('presetPublicWelfare').addEventListener('click', () => applyPreset('PUBLIC_WELFARE'));

  // 상단 액션 버튼들
  document.getElementById('btnOpenResearch').addEventListener('click', () => {
    document.querySelectorAll('.doc-tab').forEach(t => t.classList.remove('active'));
    const hubTab = document.querySelector('.doc-tab[data-doc="LIFECYCLE_RESEARCH"]');
    if (hubTab) hubTab.classList.add('active');
    state.activeDocTab = 'LIFECYCLE_RESEARCH';
    updateAll(false);
    showToast('📚 우측 화면에 [사후관리 타임라인 & 사전조사 학술논문·PDR 허브]를 열었습니다.');
  });

  document.getElementById('btnDownloadPdr').addEventListener('click', downloadPdrMarkdown);
  document.getElementById('btnExportDoc').addEventListener('click', downloadAsWordDoc);
  document.getElementById('btnPrintPdf').addEventListener('click', () => window.print());

  // 문서 텍스트 복사
  document.getElementById('btnCopyDocument').addEventListener('click', () => {
    const text = document.getElementById('legalPaperContent').innerText;
    navigator.clipboard.writeText(text).then(() => {
      showToast('📋 현재 문서 전문이 클립보드에 복사되었습니다.');
    });
  });

  // 사전 적격성 진단 마법사 모달
  const wizardModal = document.getElementById('wizardModal');
  document.getElementById('btnOpenWizard').addEventListener('click', () => {
    evaluateWizard();
    wizardModal.classList.remove('hidden');
  });
  document.getElementById('btnCloseWizard').addEventListener('click', () => wizardModal.classList.add('hidden'));
  document.getElementById('btnCancelWizard').addEventListener('click', () => wizardModal.classList.add('hidden'));

  document.querySelectorAll('#wizardModal input[type="radio"]').forEach(r => {
    r.addEventListener('change', evaluateWizard);
  });

  document.getElementById('btnApplyWizard').addEventListener('click', () => {
    const res = evaluateWizard();
    state.track = res.recommendedTrack;
    if (res.q3 === 'YES_HIGH') {
      document.getElementById('dataScale').value = 'OVER_100K';
      document.getElementById('accessControlLevel').value = 'STRICT_MFA';
    } else if (res.q3 === 'YES_GENERAL') {
      document.getElementById('dataScale').value = 'UNDER_10K';
      document.getElementById('accessControlLevel').value = 'STANDARD';
    }
    if (res.q4 === 'SUB_YES') {
      document.getElementById('subPolicy').value = 'PRE_APPROVED_LIST';
    } else {
      document.getElementById('subPolicy').value = 'STRICT_PROHIBIT';
    }
    updateTrackButtons();
    updateAll(true);
    wizardModal.classList.add('hidden');
    showToast(`🧭 진단 결과에 따라 [${state.track}] 트랙 및 맞춤형 보호조항이 자동 설정되었습니다.`);
  });
});
