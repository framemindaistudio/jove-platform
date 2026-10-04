#!/usr/bin/env node
/**
 * JOVE HQ — environment generator.
 * Asks for your team logins (passwords are hidden while you type and are never stored),
 * then prints the block to paste into Vercel → Project → Settings → Environment Variables.
 *
 *   node scripts/make-hq-env.mjs
 *
 * Nothing is written to disk and nothing is sent anywhere. Only the sha256 hash of each
 * password appears in the output.
 */
import readline from "node:readline";
import { createHash, randomBytes } from "node:crypto";

const ROLES = ["founder", "admin", "ops", "trainer", "media"];
const DEFAULTS = [
  { username: "shiva", name: "Shivaprasad Reddy S S", role: "founder" },
  { username: "chinmay", name: "Chinmay R M", role: "founder" },
];

// One reader for the whole session. While a password is being typed, echo is muted.
const tty = !!process.stdin.isTTY;
const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: tty });
let muted = false;
const echo = rl._writeToOutput.bind(rl);
rl._writeToOutput = (s) => {
  if (!muted) echo(s);
};
const lines = rl[Symbol.asyncIterator]();

async function ask(question, { hidden = false, fallback = "" } = {}) {
  process.stdout.write(question);
  muted = hidden;
  const { value, done } = await lines.next();
  muted = false;
  if (hidden || !tty) process.stdout.write("\n");
  if (done) {
    console.error("Input ended before all questions were answered.");
    process.exit(1);
  }
  return String(value ?? "").trim() || fallback;
}

async function askPassword(label) {
  for (;;) {
    const a = await ask(`  ${label} password (hidden, at least 10 characters): `, { hidden: true });
    if (a.length < 10) {
      console.log("  Too short — use at least 10 characters.");
      continue;
    }
    const b = await ask("  Type it again: ", { hidden: true });
    if (a !== b) {
      console.log("  The two entries did not match. Try again.");
      continue;
    }
    return a;
  }
}

console.log("\nJOVE HQ — environment generator\nPress Enter to accept a [default].\n");

const users = [];
for (let i = 0; ; i++) {
  const d = DEFAULTS[i] || { username: "", name: "", role: "trainer" };
  console.log(`User ${i + 1}`);
  const username = (await ask(`  Username${d.username ? ` [${d.username}]` : ""}: `, { fallback: d.username })).toLowerCase().replace(/\s+/g, "");
  if (!username) {
    console.log("  A username is required.");
    i--;
    continue;
  }
  const name = await ask(`  Full name${d.name ? ` [${d.name}]` : ""}: `, { fallback: d.name || username });
  let role = await ask(`  Role (${ROLES.join(" / ")}) [${d.role}]: `, { fallback: d.role });
  if (!ROLES.includes(role)) role = d.role;
  const password = await askPassword(username);
  users.push({ username, name, role, password: "sha256:" + createHash("sha256").update(password).digest("hex") });
  const more = await ask("\nAdd another user? [y/N]: ", { fallback: i + 1 < DEFAULTS.length ? "y" : "n" });
  if (!/^y/i.test(more)) break;
  console.log("");
}

const dataRepo = await ask("\nPrivate data repo (owner/name) [framemindaistudio/jove-hq-data]: ", { fallback: "framemindaistudio/jove-hq-data" });
const siteUrl = await ask("Public site URL [https://your-project.vercel.app]: ", { fallback: "https://your-project.vercel.app" });
rl.close();

const line = "─".repeat(72);
console.log(`\n${line}\nPaste these into Vercel → Project → Settings → Environment Variables\n(Production and Preview), then redeploy.\n${line}\n`);
console.log(`HQ_SESSION_SECRET=${randomBytes(32).toString("hex")}`);
console.log(`HQ_USERS=${JSON.stringify(users)}`);
console.log(`GITHUB_REPO=${dataRepo}`);
console.log("GITHUB_BRANCH=main");
console.log("GITHUB_TOKEN=<paste the fine-grained token you created for the data repo>");
console.log(`NEXT_PUBLIC_SITE_URL=${siteUrl}`);
console.log(`\n${line}`);
console.log("Optional (shown on the public site when set):");
console.log("NEXT_PUBLIC_CONTACT_EMAIL=   NEXT_PUBLIC_CONTACT_PHONE=   NEXT_PUBLIC_WHATSAPP=   (digits with country code, e.g. 919876543210)");
console.log("NEXT_PUBLIC_LOCATION=   NEXT_PUBLIC_INSTAGRAM=   NEXT_PUBLIC_YOUTUBE=   NEXT_PUBLIC_LINKEDIN=");
console.log(`${line}\nLogins created: ${users.map((u) => `${u.username} (${u.role})`).join(", ")}\nKeep HQ_SESSION_SECRET and GITHUB_TOKEN secret. They belong only in Vercel.\n`);
