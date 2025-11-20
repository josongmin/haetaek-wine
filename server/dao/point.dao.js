import db from '../config/db.js';
import { TYPE_INDEX_SHOW_PRICE } from '@myorg/shared/constants/pointTypes';
import { syncUserPoint } from './user.dao.js';

/**
 * PointHistory에 insert하고, User 테이블에 point 업데이트
 * @param {Object} pointHistory - 포인트 히스토리 데이터
 * @returns {number} insert 및 update 성공한 row 수
 */
export const insertWithUpdateUserPoint = async (pointHistory) => {
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    // 1. PointHistory insert
    const insertSql = `
      INSERT INTO PointHistory (PHI_userIndex, PHI_activityTypeIndex, PHI_foreignKey, PHI_datetime, PHI_point, PHI_dataSet)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const [insertResult] = await conn.query(insertSql, [
      pointHistory.userIndex,
      pointHistory.activityTypeIndex,
      pointHistory.foreignKey,
      pointHistory.datetime,
      pointHistory.point,
      pointHistory.dataSet,
    ]);

    // 2. User 포인트 업데이트
    const pointOperator = pointHistory.activityTypeIndex === TYPE_INDEX_SHOW_PRICE ? '-' : '+';
    const updateSql = `
      UPDATE User
      SET USR_point = USR_point ${pointOperator} ?
      WHERE USR_index = ?
    `;
    const [updateResult] = await conn.query(updateSql, [
      pointHistory.point,
      pointHistory.userIndex,
    ]);

    await conn.commit();

    return insertResult.insertId;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const updateWithSyncUserPoint = async (userIndex, index, point, reason) => {
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    // 1. PointHistory insert
    const sql = `
      UPDATE  PointHistory 
      SET     PHI_point = ? , PHI_dataSet = ?
      WHERE   PHI_index = ?
    `;
    const [insertResult] = await conn.query(sql, [
      point,
      reason,
      index
    ]);

    // 2. User 포인트 업데이트
    const updateResult = await syncUserPoint(conn, userIndex);

    await conn.commit();

    return insertResult.affectedRows + updateResult.affectedRows;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const deleteWithSyncUserPoint = async (userIndex, index) => {
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    // 1. PointHistory delete
    const sql = `
      DELETE FROM   PointHistory 
      WHERE         PHI_index = ?
    `;
    const [deleteResult] = await conn.query(sql, [
      index
    ]);

    // 2. User 포인트 업데이트
    const updateResult = await syncUserPoint(conn, userIndex);

    await conn.commit();

    return deleteResult.affectedRows + updateResult.affectedRows;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const deletePriceWithSyncUserPoint = async (priceIndex, index) => {
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    // 1. PointHistory delete
    const sql = `
      DELETE FROM   PointHistory 
      WHERE         PHI_activityTypeIndex = 11 AND PHI_foreignKey = ?
    `;
    const [deleteResult] = await conn.query(sql, [
      priceIndex
    ]);

    // 2. User 포인트 업데이트
    const updateResult = await syncUserPoint(conn, userIndex);

    await conn.commit();

    return deleteResult.affectedRows + updateResult.affectedRows;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};