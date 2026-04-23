#!/usr/bin/env node

/**
 * atomic-cursor install
 *
 * Installs Atomic hooks into ~/.cursor/hooks.json (via atomic CLI or manual merge)
 * and provides instructions for adding rules to projects.
 *
 * Usage:
 *   npx atomic-cursor            # install from npm
 *   node install.js              # install from local checkout
 *   node install.js --silent     # postinstall (no output on success)
 *   node install.js --uninstall  # remove hooks
 */

const fs = require("fs");
const path = require("path");
const os = require("os");
const { execSync } = require("child_process");

const silent = process.argv.includes("--silent");
const uninstall = process.argv.includes("--uninstall");

const PKG_DIR = __dirname;
const HOOKS_TARGET = path.join(os.homedir(), ".cursor", "hooks.json");
const ATOMIC_PREFIX = "atomic agent hooks cursor";

function tryExec(cmd) {
  try {
    execSync(cmd, { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

function readHooksJson(filePath) {
  try {
    if (!fs.existsSync(filePath)) return { version: 1, hooks: {} };
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return { version: 1, hooks: {} };
  }
}

function writeHooksJson(filePath, data) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n");
}

function hasAtomicHook(hooks, eventName) {
  const entries = hooks[eventName] || [];
  return entries.some((e) => e.command && e.command.includes(ATOMIC_PREFIX));
}

function doInstall() {
  // Try atomic CLI first
  const hasAtomic = tryExec("atomic --version");
  if (hasAtomic) {
    const installed = tryExec("atomic agent enable --agent cursor --global");
    if (!silent) {
      if (installed) {
        console.log("  hooks: installed via atomic CLI into ~/.cursor/hooks.json");
      } else {
        console.log("  hooks: atomic CLI install failed, trying manual merge");
      }
    }

    // Verify it worked
    if (installed && fs.existsSync(HOOKS_TARGET)) {
      const existing = readHooksJson(HOOKS_TARGET);
      if (hasAtomicHook(existing.hooks || {}, "sessionStart")) {
        if (!silent) {
          console.log();
          console.log("✓ atomic-cursor installed");
          printProjectInstructions();
        }
        return;
      }
    }
  }

  // Manual merge fallback
  const source = readHooksJson(path.join(PKG_DIR, "hooks.json"));
  const target = readHooksJson(HOOKS_TARGET);

  if (!target.hooks) target.hooks = {};
  let added = 0;

  for (const [event, entries] of Object.entries(source.hooks || {})) {
    if (!target.hooks[event]) target.hooks[event] = [];
    for (const entry of entries) {
      if (!target.hooks[event].some((e) => e.command.includes(ATOMIC_PREFIX))) {
        target.hooks[event].push(entry);
        added++;
      }
    }
  }

  if (added > 0) {
    writeHooksJson(HOOKS_TARGET, target);
  }

  if (!silent) {
    console.log(`  hooks: ${added > 0 ? `merged ${added} hooks` : "already installed"} in ~/.cursor/hooks.json`);
    console.log();
    console.log("✓ atomic-cursor installed");
    printProjectInstructions();
  }
}

function doUninstall() {
  // Try atomic CLI first
  const hasAtomic = tryExec("atomic --version");
  if (hasAtomic) {
    tryExec("atomic agent disable --agent cursor --global");
  }

  // Also do manual removal
  if (fs.existsSync(HOOKS_TARGET)) {
    const target = readHooksJson(HOOKS_TARGET);
    let removed = 0;

    for (const event of Object.keys(target.hooks || {})) {
      const before = target.hooks[event].length;
      target.hooks[event] = target.hooks[event].filter(
        (e) => !e.command || !e.command.includes(ATOMIC_PREFIX)
      );
      removed += before - target.hooks[event].length;
      if (target.hooks[event].length === 0) delete target.hooks[event];
    }

    if (removed > 0) writeHooksJson(HOOKS_TARGET, target);

    if (!silent) {
      console.log(`  hooks: removed ${removed} hooks from ~/.cursor/hooks.json`);
    }
  }

  if (!silent) {
    console.log();
    console.log("✓ atomic-cursor uninstalled");
    console.log("  Note: .cursor/rules/atomic.md in projects must be removed manually.");
  }
}

function printProjectInstructions() {
  console.log();
  console.log("  To add Atomic rules to a project:");
  console.log("    mkdir -p .cursor/rules");
  console.log(`    cp ${path.join(PKG_DIR, "rules", "atomic.md")} .cursor/rules/atomic.md`);
  console.log();
}

if (uninstall) {
  doUninstall();
} else {
  doInstall();
}
