// controllers/report.controller.ts
import type { Request, Response } from 'express';
import { insertReport, updateReport, deleteReport } from '../dao/report.service.js';
import { changeReviewStatus } from '../dao/winePrice.service.js';
import {
  PRICE_STATUS_REJECT
} from '@myorg/shared/constants/winePriceStatusMap';

interface InsertPriceReportBody {
  reporterIndex: number;
  winePriceIndex: number;
  reason: string;
}

interface UpdatePriceReportBody {
  reportIndex: number;
  reason: string;
}

interface DeletePriceReportBody {
  reportIndex: number;
}

export const insertPriceReport = async (req: Request<{}, {}, InsertPriceReportBody>, res: Response): Promise<void> => {
  const { reporterIndex, winePriceIndex, reason } = req.body;
  
  // 입력값 검증
  if (!reporterIndex) {
    res.status(400).json({ 
      success: false, 
      message: 'reporterIndex는 필수 항목입니다.' 
    });
    return;
  }

  if (!winePriceIndex) {
    res.status(400).json({ 
      success: false, 
      message: 'winePriceIndex는 필수 항목입니다.' 
    });
    return;
  }

  if (!reason || reason.trim().length === 0) {
    res.status(400).json({ 
      success: false, 
      message: 'reason은 필수 항목입니다.' 
    });
    return;
  }

  console.log('[insertPriceReport] req.body >', req.body);
  try {    
    await changeReviewStatus(PRICE_STATUS_REJECT, winePriceIndex);
    const newReportId = await insertReport(reporterIndex, 0, winePriceIndex, reason);
    res.json({ success: true, newIndex: newReportId });
  } catch (err) {
    console.error('[insertPriceReport] 신고 등록 실패:', err);
    res.status(500).json({ 
      success: false, 
      message: '신고를 등록하는데 실패했습니다.',
      error: process.env.NODE_ENV === 'development' ? (err as Error).message : undefined
    });
  }
};

export const updatePriceReport = async (req: Request<{}, {}, UpdatePriceReportBody>, res: Response): Promise<void> => {
  const { reportIndex, reason } = req.body;

  // 입력값 검증
  if (!reportIndex) {
    res.status(400).json({ 
      success: false, 
      message: 'reportIndex는 필수 항목입니다.' 
    });
    return;
  }

  if (!reason || reason.trim().length === 0) {
    res.status(400).json({ 
      success: false, 
      message: 'reason은 필수 항목입니다.' 
    });
    return;
  }

  try {
    const result = await updateReport(reportIndex, reason);
    res.json({ success: true, updated: result });
  } catch (err) {
    console.error('[updatePriceReport] 신고 수정 실패:', err);
    res.status(500).json({ 
      success: false, 
      message: '신고를 수정하는데 실패했습니다.',
      error: process.env.NODE_ENV === 'development' ? (err as Error).message : undefined
    });
  }
};

export const deletePriceReport = async (req: Request<{}, {}, DeletePriceReportBody>, res: Response): Promise<void> => {
  const { reportIndex } = req.body;

  // 입력값 검증
  if (!reportIndex) {
    res.status(400).json({ 
      success: false, 
      message: 'reportIndex는 필수 항목입니다.' 
    });
    return;
  }

  try {
    const result = await deleteReport(reportIndex);
    res.json({ success: true, updated: result });
  } catch (err) {
    console.error('[deletePriceReport] 신고 삭제 실패:', err);
    res.status(500).json({ 
      success: false, 
      message: '신고를 삭제하는데 실패했습니다.',
      error: process.env.NODE_ENV === 'development' ? (err as Error).message : undefined
    });
  }
};

