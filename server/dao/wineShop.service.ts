// dao/wineShop.dao.ts
import db from '../config/db.js';
import { RowDataPacket } from 'mysql2/promise';
import {
   PRICE_STATUS_PASS,
   PRICE_STATUS_PASS_BEFORE
} from '@myorg/shared/constants/winePriceStatusMap';

export const getList = async (
  searchText?: string | null,
  sort: number = 1,
  status: number | null = null,
  type: number | null = null,
  onlyHeadShop: boolean | null = null,
  onlyBranch: boolean | null = null,
  lastRowIndex: number | string | null = null
): Promise<RowDataPacket[]> => {
  // 1) loadMoreQuery
  let loadMoreQuery = '';
  if (lastRowIndex && String(lastRowIndex).length > 0) {
    // 마지막 인덱스보다 작은 것만 가져오기
    loadMoreQuery = ` AND WS.WSH_index < ${lastRowIndex} `;
  }

  // 2) searchQuery: shopTitle이 있을 때, 공백을 없앤 후 LIKE 검사
  let searchQuery = '';
  if (searchText && searchText.length > 0) {
    const cleaned = searchText.replace(/\s/g, '');
    searchQuery = `
      AND REPLACE(WS.WSH_searchField, ' ', '') LIKE '%${cleaned}%'
    `;
  }

  // 3) statusQuery: status가 넘어오지 않으면 ModelWineShop.STATUS_PASS를 기본으로 사용
  const DEFAULT_STATUS_PASS = 1;
  let statusQuery = '';
  if (status !== null && typeof status !== 'undefined') {
    statusQuery = ` AND WS.WSH_status = ${status} `;
  } else {
    statusQuery = ` AND WS.WSH_status = ${DEFAULT_STATUS_PASS} `;
  }

  // 4) typeQuery
  let typeQuery = '';
  if (type !== null && typeof type !== 'undefined') {
    typeQuery = ` AND WS.WSH_shopType = ${type} `;
  }

  // 5) onlyHeadShop
  let headShopQuery = '';
  if (onlyHeadShop) {
    headShopQuery = ` AND WS.WSH_index = WS.WSH_headShopIndex `;
  }

  // 6) onlyBranch
  let branchQuery = '';
  if (onlyBranch) {
    branchQuery = ` AND WS.WSH_branch IS NOT NULL `;
  }

  // 7) select, join, orderBy 기본값
  let selectExtra = '';
  let joinExtra = '';
  let orderBy = ` ORDER BY WS.WSH_priority DESC, WS.WSH_index ASC `;

  // sort가 1이면 최근 가격 업로드 순으로 정렬
  if (sort === 1) {
    selectExtra = `, P.recentPriceDate `;
    joinExtra = `
      LEFT JOIN (
        SELECT 
          MAX(WPR_registered) AS recentPriceDate,
          WPR_shopIndex
        FROM WinePrice
        WHERE WPR_status = ${PRICE_STATUS_PASS}
           OR WPR_status = ${PRICE_STATUS_PASS_BEFORE}
        GROUP BY WPR_shopIndex
      ) AS P 
        ON P.WPR_shopIndex = WS.WSH_index
    `;
    orderBy = ` ORDER BY P.recentPriceDate DESC, WS.WSH_priority DESC `;
  }

  // 8) 최종 SQL 조립
  let sql = `
    SELECT
      WS.WSH_index,
      WS.WSH_headShopIndex,
      WS.WSH_title,
      WS.WSH_branch,
      WS.WSH_datetime,
      WS.WSH_writerIndex,
      WS.WSH_location,
      WS.WSH_linkURL,
      WS.WSH_description,
      WS.WSH_thumbnailURL,
      WS.WSH_status,
      WS.WSH_phone,
      WS.WSH_kakaoURL,
      WS.WSH_instagramURL,
      WS.WSH_priority,
      WS.WSH_shopType,
      WS.WSH_priceUnitCode
      ${selectExtra}
    FROM WineShop AS WS
    ${joinExtra}
    WHERE 1=1
      ${statusQuery}
      ${searchQuery}
      ${typeQuery}
      ${headShopQuery}
      ${branchQuery}
      ${loadMoreQuery}
    ${orderBy}
    LIMIT 100
  `;

  // 불필요한 공백을 정리하고 return
  sql = sql.replace(/\s{2,}/g, ' ').trim();
  try {
    const [rows] = await db.query<RowDataPacket[]>(sql);
    return rows;
  } catch (err) {
    console.error('getList 에러:', err);
    throw err;
  }
};

