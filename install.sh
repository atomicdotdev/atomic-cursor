#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# 1. Install hooks via atomic CLI
if command -v atomic &>/dev/null; then
  echo "Installing hooks..."
  atomic agent enable --agent cursor --global 2>/dev/null && echo "  hooks: installed into ~/.cursor/hooks.json" || echo "  hooks: using manual install"
else
  echo "Warning: 'atomic' not found on PATH."
  echo "  Install Atomic VCS first, then run: atomic agent enable --agent cursor --global"
fi

# 2. Copy rules for project use
echo ""
echo "✓ Installed atomic-cursor"
echo ""
echo "  To add Atomic rules to a project:"
echo "    mkdir -p .cursor/rules"
echo "    cp $SCRIPT_DIR/rules/atomic.md .cursor/rules/atomic.md"
echo ""
echo "  Skills (copy to project .cursor/rules/ as needed):"
echo "    cp $SCRIPT_DIR/skills/atomic-vault/SKILL.md .cursor/rules/atomic-vault.md"
echo "    cp $SCRIPT_DIR/skills/code-intelligence/SKILL.md .cursor/rules/code-intelligence.md"
