CREATE DATABASE IF NOT EXISTS kiroo_assessment DEFAULT CHARSET utf8mb4;
USE kiroo_assessment;

-- ========================================
-- 基础表（无外键依赖）
-- ========================================

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nickname VARCHAR(50) NOT NULL DEFAULT '测评用户',
  avatar VARCHAR(500) DEFAULT NULL,
  phone VARCHAR(20) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 管理员表
CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(200) NOT NULL,
  role ENUM('super_admin', 'viewer') DEFAULT 'viewer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================================
-- 认证相关表
-- ========================================

-- 用户认证方式表（支持多种登录方式绑定在一个账号）
CREATE TABLE IF NOT EXISTS user_auth_methods (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  auth_type ENUM('phone', 'password') NOT NULL,
  identifier VARCHAR(200) NOT NULL,
  credential VARCHAR(500) DEFAULT NULL,
  bound_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uk_auth (auth_type, identifier)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 短信验证码表
CREATE TABLE IF NOT EXISTS sms_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  phone VARCHAR(20) NOT NULL,
  code VARCHAR(10) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_phone (phone),
  INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================================
-- 新版核心业务表
-- ========================================

-- 测评会话表（追踪用户的一次完整测评流程）
CREATE TABLE IF NOT EXISTS assessment_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  selected_questionnaires JSON NOT NULL,     -- 用户选择的问卷ID列表 ["leadership","temperament","big5"]
  ordered_questionnaires JSON NOT NULL,      -- 按优先级排序后的列表
  current_index INT DEFAULT 0,              -- 当前做到第几个问卷（0-based）
  status ENUM('in_progress', 'completed', 'submitted', 'approved', 'rejected') DEFAULT 'in_progress',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_status (user_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 测评记录表（每完成一个问卷保存一条记录，关联到session）
CREATE TABLE IF NOT EXISTS assessment_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  session_id INT DEFAULT NULL,
  questionnaire_id VARCHAR(50) NOT NULL,
  questionnaire_name VARCHAR(100) NOT NULL,
  answers JSON NOT NULL,
  score_result JSON NOT NULL,
  ai_report TEXT DEFAULT NULL,
  review_status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  review_comment VARCHAR(500) DEFAULT NULL,
  reviewed_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES assessment_sessions(id) ON DELETE SET NULL,
  INDEX idx_user (user_id),
  INDEX idx_session (session_id),
  INDEX idx_questionnaire (questionnaire_id),
  INDEX idx_time (created_at),
  INDEX idx_review_status (review_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 综合报告表（汇总所有问卷得分的综合AI报告）
CREATE TABLE IF NOT EXISTS comprehensive_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL UNIQUE,
  user_id INT NOT NULL,
  questionnaires_completed JSON NOT NULL,    -- 完成的问卷ID列表
  score_summary JSON NOT NULL,               -- 各问卷汇总得分
  report_content LONGTEXT NOT NULL,          -- AI生成的报告正文（Markdown/HTML）
  comprehensive_score DECIMAL(5,2) NOT NULL, -- 综合得分（65-85区间）
  review_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  review_comment VARCHAR(500) DEFAULT NULL,
  reviewed_at TIMESTAMP NULL DEFAULT NULL,
  reviewed_by INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES assessment_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES admins(id) ON DELETE SET NULL,
  INDEX idx_user (user_id),
  INDEX idx_status (review_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================================
-- 数据库迁移脚本（旧数据库升级用）
-- 如果是全新安装，忽略以下内容
-- 如果是从旧版升级，按需执行以下ALTER语句
-- ========================================

-- ALTER TABLE assessment_records ADD COLUMN session_id INT DEFAULT NULL;
-- ALTER TABLE assessment_records ADD FOREIGN KEY (session_id) REFERENCES assessment_sessions(id) ON DELETE SET NULL;
-- ALTER TABLE assessment_records ADD INDEX idx_session (session_id);
