import type { Request, Response } from 'express';
import * as pointDao from '../dao/point.service.js';
import moment from 'moment';
import { TYPE_INDEX_WRITE_PRICE } from '@myorg/shared/constants/pointTypes';

interface InsertPointBody {
  itemIndex: number;
  userIndex: number;
  point: number;
  reason?: string;
}

interface UpdatePointBody {
  userIndex: number;
  index: number;
  point: number;
  reason?: string;
}

interface DeletePointBody {
  userIndex: number;
  index: number;
}

export const insertPointForWritePrice = async (req: Request<{}, {}, InsertPointBody>, res: Response): Promise<void> => {
  const { itemIndex, userIndex, point, reason } = req.body;

  // 입력값 검증
  if (!itemIndex) {
    res.status(400).json({ 
      success: false, 
      message: 'itemIndex는 필수 항목입니다.' 
    });
    return;
  }

  if (!userIndex) {
    res.status(400).json({ 
      success: false, 
      message: 'userIndex는 필수 항목입니다.' 
    });
    return;
  }

  if (point === undefined || point === null) {
    res.status(400).json({ 
      success: false, 
      message: 'point는 필수 항목입니다.' 
    });
    return;
  }

  if (typeof point !== 'number') {
    res.status(400).json({ 
      success: false, 
      message: 'point는 숫자여야 합니다.' 
    });
    return;
  }

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
    console.error('[insertPointForWritePrice] 포인트 저장 실패:', err);
    res.status(500).json({ 
      success: false, 
      message: '포인트를 저장하는데 실패했습니다.',
      error: process.env.NODE_ENV === 'development' ? (err as Error).message : undefined
    });
  }
};

export const updatePointForWritePrice = async (req: Request<{}, {}, UpdatePointBody>, res: Response): Promise<void> => {
  const { userIndex, index, point, reason } = req.body;

  // 입력값 검증
  if (!userIndex) {
    res.status(400).json({ 
      success: false, 
      message: 'userIndex는 필수 항목입니다.' 
    });
    return;
  }

  if (!index) {
    res.status(400).json({ 
      success: false, 
      message: 'index는 필수 항목입니다.' 
    });
    return;
  }

  if (point === undefined || point === null) {
    res.status(400).json({ 
      success: false, 
      message: 'point는 필수 항목입니다.' 
    });
    return;
  }

  if (typeof point !== 'number') {
    res.status(400).json({ 
      success: false, 
      message: 'point는 숫자여야 합니다.' 
    });
    return;
  }

  try {
    const result = await pointDao.updateWithSyncUserPoint(userIndex, index, point, reason);
    res.json({ success: true, result });
  } catch (err) {
    console.error('[updatePointForWritePrice] 포인트 갱신 실패:', err);
    res.status(500).json({ 
      success: false, 
      message: '포인트를 갱신하는데 실패했습니다.',
      error: process.env.NODE_ENV === 'development' ? (err as Error).message : undefined
    });
  }
};

export const deletePointHistoryWithSyncUserPoint = async (req: Request<{}, {}, DeletePointBody>, res: Response): Promise<void> => {
  const { userIndex, index } = req.body;

  // 입력값 검증
  if (!userIndex) {
    res.status(400).json({ 
      success: false, 
      message: 'userIndex는 필수 항목입니다.' 
    });
    return;
  }

  if (!index) {
    res.status(400).json({ 
      success: false, 
      message: 'index는 필수 항목입니다.' 
    });
    return;
  }

  try {
    const result = await pointDao.deleteWithSyncUserPoint(userIndex, index);
    res.json({ success: true, result });
  } catch (err) {
    console.error('[deletePointHistoryWithSyncUserPoint] 포인트 삭제 실패:', err);
    res.status(500).json({ 
      success: false, 
      message: '포인트를 삭제하는데 실패했습니다.',
      error: process.env.NODE_ENV === 'development' ? (err as Error).message : undefined
    });
  }
};

