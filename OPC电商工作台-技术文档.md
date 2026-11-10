# OPC 电商工作台 — 技术文档

> 本文档说明当前工程的目录结构、环境配置、数据库初始化结果，以及各端本地启动方式。  
> 基础设施与配置已就绪；桌面端为 Tauri + Python agent server 本地工作台。

---

## 1. 工程结构

```
opc-电商工作台/
├── opc-电商-后台管理前端/          # Vue3 + TDesign 管理端（独立工程）
├── opc电商-后端服务/
│   └── ruoyi-tdesign-main/         # Spring Boot 后端（RuoYi-TDesign）
│       ├── ruoyi-admin/            # 启动模块（端口 9080）
│       ├── ruoyi-common/           # 公共组件
│       ├── ruoyi-modules/          # 业务模块（system/job/workflow/...）
│       ├── ruoyi-extend/           # 扩展（监控 / SnailJob，默认关闭）
│       └── script/sql/mysql/       # MySQL 初始化脚本
└── opc电商-桌面端/
    └── cm-opc-worker/              # OpcWorkbench 桌面端（本仓库内源码）
        ├── coworker/               # Python agent 引擎、连接器、自动化调度
        ├── surfaces/gui/           # React UI + Tauri 2 壳
        ├── packaging/              # 开发引导 / DMG / Windows 打包
        ├── docs/                   # 桌面端设计与部署文档
        └── tests/                  # 后端测试
```

| 端 | 技术栈 | 本地地址 |
|----|--------|----------|
| 后端 | JDK 17、Spring Boot 3.5、Sa-Token、MyBatis-Plus、Redis | `http://localhost:9080` |
| 管理前端 | Node ≥ 22、Vue3、Vite6、TDesign、Pinia | `http://localhost:9002` |
| 桌面端 GUI | Node ≥ 20、React 18、Vite5、Tailwind、Tauri 2 | `http://127.0.0.1:1420`（浏览器开发） |
| 桌面端引擎 | Python ≥ 3.10、FastAPI / uvicorn（`coworker.server`） | `http://127.0.0.1:8765` |

---

## 2. 已完成的环境配置（管理后台）

配置文件：

`opc电商-后端服务/ruoyi-tdesign-main/ruoyi-admin/src/main/resources/application-dev.yml`

Maven 默认激活 `dev` 环境，直接启动会加载上述文件。

> 真实 Host / 账号 / 口令以本机 `application-dev.yml` 为准，本文仅用占位符示意，勿把明文写入对外文档。

### 2.1 MySQL

| 项 | 值 |
|----|----|
| Host | `<MYSQL_HOST>` |
| Port | `3306` |
| User | `<MYSQL_USER>` |
| Password | `<MYSQL_PASSWORD>` |
| Database | `opc_admin` |
| Charset | `utf8mb4` / `utf8mb4_unicode_ci` |

JDBC：

```text
jdbc:mysql://<MYSQL_HOST>:3306/opc_admin?useUnicode=true&characterEncoding=utf8&zeroDateTimeBehavior=convertToNull&useSSL=false&serverTimezone=GMT%2B8&autoReconnect=true&rewriteBatchedStatements=true&allowPublicKeyRetrieval=true&nullCatalogMeansCurrent=true
```

### 2.2 Redis

| 项 | 值 |
|----|----|
| Host | `<REDIS_HOST>` |
| Port | `6379` |
| DB | `13` |
| Password | `<REDIS_PASSWORD>`（当前可为空） |

连通性已验证：`PING` → `PONG`。业务缓存写入 **DB 13**，避免与同实例其他库冲突。

---

## 3. 数据库初始化说明

### 3.1 库状态

- 独立库：`opc_admin`（utf8mb4 / utf8mb4_unicode_ci），专供本后台使用。
- 旧库 `flowgam` 仍保留原有 Django/dvadmin 数据，**后端已不再指向该库**。
- `opc_admin` 已完整导入 RuoYi-TDesign 初始化脚本。

### 3.2 已执行的 SQL（按顺序）

路径：`script/sql/mysql/`

