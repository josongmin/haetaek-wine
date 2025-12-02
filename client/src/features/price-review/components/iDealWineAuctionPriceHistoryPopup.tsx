// src/components/reviewPrice/iDealWineAuctionPriceHistoryPopup.jsx
import React, { useEffect, useState } from "react";
import Modal from "react-modal";
import { crawlWinePrices } from "../../../api/wineApi";
import styles from "./PriceHistoryPopup.module.css"; // PriceHistoryPopup 스타일 재사용

Modal.setAppElement("#root");

// util: "YYYY-MM-DD HH:mm:ss" 또는 "YYYY-MM-DD"만 안전하게 파싱
function parseDateSafe(s: string | null | undefined): Date | null {
  if (!s || typeof s !== 'string') return null;
  // 잘못 들어온 "25:07:25" 같은 건 버림
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const [_, y, mo, d] = m;
  // 로컬(사용자 타임존)의 자정으로 생성 → 시차로 인한 하루 오프셋 방지
  return new Date(Number(y), Number(mo) - 1, Number(d));
}

function formatRelative(past: string | Date | null | undefined, now: Date = new Date()): string {
  const d = typeof past === 'string' ? parseDateSafe(past) : past;
  if (!d) return ''; // 혹은 '날짜 없음'
  const ms = now.getTime() - d.getTime();
  const dayMs = 1000 * 60 * 60 * 24;
  const days = Math.floor(ms / dayMs);
  if (days < 1) return '오늘';
  if (days < 60) return `${days}일 전`;
  const months = Math.floor(days / 30); // 충분히 정확
  if (months < 12) return `${months}개월 전`;
  const years = Math.floor(months / 12);
  return `${years}년 전`;
}