export const getUsedDiscountHistoryList = async (shopIndex: number, limit: number = 50): Promise<RowDataPacket[]> => {
  const sql = `
    SELECT 		P.WPR_saleInfo, MAX(P.WPR_index) AS max_index  
    FROM 		  WinePrice AS P 
  
    WHERE 		(P.WPR_status = ? OR P.WPR_status = ?) AND P.WPR_shopIndex = ? AND P.WPR_saleInfo is not null 
    GROUP BY 	P.WPR_saleInfo 
    ORDER BY 	max_index DESC 
    LIMIT   ?
    `;
  const params = [PRICE_STATUS_PASS, PRICE_STATUS_PASS_BEFORE, shopIndex, limit];

  try {
    const [result] = await db.query<RowDataPacket[]>(sql, params);
    return result;
  } catch (err) {
    console.error('getUsedDiscountHistoryListOfShop 에러:', err);
    throw err;
  }
};

export const getCommentHistoryList = async (
  shopIndex: number | string | null,
  lastRowIndex: number | string | null = null,
  loadRowCount: number = 40
): Promise<RowDataPacket[]> => {
  // ── 1) Java 코드에서와 똑같이 lastRowIndex 조건 추가 ──
  let loadMoreQuery = " ";
  if (lastRowIndex != null && String(lastRowIndex).length > 0) {
    loadMoreQuery = " AND WP.WPR_index < " + lastRowIndex + " ";
  }

  // ── 2) Java 코드에서와 똑같이 statusQuery 작성 ──
  const statusQuery =
    " AND (WP.WPR_status = " +
    PRICE_STATUS_PASS +
    " OR WP.WPR_status = " +
    PRICE_STATUS_PASS_BEFORE +
    ") ";

  // ── 3) Java 코드 그대로 shopQuery 작성 ──
  let shopQuery = " WinePrice AS WP ";
  if (shopIndex != null &&
    (
      typeof shopIndex === 'number' ||
      (typeof shopIndex === 'string' && shopIndex.length > 0)
    )
  ) {
    shopQuery =
      " ("
      + " SELECT       P.WPR_index, P.WPR_status, P.WPR_point, P.WPR_showWineDetailPage, P.WPR_showSpecialPricePage, "
      + "               P.WPR_wineIndex, P.WPR_shopIndex, P.WPR_headShopIndex, P.WPR_vintage, P.WPR_bottleSize, "
      + "               P.WPR_price, P.WPR_finalPrice, P.WPR_saleInfo, P.WPR_purchaseLink, P.WPR_datetime, "
      + "               P.WPR_registered, P.WPR_writerIndex, P.WPR_comment, P.WPR_hideWriter "
      + " FROM         WinePrice P "
      + " JOIN ( "
      + "     SELECT   WPR_comment, MAX(WPR_index) AS max_index "
      + "     FROM     WinePrice "
      + "     WHERE    WPR_shopIndex = " + shopIndex + " AND WPR_comment IS NOT NULL "
      + "     GROUP BY WPR_comment "
      + " ) Latest "
      + "   ON P.WPR_comment = Latest.WPR_comment AND P.WPR_index = Latest.max_index "
      + " WHERE P.WPR_shopIndex = " + shopIndex + " "
      + " ) AS WP ";
  }

  // ── 4) Java 코드 그대로 limitQuery 작성 ──
  let limitQuery = " ";
  if (loadRowCount != null && loadRowCount > 0) {
    limitQuery = " LIMIT " + loadRowCount;
  } else {
    limitQuery = " LIMIT 30 ";
  }

  // ── 5) Java 코드와 **정확히 동일하게** SELECT/LEFT JOIN/WHERE/ORDER BY/LIMIT 연결 ──
  const sql =
    ""
    + " SELECT       WP.*, "
    + "               WS.WSH_title, WS.WSH_branch, WS.WSH_priceUnitCode, "
    + "               W.WIN_titleKR, WIN_title, WIN_thumbnailURL "
    + " FROM         " + shopQuery
    + " LEFT JOIN    WineShop AS WS on WS.WSH_index = WP.WPR_shopIndex "
    + " LEFT JOIN    Wine   AS W  on W.WIN_index = WP.WPR_wineIndex "
    + " WHERE        (WP.WPR_comment is not null AND WP.WPR_comment <> '')"
    + statusQuery
    + loadMoreQuery
    + " ORDER BY     WP.WPR_index DESC "
    + limitQuery;

  try {
    // Java 쪽은 PreparedStatement 없이 빈 파라미터(new Object[]{})를 넘겼으므로,
    // Node.js에서도 파라미터 없이 SQL 문자열 그대로 실행합니다.
    const [rows] = await db.query<RowDataPacket[]>(sql);
    return rows;
  } catch (err) {
    console.error('getCommentHistoryList 에러:', err);
    throw err;
  }
};

