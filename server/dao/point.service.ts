import db from '../config/db.js';
import { ResultSetHeader, PoolConnection } from 'mysql2/promise';
import { TYPE_INDEX_SHOW_PRICE } from '@myorg/shared/constants/pointTypes';
import { syncUserPoint } from './user.service.js';

interface PointHistory {
  userIndex: number;
  activityTypeIndex: number;
  foreignKey: number;
  datetime: string;
  point: number;
  dataSet?: string;
}

/**
 * PointHistory에 insert하고, User 테이블에 point 업데이트
 */
export const insertWithUpdateUserPoint = async (pointHistory: PointHistory): Promise<number> => {
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    // 1. PointHistory insert
    const insertSql = `
      INSERT INTO PointHistory (PHI_userIndex, PHI_activityTypeIndex, PHI_foreignKey, PHI_datetime, PHI_point, PHI_dataSet)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const [insertResult] = await conn.query<ResultSetHeader>(insertSql, [
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
    const [updateResult] = await conn.query<ResultSetHeader>(updateSql, [
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

export const updateWithSyncUserPoint = async (userIndex: number, index: number, point: number, reason?: string): Promise<number> => {
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    // 1. PointHistory update
    const sql = `
      UPDATE  PointHistory 
      SET     PHI_point = ? , PHI_dataSet = ?
      WHERE   PHI_index = ?
    `;
    const [updateResult] = await conn.query<ResultSetHeader>(sql, [
      point,
      reason,
      index
    ]);

    // 2. User 포인트 업데이트
    const syncResult = await syncUserPoint(conn, userIndex);

    await conn.commit();

    return updateResult.affectedRows + syncResult;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const deleteWithSyncUserPoint = async (userIndex: number, index: number): Promise<number> => {
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    // 1. PointHistory delete
    const sql = `
      DELETE FROM   PointHistory 
      WHERE         PHI_index = ?
    `;
    const [deleteResult] = await conn.query<ResultSetHeader>(sql, [
      index
    ]);

    // 2. User 포인트 업데이트
    const syncResult = await syncUserPoint(conn, userIndex);

    await conn.commit();

    return deleteResult.affectedRows + syncResult;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

