import { InlineConfig, build as viteBuild } from "vite";
import { CLIENT_ENTRY_PATH, SERVER_ENTRY_PATH } from "./constants";
import * as path from "path";
export async function bundle(root: string) {
  try {
    const resolveViteConfig = (isServer: boolean): InlineConfig => {
      return {
        mode: "production",
        root,
        build: {
          ssr: isServer,
          outDir: isServer ? ".temp" : "build",
          rollupOptions: {
            input: isServer ? SERVER_ENTRY_PATH : CLIENT_ENTRY_PATH,
            output: {
              format: isServer ? "cjs" : "esm",
            },
          },
        },
      };
    };
    const clientBuild = async () => {
      return viteBuild(resolveViteConfig(false));
    };

    const serverBuild = async () => {
      return viteBuild(resolveViteConfig(true));
    };
    console.log("Building client + server bundles...");
    const [clientBundle, serverBundle] = await Promise.all([
      clientBuild(),
      serverBuild(),
    ]);
    return [clientBundle, serverBundle];
  } catch (e) {
    console.log(e);
  }
}

export async function build(root: string) {
  const [clientBundle, serverBundle] = await bundle(root);
  const serverEntryPath = path.join(root, ".temp", "ssr-entry.js");
  const { render } = require(serverEntryPath);
}
