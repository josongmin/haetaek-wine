// src/components/PriceHistoryPopup.tsx
import React, { useEffect, useState } from "react";
import Modal from "react-modal";
import { fetchWinePrices } from "../../../../api/wineApi";
import styles from "./PriceHistoryPopup.module.css"; // ← 모듈화된 CSS를 import
import { PRICE_STATUS_PASS } from '@myorg/shared/constants/winePriceStatusMap';
import { formatRelative } from "../../../../shared/utils/dateTimeUtils";

Modal.setAppElement("#root");

interface PriceHistoryPopupProps {
  wineIndex?: string | number;
  count?: number;
  onClose?: () => void;
  onSelectPrice?: (price: any) => void;
  highlightPrice?: any;
  onOpenAuctionPopup?: () => void;
}

export default function PriceHistoryPopup({
  wineIndex,
  count = 15,
  onClose,
  onSelectPrice,
  highlightPrice,
  onOpenAuctionPopup,
}: PriceHistoryPopupProps) {
  const wine = highlightPrice ? {
    title: highlightPrice?.WIN_title || "",
    titleKR: highlightPrice?.WIN_titleKR || "",
    thumbnailURLString: highlightPrice?.WIN_thumbnailURL || "",
    index: highlightPrice?.WPR_wineIndex || null,
  }
    : { WIN_title: "", WIN_titleKR: "", WIN_thumbnailURL: "", WPR_wineIndex: null };
  ;

  const [sections, setSections] = useState<[string, any[]][]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [headerLabel, setHeaderLabel] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [subtitle, setSubtitle] = useState("");
  const [subtitle2, setSubtitle2] = useState("");
  const [subtitle3, setSubtitle3] = useState("");
  const [subtitle4, setSubtitle4] = useState("");
  const [minPriceIndex, setMinPriceIndex] = useState(null);

  useEffect(() => {
    if (!wineIndex) return;
    setLoading(true);
    fetchWinePrices({ wineIndex, status: [PRICE_STATUS_PASS], loadRowCount: count })
      .then((prices) => {
        const all = [...prices];
        if (
          highlightPrice &&
          !prices.find((p) => Number(p.WPR_index) === Number(highlightPrice.WPR_index))
        ) {
          all.push(highlightPrice);
        }
        setTotalCount(prices.length);

        // 1) oldest date 계산
        let oldestDate = null;
        if (prices.length > 0) {
          oldestDate = prices
            .map((p) => new Date(p.WPR_datetime))
            .reduce((a, b) => (a < b ? a : b));
        }

        // 2) highlight 제외 배열 & 가격순 정렬
        const others = all.filter(
          (p) =>
            !(
              highlightPrice &&
              Number(p.WPR_index) === Number(highlightPrice.WPR_index)
            )
        );
        const sortedByPrice = [...others].sort(
          (a, b) => a.WPR_finalPrice - b.WPR_finalPrice
        );

        // 3) 첫번째 subtitle (최저가 대비)
        let basePct = null;
        let overallMin = null;
        if (highlightPrice && sortedByPrice.length > 0) {
          overallMin = sortedByPrice[0];
          setMinPriceIndex(Number(overallMin.WPR_index));
          const rel = formatRelative(overallMin.WPR_datetime);
          const pct = Math.round(
            (highlightPrice.WPR_finalPrice / overallMin.WPR_finalPrice) * 100
          );
          basePct = pct;
          setSubtitle(`(${rel}) 전체 최저가 대비 ${pct}% 가격`);
        }

        // 4) 3개월 이내 최저가 대비
        if (
          highlightPrice &&
          oldestDate &&
          new Date().getTime() - oldestDate.getTime() >= 1000 * 60 * 60 * 24 * 30 * 3
        ) {
          const threeMonthsAgo = new Date();
          threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
          const recent = others.filter(
            (p) => new Date(p.WPR_datetime) >= threeMonthsAgo
          );
          if (recent.length > 0) {
            const min3 = recent.reduce((m, p) =>
              p.WPR_finalPrice < m.WPR_finalPrice ? p : m
              , recent[0]);
            const pct3 = Math.round(
              (highlightPrice.WPR_finalPrice / min3.WPR_finalPrice) * 100
            );
            setSubtitle2(`3개월 이내 최저가 대비 ${pct3}%`);
          } else {
            setSubtitle2(`3개월 이내 등록된 가격 없음`);
          }
        }

        // 5) 직구 제외 최저가 대비
        if (highlightPrice) {
          const nonImport = others.filter(
            (p) =>
              !p.WSH_priceUnitCode || p.WSH_priceUnitCode.trim() === ""
          );
          if (nonImport.length > 0 && nonImport.length < others.length) {
            const minNI = nonImport.reduce((m, p) =>
              p.WPR_finalPrice < m.WPR_finalPrice ? p : m
              , nonImport[0]);
            if (minNI.WPR_index !== overallMin.WPR_index) {
              const pctNI = Math.round(
                (highlightPrice.WPR_finalPrice / minNI.WPR_finalPrice) * 100
              );
              setSubtitle3(`직구를 제외한 최저가 대비 ${pctNI}%`);
            }
          }
        }

        // 6) 두번째 최저가 대비
        if (highlightPrice && sortedByPrice.length > 1 && basePct > 100) {
          const second = sortedByPrice[1];
          const pct2 = Math.round(
            (highlightPrice.WPR_finalPrice / second.WPR_finalPrice) * 100
          );
          setSubtitle4(`두번째 최저가 대비 ${pct2}%`);
        }

        // 7) 헤더 계산
        if (oldestDate) {
          const days = Math.floor(
            (new Date().getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          let lbl =
            days < 30
              ? `최근 ${days}일 이내`
              : days < 365
                ? `최근 ${Math.floor(days / 30)}개월 이내`
                : `최근 ${Math.floor(days / 365)}년 이내`;
          setHeaderLabel(lbl);
        } else {
          setHeaderLabel(`최근 ${count}개 가격`);
        }

        // 8) vintage별 그룹핑 & 정렬
        const byV = all.reduce((acc: Record<string, any[]>, p: any) => {
          const v = p.WPR_vintage || "Unknown";
          (acc[v] = acc[v] || []).push(p);
          return acc;
        }, {} as Record<string, any[]>);
        const sorted = Object.entries(byV)
          .sort(([a], [b]) => {
            const na = +a,
              nb = +b;
            if (!isNaN(na) && !isNaN(nb)) return nb - na;
            if (!isNaN(na)) return -1;
            if (!isNaN(nb)) return 1;
            return b.localeCompare(a);
          })
          .map(([v, arr]: [string, any[]]) => [
            v,
            (arr as any[]).sort(
              (p: any, q: any) => new Date(q.WPR_datetime).getTime() - new Date(p.WPR_datetime).getTime()
            ),
          ] as [string, any[]]);
        setSections(sorted as [string, any[]][]);
      })
      .catch(() => setError("불러오는 중 오류가 발생했습니다."))
      .finally(() => setLoading(false));
  }, [wineIndex, count, highlightPrice]);

  // --- subtitle 퍼센트 파싱 & 조건 검사 ---
  const parsePct = (text: string): number | null => {
    // "XXX%” 형태에서 숫자만 뽑아냄
    const m = text.match(/(\d+)%/);
    return m ? parseInt(m[1], 10) : null;
  };
  const pct1 = subtitle ? parsePct(subtitle) : null;
  const pct2 = subtitle2 ? parsePct(subtitle2) : null;
  const pct3 = subtitle3 ? parsePct(subtitle3) : null;
  const pct4 = subtitle4 ? parsePct(subtitle4) : null;

  // 조건별 boolean
  const isRed1 = pct1 !== null && pct1 <= 105;
  // 3개월 이 등록된 가격 없을 경우도 강조
  //const isRed2 = pct2 !== null && pct2 <= 100;
  const isRed2 = pct2 === null || pct2 <= 100;
  const isRed3 = pct3 !== null && pct3 <= 100;
  const isRed4 = pct4 !== null && pct4 <= 90;

  return (
    <Modal
      isOpen
      onRequestClose={onClose}
      overlayClassName={styles["price-history-overlay"]}
      className={styles["price-history-modal"]}
      contentLabel="Price History"
    >
      <button className={styles["close-btn"]} onClick={onClose}>
        ×
      </button>
      <h2>
        {headerLabel} ({totalCount}개)
      </h2>
      {/* 수정된 subtitle 렌더링 */}
      <div className={styles["subtitle-group"]}>
        {subtitle && (
          <div
            className={
              isRed1
                ? `${styles.subtitle} ${styles["subtitle-red"]}`
                : styles.subtitle
            }
          >
            {subtitle}
          </div>
        )}
        {subtitle2 && (
          <div
            className={
              isRed2
                ? `${styles.subtitle} ${styles["subtitle-red"]}`
                : styles.subtitle
            }
          >
            {subtitle2}
          </div>
        )}
        {subtitle3 && (
          <div
            className={
              isRed3
                ? `${styles.subtitle} ${styles["subtitle-red"]}`
                : styles.subtitle
            }
          >
            {subtitle3}
          </div>
        )}
        {subtitle4 && (
          <div
            className={
              isRed4
                ? `${styles.subtitle} ${styles["subtitle-red"]}`
                : styles.subtitle
            }
          >
            {subtitle4}
          </div>
        )}
      </div>

      {/* [경매 가격 보기] 버튼 */}
      {onOpenAuctionPopup && (
        <div style={{ textAlign: 'right', marginBottom: 8 }}>
          <button
            type="button"
            style={{ background: '#f5f5f5', border: '1px solid #aaa', borderRadius: 4, padding: '6px 12px', cursor: 'pointer', fontSize: 13 }}
            onMouseDown={e => e.stopPropagation()}
            onClick={e => {
              e.stopPropagation();
              onOpenAuctionPopup();
            }}
          >
            경매 가격 보기
          </button>
        </div>
      )}

      {loading && <div className={styles.center}>불러오는 중…</div>}
      {error && (
        <div className={`${styles.center} ${styles.error}`}>{error}</div>
      )}
      {!loading && !error && sections.length === 0 && (
        <div className={styles.center}>등록된 가격이 없습니다.</div>
      )}

      {!loading &&
        !error &&
        sections.map(([vintage, prices]) => (
          <section key={vintage} className={styles["vintage-section"]}>
            <h3>{vintage}</h3>
            <ul>
              {prices.map((p) => {
                const isHighlight =
                  highlightPrice &&
                  Number(p.WPR_index) === Number(highlightPrice.WPR_index);
                const isCheapest =
                  Number(p.WPR_index) === minPriceIndex;
                return (
                  <li
                    key={p.WPR_index}
                    className={`
                    ${isCheapest ? styles["cheapest-price"] : ""}
                    ${isHighlight ? styles["highlight-price"] : ""}
                  `}
                    onClick={() => onSelectPrice(p)}
                  >
                    {/* 1) 첫 번째 칸: 최저가 태그용 빈 칸(고정 너비) */}
                    <div className={styles["tag-cell"]}>
                      {isCheapest && (
                        <div className={styles["cheapest-tag"]}>
                          최저
                        </div>
                      )}
                    </div>

                    {/* 2) 가격 칸: overflow/ellipsis 처리해서 한 줄로 유지 */}
                    <span className={styles["price-label"]}>
                      {p.WPR_finalPrice?.toLocaleString()}원
                    </span>

                    {/* 3) 날짜 칸 */}
                    <span className={styles["date-label"]}>
                      {formatRelative(p.WPR_datetime)}
                    </span>

                    {/* 4) 샵 정보 칸: 세로로 쌓임 */}
                    <span className={styles["shop-label"]}>
                      <span className={styles["shop-name"]}>
                        {p.WSH_title}
                      </span>
                      <span className={styles["shop-branch"]}>
                        {p.WSH_branch}
                      </span>
                    </span>

                    {/* 5) 상태 점 셀 */}
                    <span className={styles["status-cell"]}>
                      {/* 특가가 1일 때 빨간 점 하나 */}
                      {p.WPR_showSpecialPricePage === 1 && (
                        <span
                          className={`${styles['status-dot']} ${styles.red}`}
                        />
                      )}
                      {/* 메인노출이 1일 때 초록 점 하나 */}
                      {p.WPR_showWineDetailPage === 1 && (
                        <span
                          className={`${styles['status-dot']} ${styles.green}`}
                        />
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}

      <div className={styles.center}>
        <button
          className={styles["see-all-btn"]}
          onClick={() => onSelectPrice(null)}
        >
          전체 보기 ▶
        </button>
      </div>
    </Modal>
  );
}