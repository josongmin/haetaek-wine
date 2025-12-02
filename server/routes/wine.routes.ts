// routes/wine.routes.ts
import express from 'express';
import { getWinePriceList, changePhotoStatus, updateWineStatus, updateWineStatusToIncompleteIfNotPass } from '../controllers/wine.controller.js';
import { updatePriceStatus, updatePriceWriter, setShowInSpecialPricePageOfPrice, setShowInWineDetailPageOfPrice, setStockCountOfPrice, setNeededPointForShowOfPrice, setHasReceiptOfPrice, deletePriceWithRelatedData} from '../controllers/wine.controller.js';
import { insertPriceReport, updatePriceReport, deletePriceReport } from '../controllers/report.controller.js';
import { searchWines, searchRegion, addWine, updateWine, getWineObject, mergeWines, addPrice, updatePrice } from '../controllers/wine-proxy.controller.js';

const router = express.Router();

// Proxy routes (프로덕션 서버로 전달)
router.post('/search', searchWines);
router.post('/searchRegion', searchRegion);
router.post('/add', addWine);
router.post('/update', updateWine);
router.post('/object', getWineObject);
router.post('/merge', mergeWines);
router.post('/addPrice', addPrice);
router.post('/price/update', updatePrice);

// Local routes (로컬 서버에서 처리)
router.get('/priceList', getWinePriceList);
router.post('/priceList', getWinePriceList);

router.post('/changePhotoStatus', changePhotoStatus);
router.post('/status/update', updateWineStatus);
router.post('/status/updateToIncompleteIfNotPass', updateWineStatusToIncompleteIfNotPass);
router.post('/price/changeStatus', updatePriceStatus);
router.post('/price/changeWriter', updatePriceWriter);

router.post('/price/report/insert', insertPriceReport);
router.post('/price/report/update', updatePriceReport);
router.post('/price/report/delete', deletePriceReport);
//router.post('/price/update', updatePrice);
router.post('/price/setShowInSpecialPricePage', setShowInSpecialPricePageOfPrice);
router.post('/price/setShowInWineDetailPage', setShowInWineDetailPageOfPrice);
router.post('/price/setStockCountOfPrice', setStockCountOfPrice);
router.post('/price/setNeededPointForShowOfPrice', setNeededPointForShowOfPrice);
router.post('/price/setHasReceiptOfPrice', setHasReceiptOfPrice);
router.post('/price/deletePriceWithRelatedData', deletePriceWithRelatedData);

export default router;