export default function IDealWineAuctionPriceHistoryPopup({
  wine,
  count = 30,
  onClose,
  onSelectPrice,
  highlightPrice,
}) {
  const [searchTerm, setSearchTerm] = useState(wine.title);
  const [sections, setSections] = useState<[string, any[]][]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [headerLabel] = useState("아이디얼 경매 가격");
  const [totalCount, setTotalCount] = useState(0);
  const [minPriceIndex, setMinPriceIndex] = useState(null);

  const [wineTitleState, setWineTitleState] = useState('');


  const loadPrices = (title) => {
    const wineObjForInjection = { // EditWineShopPricePopup.jsx 페이지에서 사용할 때 이 값들을 기준으로 와인 정보를 미리 채워넣음.
      WPR_wineIndex: wine.index,
      WIN_title: wine.title,
      WIN_titleKR: wine.titleKR,
      WIN_thumbnailURL: wine.thumbnailURLString,
    };
    const shopObjForInjection = { // EditWineShopPricePopup.jsx 페이지에서 사용할 때 이 값들을 기준으로 샵 정보를 미리 채워넣음.
      WSH_index: '926',
      WSH_headShopIndex: '926',
      WSH_title: '아이디얼와인',
      WSH_branch: '',
      WSH_priceUnitCode: 'EUR',

      WPR_shopIndex: '926',
      WPR_headShopIndex: '926',
      WPR_priceUnitCode: 'EUR',

      WPR_showWineDetailPage: 1, // 와인 상세 페이지 노출 활성화
      WPR_showSpecialPricePage: 0, // 특가 페이지 노출 비활성화
      WPR_hideWriter: 1, // 작성자 숨기기 활성화
    };

    setLoading(true);
    setError(null);
    crawlWinePrices(title)
      .then((items: any) => {
        // 1) 각 item에 wineInfo 병합
        const itemsWithWine = (items as any[]).map((item: any) => ({
          ...item,
          ...wineObjForInjection,
          ...shopObjForInjection
        }));

        setWineTitleState(itemsWithWine[0]?.WPR_wineTitle);

        setTotalCount(itemsWithWine.length);
        // vintage별 그룹핑 & 정렬
        const byV = itemsWithWine.reduce((acc: Record<string, any[]>, item: any) => {
          const v = item.WPR_vintage || "Unknown";
          (acc[v] = acc[v] || []).push(item);
          return acc;
        }, {} as Record<string, any[]>);
        const sorted = Object.entries(byV)
          .sort(([a], [b]) => {
            const na = +a, nb = +b;
            if (!isNaN(na) && !isNaN(nb)) return nb - na;
            if (!isNaN(na)) return -1;
            if (!isNaN(nb)) return 1;
            return b.localeCompare(a);
          })
          .map(([v, arr]: [string, any[]]) => [
            v,
            (arr as any[])
            .map((it: any) => ({ ...it, __parsedDate: parseDateSafe(it.WPR_datetime || it.datetime) }))
            .sort((a: any, b: any) => (b.__parsedDate?.getTime() ?? 0) - (a.__parsedDate?.getTime() ?? 0))
          ] as [string, any[]]);
        setSections(sorted as [string, any[]][]);
      })
      .catch(() => setError("불러오는 중 오류가 발생했습니다."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // wine.title에 'domaine'이 포함되어 있으면 제거
    const cleanedTitle = /domaine/i.test(wine.title)
      ? wine.title.replace(/domaine\s*/gi, "").trim()
      : wine.title;

    setSearchTerm(cleanedTitle);
    loadPrices(cleanedTitle);
  }, []);

  return (
    <Modal
      isOpen
      onRequestClose={onClose}
      overlayClassName={styles['price-history-overlay']}
      className={styles['price-history-modal']}
      contentLabel="Auction Price History"
    >
      {/* 닫기 버튼 */}
      <button className={styles['close-btn']} onClick={onClose}>
        ×
      </button>

      {/* 제목 */}
      <h2>
        {headerLabel} ({totalCount}개)
      </h2>

      {/* 검색 입력 & 재검색 버튼 */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: 1, padding: '6px 12px', fontSize: 13, border: '1px solid #ccc', borderRadius: 4 }}
        />
        <button
          type="button"
          onClick={() => loadPrices(searchTerm)}
          style={{ marginLeft: 8, padding: '6px 12px', fontSize: 13 }}
        >
          재검색
        </button>
      </div>

      <div style={{ margin: '0 0 16px' }}>
        {wineTitleState}
      </div>

      {/* 로딩 / 에러 / 빈 상태 */}
      {loading && <div className={styles.center}>불러오는 중…</div>}
      {error && <div className={`${styles.center} ${styles.error}`}>{error}</div>}
      {!loading && !error && sections.length === 0 && (
        <div className={styles.center}>등록된 가격이 없습니다.</div>
      )}

      {/* vintage 섹션 */}
      {!loading &&
        !error &&
        sections.map(([vintage, prices]) => (
          <section key={vintage} className={styles['vintage-section']}>
            <h3>{vintage}</h3>
            <ul>
              {prices.map((p) => {
                const isHighlight =
                  highlightPrice && Number(p.WPR_index) === Number(highlightPrice.WPR_index);
                const isCheapest = Number(p.WPR_index) === minPriceIndex;
                return (
                  <li
                    key={p.WPR_index}
                    className={`${isCheapest ? styles['cheapest-price'] : ''} ${isHighlight ? styles['highlight-price'] : ''}`}
                    onClick={() => onSelectPrice(p)}
                  >
                    <div className={styles['tag-cell']}>
                      {isCheapest && <div className={styles['cheapest-tag']}>최저</div>}
                    </div>
                    <span className={styles['price-label']}>{p.WPR_finalPrice?.toLocaleString()}원</span>
                    <span className={styles['date-label']}>{formatRelative(p.WPR_datetime)}</span>
                    <span className={styles['shop-label']}>
                      <span className={styles['shop-name']}>{p.WSH_title}</span>
                      <span className={styles['shop-branch']}>{p.WSH_branch}</span>
                    </span>
                    <span className={styles['status-cell']}>
                      {p.WPR_showSpecialPricePage === 1 && <span className={`${styles['status-dot']} ${styles.red}`} />}
                      {p.WPR_showWineDetailPage === 1 && <span className={`${styles['status-dot']} ${styles.green}`} />}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}

    </Modal>
  );
}