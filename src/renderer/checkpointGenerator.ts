import type { CapturedResource, CognitiveCheckpoint } from "../shared/types";

const demoNote =
  "我正在整理 TWIG API 对接和 VPP Save 行为的检查点。Notion 里是 20260616 会议沟通问题清单，钉钉群里在确认 Save 多次点击才响应是否只出现在 mind energy BRP 场景，Claude 辅助校对了电池聚合对外说明，Terminal 里在和 AI 梳理 demo 定位与排查路径。回来后先把 TWIG 上报频率/粒度问题和 Save 复现路径合并成一份待确认清单。";

export function getDemoNote(resources: CapturedResource[] = []) {
  if (resources.length === 0) return demoNote;

  const selectedText = resources.map((resource) => `${resource.appName ?? ""} ${resource.title}`).join(" ");
  if (/twig|vpp|brp|mind energy|notion|钉钉|claude|terminal/i.test(selectedText)) {
    return [
      "我正在整理 TWIG API 对接和 VPP Save 行为的检查点。",
      "",
      "Notion：20260616 TWIG API 对接会议沟通记录，正在整理 EAM 是否单独投标、CM 容量报价来源、POST /activations 是否持续上报、上报频率和粒度等待确认问题。",
      "钉钉：VPP 常务会里，冯冬妮、廖家杰、李德文正在确认 Save 多次点击才响应的问题；目前线索指向 mind energy BRP 场景，需要继续要复现路径和页面位置。",
      "Claude：正在校对电池聚合与电网服务的对外说明，重点确认 D-1 / D-2、Your API revenue、Mimer average price revenue 这些表达是否清楚。",
      "Terminal：正在和 AI 梳理这个 demo 的产品定位、恢复流程价值，以及 macOS 权限/窗口捕获的排查路径。",
      "",
      "当前卡点：TWIG 上报边界和 Save 复现条件还没有完全对齐。",
      "",
      "回来第一步：先在钉钉群里向 George 和 Dwyane 要复现路径、页面位置和点击 Save 后的状态反馈，再回到 Notion 补齐上报频率/粒度问题。"
    ].join("\n");
  }

  const communication = filterByKind(resources, /slack|钉钉|dingtalk|微信|wechat|群|channel|chat/i);
  const documents = filterByKind(resources, /notion|codex|文档|docs?|spec|规范|方案|prompt|markdown|md/i);
  const browser = filterByKind(resources, /chrome|safari|浏览器|api|网页|web|可灵|klng/i);
  const localFiles = filterByKind(resources, /finder|下载|download|文件|folder|zip|excel|powerpoint|ppt/i);

  const lines = [
    "我正在整理当前工作检查点。",
    "",
    communication.length > 0 ? `沟通上下文：${summarizeGroup(communication)} 里主要承载讨论、反馈和待确认事项。` : "",
    documents.length > 0 ? `资料上下文：${summarizeGroup(documents)} 记录了方案、规范或当前思路。` : "",
    browser.length > 0 ? `参考上下文：${summarizeGroup(browser)} 是正在查看的网页或产品/API 资料。` : "",
    localFiles.length > 0 ? `本地素材：${summarizeGroup(localFiles)} 里有需要继续处理的文件或材料。` : "",
    "",
    "当前卡点：需要把沟通里的最新反馈和资料里的关键规则对齐，避免回来后重新找上下文。",
    "",
    "回来第一步：先打开沟通窗口确认最新反馈，再回到文档/资料窗口更新当前工作产物。"
  ].filter((line, index, allLines) => line || (allLines[index - 1] && allLines[index + 1]));

  return lines.join("\n");
}

function filterByKind(resources: CapturedResource[], pattern: RegExp) {
  return resources.filter((resource) => pattern.test(`${resource.appName ?? ""} ${resource.title}`));
}

function summarizeGroup(resources: CapturedResource[]) {
  return resources
    .slice(0, 3)
    .map((resource) => resource.appName || resource.title.replace(/[-—].*$/, "").trim())
    .filter(Boolean)
    .join("、");
}

