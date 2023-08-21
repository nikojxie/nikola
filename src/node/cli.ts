import { cac } from "cac";
import { createDevServer } from "./dev";
import { build } from "./build";
import { resolve } from "path";

const version = require("../../package.json").version;
const cli = cac("nikola").version(version).help();

cli
  .command("[root]", "start dev server")
  .alias("dev")
  .action(async (root: string) => {
    root = root ? resolve(root) : process.cwd();
    const server = await createDevServer(root);
    await server.listen();
    server.printUrls();
  });

cli
  .command("build [root]", "build in production")
  .action(async (root: string) => {
    try {
      root = resolve(root);
      await build(root);
    } catch (e) {
      console.log(e);
    }
  });

cli.parse();
