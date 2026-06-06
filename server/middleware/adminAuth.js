const jwt = require('jsonwebtoken');

function adminAuthMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: '未登录' });

  try {
    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
    req.admin = decoded; // { id, username, role }
    next();
  } catch (err) {
    return res.status(401).json({ error: '管理员Token无效或已过期' });
  }
}

module.exports = adminAuthMiddleware;
