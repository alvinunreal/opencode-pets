# OpenCode Pets

Make OpenCode visible with a tiny desktop pet.

## Repository Map

### Overview

OpenCode Pets is an OpenCode plugin installer that bridges OpenCode agent activity to [OpenPets](https://github.com/alvinunreal/openpets) desktop pet states. It generates and installs a TypeScript plugin that maps OpenCode events (session status, tool execution, permissions) to visual pet states (thinking, running, editing, waving, success, error).

### Directory Structure

```
opencode-pets/
├── src/                          # Source code
│   ├── cli.ts                    # CLI entry point (install, print-plugin, test-event)
│   ├── install.ts                # Plugin installation and file I/O
│   ├── map-opencode-event.ts     # Event-to-state mapping logic
│   ├── plugin-template.ts        # Plugin code generation template
│   └── map-opencode-event.test.ts # Unit tests
├── codemap.md                    # Root architecture documentation
├── src/codemap.md                # Source folder documentation
├── package.json                  # Package manifest (type: module)
├── tsconfig.json                 # TypeScript configuration
└── README.md                     # User documentation
```

### Key Components

#### CLI/Plugin/Install Flow

**Entry Point**: `src/cli.ts`
- Parses command-line arguments and dispatches to handlers
- Supports three commands:
  - `install [--local-command]`: Generates and installs plugin to `.opencode/plugins/openpets.ts`
  - `print-plugin [--local-command]`: Outputs generated plugin to stdout
  - `test-event <state>`: Sends test events directly to OpenPets

**Installation**: `src/install.ts`
- `installOpenCodePets()`: Creates `.opencode/plugins/` directory, backs up existing plugins, writes new plugin
- `pluginSnippet()`: Returns generated plugin source
- Uses `node:fs/promises` for atomic file operations with timestamped backups

**Plugin Generation**: `src/plugin-template.ts`
- `openCodePluginSource()`: Returns complete TypeScript plugin as string
- Generated plugin is self-contained (no runtime dependency on opencode-pets)
- Includes inline implementations of event mapping logic

#### OpenPets Client/Core Integration

**Dependencies** (from `package.json`):
```json
"@openpets/client": "file:../openpets/packages/client"
"@openpets/core": "file:../openpets/packages/core"
```

**CLI Integration**:
- `cli.ts` imports `isOpenPetsState` and `safeSendEvent` from `@openpets/client`
- `test-event` command validates state and sends via `safeSendEvent()`

**Generated Plugin Integration**:
- Plugin spawns OpenPets CLI as child process: `bunx openpets event <state> --source opencode --type <type>`
- Uses `node:child_process.spawn()` with `stdio: "ignore"` and 500ms timeout
- Fire-and-forget pattern: errors don't block OpenCode execution

#### Event Mapping

**Source**: `src/map-opencode-event.ts`

Maps OpenCode events to OpenPets states:

| OpenCode Event | Condition | OpenPets State |
|----------------|-----------|----------------|
| `session.status` | `status: "busy"` | `thinking` |
| `session.status` | `status: "idle"` | `idle` |
| `permission.asked` | - | `waving` |
| `session.error` | - | `error` |
| `tool.execute.before` | bash + test command | `testing` |
| `tool.execute.before` | bash (non-test) | `running` |
| `tool.execute.before` | edit tool | `editing` |
| `tool.execute.before` | other tools | `working` |
| `tool.execute.after` | success | `success` |
| `tool.execute.after` | error | `error` |

**Test Detection**: `isTestCommand()` matches: `test`, `vitest`, `jest`, `pytest`, `bun test`, `npm test`

**Edit Tool Detection**: `isEditTool()` matches: `edit`, `write`, `multiedit`, `patch`, `apply_patch`

#### Privacy/Data Flow

**Data Minimization**: The generated plugin only transmits:
- `state`: OpenPets state name (thinking, running, etc.)
- `type`: Event type identifier (opencode.session.busy, etc.)
- `source`: Always "opencode"
- `timestamp`: Unix timestamp
- `tool`: Tool name when applicable (bash, edit, etc.)

**Excluded Data** (never transmitted):
- Prompts or user input
- Transcripts or conversation history
- File contents or diffs
- Shell command output
- File paths (except tool name)

**Communication Flow**:
```
OpenCode plugin event
        ↓
Generated openpets.ts plugin (in user's project)
        ↓
OpenPets CLI command (spawned process)
        ↓
Same-user OS IPC
        ↓
OpenPets desktop pet UI update
```

**Resilience**:
- OpenPets is optional - plugin continues silently if pet not running
- 500ms timeout on all pet communication
- Spawn errors are caught and ignored
- No impact on OpenCode functionality if pet unavailable

### Commands

```bash
# Install plugin (published version)
bunx opencode-pets install

# Install plugin (local development)
bun "$HOME/repos/pets/opencode-pets/src/cli.ts" install --local-command

# Preview generated plugin
opencode-pets print-plugin

# Send test events
opencode-pets test-event thinking
opencode-pets test-event testing
opencode-pets test-event success
```

### Development Setup

Requires OpenPets checked out adjacent to this repo:
```
~/repos/pets/
  openpets/          # git clone https://github.com/alvinunreal/openpets.git
  opencode-pets/     # git clone https://github.com/alvinunreal/opencode-pets.git
```

Build OpenPets first, then install and test this package:
```bash
cd openpets && bun install && bun run build
cd ../opencode-pets && bun install && bun test && bun run typecheck
```

### Architecture Patterns

1. **Plugin-as-Code**: Generates source code rather than distributing binaries
2. **Environment Adaptation**: `--local-command` flag switches between `bunx openpets` and local bun paths
3. **Backup Safety**: Existing plugins are backed up with timestamps before overwrite
4. **Dual-Use Functions**: Event mapping logic shared between CLI (for testing) and generated plugin
5. **Fail-Silent**: All pet communication is non-blocking with timeouts

---

## Quick Start

See [README.md](./README.md) for full user documentation.

## License

MIT