| 顺序 | 文件 | 用途 |
|------|------|------|
| 1 | `ry_vue_1.X.sql` | 核心系统表、菜单、角色、租户、用户等 |
| 2 | `ry_job.sql` | SnailJob 调度相关表 |
| 3 | `ry_workflow.sql` | 工作流相关表 |
| 4 | `test.sql` | 示例/演示数据 |

### 3.3 导入结果摘要

| 指标 | 结果 |
|------|------|
| 库内总表数 | 72 |
| 菜单数 | 213 |
| 角色数 | 4 |
| 管理员账号 | `admin`（昵称：管理员，状态启用） |

如需手动重导（会覆盖同名表数据，请谨慎）：

```bash
MYSQL=/usr/local/mysql/bin/mysql
HOST=<MYSQL_HOST>
USER=<MYSQL_USER>
SQL_DIR="opc电商-后端服务/ruoyi-tdesign-main/script/sql/mysql"

$MYSQL -h $HOST -P 3306 -u "$USER" -p'<MYSQL_PASSWORD>' --default-character-set=utf8mb4 opc_admin < "$SQL_DIR/ry_vue_1.X.sql"
$MYSQL -h $HOST -P 3306 -u "$USER" -p'<MYSQL_PASSWORD>' --default-character-set=utf8mb4 opc_admin < "$SQL_DIR/ry_job.sql"
$MYSQL -h $HOST -P 3306 -u "$USER" -p'<MYSQL_PASSWORD>' --default-character-set=utf8mb4 opc_admin < "$SQL_DIR/ry_workflow.sql"
$MYSQL -h $HOST -P 3306 -u "$USER" -p'<MYSQL_PASSWORD>' --default-character-set=utf8mb4 opc_admin < "$SQL_DIR/test.sql"
```

---

## 4. 本地启动步骤（管理后台）

### 4.1 前置条件

- **JDK 17+**（推荐 17 或 21）
- **Maven 3.8+**
- **Node.js ≥ 22**（管理前端）
- 本机可访问 `<MYSQL_HOST>:3306` 与 `<REDIS_HOST>:6379`

### 4.2 启动后端

```bash
cd "opc电商-后端服务/ruoyi-tdesign-main"

# 默认 profile = dev（已配置远程 MySQL / Redis）
mvn clean install -DskipTests

# 启动主应用
cd ruoyi-admin
mvn spring-boot:run
```

IDEA 可直接运行主类：

`org.dromara.DromaraApplication`

成功标志：控制台无数据源/Redis 报错，访问：

- 接口根路径：`http://localhost:9080`
- API 文档（若开启）：`http://localhost:9080/doc.html` 或 SpringDoc 对应地址

> `snail-job`、`spring-boot-admin` 在 `application-dev.yml` 中默认 `enabled: false`，本地可不启扩展服务。

### 4.3 启动管理前端

```bash
cd "opc-电商-后台管理前端"

yarn install
# 或：npm install --registry=https://registry.npmmirror.com

yarn dev
# 或：npm run dev
```

浏览器打开：`http://localhost:9002`

开发代理（`vite.config.ts`）：

| 前缀 | 目标 |
|------|------|
| `/dev-api` | `http://localhost:9080` |

### 4.4 登录账号

框架默认账号（初始化数据）：

| 账号 | 密码 | 说明 |
|------|------|------|
| `admin` | `<ADMIN_PASSWORD>` | 超级管理员（框架初始化默认口令见本地脚本/交付说明） |
| `test` | `<TEST_PASSWORD>` | 测试用户（本部门及以下） |
| `test1` | `<TEST_PASSWORD>` | 测试用户（仅本人） |

若登录异常，优先检查：

1. 后端是否已起来且 Redis DB13 可写  
2. 前端 `.env.development` 中 `VITE_APP_ENCRYPT` 与后端接口加密开关是否一致  
3. 浏览器控制台 / 后端日志的鉴权与验证码错误

---

## 5. 桌面端（OpcWorkbench）

桌面端源码位于 `opc电商-桌面端/cm-opc-worker/`：本地 Python agent server + React GUI，可选 Tauri 原生壳。应用显示名 **OpcWorkbench**（`productName` / 侧栏品牌）。

### 5.1 前置条件

