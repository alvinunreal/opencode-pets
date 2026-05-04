import { describe, expect, it } from "bun:test";
import { isEditTool, isTestCommand, mapOpenCodeEvent, mapToolExecuteAfter, mapToolExecuteBefore } from "./map-opencode-event.js";
import { pluginSnippet } from "./install.js";

describe("OpenCode event mapping", () => {
  it("maps session events", () => {
    expect(mapOpenCodeEvent({ type: "session.status", properties: { status: { type: "busy" } } })).toMatchObject({ state: "thinking" });
    expect(mapOpenCodeEvent({ type: "session.status", properties: { status: { type: "idle" } } })).toMatchObject({ state: "idle" });
    expect(mapOpenCodeEvent({ type: "permission.asked" })).toMatchObject({ state: "waving" });
    expect(mapOpenCodeEvent({ type: "session.error" })).toMatchObject({ state: "error" });
  });

  it("maps tool before events", () => {
    expect(mapToolExecuteBefore({ tool: "bash", args: { command: "bun test" } })).toMatchObject({ state: "testing", tool: "bash" });
    expect(mapToolExecuteBefore({ tool: "bash", args: { command: "ls" } })).toMatchObject({ state: "running" });
    expect(mapToolExecuteBefore({ tool: "Edit" })).toMatchObject({ state: "editing" });
    expect(mapToolExecuteBefore({ tool: "Read" })).toMatchObject({ state: "working" });
  });

  it("maps tool after events", () => {
    expect(mapToolExecuteAfter({ tool: "bash" }, { state: { status: "done" } })).toMatchObject({ state: "success" });
    expect(mapToolExecuteAfter({ tool: "bash" }, { state: { status: "error" } })).toMatchObject({ state: "error" });
  });

  it("detects test and edit tools", () => {
    expect(isTestCommand("npm test")).toBe(true);
    expect(isEditTool("apply_patch")).toBe(true);
  });

  it("prints self-contained protocol helper", () => {
    const plugin = pluginSnippet();
    expect(plugin).toContain("OPENPETS_BASE_URL");
    expect(plugin).toContain("/health");
    expect(plugin).toContain("/event");
    expect(plugin).toContain("OpenPets is optional");
  });
});
