USE game_showcase;

INSERT INTO games (
  name,
  cover_image,
  cloud_link,
  genre,
  platform,
  summary,
  sort_order
)
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
