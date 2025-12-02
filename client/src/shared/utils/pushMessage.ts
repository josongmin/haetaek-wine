// utils/pushMessage.ts (새 파일 추천)

export function maskingPriceForLock(finalPrice: number | null | undefined): string {
    const priceInt = finalPrice != null ? Math.floor(finalPrice) : 0;
    const priceStr = String(priceInt);
  
    let visibleLen = priceInt < 1_000_000 ? 1 : 2; // 10만원대까지 1자리, 백만원 이상 2자리
    if (priceStr.length <= visibleLen) {
      visibleLen = Math.max(0, priceStr.length - 1); // 안전처리
    }
  
    const head = priceStr.slice(0, visibleLen);
    const maskedTail = '*'.repeat(priceStr.length - visibleLen);
    return head + maskedTail;
  }

  export interface HotDealMessageParams {
    titleKR?: string;
    vintage?: string;
    finalPrice?: number | null;
    needsLock?: boolean;
  }

  export interface PushMessage {
    title: string;
    body: string;
  }

  export interface LevelPushText {
    title: string | null;
    message: string | null;
  }

  export function buildHotDealMessage({ titleKR, vintage, finalPrice, needsLock }: HotDealMessageParams): PushMessage {
    let msg = titleKR || '';
    if (vintage && vintage !== '모름') {
      msg += ` (${vintage})`;
    }
  
    if (needsLock) {
      msg += ` ${maskingPriceForLock(finalPrice)}원`;
    } else {
      const priceInt = finalPrice != null ? Math.floor(finalPrice) : 0;
      msg += ` ${priceInt}원`; // 콤마 없이 정수 + "원" (기존 서버와 동일)
    }
    return { title: '특가 등록', body: msg };
  }

  // 등급 변경 푸시 타이틀/메시지 매핑 (자바 로직 그대로)
export function getLevelPushText(level: number): LevelPushText {
  if (level === 3) return { title: '회원 인증 완료', message: '가격 업로드 인증이 완료되었습니다' };
  if (level === 4) return { title: '회원 인증 완료', message: '실구매 인증이 완료되었습니다' };
  if (level === 5) return { title: '회원 등급이 변경되었습니다', message: '구매 고수 레벨1' };
  if (level === 6) return { title: '회원 등급이 변경되었습니다', message: '구매 고수 레벨2' };
  if (level === 7) return { title: '회원 등급이 변경되었습니다', message: '구매 고수 레벨3' };
  if (level === 8) return { title: '회원 등급이 변경되었습니다', message: '구매 전문가' };
  return { title: null, message: null };
}

// 자바 FCMNotification.UserLevelChanged (TYPE="2")와 동일한 데이터 페이로드
export interface UserLevelChangedData {
  notificationType: string;
  userLevel: string;
  userIndex: string;
}

export function buildUserLevelChangedData({ userIndex, level }: { userIndex: number | string; level: number }): UserLevelChangedData {
  return {
    notificationType: "2",
    userLevel: String(level),
    userIndex: String(userIndex),
  };
}

