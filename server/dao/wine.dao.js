// winePrice.dao.js
import db from '../config/db.js';
import {
  WINE_STATUS_PASS,
  WINE_STATUS_WAITING,
  WINE_STATUS_INCOMPLETE,
  WINE_STATUS_DISABLED,
} from '@myorg/shared/constants/wineStatusMap';

export const changeWineStatus = async (index, status) => {
  const sql = `
    UPDATE  Wine
    SET     WIN_status = ?
    WHERE   WIN_index = ?
  `;

  try {
    console.log('실행 SQL:', sql, 'params:', [status, index]);
    console.log('[changeWineStatus] 실행:', { index, status, sql });

    const [result] = await db.query(sql, [status, index]);

    console.log('[changeWineStatus] 결과:', result);

    return result.affectedRows; // 업데이트된 행 수 반환
  } catch (err) {
    console.error('updateStatus 오류:', err);
    throw err;
  }
};

export const changeWineStatusToIncompleteIfNotPass = async (index) => {
  const sql = `
    UPDATE  Wine
    SET     WIN_status = ?
    WHERE   WIN_index = ? AND WIN_status != ?
  `;

  try {
    const [result] = await db.query(sql, [WINE_STATUS_INCOMPLETE, index, WINE_STATUS_PASS]);
    return result.affectedRows; // 업데이트된 행 수 반환
  } catch (err) {
    console.error('updateStatus 오류:', err);
    throw err;
  }
};