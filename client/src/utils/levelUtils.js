// src/utils/levelUtils.js

// 최소 WSET4 레벨값
const MIN_LEVEL_WSET4   = 60;
export const MIN_LEVEL_ADMIN   = 999999; // 필요시 조정

export function levelTitle(level) {
  let title = '';

  // 관리자
  if (level >= MIN_LEVEL_ADMIN) {
    return '관리자';
  }

  // 추천 상위
  if (level >= 1000) {
    title = '추천 상위 ';
  }

  // 100의 자리 (소믈리에 등급)
  const sommField = level % 1000;
  if (sommField >= 600) {
    title += '마스터 소믈리에';
  } else if (sommField >= 400) {
    title += '어드밴스드 소믈리에';
  } else if (sommField >= 200) {
    title += '소믈리에';
  }

  // 10의 자리 (전문가 자격)
  const expertField = sommField % 100;
  if (expertField >= 80) {
    if (sommField >= 100) title += ' + ';
    title += '마스터 오브 와인';
  } else if (expertField >= MIN_LEVEL_WSET4) {
    if (sommField >= 100) title += ' + ';
    //title += 'WSET Level 4'; // 드롭다운에서 너무 길어서 잘림
    title += 'WSET L4';
  } else if (expertField >= 40) {
    if (sommField >= 100) title += ' + ';
    //title += 'WSET Level 3'; // 드롭다운에서 너무 길어서 잘림
    title += 'WSET L3';
  }

  // 1의 자리 (구매 전문가)
  const purchaseField = expertField % 10;
  if (purchaseField >= 9) {
    if (sommField >= 100 || expertField >= 10) title += ' + ';
    title += '구매 전문가';
  } else if (purchaseField >= 8) {
    if (sommField >= 100 || expertField >= 10) title += ' + ';
    // 드롭다운에서 너무 길어서 잘림
    //title += '구매 고수 Level 4';
    title += '구매 Lv4';
  } else if (purchaseField >= 7) {
    if (sommField >= 100 || expertField >= 10) title += ' + ';
    // 드롭다운에서 너무 길어서 잘림
    //title += '구매 고수 Level 3';
    title += '구매 Lv3';
  } else if (purchaseField >= 6) {
    if (sommField >= 100 || expertField >= 10) title += ' + ';
    // 드롭다운에서 너무 길어서 잘림
    //title += '구매 고수 Level 2';
    title += '구매 Lv2';
  } else if (purchaseField >= 5) {
    if (sommField >= 100 || expertField >= 10) title += ' + ';
    // 드롭다운에서 너무 길어서 잘림
    //title += '구매 고수 Level 1';
    title += '구매 Lv1';
  } else if (purchaseField >= 4) {
    if (sommField >= 100 || expertField >= 10) title += ' + ';
    // 드롭다운에서 너무 길어서 잘림
    //title += '가격 업로드 & 실구매 인증';
    title += '실구매 인증 + 가격 업로드';
  } else if (purchaseField >= 3) {
    if (sommField >= 100 || expertField >= 10) title += ' + ';
    title += '가격 업로드 인증 완료';
  }

  return title || '레벨 없음';
}