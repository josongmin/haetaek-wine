// controllers/report.controller.js
import { insertReport, updateReport, deleteReport } from '../dao/report.dao.js';
import { changeReviewStatus } from '../dao/winePrice.dao.js';
import {
  PRICE_STATUS_REJECT
} from '@myorg/shared/constants/winePriceStatusMap'



export const insertPriceReport = async (req, res) => {
  const { reporterIndex, winePriceIndex, reason } = req.body;
  
  // 입력값 검증
  if (!reporterIndex) {
    return res.status(400).json({ 
      success: false, 
      message: 'reporterIndex는 필수 항목입니다.' 
    });
  }

  if (!winePriceIndex) {
    return res.status(400).json({ 
      success: false, 
      message: 'winePriceIndex는 필수 항목입니다.' 
    });
  }

  if (!reason || reason.trim().length === 0) {
    return res.status(400).json({ 
      success: false, 
      message: 'reason은 필수 항목입니다.' 
    });
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
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};
export const updatePriceReport = async (req, res) => {
  const { reportIndex, reason } = req.body;

  // 입력값 검증
  if (!reportIndex) {
    return res.status(400).json({ 
      success: false, 
      message: 'reportIndex는 필수 항목입니다.' 
    });
  }

  if (!reason || reason.trim().length === 0) {
    return res.status(400).json({ 
      success: false, 
      message: 'reason은 필수 항목입니다.' 
    });
  }

  try {
    const result = await updateReport(reportIndex, reason);
    res.json({ success: true, updated: result });
  } catch (err) {
    console.error('[updatePriceReport] 신고 수정 실패:', err);
    res.status(500).json({ 
      success: false, 
      message: '신고를 수정하는데 실패했습니다.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

export const deletePriceReport = async (req, res) => {
  const { reportIndex } = req.body;

  // 입력값 검증
  if (!reportIndex) {
    return res.status(400).json({ 
      success: false, 
      message: 'reportIndex는 필수 항목입니다.' 
    });
  }

  try {
    const result = await deleteReport(reportIndex);
    res.json({ success: true, updated: result });
  } catch (err) {
    console.error('[deletePriceReport] 신고 삭제 실패:', err);
    res.status(500).json({ 
      success: false, 
      message: '신고를 삭제하는데 실패했습니다.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};