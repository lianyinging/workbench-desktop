# OpcWorkbench（cm-opc-worker）

丛茂 OPC 电商工作台 **桌面端**：本地优先的 AI 工作台，由 Python agent server + React GUI 组成，可选 Tauri 2 原生壳。

应用显示名：**OpcWorkbench**

> 更完整的平台说明（含管理后台 / 数据库）见同目录 [`OPC电商工作台-技术文档.md`](./OPC电商工作台-技术文档.md)。

---

## 仓库定位

本仓库是 OPC 电商工作台三端之一：

| 仓库 | 说明 |
|------|------|
| `cm-opc-desktop`（本仓库） | 桌面端 OpcWorkbench |
| `cm-opc-desktop-admin` | 后台管理前端（Vue3 + TDesign） |
| `cm-opc-desktop-service` | 后台 Java 服务（RuoYi-TDesign） |

桌面端 **不依赖** 管理后台的 MySQL / Redis；与后台通过「行业应用」等产品入口衔接，而非同一进程。

---

## 技术栈

| 层 | 技术 | 本地地址 |
|----|------|----------|
| GUI | Node ≥ 20、React 18、Vite 5、Tailwind、Tauri 2 | `http://127.0.0.1:1420` |
| 引擎 | Python ≥ 3.10、FastAPI / uvicorn（`coworker.server`） | `http://127.0.0.1:8765` |

---

## 目录结构

```text
cm-opc-worker/
├── coworker/          # Python agent 引擎、连接器、自动化调度
├── surfaces/gui/      # React UI + Tauri 2 壳
├── packaging/         # 开发引导 / DMG / Windows 打包
├── docs/              # 设计与部署文档
└── tests/             # 后端测试
```

侧栏导航：新建会话 → 自动化 → 行业应用 → 同事技能 → 会话列表（置顶 / 计划 / 最近）。

---

## 快速开始

### 前置条件

- Python 3.10+
- Node.js ≥ 20
- Rust 工具链（仅跑 Tauri 桌面壳时需要，见 [rustup](https://rustup.rs/)）

### 1. 一次引导

```bash
bash packaging/setup_dev_env.sh   # 创建 .venv 并安装 Python 依赖
```

### 2. 浏览器开发模式（推荐日常改 UI）

终端 1 — agent server：

```bash
.venv/bin/python -m coworker.server.run --cwd ~ --port 8765
```

终端 2 — GUI：

```bash
cd surfaces/gui
npm install
npm run dev          # http://127.0.0.1:1420（strictPort）
```

独立 server 会把启动 token 写到用户态目录的 `sidecar-8765.token`；Vite 启动时读取。直接调 API 时需在请求头携带该 token（字段名见 `surfaces/gui/vite.config.ts`）。

### 3. Tauri 桌面壳

```bash
cd surfaces/gui
npm run tauri dev    # 壳自行拉起并监管 local server
```

---

## 测试与打包

| 命令 | 说明 |
|------|------|
| `.venv/bin/pytest`（仓库根） | Python 引擎测试 |
| `npm test`（`surfaces/gui`） | GUI 单测（vitest） |
| `npm run e2e`（`surfaces/gui`） | Playwright 端到端 |
| `packaging/build_dmg.sh` / `build_windows.ps1` | 安装包构建 |

---

## 行业应用原则（摘要）

后续行业应用按 **可配置、可插拔** 演进，桌面壳只负责发现 / 展示 / 打开 / 鉴权透传：

| 模式 | `entry.mode` | 适用 |
|------|--------------|------|
| 内嵌 Web | `embed` | 已有独立 Web 产品，iframe / WebView 打开 |
| 本地插件 | `plugin` | 需本地 agent / 文件系统等深度能力，落在 `plugins/<id>/` |
| 外链 | `external` | 仅浏览器打开 |

**禁止**在侧栏 / 会话 / 自动化等核心目录按应用写 if/else。详情见技术文档第 6 节。

---

## 自检

- [ ] `.venv` 已创建，`python -m coworker.server.run --port 8765` 可起
- [ ] `surfaces/gui` 下 `npm run dev` 可打开 `http://127.0.0.1:1420`
- [ ] 侧栏可见：新建会话 / 自动化 / 行业应用 / 同事技能
- [ ] （可选）`npm run tauri dev` 窗口与侧栏表现正常

---

## 许可

见 [LICENSE](./LICENSE)。
