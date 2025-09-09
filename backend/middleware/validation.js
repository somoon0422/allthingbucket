// 🔥 SMS 요청 유효성 검사 미들웨어
function validateSMSRequest(req, res, next) {
  const { to, message, from } = req.body;
  
  // 🔥 필수 필드 검증
  if (!to) {
    return res.status(400).json({
      success: false,
      error: '수신자 번호(to)는 필수입니다'
    });
  }
  
  if (!message) {
    return res.status(400).json({
      success: false,
      error: '메시지 내용(message)은 필수입니다'
    });
  }
  
  // 🔥 전화번호 형식 검증
  const cleanTo = to.replace(/-/g, '');
  if (!/^010\d{8}$/.test(cleanTo)) {
    return res.status(400).json({
      success: false,
      error: '올바른 휴대폰 번호 형식이 아닙니다. (010-1234-5678)'
    });
  }
  
  // 🔥 메시지 길이 검증
  if (message.length > 2000) {
    return res.status(400).json({
      success: false,
      error: '메시지는 2000자를 초과할 수 없습니다'
    });
  }
  
  // 🔥 발신번호 형식 검증 (선택사항)
  if (from) {
    const cleanFrom = from.replace(/-/g, '');
    if (!/^0\d{9,10}$/.test(cleanFrom)) {
      return res.status(400).json({
        success: false,
        error: '올바른 발신번호 형식이 아닙니다'
      });
    }
  }
  
  // 🔥 요청 데이터 정리
  req.body = {
    to: cleanTo,
    message: message.trim(),
    from: from ? from.replace(/-/g, '') : undefined
  };
  
  next();
}

module.exports = {
  validateSMSRequest
};