export function generateCheckpoint(userNote: string, resources: CapturedResource[]): CognitiveCheckpoint {
  const now = new Date().toISOString();
  const lowerNote = userNote.toLowerCase();
  const resourceTitles = resources.map((resource) => resource.title);
  const resourceText = resources.map((resource) => `${resource.appName ?? ""} ${resource.title}`).join(" ");
  const isTwigVppDemo = /twig|vpp|brp|mind energy|claude|terminal|notion|钉钉/i.test(`${userNote} ${resourceText}`);
  const isFlowerTwig =
    lowerNote.includes("flower") ||
    lowerNote.includes("twig") ||
    resourceTitles.some((title) => /flower|twig|integration/i.test(title));
  const isDingTalkSaveIssue =
    /钉钉|dingtalk|群|vpp/i.test(resourceText) &&
    (/save|保存|按钮|brp|mind energy/i.test(`${userNote} ${resourceText}`) || resources.length <= 2);

  if (isTwigVppDemo) {
    return {
      id: `checkpoint-${Date.now()}`,
      projectName: "TWIG API 对接与 VPP Save 行为确认",
      createdAt: now,
      updatedAt: now,
      userNote,
      goal: "把 TWIG API 对接问题、VPP Save 复现场景和对外说明合并成一份可继续推进的确认清单。",
      progress: [
        "Notion 已整理 20260616 TWIG API 对接会议问题，覆盖 EAM 投标、CM 容量报价、activation 持续上报和频率粒度。",
        "钉钉 VPP 常务会里，冯冬妮、廖家杰、李德文正在确认 Save 多次点击才响应的问题是否只在 mind energy BRP 场景出现。",
        "Claude 已辅助检查电池聚合与电网服务说明里 D-1 / D-2、Your API revenue 等表达。",
        "Terminal 里已用 AI 梳理 demo 叙事和权限/窗口捕获排查路径。"
      ],
      currentThinking:
        "主线不是单点 bug，而是要把业务规则、沟通反馈和下一步追问压缩成一个可恢复的工作断点。当前优先确认 TWIG 上报边界和 Save 复现条件。",
      blockers: [
        "POST /activations 是否需要 7x24 持续上报，以及空闲期和激活期的频率是否不同。",
        "上报粒度是否必须 1Hz，还是 2 秒 / 5 秒 / 10 秒也可接受。",
        "Save 按钮多次点击才响应的复现路径、页面位置和发生频率还没有收齐。",
        "第一次 Save 已保存后，第二次 Save 与 Cancel 的预期区别还需要后端确认。"
      ],
      nextMove: "先在钉钉群里向 George 和 Dwyane 要 Save 复现路径、页面位置和点击后的状态反馈，再回到 Notion 补齐 TWIG 上报频率与粒度问题。",
      openFirst: chooseOpenFirst(resourceTitles, [
        "钉钉 - VPP 常务会",
        "Notion - 20260616 TWIG API 对接会议沟通记录",
        "Terminal - GPT 会话：工作断点 Demo 定位与问题排查"
      ]),
      resources
    };
  }

  if (isFlowerTwig) {
    return {
      id: `checkpoint-${Date.now()}`,
      projectName: "Flower / TWIG 集成方案",
      createdAt: now,
      updatedAt: now,
      userNote,
      goal: "完成 Flower / TWIG API 集成方案对比，并形成推荐结论。",
      progress: [
        "已检查正常容量预测流程。",
        "已检查正常激活流程。",
        "已完成第 1-3 页幻灯片。",
        "已排除方案 B。"
      ],
      currentThinking:
        "倾向于采用 Emaldo 上报动态可用容量的模型，合作方不能激活超过已提交容量。",
      blockers: ["重复 activation ID 的处理规则。", "重试行为。", "Acknowledgement 是否需要唯一 ID。"],
      nextMove: "先和技术团队确认异常处理规则，然后更新第 4 页幻灯片。",
      openFirst: chooseOpenFirst(resourceTitles, [
        "集成方案提案",
        "TWIG 激活接口规范",
        "VPP 技术群"
      ]),
      resources
    };
  }

  if (isDingTalkSaveIssue) {
    return {
      id: `checkpoint-${Date.now()}`,
      projectName: "VPP Save 按钮问题",
      createdAt: now,
      updatedAt: now,
      userNote,
      goal: "排查钉钉群里反馈的 Save 按钮偶发无响应和重复保存问题。",
      progress: [
        "李德文反馈 Save 按钮需要点很多次才有反应。",
        "廖家杰在确认第一次 Save 已保存后，第二次 Save 和 Cancel 的预期区别。",
        "冯冬妮补充问题不多，主要在 mind energy 这个 BRP 场景出现。"
      ],
      currentThinking:
        "问题不像是全局故障，更可能集中在 mind energy BRP 场景下的保存状态刷新或二次点击逻辑。",
      blockers: [
        "缺少稳定复现步骤和具体页面路径。",
        "Save / Cancel 在首次保存后的二次点击预期还没有对齐。",
        "需要确认点击 Save 后是否有 loading 或状态反馈。"
      ],
      nextMove: "先在群里要复现步骤、页面路径和点击 Save 后的状态反馈，再跟后端确认保存状态。",
      openFirst: chooseOpenFirst(resourceTitles, ["VPP 常务会", "钉钉", "产品设计-后端"]),
      resources
    };
  }

  return {
    id: `checkpoint-${Date.now()}`,
    projectName: inferProjectName(resourceTitles),
    createdAt: now,
    updatedAt: now,
    userNote,
    goal: inferGoal(userNote, resourceTitles),
    progress: inferProgress(userNote),
    currentThinking: inferThinking(userNote),
    blockers: inferBlockers(userNote),
    nextMove: inferNextMove(userNote),
    openFirst: resourceTitles.slice(0, 3),
    resources
  };
}

