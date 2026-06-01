# atomic-cursor

[Atomic VCS](https://atomic.dev) integration for [Cursor](https://cursor.com).

Automatic turn recording with AI provenance, intent tracking, and knowledge graph skills.

## What it does

- **1 session = 1 view** — a draft view is created automatically when you start a Cursor session
- **Every turn records with provenance** — model, vendor, session, turn number, timing
- **Tool executions tracked** — reads, edits, shell calls captured in a causal decision graph
- **Thinking blocks captured** — agent reasoning stored as provenance nodes
- **Intent workflow** — rules prompt guides problem-first development with vault intents

## Install

### Quick start

```bash
git clone https://github.com/atomicdotdev/atomic-cursor
cd atomic-cursor
./install.sh
```

### From npm (once published)

```bash
npx atomic-cursor
```

### What install does

1. **Hooks** — runs `atomic agent enable --hooks hooks/cursor.atomic-hooks.json` to merge hook entries into `~/.cursor/hooks.json` (fires `atomic agent hooks cursor <verb>`). The hook definitions live in this repo's manifest, so updating Cursor's hook wiring never requires rebuilding `atomic`.
2. **Rules & skills** — must be copied to each project's `.cursor/rules/` directory manually (`atomic.md` plus the three skills)

### Add rules to a project

```bash
mkdir -p .cursor/rules
cp /path/to/atomic-cursor/rules/atomic.md .cursor/rules/atomic.md
```

## Prerequisites

- [Atomic VCS](https://atomic.dev) installed and on your PATH (`atomic --version`)
- A project with an `.atomic/` repository (`atomic init`)
- [Cursor](https://cursor.com) installed

## Usage

```bash
cd my-project
atomic init                                    # if not already an atomic repo
cp /path/to/atomic-cursor/rules/atomic.md .cursor/rules/  # add rules
# Open project in Cursor — hooks activate automatically
```

The hooks automatically:

1. Create a draft view when the session starts
2. Track your prompt and model info
3. Record tool executions in a provenance graph
4. Capture thinking blocks as reasoning nodes
5. Record changes with full AI attestation when a turn ends

You never need to run `atomic add` or `atomic record` — the hooks handle it.

## Viewing provenance

```bash
# Show the causal decision graph (goals → tool calls → patch)
atomic change -p <hash>

# Show inline AI attestation (model, tokens, cost)
atomic change -a <hash>

# Show session-level attestations
atomic agent attest
```

## What's in the package

| File | Purpose |
|------|---------|
| `hooks/cursor.atomic-hooks.json` | Hook manifest (source of truth) — merged into `~/.cursor/hooks.json` by `atomic agent enable --hooks` |
| `rules/atomic.md` | Agent rules — copy to `.cursor/rules/` in each project |
| `skills/atomic-vault/SKILL.md` | Vault reference (goals, intents, memory) |
| `skills/atomic-vcs/SKILL.md` | VCS inspection (status, log, change `-p`/`-a`, diff) |
| `skills/code-intelligence/SKILL.md` | Knowledge graph query patterns |
| `install.js` | Registers hooks via `atomic agent enable --hooks` |
| `install.sh` | Development install (same step) |

## How hooks work

Cursor reads hooks from `.cursor/hooks.json`. This package ships the hook definitions in `hooks/cursor.atomic-hooks.json`; `atomic agent enable --hooks` merges them in (idempotently, preserving non-Atomic hooks). They call back to `atomic agent hooks cursor <verb>`:

```
Cursor session start
  │
  ├── sessionStart → Rust creates haikunator-named draft view
  │
  ├── User sends prompt
  │   ├── beforeSubmitPrompt → Rust saves prompt + model on session
  │   ├── Agent works (edits, shell, reads)
  │   │   ├── postToolUse → Rust appends to provenance graph
  │   │   └── afterAgentThought → Rust captures reasoning blocks
  │   └── Turn ends
  │       └── stop → Rust adds files, records change with provenance
  │
  ├── User sends another prompt → repeat
  │
  └── Session ends
      └── sessionEnd → Rust creates attestation
```

## Uninstall

```bash
npx atomic-cursor --uninstall
```

Or manually:

```bash
atomic agent disable --hooks /path/to/atomic-cursor/hooks/cursor.atomic-hooks.json
```

Rules files in project `.cursor/rules/` must be removed manually.

## License

Apache-2.0 — same as [Atomic VCS](https://github.com/atomicdotdev/atomic).
