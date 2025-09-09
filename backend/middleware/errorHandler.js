// 🔥 전역 에러 핸들러
function errorHandler(err, req, res, next) {
  console.error('🚨 에러 발생:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // 🔥 기본 에러 응답
  let statusCode = 500;
  let message = '서버 내부 오류가 발생했습니다';

  // 🔥 특정 에러 타입별 처리
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = '요청 데이터가 올바르지 않습니다';
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    message = '인증이 필요합니다';
  } else if (err.name === 'ForbiddenError') {
    statusCode = 403;
    message = '접근 권한이 없습니다';
  } else if (err.name === 'NotFoundError') {
    statusCode = 404;
    message = '요청한 리소스를 찾을 수 없습니다';
  } else if (err.code === 'ECONNREFUSED') {
    statusCode = 503;
    message = '외부 서비스에 연결할 수 없습니다';
  } else if (err.code === 'ETIMEDOUT') {
    statusCode = 504;
    message = '요청 시간이 초과되었습니다';
  }

  // 🔥 개발 환경에서는 상세 에러 정보 포함
  const errorResponse = {
    success: false,
    error: message,
    timestamp: new Date().toISOString()
  };

  if (process.env.NODE_ENV === 'development') {
    errorResponse.details = {
      message: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method
    };
  }

  res.status(statusCode).json(errorResponse);
}

// 🔥 404 에러 핸들러
function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: '요청한 API 엔드포인트를 찾을 수 없습니다',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
}

module.exports = {
  errorHandler,
  notFoundHandler
};
