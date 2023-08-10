import cac from "cac";
import { createDevServer } from "./dev";

const cli = cac("nikola").version("1.0.0").help();

cli.command("dev [root]", "start dev server").action(async (root: string) => {
  const server = await createDevServer(root);
  await server.listen();
  server.printUrls();
});

cli
  .command("build [root]", "build in production")
  .action(async (root: string) => {
    console.log("build", root);
  });

cli.parse();
