# opencode-pets/

OpenCode plugin installer for OpenPets desktop pet status updates. Bridges OpenCode agent activity to visual desktop pet states.

## Responsibility

- Installs an OpenCode plugin that maps agent events to OpenPets desktop pet states
- Provides CLI commands for plugin installation, preview, and testing
- Generates TypeScript plugin code that integrates with OpenCode's plugin system
- Sends state updates to OpenPets via CLI command execution

## Design

**Plugin-as-Code Generation**: Rather than distributing a pre-built plugin, this package generates TypeScript source code tailored to the user's environment (local dev vs published package).

**Non-Intrusive Integration**: OpenPets is optional - if the pet runtime isn't available, OpenCode continues normally. All pet communication is fire-and-forget with timeouts.

**Privacy-First Event Mapping**: Only state metadata flows to OpenPets (state name, event type, source, timestamp, tool name). No prompts, transcripts, diffs, shell output, or file contents are transmitted.

**Dual Command Modes**: Supports both local development (direct bun execution) and published package (bunx) workflows.

## Flow

```
User runs: opencode-pets install
    ↓
install.ts generates plugin via plugin-template.ts
    ↓
Writes to: ./.opencode/plugins/openpets.ts
    ↓
OpenCode loads plugin on next session
    ↓
OpenCode events → map-opencode-event.ts logic (in generated plugin)
    ↓
Plugin spawns: bunx openpets event <state> --source opencode --type <event>
    ↓
@openpets/client → @openpets/core → desktop pet UI update
```

## Integration

**Upstream**: OpenCode (via plugin system) - receives session.status, permission.asked, session.error, tool.execute.before/after events

**Downstream**: OpenPets CLI - spawns child process to send events via `@openpets/client` APIs

**Local Dependencies**: `@openpets/client` and `@openpets/core` are local file dependencies for development

**Event State Mapping**:
- `session.status: busy` → `thinking`
- `session.status: idle` → `idle`
- `permission.asked` → `waving`
- `session.error` → `error`
- `tool.execute.before` + bash + test command → `testing`
- `tool.execute.before` + bash → `running`
- `tool.execute.before` + edit tool → `editing`
- `tool.execute.before` + other → `working`
- `tool.execute.after` + success → `success`
- `tool.execute.after` + error → `error`
