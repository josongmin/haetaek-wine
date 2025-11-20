import mysql from 'mysql2/promise';

const testConnection = async () => {
  console.log('DB 연결 테스트 시작...');
  console.log('Host:', 'pickinsteadkoreadev.cgsijxqbblpp.ap-northeast-2.rds.amazonaws.com');
  console.log('Port:', 3306);
  console.log('Database:', 'wineasy');
  console.log('User:', 'pdmin');
  console.log('-----------------------------------');

  try {
    const connection = await mysql.createConnection({
      host: 'pickinsteadkoreadev.cgsijxqbblpp.ap-northeast-2.rds.amazonaws.com',
      port: 3306,
      user: 'pdmin',
      password: 'vlzlstmxlem2',
      database: 'wineasy',
      connectTimeout: 10000,
    });

    console.log('✅ DB 연결 성공!');

    const [rows] = await connection.query('SELECT 1 AS test, NOW() AS current_time, DATABASE() AS db_name');
    console.log('✅ 쿼리 실행 성공:');
    console.log(rows[0]);

    await connection.end();
    console.log('✅ 연결 종료 완료');
    process.exit(0);
  } catch (error) {
    console.error('❌ DB 연결 실패:');
    console.error('Error Code:', error.code);
    console.error('Error Message:', error.message);
    console.error('Full Error:', error);
    process.exit(1);
  }
};

testConnection();

