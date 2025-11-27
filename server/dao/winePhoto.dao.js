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

/**
 * 여러 WinePrice의 사진들을 한 번에 조회 (N+1 문제 해결)
 * @param {number[]} foreignKeys - WinePrice 인덱스 배열
 * @returns {Promise<Object>} foreignKey를 key로 하는 사진 배열 객체
 */
export const getAttachedPhotosByWinePriceIndices = async (foreignKeys) => {
  if (!foreignKeys || foreignKeys.length === 0) {
    return {};
  }

  const placeholders = foreignKeys.map(() => '?').join(',');
  const sql = `
    SELECT WPH_index, WPH_url, WPH_type, WPH_ratioHW, WPH_foreignKey
    FROM WinePhoto
    WHERE WPH_foreignKey IN (${placeholders})
      AND (WPH_type = 3 OR WPH_type = 13)
    ORDER BY WPH_foreignKey, WPH_order ASC
  `;
  
  const [rows] = await db.query(sql, foreignKeys);
  
  // foreignKey별로 그룹화
  const photosByForeignKey = {};
  rows.forEach(row => {
    const key = row.WPH_foreignKey;
    if (!photosByForeignKey[key]) {
      photosByForeignKey[key] = [];
    }
    photosByForeignKey[key].push({
      WPH_index: row.WPH_index,
      WPH_url: row.WPH_url,
      WPH_type: row.WPH_type,
      WPH_ratioHW: row.WPH_ratioHW
    });
  });
  
  return photosByForeignKey;
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