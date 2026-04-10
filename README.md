# Game Showcase

一个基于 `Node.js + TypeScript + Express + MySQL` 的游戏资源展示项目，包含：

- 前台展示页：以游戏卡片视图展示封面、简介、平台、网盘地址
- 管理端：维护游戏名称、图片地址、网盘地址、类型、平台、简介、排序值
- 后端 API：提供游戏列表查询与增删改查

## 启动方式

1. 安装依赖

```bash
npm install
```

2. 初始化数据库

```bash
mysql -u root -p < sql/schema.sql
```

常用数据操作语句可参考：

```bash
cat sql/dml.sql
```

3. 配置环境变量

```bash
cp .env.example .env
```

需要至少配置这些管理端鉴权项：

```bash
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=your-bcrypt-hash
SESSION_SECRET=your-random-secret
```

生成 bcrypt 密码哈希示例：

```bash
node -e "const bcrypt=require('bcryptjs'); console.log(bcrypt.hashSync('your-password', 12))"
```

4. 启动开发环境

```bash
npm run dev
```

默认地址：

- 展示页：`http://localhost:3000/`
- 管理端：`http://localhost:3000/admin`

管理端登录后才能新增、编辑、删除游戏数据。
管理端支持直接上传封面图片，文件会保存到本地 `uploads/` 目录，并通过 `/uploads/...` 对外访问。

## API 概览

- `GET /api/games` 获取游戏列表
- `GET /api/games/:id` 获取单个游戏
- `POST /api/games` 新增游戏
- `PUT /api/games/:id` 更新游戏
- `DELETE /api/games/:id` 删除游戏
- `POST /api/admin/login` 管理员登录
- `POST /api/admin/logout` 管理员退出
- `GET /api/admin/me` 获取当前登录状态
- `POST /api/upload` 上传封面图片

## SQL 文件

- `sql/schema.sql`：建库、建表、初始化示例数据
- `sql/dml.sql`：常用新增、查询、更新、删除、统计语句
