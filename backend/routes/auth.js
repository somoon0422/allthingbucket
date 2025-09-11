const express = require('express');
const axios = require('axios');
const router = express.Router();
const supabaseService = require('../services/supabaseService');

// 어드민 로그인 API
router.post('/admin/login', async (req, res) => {
  try {
    console.log('🔐 어드민 로그인 요청:', req.body);
    
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: '관리자명과 비밀번호를 입력해주세요'
      });
    }
    
    // Supabase에서 관리자 인증
    const admin = await supabaseService.loginAdmin(username, password);
    
    if (admin) {
      console.log('✅ 어드민 로그인 성공:', admin.username);
      
      res.json({
        success: true,
        admin: {
          id: admin.id,
          username: admin.username,
          email: admin.email || '',
          role: admin.role || 'admin',
          is_active: admin.is_active !== false
        },
        message: '관리자 로그인 성공'
      });
    } else {
      console.log('❌ 어드민 로그인 실패: 잘못된 인증 정보');
      
      res.status(401).json({
        success: false,
        error: '관리자명 또는 비밀번호가 올바르지 않습니다'
      });
    }
  } catch (error) {
    console.error('❌ 어드민 로그인 API 오류:', error);
    
    res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다'
    });
  }
});

// Google OAuth 토큰 교환
router.post('/google/token', async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: '인증 코드가 필요합니다' });
    }

    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: process.env.GOOGLE_CLIENT_ID || '355223292883-jvr1fs5a9ra8bcbg0q6hnhamjqcd58k1.apps.googleusercontent.com',
      client_secret: process.env.GOOGLE_CLIENT_SECRET || 'GOCSPX-your-secret-here',
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: 'http://localhost:5173/auth/google/callback'
    });

    const { access_token, refresh_token, expires_in } = tokenResponse.data;
    
    res.json({
      access_token,
      refresh_token,
      expires_in
    });
  } catch (error) {
    console.error('Google 토큰 교환 실패:', error.response?.data || error.message);
    res.status(500).json({ error: '토큰 교환에 실패했습니다' });
  }
});

// Google 사용자 정보로 로그인 처리
router.post('/google/login', async (req, res) => {
  try {
    const { id, email, name, picture, verified_email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: '이메일이 필요합니다' });
    }

    // Supabase에서 사용자 찾기 또는 생성
    let user = await supabaseService.getUser(`google_${id}`);
    
    if (!user) {
      // 새 사용자 생성
      const userData = {
        id: `google_${id}`,
        email: email,
        name: name,
        google_id: id,
        profile_image_url: picture,
        is_active: true
      };
      
      user = await supabaseService.createUser(userData);
    }

    // JWT 토큰 생성 (실제로는 jwt 라이브러리를 사용해야 합니다)
    const token = `supabase_google_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    res.json({
      user,
      token,
      message: 'Supabase Google 로그인 성공'
    });
  } catch (error) {
    console.error('Supabase Google 로그인 처리 실패:', error);
    res.status(500).json({ error: '로그인 처리에 실패했습니다' });
  }
});

// 카카오 OAuth 토큰 교환
router.post('/kakao/token', async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: '인증 코드가 필요합니다' });
    }

    const tokenResponse = await axios.post('https://kauth.kakao.com/oauth/token', {
      grant_type: 'authorization_code',
      client_id: process.env.KAKAO_CLIENT_ID || 'your-kakao-client-id',
      client_secret: process.env.KAKAO_CLIENT_SECRET || 'your-kakao-client-secret',
      code: code,
      redirect_uri: `${process.env.FRONTEND_URL || 'https://allthingbucket.com'}/auth/kakao/callback`
    }, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const { access_token, refresh_token, expires_in } = tokenResponse.data;
    
    res.json({
      access_token,
      refresh_token,
      expires_in
    });
  } catch (error) {
    console.error('카카오 토큰 교환 실패:', error.response?.data || error.message);
    res.status(500).json({ error: '토큰 교환에 실패했습니다' });
  }
});

// 카카오 사용자 정보로 로그인 처리
router.post('/kakao/login', async (req, res) => {
  try {
    const { id, email, name, profile_image, verified_email } = req.body;
    
    if (!id) {
      return res.status(400).json({ error: '카카오 ID가 필요합니다' });
    }

    // Supabase에서 사용자 찾기 또는 생성
    let user = await supabaseService.getUser(`kakao_${id}`);
    
    if (!user) {
      // 새 사용자 생성
      const userData = {
        id: `kakao_${id}`,
        email: email || `kakao_${id}@kakao.com`,
        name: name || '카카오 사용자',
        google_id: null,
        profile_image_url: profile_image,
        is_active: true
      };
      
      user = await supabaseService.createUser(userData);
    }

    // JWT 토큰 생성 (실제로는 jwt 라이브러리를 사용해야 합니다)
    const token = `supabase_kakao_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    res.json({
      user,
      token,
      message: 'Supabase 카카오 로그인 성공'
    });
  } catch (error) {
    console.error('Supabase 카카오 로그인 처리 실패:', error);
    res.status(500).json({ error: '로그인 처리에 실패했습니다' });
  }
});

// 관리자 로그인
router.post('/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: '사용자명과 비밀번호가 필요합니다' });
    }

    console.log('🔐 Supabase 관리자 로그인 시도:', username);

    const admin = await supabaseService.loginAdmin(username, password);
    
    if (!admin) {
      return res.status(401).json({ error: '존재하지 않는 관리자입니다' });
    }

    // JWT 토큰 생성 (실제로는 jwt 라이브러리를 사용해야 합니다)
    const token = `supabase_admin_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    res.json({
      success: true,
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        last_login: admin.last_login
      },
      token,
      message: 'Supabase 관리자 로그인 성공'
    });
  } catch (error) {
    console.error('Supabase 관리자 로그인 실패:', error);
    res.status(500).json({ error: '로그인에 실패했습니다' });
  }
});

// 사용자 로그인 (이메일/비밀번호)
router.post('/user/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        error: '이메일과 비밀번호가 필요합니다' 
      });
    }

    console.log('👤 사용자 로그인 시도:', email);

    // Supabase에서 사용자 찾기
    const users = await supabaseService.getUsers({ email });
    
    if (!users || users.length === 0) {
      return res.status(401).json({
        success: false,
        error: '존재하지 않는 사용자입니다'
      });
    }

    const user = users[0];

    // 비밀번호 검증 (간단한 비교 - 실제로는 해시 비교 필요)
    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        error: '비밀번호가 올바르지 않습니다'
      });
    }

    // 로그인 시간 업데이트
    await supabaseService.updateUser(user.id, {
      last_login: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    // 토큰 생성 (간단한 토큰)
    const token = `user_token_${Date.now()}_${user.id}`;

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: 'user',
          created_at: user.created_at,
          last_login: new Date().toISOString()
        },
        token
      },
      message: '사용자 로그인 성공'
    });

  } catch (error) {
    console.error('❌ 사용자 로그인 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
