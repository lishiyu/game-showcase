USE game_showcase;

-- 新增游戏
INSERT INTO games (
  name,
  cover_image,
  cloud_link,
  genre,
  platform,
  summary,
  sort_order
) VALUES (
  'Black Myth: Wukong',
  '/uploads/black-myth-wukong.jpg',
  'https://pan.example.com/black-myth-wukong',
  'Action RPG',
  'PC / PS5',
  '可替换为实际资源说明、提取码提示或版本描述。',
  100
);

-- 查询全部游戏，按排序值和主键倒序
SELECT
  id,
  name,
  cover_image,
  cloud_link,
  genre,
  platform,
  summary,
  sort_order,
  created_at,
  updated_at
FROM games
ORDER BY sort_order DESC, id DESC;

-- 按关键字搜索
SELECT
  id,
  name,
  genre,
  platform,
  sort_order
FROM games
WHERE name LIKE '%RPG%'
   OR genre LIKE '%RPG%'
   OR platform LIKE '%PC%'
ORDER BY sort_order DESC, id DESC;

-- 按 ID 查询单个游戏
SELECT *
FROM games
WHERE id = 1;

-- 更新游戏基础信息
UPDATE games
SET
  name = 'Black Myth: Wukong Deluxe Edition',
  cover_image = '/uploads/black-myth-wukong-v2.jpg',
  cloud_link = 'https://pan.example.com/black-myth-wukong-v2',
  genre = 'Action RPG',
  platform = 'PC / PS5',
  summary = '更新后的资源说明。',
  sort_order = 120
WHERE id = 1;

-- 仅更新封面图
UPDATE games
SET cover_image = '/uploads/new-cover.jpg'
WHERE id = 1;

-- 仅更新网盘地址
UPDATE games
SET cloud_link = 'https://pan.example.com/new-link'
WHERE id = 1;

-- 批量调整排序
UPDATE games
SET sort_order = CASE id
  WHEN 1 THEN 300
  WHEN 2 THEN 200
  WHEN 3 THEN 100
  ELSE sort_order
END
WHERE id IN (1, 2, 3);

-- 删除单个游戏
DELETE FROM games
WHERE id = 1;

-- 删除某个平台下的全部测试数据
DELETE FROM games
WHERE platform = 'TEST';

-- 统计游戏数量
SELECT COUNT(*) AS total_games
FROM games;

-- 按类型统计数量
SELECT
  genre,
  COUNT(*) AS total
FROM games
GROUP BY genre
ORDER BY total DESC, genre ASC;

-- 按平台统计数量
SELECT
  platform,
  COUNT(*) AS total
FROM games
GROUP BY platform
ORDER BY total DESC, platform ASC;

-- 查看最近新增或更新的数据
SELECT
  id,
  name,
  updated_at
FROM games
ORDER BY updated_at DESC
LIMIT 10;
