// controllers/wineShop.controller.ts
import type { Request, Response } from 'express';
import { getList, getUsedDiscountHistoryList, getCommentHistoryList } from '../dao/wineShop.service.js';

interface GetWineShopListBody {
  searchText?: string;
  status?: number;
  lastRowIndx?: number;
}

interface GetUsedDiscountHistoryListBody {
  shopIndex: number;
}

interface GetCommentHistoryListBody {
  shopIndex: number;
}

const isTrue = (v: any): boolean => v === true || v === 'true';

export const getWineShopList = async (req: Request<{}, {}, GetWineShopListBody>, res: Response): Promise<void> => {
  try {
    const { searchText, status, lastRowIndx } = req.body;

    const data = await getList(searchText, status, lastRowIndx);
    res.json({ success: true, data: data });
  } catch (err) {
    console.error('[getWineShopList] 와인샵 목록 조회 실패:', err);
    res.status(500).json({ 
      success: false, 
      message: '와인샵 목록을 조회하는데 실패했습니다.',
      error: process.env.NODE_ENV === 'development' ? (err as Error).message : undefined
    });
  }
};

export const getUsedDiscountHistoryListOfShop = async (req: Request<{}, {}, GetUsedDiscountHistoryListBody>, res: Response): Promise<void> => {
  const { shopIndex } = req.body;

  // 입력값 검증
  if (!shopIndex) {
    res.status(400).json({ 
      success: false, 
      message: 'shopIndex는 필수 항목입니다.' 
    });
    return;
  }

  try {
    const result = await getUsedDiscountHistoryList(shopIndex);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[getUsedDiscountHistoryListOfShop] 할인 이력 조회 실패:', err);
    res.status(500).json({ 
      success: false, 
      message: '할인 이력을 조회하는데 실패했습니다.',
      error: process.env.NODE_ENV === 'development' ? (err as Error).message : undefined
    });
  }
};

export const getCommentHistoryListOfShop = async (req: Request<{}, {}, GetCommentHistoryListBody>, res: Response): Promise<void> => {
  const { shopIndex } = req.body;

  // 입력값 검증
  if (!shopIndex) {
    res.status(400).json({ 
      success: false, 
      message: 'shopIndex는 필수 항목입니다.' 
    });
    return;
  }

  try {
    const result = await getCommentHistoryList(shopIndex);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[getCommentHistoryListOfShop] 코멘트 이력 조회 실패:', err);
    res.status(500).json({ 
      success: false, 
      message: '코멘트 이력을 조회하는데 실패했습니다.',
      error: process.env.NODE_ENV === 'development' ? (err as Error).message : undefined
    });
  }
};

