// controllers/report.controller.js
import { insertReport, updateReport, deleteReport } from '../dao/report.dao.js';
import { changeReviewStatus } from '../dao/winePrice.dao.js';
import {
  PRICE_STATUS_REJECT
} from '@myorg/shared/constants/winePriceStatusMap'



export const insertPriceReport = async (req, res) => {
  const { reporterIndex, winePriceIndex, reason } = req.body;
  console.log('[insertPriceReport] req.body >', req.body);
  try {    
    const result1 = await changeReviewStatus(PRICE_STATUS_REJECT, winePriceIndex);

    const newReportId = await insertReport(reporterIndex, 0, winePriceIndex, reason)
    res.json({ success: true, newIndex: newReportId });
  } catch (err) {
    res.status(500).json({ success: false, message: '등록 실패' });
  }
};
export const updatePriceReport = async (req, res) => {
  const { reportIndex, reason } = req.body;
  try {
    const result = await updateReport(reportIndex, reason)
    res.json({ success: true, updated: result });
  } catch (err) {
    res.status(500).json({ success: false, message: '업데이트 실패' });
  }
};

export const deletePriceReport = async (req, res) => {
  const { reportIndex } = req.body;
  try {
    const result = await deleteReport(reportIndex)
    res.json({ success: true, updated: result });
  } catch (err) {
    res.status(500).json({ success: false, message: '삭제 실패' });
  }
};