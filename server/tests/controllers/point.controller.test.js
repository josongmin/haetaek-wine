import { jest } from '@jest/globals';
import * as pointController from '../../controllers/point.controller.js';
import * as pointDao from '../../dao/point.dao.js';

jest.mock('../../dao/point.dao.js');

describe('Point Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('insertPointForWritePrice', () => {
    test('성공 - 포인트 추가', async () => {
      req.body = {
        itemIndex: '456',
        userIndex: '123',
        point: 100,
        reason: '가격 등록'
      };
      pointDao.insertWithUpdateUserPoint.mockResolvedValue(789);

      await pointController.insertPointForWritePrice(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        newIndex: 789
      });
    });

    test('실패 - itemIndex 누락', async () => {
      req.body = { userIndex: '123', point: 100 };

      await pointController.insertPointForWritePrice(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('실패 - point가 숫자가 아님', async () => {
      req.body = {
        itemIndex: '456',
        userIndex: '123',
        point: 'invalid'
      };

      await pointController.insertPointForWritePrice(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'point는 숫자여야 합니다.'
      });
    });
  });

  describe('updatePointForWritePrice', () => {
    test('성공 - 포인트 수정', async () => {
      req.body = {
        userIndex: '123',
        index: '789',
        point: 150,
        reason: '수정'
      };
      pointDao.updateWithSyncUserPoint.mockResolvedValue(1);

      await pointController.updatePointForWritePrice(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        result: 1
      });
    });

    test('실패 - index 누락', async () => {
      req.body = { userIndex: '123', point: 150 };

      await pointController.updatePointForWritePrice(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('deletePointHistoryWithSyncUserPoint', () => {
    test('성공 - 포인트 삭제', async () => {
      req.body = { userIndex: '123', index: '789' };
      pointDao.deleteWithSyncUserPoint.mockResolvedValue(1);

      await pointController.deletePointHistoryWithSyncUserPoint(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        result: 1
      });
    });

    test('실패 - userIndex와 index 모두 누락', async () => {
      req.body = {};

      await pointController.deletePointHistoryWithSyncUserPoint(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});


