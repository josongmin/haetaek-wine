// winePrice.dao.js
import db from '../config/db.js';

export const getWinePriceListContainWineInfo = async (filters) => {
  const isTrue = (v) => v === true || v === 'true';

  const {
    wineIndex,
    shopIndex,
    writerIndex,
    writerIsNotAdmin,
    searchText,
    lastRowIndex,
    loadRowCount = 40,
    showReportedByUser,
    showPassed,
    showInReview,
    showDeleted,
    showReported,
    showPassBeforeReview,
  } = filters;

  let wineQuery = '';
  let shopQuery = '';
  let writerQuery = '';
  let writerIsNotAdminQuery = '';
  let searchQuery = '';
  let statusQuery = '';
  let reportedQuery = '';
  let loadMoreQuery = '';
  let limitQuery = `LIMIT ${loadRowCount}`;

  if (wineIndex) wineQuery = ` AND WP.WPR_wineIndex = ?`;
  if (shopIndex) shopQuery = ` AND WP.WPR_shopIndex = ?`;
  if (writerIndex) writerQuery = ` AND WP.WPR_writerIndex = ?`;
  if (writerIsNotAdmin) writerIsNotAdminQuery = ` AND U.USR_level < 999999 AND U.USR_index != 250 AND U.USR_index != 6107 AND U.USR_index != 152 AND U.USR_index != 195 `;
  if (searchText) searchQuery = ` AND REPLACE(W.WIN_searchField, ' ', '') LIKE ?`;
  if (showReportedByUser) reportedQuery = ` AND R.RPT_index IS NOT NULL`;
  if (lastRowIndex) loadMoreQuery = ` AND WP.WPR_index < ?`;

  // 상태 리스트 구성
  const statusList = [];
  if (isTrue(showPassed)) statusList.push(1);
  if (isTrue(showInReview)) statusList.push(0);
  if (isTrue(showReported)) statusList.push(2);
  if (isTrue(showDeleted)) statusList.push(3);
  if (isTrue(showPassBeforeReview)) statusList.push(4);
  const statusListWithComma = statusList.join(',');
  if (statusListWithComma) statusQuery = ` AND WP.WPR_status IN (${statusListWithComma})`;

  const sql = `
    SELECT WP.*,
           WS.WSH_index, WS.WSH_title, WS.WSH_branch, WS.WSH_priceUnitCode, WS.WSH_status, WS.WSH_shopType, 
           W.WIN_title, W.WIN_titleKR, W.WIN_thumbnailURL, 
           U.*,
           R.RPT_reason, R.RPT_datetime, R.RPT_index,
           P.PHI_point AS pointRewarded, P.PHI_dataSet AS rewardedComment, P.PHI_datetime, P.PHI_index
    FROM WinePrice AS WP
    LEFT JOIN WineShop AS WS ON WS.WSH_index = WP.WPR_shopIndex
    LEFT JOIN Wine AS W ON W.WIN_index = WP.WPR_wineIndex
    LEFT JOIN User AS U ON U.USR_index = WP.WPR_writerIndex
    LEFT JOIN (
      SELECT _R.* FROM Report _R
      JOIN (
        SELECT RPT_winePriceIndex, MAX(RPT_index) AS max_index
        FROM Report GROUP BY RPT_winePriceIndex
      ) LatestReports ON _R.RPT_winePriceIndex = LatestReports.RPT_winePriceIndex
                      AND _R.RPT_index = LatestReports.max_index
    ) AS R ON R.RPT_winePriceIndex = WP.WPR_index
    LEFT JOIN (
      SELECT _P.* FROM PointHistory _P
      JOIN (
        SELECT PHI_foreignKey, MAX(PHI_index) AS max_index
        FROM PointHistory
        WHERE PHI_activityTypeIndex = 11
        GROUP BY PHI_foreignKey
      ) LatestPointHistory ON _P.PHI_foreignKey = LatestPointHistory.PHI_foreignKey
                            AND _P.PHI_index = LatestPointHistory.max_index
    ) AS P ON WP.WPR_index = P.PHI_foreignKey
    WHERE 1=1
      ${wineQuery}
      ${shopQuery}
      ${writerQuery}
      ${writerIsNotAdminQuery}
      ${searchQuery}
      ${statusQuery}
      ${reportedQuery}
      ${loadMoreQuery}
    ORDER BY WP.WPR_registered DESC
    ${limitQuery}
  `;

  const params = [];
  if (wineIndex) params.push(wineIndex);
  if (shopIndex) params.push(shopIndex);
  if (writerIndex) params.push(writerIndex);
  if (searchText) params.push(`%${searchText.replace(/\s+/g, '')}%`);
  if (lastRowIndex) params.push(lastRowIndex);

  try {
    const [rows] = await db.query(sql, params);
    return rows;
  } catch (err) {
    console.error('getWinePriceListContainWineInfo 에러:', err);
    throw new Error('DB 연결 오류');
  }
};

