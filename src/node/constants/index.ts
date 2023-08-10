import * as path from "path";

export const PACKAGE_ROOT = path.join(__dirname, "..", "..", "..");

export const CLIENT_ENTRY_PATH = path.join(
  PACKAGE_ROOT,
  "src",
  "runtime",
  "client-entry.tsx"
);

export const DEFAULT_TEMPLATE_PATH = path.join(PACKAGE_ROOT, "template.html");
