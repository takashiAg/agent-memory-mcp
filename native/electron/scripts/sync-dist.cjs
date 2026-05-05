const { cpSync, mkdirSync, rmSync } = require("node:fs");
const path = require("node:path");

const appDir = path.resolve(__dirname, "..");
const rootDir = path.resolve(appDir, "../..");
const source = path.join(rootDir, "dist");
const target = path.join(appDir, "vendor/dist");

rmSync(target, { recursive: true, force: true });
mkdirSync(path.dirname(target), { recursive: true });
cpSync(source, target, { recursive: true });
