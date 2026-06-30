# Codex 接手说明

## 项目位置

源码在：

`项目源码/`

这是一个 Electron + React + TypeScript + Vite 项目。

## 推荐在另一台电脑上的运行方式

进入源码目录：

```bash
cd 项目源码
npm install
npm run typecheck
npm run build
npm run package
```

打包完成后，应用会生成在：

`项目源码/dist/mac-arm64/保存工作现场.app`

开发调试时使用两个终端：

Terminal 1:

```bash
cd 项目源码
npm run dev
```

Terminal 2:

```bash
cd 项目源码
npm run open
```

## 主要源码

- `src/main/main.ts`：Electron 主进程，悬浮窗、折叠/展开、IPC。
- `src/main/captureService.ts`：窗口扫描、demo 窗口数据。
- `src/renderer/App.tsx`：主状态和页面切换。
- `src/renderer/components/FloatingCapsule.tsx`：桌面悬浮胶囊。
- `src/renderer/components/CapturePanel.tsx`：新建检查点主流程。
- `src/renderer/components/CheckpointComposer.tsx`：自动识别填入、生成检查点。
- `src/renderer/components/ResumeView.tsx`：恢复检查点页面。
- `src/renderer/checkpointGenerator.ts`：demo 的自动归纳规则。
- `src/renderer/styles/app.css`：主要视觉和动画。

## 当前已实现

- 桌面悬浮胶囊。
- 边缘吸附、悬浮展开、点击打开主窗口。
- 扫描当前窗口，展示窗口缩略图。
- 拖拽/点击添加窗口。
- 专注填写模式：左侧折叠成 mini 窗口列表，右侧输入区放大。
- 自动识别填入 loading 动画。
- 根据窗口类型生成分段备注。
- 生成检查点 WebGL 粒子动画。
- 历史检查点。
- 恢复检查点页面。

## 产品方向

当前产品核心不是“恢复窗口”，而是“恢复思路”。

一句话：

Save My Work 是桌面上的工作记忆胶囊。用户被打断时，它把当前工作现场、相关窗口、卡点和下一步压缩成一个可恢复的工作断点。

## 当前技术限制

- 目前没有真正读取微信、Notion、浏览器页面正文。
- 自动识别主要基于窗口标题、应用名、缩略图和 demo 规则。
- 一键恢复目前偏演示，真实恢复网页/文件/应用需要继续完善。
- 精确恢复第三方窗口位置需要 macOS 辅助功能权限。

## 下一步建议

1. 先准备固定 demo 窗口组合，让 demo 像一个完整故事。
2. 强化悬浮胶囊状态：未恢复任务数量、堆叠形态、压缩动画。
3. 做“高级版 MVP”：一键恢复资源、恢复进度、失败提示。
4. 如果要真实内容理解，再做浏览器插件/OCR/API 集成。
