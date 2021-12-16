import { Command } from "commander";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { argv } from "process";
import { load } from "js-yaml";
import { extname } from "path";
import { Generator } from "./generators/v3";
import { OpenAPIv3 } from "./openapi-v3";

const options: {
  source: string,
  output: string;
} = new Command()
  .requiredOption("-s, --source <path-to-openapi-file>", "The path to the openapi/swagger file that you want to convert to requests")
  .requiredOption("-o, --output <path-to-api-file>", "The path to the Typescript file that will contain the typed requests", "./api.ts")
  .parse(argv)
  .opts();

if (existsSync(options.source)) {
  const contents = readFileSync(options.source, { encoding: "utf-8" });
  const extension = extname(options.source).toLowerCase();
  if (!extensionIsSupported(extension)) throw new Error("Only files with extensions `.yml`, `.yaml` and `.json` are supported.");
  const schema: OpenAPIv3 = extension === ".json" ? JSON.parse(contents) : load(contents);
  if (!schemaIsSupported(schema)) throw new Error("This tool only works with OpenAPI v3");

  writeFileSync(options.output, new Generator(schema).generateTypedFunctions());
}

export function extensionIsSupported(extension: string): boolean {
  if ([".yml", ".yaml", ".json"].includes(extension)) return true;
  return false;
}

export function schemaIsSupported(schema: OpenAPIv3) {
  return !("swagger" in schema || (schema.openapi && schema.openapi.slice(0, 2) !== "3."));
}