export const changeReviewStatus = async (status, winePriceIndex, point = null) => {
  let setClauses = ['WPR_status = ?'];
  const params = [status];

  if (point !== null && point !== undefined) {
    setClauses.push('WPR_point = ?');
    params.push(point);
  }

  // WHERE 조건
  params.push(winePriceIndex);

  const sql = `
    UPDATE WinePrice
    SET ${setClauses.join(', ')}
    WHERE WPR_index = ?
  `;

  try {
    const [result] = await db.query(sql, params);
    return result.affectedRows;
  } catch (err) {
    console.error('changeReviewStatus 오류:', err);
    throw err;
  }
};
export const changeWriter = async (winePriceIndex, writerIndex) => {
  const sql = `
    UPDATE WinePrice
    SET WPR_writerIndex = ?
    WHERE WPR_index = ?
  `;

  try {
    const [result] = await db.query(sql, [writerIndex, winePriceIndex]);
    return result.affectedRows;
  } catch (err) {
    console.error('changeWriter 오류:', err);
    throw err;
  }
};

/**
 * WinePrice.WPR_showSpecialPricePage 컬럼을 업데이트합니다.
 * @param {boolean} show           특가 페이지 노출 여부
 * @param {number} winePriceIndex         WinePrice 테이블의 PK
 * @returns {Promise<number>}       변경된 행의 개수
 */
export const setShowInSpecialPricePage = async (show, winePriceIndex) => {
  const sql = `
    UPDATE WinePrice
       SET WPR_showSpecialPricePage = ?
     WHERE WPR_index = ?
  `;
  const params = [show ? 1 : 0, winePriceIndex];

  try {
    const [result] = await db.query(sql, params);
    return result.affectedRows;  // 0: 변경 없음, 1: 성공
  } catch (err) {
    console.error('setSpecialPriceVisibility 에러:', err);
    throw err;
  }
}

export const setShowInWineDetailPage = async (show, winePriceIndex) => {
  const sql = `
    UPDATE WinePrice
       SET WPR_showWineDetailPage = ?
     WHERE WPR_index = ?
  `;
  const params = [show ? 1 : 0, winePriceIndex];

  try {
    const [result] = await db.query(sql, params);
    return result.affectedRows;  // 0: 변경 없음, 1: 성공
  } catch (err) {
    console.error('setShowInWineDetailPage 에러:', err);
    throw err;
  }
}

export const setStockCount = async (stockCount, winePriceIndex) => {
  const sql = `
    UPDATE WinePrice
       SET WPR_stockCount = ?
     WHERE WPR_index = ?
  `;
  const params = [stockCount, winePriceIndex];

  try {
    const [result] = await db.query(sql, params);
    return result.affectedRows;  // 0: 변경 없음, 1: 성공
  } catch (err) {
    console.error('setShowInWineDetailPage 에러:', err);
    throw err;
  }
}

export const setHasReceipt = async (hasReceipt, winePriceIndex) => {
  const sql = `
    UPDATE WinePrice
       SET WPR_receipt = ?
     WHERE WPR_index = ?
  `;
  const params = [hasReceipt, winePriceIndex];

  try {
    const [result] = await db.query(sql, params);
    return result.affectedRows;  // 0: 변경 없음, 1: 성공
  } catch (err) {
    console.error('setShowInWineDetailPage 에러:', err);
    throw err;
  }
}
export const setNeededPointForShow = async (neededPoint, winePriceIndex) => {
  const sql = `
    UPDATE WinePrice
       SET WPR_point = ?
     WHERE WPR_index = ?
  `;
  const params = [neededPoint, winePriceIndex];

  try {
    const [result] = await db.query(sql, params);
    return result.affectedRows;  // 0: 변경 없음, 1: 성공
  } catch (err) {
    console.error('setShowInWineDetailPage 에러:', err);
    throw err;
  }
}

