// controllers/wineShop.controller.js
import { getList, getUsedDiscountHistoryList, getCommentHistoryList } from '../dao/wineShop.dao.js';


const isTrue = v => v === true || v === 'true';

export const getWineShopList = async (req, res) => {
  try {
    console.error('getWineShopList:', req);
    const { searchText, status, lastRowIndx } = req.body;

    const data = await getList(searchText, status, lastRowIndx);
    res.json({ success: true, data: data });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getUsedDiscountHistoryListOfShop = async (req, res) => {
  try {
    const { shopIndex } = req.body;

    // if (!accessToken || !accessToken.includes('1234qwer')) {
    //   return res.status(403).json({ success: false, message: 'Access denied' });
    // }

    const result = await getUsedDiscountHistoryList(shopIndex);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('changePhotoStatus error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updatePriceStatus = async (req, res) => {
  const { status, winePriceIndex, point } = req.body;
  try {
    const result = await changeReviewStatus(status, winePriceIndex, point);
    res.json({ success: true, updated: result });
  } catch (err) {
    res.status(500).json({ success: false, message: '업데이트 실패' });
  }
};

export const getCommentHistoryListOfShop = async (req, res) => {
  try {
    const { shopIndex } = req.body;

    // if (!accessToken || !accessToken.includes('1234qwer')) {
    //   return res.status(403).json({ success: false, message: 'Access denied' });
    // }

    const result = await getCommentHistoryList(shopIndex);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('getCommentHistoryListOfShop error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};