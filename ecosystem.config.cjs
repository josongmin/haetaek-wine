/**
 * PM2 Ecosystem 설정 파일
 * 
 * 사용법:
 *   pm2 start ecosystem.config.cjs
 *   pm2 reload ecosystem.config.cjs
 *   pm2 stop ecosystem.config.cjs
 */

module.exports = {
  apps: [{
    name: 'admin-api',
    script: './server/index.js',
    
    // 인스턴스 수 (클러스터 모드)
    instances: 'max', // CPU 코어 수만큼 실행
    exec_mode: 'cluster',
    
    // 자동 재시작
    autorestart: true,
    watch: false, // 프로덕션에서는 false 권장
    max_restarts: 10,
    min_uptime: '10s', // 최소 실행 시간 (이것보다 빨리 종료되면 비정상)
    
    // 메모리 제한
    max_memory_restart: '500M',
    
    // 환경 변수
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    
    // 로그 설정
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    
    // 프로세스 ID 파일
    pid_file: './logs/pm2.pid',
    
    // 크론 재시작 (선택사항)
    // cron_restart: '0 3 * * *', // 매일 오전 3시에 재시작
    
    // 로그 로테이션 (pm2-logrotate 모듈 설치 필요)
    // pm2 install pm2-logrotate
    
    // 타임아웃 설정
    kill_timeout: 5000,
    listen_timeout: 3000,
    
    // 소스 맵 지원
    source_map_support: true,
    
    // 인터프리터
    interpreter: 'node',
    interpreter_args: '--max-old-space-size=512'
  }],

  /**
   * 배포 설정 (pm2 deploy 사용시)
   */
  deploy: {
    production: {
      user: 'ubuntu',
      host: ['ec2-xx-xx-xx-xx.compute.amazonaws.com'],
      ref: 'origin/main',
      repo: 'git@github.com:your-org/wine-admin.git',
      path: '/home/ubuntu/wine-admin',
      'post-deploy': 'npm ci && npm run build:client && pm2 reload ecosystem.config.cjs --env production',
      'pre-deploy-local': 'echo "Deploying to production..."',
      'post-deploy-failed': 'echo "Deployment failed" && pm2 logs'
    },
    staging: {
      user: 'ubuntu',
      host: ['staging.example.com'],
      ref: 'origin/develop',
      repo: 'git@github.com:your-org/wine-admin.git',
      path: '/home/ubuntu/wine-admin-staging',
      'post-deploy': 'npm ci && npm run build:client && pm2 reload ecosystem.config.cjs',
      env: {
        NODE_ENV: 'staging'
      }
    }
  }
};


