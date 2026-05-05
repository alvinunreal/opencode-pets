# src/

Source code for the opencode-pets CLI and plugin generation system.

## Responsibility

- CLI entry point with command routing (`cli.ts`)
- Plugin installation and file I/O (`install.ts`)
- OpenCode event to OpenPets state mapping logic (`map-opencode-event.ts`)
- Plugin template generation (`plugin-template.ts`)
- Unit tests for event mapping (`map-opencode-event.test.ts`)

## Design

**Separation of Concerns**: 
- `cli.ts` handles argument parsing and command dispatch
- `install.ts` manages file system operations and backup logic
- `map-opencode-event.ts` contains pure mapping functions (used both in CLI and generated plugin)
- `plugin-template.ts` exports a template function that generates self-contained plugin code

**Template Pattern**: `plugin-template.ts` exports `openCodePluginSource()` which returns a complete TypeScript plugin as a string. This allows the generated plugin to be self-contained without requiring this package as a runtime dependency.

**Shared Logic**: Event mapping functions in `map-opencode-event.ts` are tested and then their logic is duplicated (in simplified form) in the generated plugin template to ensure the plugin works standalone.

## Flow

```
cli.ts main()
    ├── install command → installOpenCodePets() → writes plugin to .opencode/plugins/
    ├── print-plugin command → outputs plugin to stdout for inspection
    └── test-event command → safeSendEvent() via @openpets/client

Generated plugin (from plugin-template.ts):
    OpenCode event → send() → spawn openpets CLI → pet state update
```

## Integration

**Internal Dependencies**:
- `cli.ts` imports from `install.ts` and `@openpets/client`
- `install.ts` imports from `plugin-template.ts`
- Tests import from `map-opencode-event.ts` and `install.ts`

**External Dependencies**:
- `@openpets/client`: `isOpenPetsState`, `safeSendEvent` for CLI test command
- `@openpets/core`: Core types and event system
- `node:fs/promises`, `node:path`, `node:child_process`: File and process operations

**CLI Commands**:
- `install [--local-command]`: Install plugin to .opencode/plugins/openpets.ts
- `print-plugin [--local-command]`: Preview generated plugin
- `test-event <state>`: Send test event to OpenPets

**Event Mapping Logic**:
- `mapOpenCodeEvent()`: Maps session and permission events
- `mapToolExecuteBefore()`: Determines state from tool type and command
- `mapToolExecuteAfter()`: Maps tool success/failure
- Helpers: `isTestCommand()`, `isBashTool()`, `isEditTool()`
