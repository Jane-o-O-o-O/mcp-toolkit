# Contributing to MCP Toolkit

感谢你有兴趣为 MCP Toolkit 做贡献！

## 🏗️ 项目结构

这是一个 pnpm monorepo，包含：

- `shared/core` — 共享工具注册、错误处理、传输层
- `shared/logger` — 结构化日志模块
- `packages/*` — 各个 MCP Server

## 🚀 开发环境

### 前置要求

- Node.js ≥ 20
- pnpm 9.x

### 安装

```bash
git clone https://github.com/Jane-o-O-o-O/mcp-toolkit.git
cd mcp-toolkit
pnpm install
```

### 常用命令

```bash
# 构建所有包
pnpm build

# 运行所有测试
pnpm test

# 代码格式化
pnpm format

# 类型检查
pnpm lint
```

## 📦 添加新的 MCP Server

### 1. 创建包结构

```bash
mkdir packages/myserver
cd packages/myserver
```

### 2. 创建 package.json

```json
{
  "name": "@mcp-toolkit/myserver",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "bin": {
    "mcp-myserver": "./dist/index.js"
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "dev": "tsx src/index.ts",
    "test": "vitest run"
  },
  "dependencies": {
    "@mcp-toolkit/core": "workspace:*",
    "@mcp-toolkit/logger": "workspace:*"
  }
}
```

### 3. 实现 Server

参考现有 server 的结构（推荐以 `packages/redis` 为模板）：

```
src/
├── index.ts        # CLI 入口
├── server.ts       # Server 创建逻辑
├── config.ts       # Zod 配置验证
└── tools/
    ├── index.ts    # 工具导出
    ├── tools.ts    # 工具实现
    └── types.ts    # 接口定义
```

### 4. 使用共享模块

```typescript
import { createMcpServer, startServer, safeRun, textResult, errorResult } from "@mcp-toolkit/core";
import { createLogger } from "@mcp-toolkit/logger";
```

### 5. 编写测试

每个包至少需要：
- `tests/tools.test.ts` — 工具逻辑测试（mock 依赖）
- `tests/config.test.ts` — 配置解析测试

```bash
# 运行单个包的测试
cd packages/myserver && pnpm test
```

## 🧪 测试规范

- 使用 vitest 作为测试框架
- Mock 外部依赖（数据库、API 等），不依赖真实服务
- 测试工具的正常路径和错误路径
- 测试配置验证（必填字段、默认值、类型转换）

## 📝 提交规范

使用中文 commit message，格式：

```
类型: 中文描述
```

类型：
- `feat` — 新功能
- `fix` — 修复
- `refactor` — 重构
- `test` — 测试
- `docs` — 文档
- `chore` — 其他

## 📋 Pull Request 流程

1. Fork 项目
2. 创建 feature 分支：`git checkout -b feat/my-feature`
3. 提交更改
4. 确保 `pnpm test` 和 `pnpm build` 通过
5. 发起 PR，描述你做了什么以及为什么

## ❓ 有问题？

在 [GitHub Issues](https://github.com/Jane-o-O-o-O/mcp-toolkit/issues) 提问。