function chooseOpenFirst(resourceTitles: string[], fallback: string[]) {
  const matches = fallback
    .map((needle) => resourceTitles.find((title) => title.toLowerCase().includes(needle.toLowerCase())) ?? needle)
    .slice(0, 3);
  return matches.length > 0 ? matches : resourceTitles.slice(0, 3);
}

function inferProjectName(resourceTitles: string[]) {
  const firstMeaningful = resourceTitles.find((title) => !/slack|dingtalk|chrome/i.test(title));
  return firstMeaningful?.replace(/^[^-—]+[-—]\s*/, "").trim() || "已捕获的工作";
}

function inferGoal(note: string, resourceTitles: string[]) {
  const doingMatch = note.match(/(?:doing|working on|complete|finish|finalize)\s+([^.!?]+)/i);
  if (doingMatch?.[1]) return `完成 ${doingMatch[1].trim()}。`;
  if (resourceTitles.length > 0) return `继续推进「${inferProjectName(resourceTitles)}」相关工作。`;
  return "基于已选择的上下文恢复当前任务。";
}

function inferProgress(note: string) {
  const progress: string[] = [];
  if (/finished|completed|done|reviewed/i.test(note)) {
    progress.push("近期的对比或检查工作已完成。");
  }
  if (/decided|ruled out|leaning/i.test(note)) {
    progress.push("已经形成当前倾向。");
  }
  return progress.length > 0 ? progress : ["已捕获选中的资源。", "已保存用户备注作为上下文。"];
}

function inferThinking(note: string) {
  const leaningMatch = note.match(/(?:leaning towards|prefer|thinking)\s+([^.!?]+)/i);
  if (leaningMatch?.[1]) return sentenceCase(leaningMatch[1].trim());
  return "当前判断来自已选择的资源和用户备注。";
}

function inferBlockers(note: string) {
  const blockedMatch = note.match(/blocked on\s+([^.!?]+)/i);
  if (!blockedMatch?.[1]) return ["继续前先明确未解决的问题。"];
  return blockedMatch[1]
    .split(/,| and /)
    .map((part) => sentenceCase(part.trim()))
    .filter(Boolean);
}

function inferNextMove(note: string) {
  const nextMatch = note.match(/(?:need to|next|return,? i need to)\s+([^.!?]+)/i);
  if (nextMatch?.[1]) return sentenceCase(nextMatch[1].trim());
  return "先打开关键资源，解决卡点，再更新当前工作产物。";
}

function sentenceCase(value: string) {
  if (!value) return value;
  const trimmed = value.replace(/\.$/, "");
  return `${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1)}.`;
}
