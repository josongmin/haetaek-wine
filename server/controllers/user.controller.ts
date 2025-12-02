import type { Request, Response } from 'express';
import * as userDao from '../dao/user.service.js';

interface GetHotDealCountBody {
  userIndex: string | number;
  days?: number;
}

interface UpdateUserLevelBody {
  userIndex: string | number;
  level: number;
}

interface GetUserByIndexBody {
  userIndex: string | number;
}

export const getHotDealCountOfUser = async (req: Request<{}, {}, GetHotDealCountBody>, res: Response): Promise<void> => {
  const { userIndex, days } = req.body;

  // 입력값 검증
  if (!userIndex) {
    res.status(400).json({ 
      success: false, 
      message: 'userIndex는 필수 항목입니다.' 
    });
    return;
  }

  if (days !== undefined && (typeof days !== 'number' || days < 0)) {
    res.status(400).json({ 
      success: false, 
      message: 'days는 0 이상의 숫자여야 합니다.' 
    });
    return;
  }

  try {
    const result = await userDao.getHotDealCount(userIndex, days);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[getHotDealCountOfUser] 특가 개수 조회 실패:', err);
    res.status(500).json({ 
      success: false, 
      message: '특가 개수를 조회하는데 실패했습니다.',
      error: process.env.NODE_ENV === 'development' ? (err as Error).message : undefined
    });
  }
};

export const updateUserLevel = async (req: Request<{}, {}, UpdateUserLevelBody>, res: Response): Promise<void> => {
  const { userIndex, level } = req.body;

  // 입력값 검증
  if (!userIndex) {
    res.status(400).json({ 
      success: false, 
      message: 'userIndex는 필수 항목입니다.' 
    });
    return;
  }

  if (level === undefined || level === null) {
    res.status(400).json({ 
      success: false, 
      message: 'level은 필수 항목입니다.' 
    });
    return;
  }

  if (typeof level !== 'number' || level < 0) {
    res.status(400).json({ 
      success: false, 
      message: 'level은 0 이상의 숫자여야 합니다.' 
    });
    return;
  }

  try {
    const result = await userDao.updateUserLevel(userIndex, level);
    res.json({ success: true, result });
  } catch (err) {
    console.error('[updateUserLevel] 레벨 변경 실패:', err);
    res.status(500).json({ 
      success: false, 
      message: '레벨을 변경하는데 실패했습니다.',
      error: process.env.NODE_ENV === 'development' ? (err as Error).message : undefined
    });
  }
};

export const getUserByIndex = async (req: Request<{}, {}, GetUserByIndexBody>, res: Response): Promise<void> => {
  const { userIndex } = req.body;

  // 입력값 검증
  if (!userIndex) {
    res.status(400).json({ 
      success: false, 
      message: 'userIndex는 필수 항목입니다.' 
    });
    return;
  }

  try {
    const user = await userDao.getUserByIndex(userIndex);
    if (!user) {
      res.status(404).json({ 
        success: false, 
        message: '사용자를 찾을 수 없습니다.' 
      });
      return;
    }
    res.json({ success: true, data: user });
  } catch (err) {
    console.error('[getUserByIndex] 유저 조회 실패:', err);
    res.status(500).json({ 
      success: false, 
      message: '사용자 정보를 조회하는데 실패했습니다.',
      error: process.env.NODE_ENV === 'development' ? (err as Error).message : undefined
    });
  }
};

