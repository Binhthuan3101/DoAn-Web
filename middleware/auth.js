const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      data: null,
      message: 'Bạn cần đăng nhập',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { userId, email, fullName }
    next();
  } catch (err) {
    return res.status(403).json({
      success: false,
      data: null,
      message: 'Token không hợp lệ hoặc đã hết hạn',
    });
  }
};

module.exports = { authenticateToken };