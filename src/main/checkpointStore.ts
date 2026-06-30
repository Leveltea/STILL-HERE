import { app } from "electron";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type { CognitiveCheckpoint } from "../shared/types.js";

const storeFileName = "checkpoints.json";

async function getStorePath() {
  const directory = path.join(app.getPath("userData"), "Save My Work");
  await mkdir(directory, { recursive: true });
  return path.join(directory, storeFileName);
}

export async function listCheckpoints(): Promise<CognitiveCheckpoint[]> {
  try {
    const storePath = await getStorePath();
    const raw = await readFile(storePath, "utf8");
    return JSON.parse(raw) as CognitiveCheckpoint[];
  } catch {
    return [];
  }
}

export async function saveCheckpoint(checkpoint: CognitiveCheckpoint): Promise<CognitiveCheckpoint[]> {
  const checkpoints = await listCheckpoints();
  const nextCheckpoint = { ...checkpoint, updatedAt: new Date().toISOString() };
  const existingIndex = checkpoints.findIndex((item) => item.id === checkpoint.id);
  const next =
    existingIndex >= 0
      ? checkpoints.map((item) => (item.id === checkpoint.id ? nextCheckpoint : item))
      : [nextCheckpoint, ...checkpoints];

  const storePath = await getStorePath();
  await writeFile(storePath, JSON.stringify(next, null, 2), "utf8");
  return next;
}

export async function deleteCheckpoint(id: string): Promise<CognitiveCheckpoint[]> {
  const checkpoints = await listCheckpoints();
  const next = checkpoints.filter((checkpoint) => checkpoint.id !== id);
  const storePath = await getStorePath();
  await writeFile(storePath, JSON.stringify(next, null, 2), "utf8");
  return next;
}

export async function resetCheckpoints(): Promise<CognitiveCheckpoint[]> {
  const storePath = await getStorePath();
  await rm(storePath, { force: true });
  return [];
}
