import { desktopCapturer, nativeImage, systemPreferences } from "electron";
import type { CaptureResult, CaptureSource } from "../shared/types.js";

const ownWindowTitles = ["保存工作现场", "工作断点Demo", "工作断点 Demo", "Save My Work"];

const demoSources: CaptureSource[] = [
  {
    id: "demo-notion-twig",
    sourceId: "demo:notion-twig",
    title: "Notion - 20260616 TWIG API 对接会议沟通记录",
    appName: "Notion",
    url: "notion://vpp/twig-api-sync",
    isDemo: true
  },
  {
    id: "demo-dingtalk-vpp",
    sourceId: "demo:dingtalk-vpp",
    title: "钉钉 - VPP 常务会",
    appName: "钉钉",
    url: "dingtalk://vpp-ops",
    isDemo: true
  },
  {
    id: "demo-claude-grid",
    sourceId: "demo:claude-grid",
    title: "Claude - 电池聚合与电网服务的集成方案",
    appName: "Claude",
    url: "claude://battery-grid-integration",
    isDemo: true
  },
  {
    id: "demo-terminal-ai",
    sourceId: "demo:terminal-ai",
    title: "Terminal - GPT 会话：工作断点 Demo 定位与问题排查",
    appName: "Terminal",
    isDemo: true
  }
]

export function getDemoSources(): CaptureResult {
  return {
    sources: demoSources,
    permissionDenied: false,
    usedDemoData: true,
    message: "已载入录屏稳定工作现场：Notion、钉钉、Claude、Terminal。"
  };
}

export async function getWindowSources(useDemoData = false): Promise<CaptureResult> {
  if (useDemoData) {
    return getDemoSources();
  }

  try {
    const sources = await desktopCapturer.getSources({
      types: ["window"],
      thumbnailSize: { width: 520, height: 320 },
      fetchWindowIcons: true
    });

    const seenTitles = new Set<string>();
    const mapped = sources
      .filter((source) => {
        const title = source.name.trim();
        if (!title || ownWindowTitles.some((ownTitle) => title.includes(ownTitle))) return false;
        if (seenTitles.has(title)) return false;
        seenTitles.add(title);
        return true;
      })
      .map<CaptureSource>((source) => {
        const thumbnail = source.thumbnail.isEmpty() ? undefined : source.thumbnail.toDataURL();
        const appIcon = source.appIcon && !source.appIcon.isEmpty() ? source.appIcon : nativeImage.createEmpty();

        return enrichDemoRecognizedSource({
          id: source.id,
          sourceId: source.id,
          title: source.name,
          appName: inferAppName(source.name),
          thumbnailDataUrl: thumbnail,
          iconDataUrl: appIcon.isEmpty() ? undefined : appIcon.toDataURL()
        });
      });

    if (mapped.length === 0) {
      return {
        sources: demoSources,
        permissionDenied: false,
        usedDemoData: true,
        message: "没有可用的窗口预览，已准备好演示模式。"
      };
    }

    return {
      sources: mapped,
      permissionDenied: false,
      usedDemoData: false
    };
  } catch {
    return {
      sources: demoSources,
      permissionDenied: false,
      usedDemoData: true,
      message: "真实窗口捕获暂时不可用，已使用录屏稳定工作现场继续。"
    };
  }
}

function getScreenCaptureStatus() {
  try {
    const maybeSystemPreferences = systemPreferences as unknown as {
      getMediaAccessStatus?: (mediaType: string) => string;
    };

    return maybeSystemPreferences.getMediaAccessStatus?.("screen") ?? "unknown";
  } catch {
    return "unknown";
  }
}

function inferAppName(title: string) {
  const separator = title.includes(" - ") ? " - " : title.includes(" — ") ? " — " : undefined;
  if (!separator) return undefined;
  return title.split(separator)[0]?.trim();
}


function enrichDemoRecognizedSource(source: CaptureSource): CaptureSource {
  const text = `${source.appName ?? ""} ${source.title}`.toLowerCase();

  if (/dsr|notion|twig api|vpp任务|沟通记录|20260616/.test(text)) {
    return {
      ...source,
      title: "Notion - 20260616 TWIG API 对接会议沟通记录",
      appName: "Notion",
      url: "notion://vpp/twig-api-sync"
    };
  }

  if (/钉钉|dingtalk|vpp 常务会|vpp/.test(text)) {
    return {
      ...source,
      title: "钉钉 - VPP 常务会",
      appName: "钉钉",
      url: "dingtalk://vpp-ops"
    };
  }

  if (/claude|电池聚合|电网服务|opus/.test(text)) {
    return {
      ...source,
      title: "Claude - 电池聚合与电网服务的集成方案",
      appName: "Claude",
      url: "claude://battery-grid-integration"
    };
  }

  if (/terminal|终端|gpt|codex|tea/.test(text)) {
    return {
      ...source,
      title: "Terminal - GPT 会话：工作断点 Demo 定位与问题排查",
      appName: "Terminal"
    };
  }

  return source;
}
