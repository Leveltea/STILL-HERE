# StillHere / 工作断点 Demo

StillHere 是一个 macOS Electron 原型：为多任务并行场景设计的 AI 工作现场恢复器。

它解决的问题不是“窗口在哪里”，而是人在被打断后重新回到工作时，如何快速找回刚才的上下文、判断和下一步。

## 当前能力

- 桌面悬浮胶囊入口
- 扫描当前打开的窗口
- 点击、拖拽或一键添加相关窗口
- 根据窗口角色生成工作断点
- 自动归纳当前任务、关键上下文、卡点和下一步
- 检查点库与恢复视图
- 针对 demo 场景内置 Notion、钉钉、Claude、Terminal 等窗口的模拟识别规则

> 注意：这是 demo / prototype，不是完整商用版本。当前并不会真正读取 Notion、钉钉或 Claude 的正文内容，主要基于窗口标题、应用名、缩略图和演示规则来生成检查点。

## 环境要求

- macOS
- Node.js 18+
- npm

## 本地运行

```bash
npm install
npm run build
npm run start
```

开发调试可以使用两个终端：

```bash
npm run dev
```

另一个终端：

```bash
npm run open
```

## 打包 macOS App

```bash
npm install
npm run package
```

打包产物会生成在：

```text
dist/mac-arm64/工作断点Demo-录屏专用.app
```

## macOS 权限说明

如果要展示真实窗口缩略图，macOS 需要给应用开启：

- 系统设置 -> 隐私与安全性 -> 录屏与系统录音

如果系统反复提示权限问题，可以先彻底退出应用，再重新打开。由于这是未签名 demo，换机器运行时 macOS 可能会重新要求授权。

## 主要源码结构

```text
src/main/main.ts                 Electron 主进程、悬浮窗、窗口管理
src/main/captureService.ts       窗口扫描与 demo 窗口识别
src/renderer/App.tsx             主界面状态与流程
src/renderer/checkpointGenerator.ts  检查点生成规则
src/renderer/components/         页面组件
src/renderer/styles/app.css      视觉样式与动画
src/shared/types.ts              共享类型
```

## GitHub Release 建议

源码仓库适合开发者运行和二次修改。

如果希望普通用户直接下载使用，请在 GitHub Releases 中上传已经打包好的：

```text
工作断点Demo-录屏专用.app.zip
```

普通用户下载后解压，右键打开 app，并按系统提示开启录屏权限。
