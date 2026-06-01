#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MANIFEST="$SCRIPT_DIR/hooks/cursor.atomic-hooks.json"

HOOKS_STATUS="not installed"

# 1. Register hooks by delegating the merge to the atomic binary. The manifest
#    in this repo is the source of truth — when Cursor changes its hook schema,
#    edit the manifest and re-publish; no `atomic` rebuild needed.
if command -v atomic &>/dev/null; then
  echo "Installing hooks..."
  if atomic agent enable --hooks "$MANIFEST"; then
    HOOKS_STATUS="registered via atomic agent enable"
  else
    HOOKS_STATUS="enable failed — see output above"
  fi
else
  HOOKS_STATUS="SKIPPED — 'atomic' not on PATH"
  echo "Warning: 'atomic' not found on PATH."
  echo "  Install Atomic VCS first, then run:"
  echo "    atomic agent enable --hooks \"$MANIFEST\""
fi

cat <<EOF

────────────────────────────────────────────────────────────
✓ Installed atomic-cursor
────────────────────────────────────────────────────────────

What was installed:
  • Hooks      ${HOOKS_STATUS}
               → ~/.cursor/hooks.json (merged from this repo's manifest by
                 'atomic agent enable --hooks'; hook definitions live in
                 ${MANIFEST})

Manual steps to finish (per project):
  1. Add the Atomic rule and skills to the project:
       mkdir -p .cursor/rules
       cp "${SCRIPT_DIR}/rules/atomic.md" .cursor/rules/atomic.md
       cp "${SCRIPT_DIR}/skills/atomic-vault/SKILL.md" .cursor/rules/atomic-vault.md
       cp "${SCRIPT_DIR}/skills/atomic-vcs/SKILL.md" .cursor/rules/atomic-vcs.md
       cp "${SCRIPT_DIR}/skills/code-intelligence/SKILL.md" .cursor/rules/code-intelligence.md
  2. Ensure the project is an Atomic repo (one-time):
       cd /path/to/your/project && atomic init
  3. Open the project in Cursor — hooks fire automatically.

Verify:
  • Hooks: grep -q "atomic agent hooks cursor" ~/.cursor/hooks.json && echo OK
  • Rules: ls .cursor/rules/   (inside a configured project)

Uninstall:
  ./install.sh is install-only; to remove run:
    node install.js --uninstall
  (or: atomic agent disable --hooks "${MANIFEST}")
────────────────────────────────────────────────────────────
EOF
