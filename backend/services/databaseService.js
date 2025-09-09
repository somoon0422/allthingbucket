const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class DatabaseService {
  constructor() {
    this.db = null;
    // 메모리 기반 SQLite 사용 (파일 권한 문제 해결)
    this.dbPath = ':memory:';
  }

  // 데이터베이스 연결
  async connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('❌ SQLite 연결 실패:', err);
          reject(err);
        } else {
          console.log('✅ SQLite 데이터베이스 연결 성공');
          this.initializeTables();
          resolve();
        }
      });
    });
  }

  // 테이블 초기화
  async initializeTables() {
    const createTables = `
      -- 사용자 프로필 테이블
      CREATE TABLE IF NOT EXISTS user_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        _id TEXT UNIQUE NOT NULL,
        user_id TEXT UNIQUE NOT NULL,
        signup_code TEXT,
        name TEXT,
        email TEXT UNIQUE,
        phone TEXT,
        address TEXT,
        birth_date TEXT,
        naver_id TEXT,
        instagram_id TEXT,
        youtube_channel TEXT,
        blog_url TEXT,
        other_sns TEXT,
        bank_name TEXT,
        account_number TEXT,
        account_holder TEXT,
        tax_resident_number TEXT,
        total_points_earned INTEGER DEFAULT 0,
        total_points_withdrawn INTEGER DEFAULT 0,
        current_balance INTEGER DEFAULT 0,
        experience_count INTEGER DEFAULT 0,
        is_verified BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- 사용자 테이블
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        _id TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        role TEXT DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- 관리자 테이블
      CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        _id TEXT UNIQUE NOT NULL,
        admin_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT,
        role TEXT DEFAULT 'admin',
        permissions TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- 체험단 캠페인 테이블
      CREATE TABLE IF NOT EXISTS experience_campaigns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        _id TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        type TEXT,
        status TEXT DEFAULT 'active',
        max_participants INTEGER,
        current_participants INTEGER DEFAULT 0,
        start_date DATETIME,
        end_date DATETIME,
        requirements TEXT,
        rewards TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- 사용자 신청 테이블
      CREATE TABLE IF NOT EXISTS user_applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        _id TEXT UNIQUE NOT NULL,
        user_id TEXT NOT NULL,
        campaign_id TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        application_data TEXT,
        shipping_address TEXT,
        contact_info TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- 리뷰 제출 테이블
      CREATE TABLE IF NOT EXISTS review_submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        _id TEXT UNIQUE NOT NULL,
        user_id TEXT NOT NULL,
        campaign_id TEXT NOT NULL,
        application_id TEXT NOT NULL,
        rating INTEGER,
        review_text TEXT,
        images TEXT,
        status TEXT DEFAULT 'pending',
        points_awarded INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- 포인트 내역 테이블
      CREATE TABLE IF NOT EXISTS points_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        _id TEXT UNIQUE NOT NULL,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        amount INTEGER NOT NULL,
        description TEXT,
        reference_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- 출금 요청 테이블
      CREATE TABLE IF NOT EXISTS withdrawal_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        _id TEXT UNIQUE NOT NULL,
        user_id TEXT NOT NULL,
        amount INTEGER NOT NULL,
        tax_amount INTEGER DEFAULT 0,
        net_amount INTEGER NOT NULL,
        bank_name TEXT,
        account_number TEXT,
        account_holder TEXT,
        status TEXT DEFAULT 'pending',
        processed_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- 알림 테이블
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        _id TEXT UNIQUE NOT NULL,
        user_id TEXT,
        admin_id TEXT,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- 체험단 코드 테이블
      CREATE TABLE IF NOT EXISTS experience_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        _id TEXT UNIQUE NOT NULL,
        code TEXT UNIQUE NOT NULL,
        campaign_id TEXT,
        is_used BOOLEAN DEFAULT 0,
        used_by TEXT,
        used_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- 사용자 코드 테이블
      CREATE TABLE IF NOT EXISTS user_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        _id TEXT UNIQUE NOT NULL,
        code TEXT UNIQUE NOT NULL,
        user_id TEXT,
        is_used BOOLEAN DEFAULT 0,
        used_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `;

    return new Promise((resolve, reject) => {
      this.db.exec(createTables, (err) => {
        if (err) {
          console.error('❌ 테이블 생성 실패:', err);
          reject(err);
        } else {
          console.log('✅ 테이블 초기화 완료');
          this.insertTestData();
          resolve();
        }
      });
    });
  }

  // 테스트 데이터 삽입
  async insertTestData() {
    const testUsers = [
      {
        _id: 'user_1',
        user_id: 'user_1',
        signup_code: 'TEST001',
        name: '테스트 사용자 1',
        email: 'test1@example.com',
        phone: '010-1234-5678',
        address: '서울시 강남구'
      },
      {
        _id: 'user_2',
        user_id: 'user_2',
        signup_code: 'TEST002',
        name: '테스트 사용자 2',
        email: 'test2@example.com',
        phone: '010-2345-6789',
        address: '서울시 서초구'
      },
      {
        _id: 'user_3',
        user_id: 'user_3',
        signup_code: 'TEST003',
        name: '테스트 사용자 3',
        email: 'test3@example.com',
        phone: '010-3456-7890',
        address: '서울시 송파구'
      },
      {
        _id: 'user_4',
        user_id: 'user_4',
        signup_code: 'TEST004',
        name: '테스트 사용자 4',
        email: 'test4@example.com',
        phone: '010-4567-8901',
        address: '서울시 마포구'
      },
      {
        _id: 'user_5',
        user_id: 'user_5',
        signup_code: 'TEST005',
        name: '테스트 사용자 5',
        email: 'test5@example.com',
        phone: '010-5678-9012',
        address: '서울시 영등포구'
      },
      {
        _id: 'user_6',
        user_id: 'user_6',
        signup_code: 'TEST006',
        name: '테스트 사용자 6',
        email: 'test6@example.com',
        phone: '010-6789-0123',
        address: '서울시 종로구'
      }
    ];

    for (const user of testUsers) {
      await this.insertUserProfile(user);
    }
  }

  // 사용자 프로필 삽입
  async insertUserProfile(userData) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT OR IGNORE INTO user_profiles 
        (_id, user_id, signup_code, name, email, phone, address)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      
      this.db.run(sql, [
        userData._id,
        userData.user_id,
        userData.signup_code,
        userData.name,
        userData.email,
        userData.phone,
        userData.address
      ], function(err) {
        if (err) {
          console.error('사용자 삽입 실패:', err);
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });
  }

  // 사용자 프로필 목록 조회
  async getUserProfiles(options = {}) {
    return new Promise((resolve, reject) => {
      let sql = 'SELECT * FROM user_profiles';
      const params = [];

      if (options.filter && options.filter.user_id) {
        sql += ' WHERE user_id = ?';
        params.push(options.filter.user_id);
      }

      if (options.limit) {
        sql += ' LIMIT ?';
        params.push(options.limit);
      }

      this.db.all(sql, params, (err, rows) => {
        if (err) {
          console.error('사용자 목록 조회 실패:', err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // 사용자 프로필 조회
  async getUserProfile(id) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM user_profiles WHERE _id = ?';
      
      this.db.get(sql, [id], (err, row) => {
        if (err) {
          console.error('사용자 조회 실패:', err);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // 사용자 프로필 삭제
  async deleteUserProfile(id) {
    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM user_profiles WHERE _id = ?';
      
      this.db.run(sql, [id], function(err) {
        if (err) {
          console.error('사용자 삭제 실패:', err);
          reject(err);
        } else {
          resolve({ success: true, deletedRows: this.changes });
        }
      });
    });
  }

  // 데이터베이스 연결 종료
  async close() {
    return new Promise((resolve) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            console.error('❌ 데이터베이스 연결 종료 실패:', err);
          } else {
            console.log('✅ 데이터베이스 연결 종료');
          }
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

module.exports = new DatabaseService();
