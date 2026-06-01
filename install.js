#!/usr/bin/env node

/**
 * atomic-cursor install
 *
 * Registers Atomic hooks into ~/.cursor/hooks.json by delegating to
 *   atomic agent enable --hooks hooks/cursor.atomic-hooks.json
 * The manifest in this repo is the source of truth — when Cursor changes its
 * hook schema you edit the manifest and re-publish; no `atomic` rebuild needed.
 * The merge engine ships with `atomic` (no node/jq/sudo/extra runtime).
 *
 * Usage:
 *   npx atomic-cursor            # install from npm
 *   node install.js              # install from local checkout
 *   node install.js --silent     # postinstall (no output on success)
 *   node install.js --uninstall  # remove hooks
 */

const path = require("path");
const { execSync } = require("child_process");

const silent = process.argv.includes("--silent");
const uninstall = process.argv.includes("--uninstall");

const PKG_DIR = __dirname;
const MANIFEST = path.join(PKG_DIR, "hooks", "cursor.atomic-hooks.json");

function tryExec(cmd) {
  try {
    return execSync(cmd, { encoding: "utf8" });
  } catch {
    return null;
  }
}

function printProjectInstructions() {
  console.log();
  console.log("  To add Atomic rules + skills to a project:");
  console.log("    mkdir -p .cursor/rules");
  console.log(
    `    cp ${path.join(PKG_DIR, "rules", "atomic.md")} .cursor/rules/atomic.md`,
  );
  for (const name of ["atomic-vault", "atomic-vcs", "code-intelligence"]) {
    console.log(
      `    cp ${path.join(PKG_DIR, "skills", name, "SKILL.md")} .cursor/rules/${name}.md`,
    );
  }
  console.log();
}

function doInstall() {
  if (tryExec("atomic --version") === null) {
    if (!silent) {
      console.warn("  hooks: skipped (atomic not found on PATH)");
      console.warn(
        `         after installing Atomic, run: atomic agent enable --hooks "${MANIFEST}"`,
      );
    }
  } else {
    const out = tryExec(`atomic agent enable --hooks "${MANIFEST}"`);
    if (!silent) {
      if (out) process.stdout.write(out);
      console.log(
        out
          ? "  hooks: registered via atomic agent enable --hooks → ~/.cursor/hooks.json"
          : "  hooks: enable failed (see output above)",
      );
    }
  }

  if (!silent) {
    console.log();
    console.log("✓ atomic-cursor installed");
    printProjectInstructions();
  }
}

function doUninstall() {
  if (tryExec("atomic --version") !== null) {
    const out = tryExec(`atomic agent disable --hooks "${MANIFEST}"`);
    if (!silent && out) process.stdout.write(out);
  }
  if (!silent) {
    console.log();
    console.log("✓ atomic-cursor uninstalled");
    console.log(
      "  Note: .cursor/rules/ files in projects must be removed manually.",
    );
  }
}

if (uninstall) {
  doUninstall();
} else {
  doInstall();
}
