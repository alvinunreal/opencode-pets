import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { openCodePluginSource } from "./plugin-template.js";

export function pluginSnippet() {
  return openCodePluginSource();
}

export async function installOpenCodePets() {
  const targetPath = resolve(process.cwd(), ".opencode", "plugins", "openpets.ts");
  await mkdir(dirname(targetPath), { recursive: true });
  if (await fileExists(targetPath)) await copyFile(targetPath, `${targetPath}.bak-${Date.now()}`);
  await writeFile(targetPath, pluginSnippet());
  return targetPath;
}

async function fileExists(path: string) {
  try {
    await readFile(path);
    return true;
  } catch {
    return false;
  }
}
