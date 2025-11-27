import { jest } from '@jest/globals';
import * as userDao from '../../dao/user.dao.js';
import db from '../../config/db.js';

jest.mock('../../config/db.js');

describe('User DAO', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getHotDealCount', () => {
    test('성공 - days 지정', async () => {
      const mockRows = [{ count: 5 }];
      db.query.mockResolvedValue([mockRows]);

      const result = await userDao.getHotDealCount('123', 7);

      expect(result).toBe(5);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('DATE_SUB'),
        ['123', 7, 1]
      );
    });

    test('성공 - days 없음 (전체 기간)', async () => {
      const mockRows = [{ count: 10 }];
      db.query.mockResolvedValue([mockRows]);

      const result = await userDao.getHotDealCount('123');

      expect(result).toBe(10);
      expect(db.query).toHaveBeenCalledWith(
        expect.not.stringContaining('DATE_SUB'),
        ['123', 1]
      );
    });

    test('성공 - count가 0', async () => {
      db.query.mockResolvedValue([[{ count: 0 }]]);

      const result = await userDao.getHotDealCount('123', 7);

      expect(result).toBe(0);
    });

    test('실패 - DB 에러 발생', async () => {
      db.query.mockRejectedValue(new Error('DB Connection Failed'));

      await expect(userDao.getHotDealCount('123', 7))
        .rejects.toThrow('DB Connection Failed');
    });
  });

  describe('updateUserLevel', () => {
    test('성공 - 레벨 업데이트', async () => {
      db.query.mockResolvedValue([{ affectedRows: 1 }]);

      const result = await userDao.updateUserLevel('123', 5);

      expect(result).toBe(1);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE User'),
        [5, '123']
      );
    });
  });

  describe('getUserByIndex', () => {
    test('성공 - 사용자 조회', async () => {
      const mockUser = {
        USR_index: 123,
        USR_id: 'testuser',
        USR_nickname: '테스트',
        USR_level: 1,
        USR_point: 100
      };
      db.query.mockResolvedValue([[mockUser]]);

      const result = await userDao.getUserByIndex('123');

      expect(result).toMatchObject({
        index: '123',
        id: 'testuser',
        nickname: '테스트',
        level: 1,
        point: 100
      });
    });

    test('성공 - 사용자 없음', async () => {
      db.query.mockResolvedValue([[]]);

      const result = await userDao.getUserByIndex('999');

      expect(result).toBeNull();
    });
  });
});

