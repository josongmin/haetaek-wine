import db from '../config/db.js';

export const getAttachedPhotosByWinePriceIndex = async (foreignKey) => {
  const sql = `
    SELECT WPH_index, WPH_url, WPH_type, WPH_ratioHW
    FROM WinePhoto
    WHERE WPH_foreignKey = ?
      AND (WPH_type = 3 OR WPH_type = 13)
    ORDER BY WPH_order ASC
  `;
  const [rows] = await db.query(sql, [foreignKey]);
  return rows;
};

export const changePhotoType = async (photoType, photoIndex) => {
  const sql = `
    UPDATE WinePhoto
    SET WPH_type = ?
    WHERE WPH_index = ?
  `;
  const [result] = await db.query(sql, [photoType, photoIndex]);
  return result.affectedRows;
};