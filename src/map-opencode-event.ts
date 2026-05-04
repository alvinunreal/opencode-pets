import { createManualEvent, type OpenPetsEvent, type OpenPetsState } from "@openpets/client";

export function mapOpenCodeEvent(input: unknown): OpenPetsEvent | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const record = input as Record<string, unknown>;
  const type = record.type;
  const properties = isRecord(record.properties) ? record.properties : {};

  if (type === "session.status") {
    const status = isRecord(properties.status) ? properties.status.type : undefined;
    if (status === "busy") return event("thinking", "opencode.session.busy");
    if (status === "idle") return event("idle", "opencode.session.idle");
  }
  if (type === "permission.asked") return event("waving", "opencode.permission.asked");
  if (type === "session.error") return event("error", "opencode.session.error");
  return null;
}

export function mapToolExecuteBefore(input: unknown): OpenPetsEvent {
  const record = isRecord(input) ? input : {};
  const tool = typeof record.tool === "string" ? record.tool : String(record.tool ?? "");
  const args = isRecord(record.args) ? record.args : {};
  const nestedInput = isRecord(record.input) ? record.input : {};
  const command = typeof args.command === "string" ? args.command : typeof nestedInput.command === "string" ? nestedInput.command : "";
  const state = isBashTool(tool) && isTestCommand(command) ? "testing" : isBashTool(tool) ? "running" : isEditTool(tool) ? "editing" : "working";
  return event(state, "opencode.tool.before", { tool });
}

export function mapToolExecuteAfter(input: unknown, output: unknown): OpenPetsEvent {
  const inputRecord = isRecord(input) ? input : {};
  const outputRecord = isRecord(output) ? output : {};
  const outputState = isRecord(outputRecord.state) ? outputRecord.state : {};
  const failed = outputState.status === "error";
  const tool = typeof inputRecord.tool === "string" ? inputRecord.tool : String(inputRecord.tool ?? "");
  return event(failed ? "error" : "success", failed ? "opencode.tool.error" : "opencode.tool.success", { tool });
}

export function isTestCommand(command: unknown) {
  return /\b(test|vitest|jest|pytest|bun test|npm test)\b/i.test(String(command ?? ""));
}

export function isBashTool(tool: unknown) {
  return String(tool ?? "").toLowerCase() === "bash";
}

export function isEditTool(tool: unknown) {
  return /^(edit|write|multiedit|patch|apply_patch)$/i.test(String(tool ?? ""));
}

function event(state: OpenPetsState, type: string, extra: { tool?: string } = {}) {
  return createManualEvent(state, {
    source: "opencode",
    type,
    ...(extra.tool ? { tool: extra.tool } : {}),
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
