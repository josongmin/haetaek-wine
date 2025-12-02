// dao/user.dao.ts
import db from '../config/db.js';
import { RowDataPacket, ResultSetHeader, PoolConnection } from 'mysql2/promise';
import {
  PRICE_STATUS_PASS,
} from '@myorg/shared/constants/winePriceStatusMap';

interface UserSelectOptions {
  needPassword?: boolean;
  needLog?: boolean;
}

interface User {
  index: string;
  id: string;
  nickname: string;
  password: string | null;
  thumbnailURLString: string;
  deviceToken: string;
  device: string;
  level: number;
  point: number;
  accessToken: string | null;
  integrateType: string;
  integrateId: string;
  log: string | null;
  registered: Date;
  appVersion: string;
  osVersion: string;
  countryCode: string;
  uuid: string;
  expertProfileIndex: number;
  hotDealPush: boolean;
}

/**
 * 주어진 사용자(userIndex)가 지난 N일(days) 동안 등록한
 * "특가" 개수를 반환합니다.
 */
export const getHotDealCount = async (userIndex: string | number, days?: number | null): Promise<number> => {
  let sql: string;
  let params: any[];
  
  if (typeof days === 'number' && days > 0) {
    // days > 0인 경우에만 날짜 필터를 적용
    sql = `
      SELECT
        COUNT(WP.WPR_index) AS count
      FROM
        WinePrice AS WP
        LEFT JOIN (
          SELECT *
          FROM PointHistory
          WHERE PHI_activityTypeIndex = 11
        ) AS PH ON PH.PHI_foreignKey = WP.WPR_index
        LEFT JOIN WineShop AS WS ON WS.WSH_index = WP.WPR_shopIndex
        LEFT JOIN Wine AS W ON W.WIN_index = WP.WPR_wineIndex
      WHERE
        WP.WPR_writerIndex = ?
        AND (WP.WPR_showSpecialPricePage = 1 OR IFNULL(PH.PHI_point, 0) >= 3)
        AND WP.WPR_datetime >= DATE_SUB(NOW(), INTERVAL ? DAY)
        AND WP.WPR_status = ?
    `;
    params = [userIndex, days, PRICE_STATUS_PASS];
  } else {
    // days가 null 또는 <= 0인 경우: 전체 기간 조회 (날짜 필터 제외)
    sql = `
      SELECT
        COUNT(WP.WPR_index) AS count
      FROM
        WinePrice AS WP
        LEFT JOIN (
          SELECT *
          FROM PointHistory
          WHERE PHI_activityTypeIndex = 11
        ) AS PH ON PH.PHI_foreignKey = WP.WPR_index
        LEFT JOIN WineShop AS WS ON WS.WSH_index = WP.WPR_shopIndex
        LEFT JOIN Wine AS W ON W.WIN_index = WP.WPR_wineIndex
      WHERE
        WP.WPR_writerIndex = ?
        AND (WP.WPR_showSpecialPricePage = 1 OR IFNULL(PH.PHI_point, 0) >= 3)
        AND WP.WPR_status = ?
    `;
    params = [userIndex, PRICE_STATUS_PASS];
  }

  try {
    const [rows] = await db.query<RowDataPacket[]>(sql, params);

    if (!rows || rows.length === 0) {
      return 0;
    }

    const countValue = rows[0].count;
    return countValue != null ? Number(countValue) : 0;
  } catch (err) {
    console.error('[getHotDealCount] 특가 개수 조회 실패:', err);
    throw err;
  }
};

export const syncUserPoint = async (conn: PoolConnection, userIndex: string | number): Promise<number> => {
  const sql = `
    UPDATE User U
    SET U.USR_point = (
      SELECT
        IFNULL(SUM(CASE WHEN PHI_activityTypeIndex = 11 THEN PHI_point ELSE 0 END), 0) -
        IFNULL(SUM(CASE WHEN PHI_activityTypeIndex = 12 THEN PHI_point ELSE 0 END), 0)
      FROM PointHistory
      WHERE PHI_userIndex = U.USR_index
    )
    WHERE U.USR_index = ?
  `;
  const [result] = await conn.query<ResultSetHeader>(sql, [userIndex]);
  return result.affectedRows;
};

export const updateUserLevel = async (userIndex: string | number, level: number): Promise<number> => {
  const sql = `
    UPDATE User U
    SET U.USR_level = ?
    WHERE U.USR_index = ?
  `;
  const [result] = await db.query<ResultSetHeader>(sql, [level, userIndex]);
  return result.affectedRows;
};

export const userSelectFields = (alias = 'U', needPassword = false, needLog = false): string => {
  const t = alias ? `${alias}.` : '';
  return `
    ${t}USR_index AS USR_index,
    ${t}USR_id AS USR_id,
    ${t}USR_nickname AS USR_nickname,
    ${t}USR_thumbnailURL AS USR_thumbnailURL,
    ${t}USR_device AS USR_device,
    ${t}USR_deviceToken AS USR_deviceToken,
    ${t}USR_integrateId AS USR_integrateId,
    ${t}USR_integrateType AS USR_integrateType,
    ${t}USR_point AS USR_point,
    ${t}USR_level AS USR_level,
    ${t}USR_expertProfileIndex AS USR_expertProfileIndex,
    ${t}USR_hotDealPush AS USR_hotDealPush,
    ${t}USR_registered AS USR_registered,
    ${t}USR_appVersion AS USR_appVersion,
    ${t}USR_osVersion AS USR_osVersion,
    ${t}USR_countryCode AS USR_countryCode,
    ${t}USR_uuid AS USR_uuid,
    ${needLog ? `${t}USR_log` : `0`} AS USR_log,
    ${needPassword ? `${t}USR_password` : `0`} AS USR_password,
    ${needPassword ? `${t}USR_accessToken` : `0`} AS USR_accessToken
  `;
};

export const getUserByIndex = async (userIndex: string | number, options: UserSelectOptions = {}): Promise<User | null> => {
  const { needPassword = false, needLog = false } = options;
  const sql = `
    SELECT
      ${userSelectFields('U', needPassword, needLog)}
    FROM \`User\` U
    WHERE U.USR_index = ?
    LIMIT 1
  `;
  const [rows] = await db.query<RowDataPacket[]>(sql, [userIndex]);
  if (!rows || rows.length === 0) return null;

  const r = rows[0];
  return {
    index: String(r.USR_index),
    id: r.USR_id,
    nickname: r.USR_nickname,
    password: needPassword ? r.USR_password : null,
    thumbnailURLString: r.USR_thumbnailURL,
    deviceToken: r.USR_deviceToken,
    device: r.USR_device,
    level: Number(r.USR_level ?? 0),
    point: Number(r.USR_point ?? 0),
    accessToken: needPassword ? r.USR_accessToken : null,
    integrateType: r.USR_integrateType,
    integrateId: r.USR_integrateId,
    log: needLog ? r.USR_log : null,
    registered: r.USR_registered,
    appVersion: r.USR_appVersion,
    osVersion: r.USR_osVersion,
    countryCode: r.USR_countryCode,
    uuid: r.USR_uuid,
    expertProfileIndex: r.USR_expertProfileIndex,
    hotDealPush: !!r.USR_hotDealPush,
  };
};

