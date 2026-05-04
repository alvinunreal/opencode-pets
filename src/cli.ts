#!/usr/bin/env bun
import { isOpenPetsState, safeSendEvent } from "@openpets/client";
import { resolve } from "node:path";
import { installOpenCodePets, pluginSnippet } from "./install.js";

const PUBLISHED_OPENPETS_COMMAND = ["bunx", "openpets"];
const LOCAL_OPENPETS_COMMAND = ["bun", resolve(import.meta.dir, "../../openpets/packages/cli/src/index.ts")];

async function main(argv: string[]) {
  const [command, ...rest] = argv;
  switch (command) {
    case "install": {
      const useLocalCommand = rest.includes("--local-command");
      const targetPath = await installOpenCodePets({ command: useLocalCommand ? LOCAL_OPENPETS_COMMAND : PUBLISHED_OPENPETS_COMMAND });
      console.log(`Installed OpenCode OpenPets plugin to ${targetPath}`);
      return 0;
    }
    case "print-plugin":
      console.log(pluginSnippet(rest.includes("--local-command") ? LOCAL_OPENPETS_COMMAND : PUBLISHED_OPENPETS_COMMAND));
      return 0;
    case "test-event":
      return testEvent(rest);
    case "help":
    case "--help":
    case "-h":
    case undefined:
      printHelp();
      return 0;
    default:
      console.error(`Unknown command: ${command}`);
      printHelp();
      return 1;
  }
}

async function testEvent(args: string[]) {
  const [state] = args;
  if (!isOpenPetsState(state)) {
    console.error(`Invalid OpenPets state: ${state ?? "<missing>"}`);
    return 1;
  }
  const result = await safeSendEvent({ state, source: "opencode-pets", type: `opencode-pets.test.${state}` });
  if (!result.ok) {
    console.error(result.error.message);
    return 1;
  }
  return 0;
}

function printHelp() {
  console.log(`opencode-pets

Usage:
  opencode-pets install
  opencode-pets install --local-command
  opencode-pets print-plugin [--local-command]
  opencode-pets test-event <state>
`);
}

const exitCode = await main(Bun.argv.slice(2));
process.exit(exitCode);
