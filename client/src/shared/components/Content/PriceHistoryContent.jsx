// src/components/common/PriceHistoryContent.jsx
import React, { useEffect, useState, useCallback } from "react";
import { fetchWinePrices } from "../../../api/wineApi";
import { formatRelative } from "../../../shared/utils/dateTimeUtils";
import styles from "./PriceHistoryContent.module.css";
import { PRICE_STATUS_PASS } from '@myorg/shared/constants/winePriceStatusMap'

export default function PriceHistoryContent({
  wineIndex,
  count = 15,
  onClose,
  onSelectPrice,
  highlightPrice,
  onOpenAuctionPopup,          // 우측 패널 열기
  onSelectIdealAuctionPrice,   // (미사용시 무시)
}) {
  const wine = highlightPrice
    ? {
        title: highlightPrice?.WIN_title || "",
        titleKR: highlightPrice?.WIN_titleKR || "",
        thumbnailURLString: highlightPrice?.WIN_thumbnailURL || "",
        index: highlightPrice?.WPR_wineIndex || null,
      }
    : { WIN_title: "", WIN_titleKR: "", WIN_thumbnailURL: "", WPR_wineIndex: null };

  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [headerLabel, setHeaderLabel] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [subtitle, setSubtitle] = useState("");
  const [subtitle2, setSubtitle2] = useState("");
  const [subtitle3, setSubtitle3] = useState("");
  const [subtitle4, setSubtitle4] = useState("");
  const [minPriceIndex, setMinPriceIndex] = useState(null);

  // ✅ 로딩 함수 추출 (초기 로드 + 새로고침 공용)
  const loadPrices = useCallback(async () => {
    if (!wineIndex) return;
    try {
      setLoading(true);
      setError(null);

      const prices = await fetchWinePrices({
        wineIndex,
        status: [PRICE_STATUS_PASS],
        loadRowCount: count,
      });

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
      setSubtitle("");
      setSubtitle2("");
      setSubtitle3("");
      setSubtitle4("");

      if (highlightPrice && sortedByPrice.length > 0) {
        overallMin = sortedByPrice[0];
        setMinPriceIndex(Number(overallMin.WPR_index));
        const rel = formatRelative(overallMin.WPR_datetime);
        const pct = Math.round(
          (highlightPrice.WPR_finalPrice / overallMin.WPR_finalPrice) * 100
        );
        basePct = pct;
        setSubtitle(`전체 최저가 대비 ${pct}% 가격 (${rel})`);
      } else {
        setMinPriceIndex(null);
      }

      // 4) 3개월 이내 최저가 대비
      if (
        highlightPrice &&
        oldestDate &&
        new Date() - oldestDate >= 1000 * 60 * 60 * 24 * 30 * 3
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
          //setSubtitle2(`3개월 이내 최저가 대비 ${pct3}%`);
          setSubtitle2(`3개월 이내 최저가 대비 ${pct3}% (${formatRelative(min3.WPR_datetime)})`);
        } else {
          setSubtitle2(`3개월 이내 등록된 가격 없음`);
        }
      }

      // 5) 직구 제외 최저가 대비
      if (highlightPrice) {
        const nonImport = others.filter(
          (p) => !p.WSH_priceUnitCode || p.WSH_priceUnitCode.trim() === ""
        );
        if (nonImport.length > 0 && nonImport.length < others.length) {
          const minNI = nonImport.reduce((m, p) =>
            p.WPR_finalPrice < m.WPR_finalPrice ? p : m
          , nonImport[0]);
          if (overallMin && minNI.WPR_index !== overallMin.WPR_index) {
            const pctNI = Math.round(
              (highlightPrice.WPR_finalPrice / minNI.WPR_finalPrice) * 100
            );
            setSubtitle3(`직구를 제외한 최저가 대비 ${pctNI}% (${formatRelative(minNI.WPR_datetime)})`);
          }
        }
      }

      // 6) 두번째 최저가 대비
      if (highlightPrice && sortedByPrice.length > 1 && basePct > 100) {
        const second = sortedByPrice[1];
        const pct2 = Math.round(
          (highlightPrice.WPR_finalPrice / second.WPR_finalPrice) * 100
        );
        //setSubtitle4(`두번째 최저가 대비 ${pct2}%`);
        setSubtitle4(`두번째 최저가 대비 ${pct2}% (${formatRelative(second.WPR_datetime)})`);
      }

      // 7) 헤더 계산
      if (oldestDate) {
        const days = Math.floor(
          (new Date() - oldestDate) / (1000 * 60 * 60 * 24)
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
      const byV = all.reduce((acc, p) => {
        const v = p.WPR_vintage || "Unknown";
        (acc[v] = acc[v] || []).push(p);
        return acc;
      }, {});
      const sorted = Object.entries(byV)
        .sort(([a], [b]) => {
          const na = +a, nb = +b;
          if (!isNaN(na) && !isNaN(nb)) return nb - na;
          if (!isNaN(na)) return -1;
          if (!isNaN(nb)) return 1;
          return b.localeCompare(a);
        })
        .map(([v, arr]) => [
          v,
          arr.sort((p, q) => new Date(q.WPR_datetime) - new Date(p.WPR_datetime)),
        ]);

      setSections(sorted);
    } catch (e) {
      setError("불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, [wineIndex, count, highlightPrice]);

  useEffect(() => {
    loadPrices();
  }, [loadPrices]);

  // --- subtitle 퍼센트 파싱 & 조건 검사 ---
  const parsePct = (text) => {
    const m = text.match(/(\d+)%/);
    return m ? parseInt(m[1], 10) : null;
  };
  const pct1 = subtitle ? parsePct(subtitle) : null;
  const pct2 = subtitle2 ? parsePct(subtitle2) : null;
  const pct3 = subtitle3 ? parsePct(subtitle3) : null;
  const pct4 = subtitle4 ? parsePct(subtitle4) : null;

  const isRed1 = pct1 !== null && pct1 <= 105;
  const isRed2 = pct2 === null || pct2 <= 100;
  const isRed3 = pct3 !== null && pct3 <= 100;
  const isRed4 = pct4 !== null && pct4 <= 90;

  return (
    <>
      <button className={styles["close-btn"]} onClick={onClose}>×</button>

      <h2>
        {headerLabel} ({totalCount}개)
      </h2>

      {/* ✅ 상단 우측 액션: 새로고침 + (옵션) 경매 가격 보기 */}
      <div className={styles.actionsRow}>
        <button
          type="button"
          disabled={loading}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); loadPrices(); }}
          style={{
            background: '#f5f5f5',
            border: '1px solid #aaa',
            borderRadius: 4,
            padding: '6px 12px',
            cursor: loading ? 'default' : 'pointer',
            fontSize: 13,
            opacity: loading ? 0.6 : 1,
          }}
          title="최근 가격 다시 불러오기"
        >
          {loading ? '새로고침 중…' : '새로고침'}
        </button>

        {onOpenAuctionPopup && (
          <button
            type="button"
            style={{ background: '#f5f5f5', border: '1px solid #aaa', borderRadius: 4, padding: '6px 12px', cursor: 'pointer', fontSize: 13 }}
            onMouseDown={e => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onOpenAuctionPopup?.(); }}
          >
            경매 가격 보기
          </button>
        )}
      </div>

      {/* 수정된 subtitle 렌더링 */}
      <div className={styles["subtitle-group"]}>
        {subtitle && (
          <div className={isRed1 ? `${styles.subtitle} ${styles["subtitle-red"]}` : styles.subtitle}>
            {subtitle}
          </div>
        )}
        {subtitle2 && (
          <div className={isRed2 ? `${styles.subtitle} ${styles["subtitle-red"]}` : styles.subtitle}>
            {subtitle2}
          </div>
        )}
        {subtitle3 && (
          <div className={isRed3 ? `${styles.subtitle} ${styles["subtitle-red"]}` : styles.subtitle}>
            {subtitle3}
          </div>
        )}
        {subtitle4 && (
          <div className={isRed4 ? `${styles.subtitle} ${styles["subtitle-red"]}` : styles.subtitle}>
            {subtitle4}
          </div>
        )}
      </div>

      {loading && <div className={styles.center}>불러오는 중…</div>}
      {error && <div className={`${styles.center} ${styles.error}`}>{error}</div>}
      {!loading && !error && sections.length === 0 && (
        <div className={styles.center}>등록된 가격이 없습니다.</div>
      )}

      {!loading && !error && sections.map(([vintage, prices]) => (
        <section key={vintage} className={styles["vintage-section"]}>
          <h3>{vintage}</h3>
          <ul>
            {prices.map((p) => {
              const isHighlight =
                highlightPrice &&
                Number(p.WPR_index) === Number(highlightPrice.WPR_index);
              const isCheapest = Number(p.WPR_index) === minPriceIndex;
              return (
                <li
                  key={p.WPR_index}
                  className={`${isCheapest ? styles["cheapest-price"] : ""} ${isHighlight ? styles["highlight-price"] : ""}`}
                  onClick={() => onSelectPrice(p)}
                >
                  <div className={styles["tag-cell"]}>
                    {isCheapest && <div className={styles["cheapest-tag"]}>최저</div>}
                  </div>
                  <span className={styles["price-label"]}>
                    {p.WPR_finalPrice?.toLocaleString()}원
                  </span>
                  <span className={styles["date-label"]}>
                    {formatRelative(p.WPR_datetime)}
                  </span>
                  <span className={styles["shop-label"]}>
                    <span className={styles["shop-name"]}>{p.WSH_title}</span>
                    <span className={styles["shop-branch"]}>{p.WSH_branch}</span>
                  </span>
                  <span className={styles["status-cell"]}>
                    {p.WPR_showSpecialPricePage === 1 && (
                      <span className={`${styles['status-dot']} ${styles.red}`} />
                    )}
                    {p.WPR_showWineDetailPage === 1 && (
                      <span className={`${styles['status-dot']} ${styles.green}`} />
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
    </>
  );
}