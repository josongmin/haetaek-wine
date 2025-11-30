import { jest } from '@jest/globals';
import * as userController from '../../controllers/user.controller.js';
import * as userDao from '../../dao/user.dao.js';

// Mock DAO
jest.mock('../../dao/user.dao.js');

describe('User Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('getHotDealCountOfUser', () => {
    test('성공 - 유효한 입력', async () => {
      req.body = { userIndex: '123', days: 7 };
      userDao.getHotDealCount.mockResolvedValue(5);

      await userController.getHotDealCountOfUser(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: 5
      });
    });

    test('실패 - userIndex 누락', async () => {
      req.body = { days: 7 };

      await userController.getHotDealCountOfUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'userIndex는 필수 항목입니다.'
      });
    });

    test('실패 - 잘못된 days 타입', async () => {
      req.body = { userIndex: '123', days: 'invalid' };

      await userController.getHotDealCountOfUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'days는 0 이상의 숫자여야 합니다.'
      });
    });

    test('실패 - 음수 days', async () => {
      req.body = { userIndex: '123', days: -1 };

      await userController.getHotDealCountOfUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('실패 - DB 에러', async () => {
      req.body = { userIndex: '123', days: 7 };
      userDao.getHotDealCount.mockRejectedValue(new Error('DB Error'));

      await userController.getHotDealCountOfUser(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: '특가 개수를 조회하는데 실패했습니다.'
        })
      );
    });
  });

  describe('updateUserLevel', () => {
    test('성공 - 레벨 업데이트', async () => {
      req.body = { userIndex: '123', level: 5 };
      userDao.updateUserLevel.mockResolvedValue(1);

      await userController.updateUserLevel(req, res);

      expect(userDao.updateUserLevel).toHaveBeenCalledWith('123', 5);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        result: 1
      });
    });

    test('실패 - level 누락', async () => {
      req.body = { userIndex: '123' };

      await userController.updateUserLevel(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'level은 필수 항목입니다.'
      });
    });

    test('실패 - 음수 level', async () => {
      req.body = { userIndex: '123', level: -1 };

      await userController.updateUserLevel(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'level은 0 이상의 숫자여야 합니다.'
      });
    });
  });

  describe('getUserByIndex', () => {
    test('성공 - 사용자 조회', async () => {
      const mockUser = {
        index: '123',
        id: 'testuser',
        nickname: '테스트',
        level: 1
      };
      req.body = { userIndex: '123' };
      userDao.getUserByIndex.mockResolvedValue(mockUser);

      await userController.getUserByIndex(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockUser
      });
    });

    test('실패 - 사용자 없음', async () => {
      req.body = { userIndex: '999' };
      userDao.getUserByIndex.mockResolvedValue(null);

      await userController.getUserByIndex(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '사용자를 찾을 수 없습니다.'
      });
    });
  });
});


