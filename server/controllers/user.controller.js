import * as userDao from '../dao/user.dao.js';


export const getHotDealCountOfUser = async (req, res) => {
  const { userIndex, days } = req.body;

  try {
    const result = await userDao.getHotDealCount(userIndex, days)
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('불러오기 실패:', err);
    res.status(500).json({ success: false, message: '서버 오류' });
  }
};


export const updateUserLevel = async (req, res) => {
  const { userIndex, level } = req.body;

  try {
    const result = await userDao.updateUserLevel(userIndex, level)
    res.json({ success: true, result });
  } catch (err) {
    console.error('레벨 변경 실패:', err);
    res.status(500).json({ success: false, message: '서버 오류' });
  }
};

export const getUserByIndex = async (req, res) => {
  const { userIndex } = req.body;

  if (!userIndex) {
    return res.status(400).json({ success: false, message: 'userIndex is required' });
  }

  try {
    const user = await userDao.getUserByIndex(userIndex);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (err) {
    console.error('유저 조회 실패:', err);
    res.status(500).json({ success: false, message: '서버 오류' });
  }
};