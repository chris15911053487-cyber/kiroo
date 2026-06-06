const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: '未登录' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, nickname }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token无效或已过期' });
  }
}

module.exports = authMiddleware;
