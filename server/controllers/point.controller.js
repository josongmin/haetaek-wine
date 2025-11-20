import * as pointDao from '../dao/point.dao.js';
import moment from 'moment';
import { TYPE_INDEX_WRITE_PRICE } from '@myorg/shared/constants/pointTypes';

export const insertPointForWritePrice = async (req, res) => {
  const { itemIndex, userIndex, point, reason } = req.body;

  const pointHistory = {
    activityTypeIndex: TYPE_INDEX_WRITE_PRICE,
    foreignKey: itemIndex,
    userIndex,
    point,
    datetime: moment().format('YYYY-MM-DD HH:mm:ss'),
    dataSet: reason,
  };

  try {
    const result = await pointDao.insertWithUpdateUserPoint(pointHistory);
    res.json({ success: true, newIndex: result });
  } catch (err) {
    console.error('포인트 저장 실패:', err);
    res.status(500).json({ success: false, message: '서버 오류' });
  }
};

export const updatePointForWritePrice = async (req, res) => {
  const { userIndex, index, point, reason } = req.body;

  try {
    const result = await pointDao.updateWithSyncUserPoint(userIndex, index, point, reason);
    res.json({ success: true, result });
  } catch (err) {
    console.error('포인트 갱신 실패:', err);
    res.status(500).json({ success: false, message: '서버 오류' });
  }
};

export const deletePointHistoryWithSyncUserPoint = async (req, res) => {
  const { userIndex, index } = req.body;

  try {
    const result = await pointDao.deleteWithSyncUserPoint(userIndex, index)
    res.json({ success: true, result });
  } catch (err) {
    console.error('포인트 갱신 실패:', err);
    res.status(500).json({ success: false, message: '서버 오류' });
  }
};