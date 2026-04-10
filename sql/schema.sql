CREATE DATABASE IF NOT EXISTS game_showcase CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE game_showcase;

CREATE TABLE IF NOT EXISTS games (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  cover_image VARCHAR(500) NOT NULL,
  cloud_link VARCHAR(500) NOT NULL,
  genre VARCHAR(80) DEFAULT '',
  platform VARCHAR(80) DEFAULT '',
  summary TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO games (name, cover_image, cloud_link, genre, platform, summary, sort_order)
VALUES
  (
    'Elden Ring',
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=900&q=80',
    'https://pan.example.com/elden-ring',
    'Action RPG',
    'PC / PS5 / Xbox',
    '开放世界动作角色扮演游戏，适合用于首页展示样例。',
    10
  ),
  (
    'Hades',
    'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=80',
    'https://pan.example.com/hades',
    'Roguelike',
    'PC / Switch',
    '节奏快、重复可玩性高，适合测试卡片布局与说明文案。',
    20
  );
