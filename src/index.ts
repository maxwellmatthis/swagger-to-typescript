import { existsSync, readFileSync, writeFileSync } from "fs";
import { argv } from "process";
import { extname } from "path";
import { Command } from "commander";
import { load } from "js-yaml";
import { extensionIsSupported, schemaIsSupported } from "./utils";
import { generateBlueprint } from "./generators/v3";
import { OpenAPIv3 } from "./types/openapi-v3";
import { composeAccessorFunction, composeInterface, composeConstant } from "./compose";

function cli() {
  const options: {
    source: string,
    output: string,
    inline?: boolean,
  } = new Command()
    .requiredOption("-s, --source <path-to-openapi-file>", "The path to the openapi/swagger file that you want to convert to requests")
    .requiredOption("-o, --output <path-to-api-file>", "The path to the Typescript file that will contain the typed requests", "./api.ts")
      .option("-i, --inline", "If as many things as possible should be inlined or may be spread out over different interfaces and constants")
      .parse(argv)
      .opts();

  if (existsSync(options.source)) {
    const contents = readFileSync(options.source, { encoding: "utf-8" });
    const extension = extname(options.source).toLowerCase();
    if (!extensionIsSupported(extension)) throw new Error("Only files with extensions `.yml`, `.yaml` and `.json` are supported.");
    const schema: OpenAPIv3 = extension === ".json" ? JSON.parse(contents) : load(contents);
    if (!schemaIsSupported(schema)) throw new Error("This tool only works with OpenAPIv3");

    const blueprint = generateBlueprint(schema, options.inline || false);
    const code = [
      ...blueprint.interfaces.map((i) => composeInterface(i)),
      ...blueprint.constants.map((c) => composeConstant(c)),
      ...blueprint.functions.map((f) => composeAccessorFunction(f))
    ].join("\n\n");

    writeFileSync(options.output, code + "\n");
  } else {
    console.error(`File ${options.source} does not exist!`);
  }
}

// Prevents the code in `cli()` from running on import
if (typeof require !== 'undefined' && require.main === module) {
  cli();
}
