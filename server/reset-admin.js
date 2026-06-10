/**
 * 重置管理员密码为 admin123
 * 用法: node server/reset-admin.js
 */
const initSqlJs = require('sql.js');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'kiroo.db');

async function main() {
  const SQL = await initSqlJs();
  const buf = fs.existsSync(DB_PATH) ? fs.readFileSync(DB_PATH) : null;
  const db = new SQL.Database(buf);

  const hash = bcrypt.hashSync('admin123', 10);

  // 先查现有 admin
  const existing = db.exec("SELECT id, username FROM admins WHERE username = 'admin'");
  if (existing.length > 0 && existing[0].values.length > 0) {
    db.run("UPDATE admins SET password_hash = ? WHERE username = 'admin'", [hash]);
    console.log('✅ 管理员 admin 密码已重置为 admin123');
  } else {
    db.run("INSERT INTO admins (username, password_hash, role) VALUES (?, ?, ?)", ['admin', hash, 'super_admin']);
    console.log('✅ 已创建默认管理员 admin / admin123');
  }

  fs.writeFileSync(DB_PATH, Buffer.from(db.export()));
  console.log('✅ 数据库已保存');
}

main().catch(err => console.error('❌', err));