- **Python 3.10+**（建议用仓库内 `.venv`）
- **Node.js ≥ 20**
- **Rust 工具链**（仅 Tauri 桌面壳需要，见 [rustup](https://rustup.rs/)）

### 5.2 一次引导

```bash
cd "opc电商-桌面端/cm-opc-worker"
bash packaging/setup_dev_env.sh   # 创建 .venv 并安装 Python 依赖
```

### 5.3 浏览器开发模式（推荐日常改 UI）

终端 1 — agent server：

```bash
cd "opc电商-桌面端/cm-opc-worker"
.venv/bin/python -m coworker.server.run --cwd ~ --port 8765
```

终端 2 — GUI：

```bash
cd "opc电商-桌面端/cm-opc-worker/surfaces/gui"
npm install
npm run dev          # http://127.0.0.1:1420（strictPort）
```

独立 server 会把启动 token 写到用户态目录的 `sidecar-8765.token`；Vite 启动时读取。直接调 API 时在请求头携带该启动 token（头字段名见 `surfaces/gui/vite.config.ts` 与 server 约定）。

### 5.4 Tauri 桌面壳

```bash
cd "opc电商-桌面端/cm-opc-worker/surfaces/gui"
npm run tauri dev    # 壳自行拉起并监管 local server
```

macOS overlay 标题栏使用透明 titlebar + traffic lights；侧栏 / 市场页 sticky 顶栏承担拖拽区，避免与内容双重顶距。

### 5.5 测试与打包

| 命令 | 说明 |
|------|------|
| `.venv/bin/pytest`（仓库根） | Python 引擎测试 |
| `npm test`（`surfaces/gui`） | GUI 单测（vitest） |
| `npm run e2e`（`surfaces/gui`） | Playwright 端到端 |
| `packaging/build_dmg.sh` / `build_windows.ps1` | 安装包构建 |

### 5.6 主要界面与 OPC 定制要点

| Surface | 组件 | 说明 |
|---------|------|------|
| 会话 | `App.tsx` + `Sidebar` | 侧栏底色 `rgb(247,247,247)`（`--sidebar`）；品牌栏：收起钮 + 搜索；分组标题「最近 / 置顶 / 计划」用 `text-ui` |
| 自动化 | `ScheduledView` | 布局对齐行业应用：sticky 顶栏、内容 `max-w-5xl`、收起时内联展开侧栏 |
| 行业应用 | `IndustryAppsView` | 列表 + sticky；「前往」嵌入工作台 iframe（当前仍为前端硬编码示例卡） |
| 同事技能 | `CoworkerKitView` | 专家 / 技能 / 连接器 tabs；收起 chrome 与行业应用同构 |
| 设置 / 收件箱 / 审计 | `SettingsView` 等 | 全页 surface；桌面 overlay 下由各自 chrome 或 `surface-window-drag` 拖窗 |

侧栏导航（自上而下）：新建会话 → 自动化 → 行业应用 → 同事技能 → 会话列表（置顶 / 计划 / 最近）。

关键样式：`surfaces/gui/src/styles.css`（`--sidebar`、`.automations-sticky` / `.industry-apps-sticky` / `.coworker-kit-sticky`、Tauri overlay 红绿灯对齐）。

### 5.7 与管理后台的关系

- 桌面端是 **本地优先** 的 agent 工作台，不依赖 `opc_admin` MySQL / Redis。
- 管理后台负责租户、菜单、运营配置；桌面端通过「行业应用」嵌入/跳转业务 Web（如 AI 电商工作台），二者通过产品入口衔接，而非同一进程。
- 后续行业应用清单应由管理后台配置下发，桌面端只消费契约（见第 6 节）。

---

## 6. 后续演进原则（行业应用）

当前「行业应用」仍以桌面端内硬编码卡片为主。后续必须按 **高内聚、低耦合** 演进，目标明确为：

> **所有行业应用可配置、可插拔。**

### 6.1 高内聚

- 每个行业应用是独立业务单元：页面、能力、数据边界收敛在应用自身。
- 桌面壳只负责发现、展示、打开、鉴权透传；不把某一行业的业务逻辑写进桌面端核心。
- 单个应用的改版、发版、回滚不影响其它应用，也不影响会话 / 自动化 / 同事技能等 surface。

### 6.2 低耦合

- 桌面端与行业应用只通过稳定契约交互（清单元数据 + 打开方式），不依赖对方内部实现。
- 禁止在 `IndustryAppsView` / `App.tsx` 中继续堆叠「按应用 if/else」的特殊逻辑；**新增应用不应改壳代码**。
- 管理后台（配置源）与桌面端（消费端）解耦：后台改配置即可上下架；尽量做到不发桌面端安装包也能生效（热更新策略另定）。

### 6.3 可配置

行业应用以配置（或后台下发清单）描述，而不是写死在前端常量里。建议字段：

| 字段 | 含义 |
|------|------|
| `id` | 稳定标识 |
| `title` / `subtitle` | 展示文案（可 i18n key） |
| `category` / `tags` | 分类与筛选 |
| `icon` / `tone` | 视觉 |
| `entry.url` | Web 地址（`embed` / `external` 用） |
| `entry.mode` | **`embed`** \| **`plugin`** \| `external` |
| `entry.pluginId` | 本地插件包 id（仅 `plugin` 模式） |
| `enabled` / `order` | 上下架与排序 |
| `permissions` | 可见角色 / 租户范围（可选） |

配置由管理后台维护；桌面端启动或进入「行业应用」时拉取并渲染。

### 6.4 两种接入方式（后续新增行业应用）

新增行业应用只走下面两种宿主能力，**不要**把业务页面散落到 `App.tsx` / `Sidebar` / 会话等核心目录。

#### A. 内嵌 Web（`entry.mode = embed`）

- 适用：已有独立 Web 产品（如 AI 电商工作台），或远端 SPA。
- 行为：桌面端在行业应用 surface 内用统一 iframe / WebView 容器打开 `entry.url`；可提供「外开浏览器」作为兜底。
- 边界：业务 UI、路由、发版全在 Web 侧；桌面只负责列表发现、鉴权透传（cookie / token）、返回列表与加载/错误态。
- 现状：`IndustryAppsView` 已演示 iframe 嵌入路径，后续改为读配置而非硬编码单卡。

#### B. 桌面端本地插件（`entry.mode = plugin`）

- 适用：需要更深集成桌面能力（本地文件、agent、Tauri API），或希望跟壳同仓维护，但不污染核心目录。
- 原则：**高内聚包 + 统一注册表**；插件代码集中在独立目录，核心树保持干净。

建议目录（示意）：

```text
surfaces/gui/src/
  industry-apps/                 # 宿主：清单加载、打开路由、embed/plugin 容器
    registry.ts                  # 发现本地插件 + 合并远程配置
    IndustryAppsView.tsx         # 列表 / 打开（壳层，无业务分支）
    EmbedHost.tsx                # 内嵌 Web 容器
    PluginHost.tsx               # 按 pluginId 挂载插件入口
  plugins/                       # ★ 所有行业应用插件落在这里，互不掺进核心
    ai-ecommerce/                # 示例：一个插件一个文件夹
      manifest.ts                # id / title / icon / entry 组件
      index.tsx                  # 插件 UI 入口
      ...                        # 仅本应用的页面与逻辑
    another-app/
      manifest.ts
      index.tsx
```

约束：

- 新增插件 = 在 `plugins/<id>/` 增加包 + `manifest` 注册；**禁止**改 `Sidebar` / 会话 / 自动化目录。
- `manifest` 导出满足统一契约（id、展示信息、`React` 入口组件）；宿主 `PluginHost` 动态挂载。
- 插件可依赖公共 UI / `api`，但不得反向污染宿主（不在宿主写按应用 if/else）。
- 远程配置里的 `pluginId` 与本地 `manifest.id` 对齐；未安装的插件在列表显示「不可用」而非崩溃。

#### 怎么选

| 场景 | 建议 |
|------|------|
| 业务已是独立站点 / 要独立发版 | **A 内嵌 Web** |
| 要调本地 agent、文件系统、或强桌面交互 | **B 本地插件** |
| 仅外链打开、不进工作台 | `external`（浏览器打开） |

两种模式共用同一张清单卡与打开流程；区别只在 `entry.mode` 对应的 Host 容器。

### 6.5 可插拔

- **插**：配置启用 + 合法 entry（URL 可达，或本地 plugin 已注册）→ 列表出现，用户可打开。
- **拔**：配置禁用或下线 → 列表消失；已打开页提示失效，不残留硬依赖。
- 宿主提供统一插槽（列表卡、详情头、`EmbedHost` / `PluginHost`）；应用只填充契约，不侵入侧栏、会话、自动化等其它模块。
- 无论内嵌 Web 还是本地插件，都走同一契约，避免「每种应用一种接入方式」。

### 6.6 落地顺序（建议）

1. 抽出行业应用清单 schema，去掉前端硬编码单卡；落地 `industry-apps/` 宿主层。
2. 固化两种 Host：`EmbedHost`（现有 iframe 收敛）+ `PluginHost` + `plugins/` 目录约定。
3. 管理后台增加「行业应用」配置 CRUD（含 `mode` / `url` / `pluginId`），桌面端读配置渲染。
4. 统一加载 / 错误 / 返回列表态；再按需加权限、租户差异化、远程热更新。

---

## 7. 关键配置对照

### 后端（dev）

```yaml
# MySQL
spring.datasource.dynamic.datasource.master:
  url: jdbc:mysql://<MYSQL_HOST>:3306/opc_admin?...
  username: <MYSQL_USER>
  password: '<MYSQL_PASSWORD>'

# Redis
spring.data.redis:
  host: <REDIS_HOST>
  port: 6379
  database: 13
  # password: <REDIS_PASSWORD>   # 无密码时可保持注释
```

### 管理前端（开发）

- 端口：`9002`
- API 前缀：`/dev-api`
- 页面标题：`OPC电商工作台-后台管理`

### 桌面端（开发）

- GUI：`127.0.0.1:1420`（Vite `strictPort`）
- Agent server：`127.0.0.1:8765`
- Token：`sidecar-8765.token`（浏览器模式）/ 内存 launch token（Tauri）

---

## 8. 注意事项

1. **库隔离**：后台使用独立库 `opc_admin`；`flowgam` 仅保留原 Django/dvadmin 业务，互不影响。
2. **Redis DB 隔离**：请固定使用 DB `13`，勿与其他项目共用同一 DB。
3. **敏感信息**：Host / 账号 / 口令仅存于本机 `application-dev.yml` 或私密交付渠道；本文档一律使用占位符。请勿将含真实口令的配置推送到公开仓库；生产环境建议改用环境变量（参考 `application-prod.yml` 的 `${DATABASE_URL}` 写法）。
4. **扩展组件**：定时任务控制台（SnailJob）、监控中心默认关闭；需要时再单独改 `enabled` 并部署对应服务。
5. **字符集**：库与连接均使用 `utf8mb4`，中文菜单/昵称已校验正常。
6. **桌面端端口**：GUI 固定 `1420`，勿与其他 Vite 实例抢端口；改 UI 时优先浏览器模式，Tauri 用于验证 overlay 标题栏与红绿灯对齐。
7. **行业应用接入**：后续新增应用一律走第 6 节契约——**内嵌 Web** 或 **`plugins/` 本地插件**；禁止在侧栏 / 会话 / 自动化等核心目录硬编码业务分支。

---

## 9. 快速自检清单

**管理后台**

- [ ] `redis-cli -h <REDIS_HOST> -p 6379 -n 13 ping` → `PONG`
- [ ] MySQL 可查：`SELECT user_name FROM opc_admin.sys_user WHERE user_name='admin';`
- [ ] 后端启动无报错，监听 `9080`
- [ ] 前端 `9002` 可打开登录页
- [ ] `admin / <ADMIN_PASSWORD>` 可登录进入首页

**桌面端**

- [ ] `.venv` 已创建，`python -m coworker.server.run --port 8765` 可起
- [ ] `surfaces/gui` 下 `npm run dev` 打开 `http://127.0.0.1:1420`
- [ ] 侧栏可见：新建会话 / 自动化 / 行业应用 / 同事技能
- [ ] （可选）`npm run tauri dev` 窗口标题栏与侧栏收起对齐正常

---

*文档更新说明：补全桌面端说明；第 6 节明确行业应用两种接入——内嵌 Web（`embed`）与本地插件（`plugins/`，不扰乱核心目录）；环境配置中的 IP / 账号 / 口令已改为占位符。*
