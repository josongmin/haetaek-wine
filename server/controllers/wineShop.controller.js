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

    const result = await getUsedDiscountHistoryList(shopIndex);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('getUsedDiscountHistoryListOfShop error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getCommentHistoryListOfShop = async (req, res) => {
  try {
    const { shopIndex } = req.body;

    const result = await getCommentHistoryList(shopIndex);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('getCommentHistoryListOfShop error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};