/**
 * 여러 필드를 한 번에 업데이트
 * @param {object} args
 * @param {number} args.priceId               - WPR_index
 * @param {boolean} [args.showSpecial]         - 특가 노출 여부
 * @param {boolean} [args.showDetail]          - 디테일 페이지 노출 여부
 * @param {number}  [args.stockCount]          - 재고 수량
 * @param {boolean} [args.hasReceipt]          - 영수증 인증 여부
 * @param {number}  [args.neededPoint]         - 열람시 필요 포인트
 */
export async function updateWinePrice({
  priceId,
  showSpecial,
  showDetail,
  stockCount,
  hasReceipt,
  neededPoint,
}) {
  const sets = [];
  const params = [];

  if (showSpecial !== undefined) {
    sets.push('WPR_showSpecialPricePage = ?');
    params.push(showSpecial ? 1 : 0);
  }
  if (showDetail !== undefined) {
    sets.push('WPR_showWineDetailPage = ?');
    params.push(showDetail ? 1 : 0);
  }
  if (stockCount !== undefined) {
    sets.push('WPR_stockCount = ?');
    params.push(stockCount);
  }
  if (hasReceipt !== undefined) {
    sets.push('WPR_receipt = ?');
    params.push(hasReceipt ? 1 : 0);
  }
  if (neededPoint !== undefined) {
    sets.push('WPR_point = ?');
    params.push(neededPoint);
  }

  if (sets.length === 0) {
    // 업데이트할 게 없으면 바로 리턴
    return 0;
  }

  const sql = `
    UPDATE WinePrice
       SET ${sets.join(', ')}
     WHERE WPR_index = ?
  `;
  params.push(priceId);

  try {
    const [result] = await db.query(sql, params);
    return result.affectedRows; // 0: 변경 없음, 1: 성공
  } catch (err) {
    console.error('updateWinePrice 에러:', err);
    throw err;
  }
}


export const deleteWithRelatedData = async (priceIndex, wineIndex) => {
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const sqlPoint = `
    DELETE FROM PointHistory WHERE PHI_foreignKey = ? AND PHI_activityTypeIndex = 11
  `;
    const [deletePointResult] = await conn.query(sqlPoint, [
      priceIndex
    ]);

    const sqlSync = `
    UPDATE User U
    SET U.USR_point = (
      SELECT
        IFNULL(SUM(CASE WHEN PHI_activityTypeIndex = 11 THEN PHI_point ELSE 0 END), 0) -
        IFNULL(SUM(CASE WHEN PHI_activityTypeIndex = 12 THEN PHI_point ELSE 0 END), 0)
      FROM PointHistory
      WHERE PHI_userIndex = U.USR_index
    )
    WHERE U.USR_index = (SELECT WPR_writerIndex FROM WinePrice WHERE WPR_index = ?)
`;
    const [syncPointResult] = await conn.query(sqlSync, [
      priceIndex
    ]);

    const sqlPrice = `
      DELETE FROM   WinePrice 
      WHERE         WPR_index = ?
    `;
    const [deletePriceResult] = await conn.query(sqlPrice, [
      priceIndex
    ]);

    const sqlWine = `
    DELETE FROM   Wine 
    WHERE         WIN_status = 0 
              AND WIN_index = ? 
              AND NOT EXISTS (
                SELECT 1
                FROM WinePrice
                WHERE WinePrice.WPR_wineIndex = Wine.WIN_index
              )
  `;
    const [deleteWineResult] = await conn.query(sqlWine, [
      wineIndex
    ]);

    const sqlReport = `
    DELETE FROM Report WHERE RPT_winePriceIndex = ? 
  `;
    const [deleteReportResult] = await conn.query(sqlReport, [
      priceIndex
    ]);

    await conn.commit();

    return deletePriceResult.affectedRows + deleteWineResult.affectedRows;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};