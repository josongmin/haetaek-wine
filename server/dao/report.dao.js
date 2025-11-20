import db from '../config/db.js';


export const insertReport = async (
  reporterIndex,
  communityIndex,
  winePriceIndex,
  reason
) => {
    const insertSql = `
    INSERT INTO Report (RPT_reporterIndex, RPT_communityIndex, RPT_winePriceIndex, RPT_reason)
    VALUES (?, ?, ?, ?)
   `;
    const [insertResult] = await db.query(insertSql, [
      reporterIndex,
      communityIndex,
      winePriceIndex,
      reason,
    ]);
    return insertResult.insertId;  // 새로 생성된 RPT_index
};

export const updateReport = async (reportIndex, reason) => {
    const sql = `
      UPDATE  Report 
      SET     RPT_reason = ?
      WHERE   RPT_index = ?
    `;
    const [result] = await db.query(sql, [
      reason,
      reportIndex
    ]);
    return result.affectedRows;
};

export const deleteReport = async (reportIndex) => {
  const sql = `
    DELETE FROM Report WHERE RPT_index = ? 
  `;
  const [result] = await db.query(sql, [
    reportIndex
  ]);
  return result.affectedRows;
};