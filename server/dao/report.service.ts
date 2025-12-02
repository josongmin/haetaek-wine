import db from '../config/db.js';
import { ResultSetHeader } from 'mysql2/promise';

export const insertReport = async (
  reporterIndex: number,
  communityIndex: number,
  winePriceIndex: number,
  reason: string
): Promise<number> => {
  const insertSql = `
    INSERT INTO Report (RPT_reporterIndex, RPT_communityIndex, RPT_winePriceIndex, RPT_reason)
    VALUES (?, ?, ?, ?)
   `;
  const [insertResult] = await db.query<ResultSetHeader>(insertSql, [
    reporterIndex,
    communityIndex,
    winePriceIndex,
    reason,
  ]);
  return insertResult.insertId;  // 새로 생성된 RPT_index
};

export const updateReport = async (reportIndex: number, reason: string): Promise<number> => {
  const sql = `
    UPDATE  Report 
    SET     RPT_reason = ?
    WHERE   RPT_index = ?
  `;
  const [result] = await db.query<ResultSetHeader>(sql, [
    reason,
    reportIndex
  ]);
  return result.affectedRows;
};

export const deleteReport = async (reportIndex: number): Promise<number> => {
  const sql = `
    DELETE FROM Report WHERE RPT_index = ? 
  `;
  const [result] = await db.query<ResultSetHeader>(sql, [
    reportIndex
  ]);
  return result.affectedRows;
};

