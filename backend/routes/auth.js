const express = require('express');
const axios = require('axios');
const router = express.Router();

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

    // 실제로는 데이터베이스에서 사용자를 찾거나 생성해야 합니다
    // 여기서는 간단한 응답을 반환합니다
    const user = {
      user_id: `google_${id}`,
      email: email,
      name: name,
      google_id: id,
      profile_image: picture,
      is_verified: verified_email,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // JWT 토큰 생성 (실제로는 jwt 라이브러리를 사용해야 합니다)
    const token = `google_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    res.json({
      user,
      token
    });
  } catch (error) {
    console.error('Google 로그인 처리 실패:', error);
    res.status(500).json({ error: '로그인 처리에 실패했습니다' });
  }
});

module.exports = router;
