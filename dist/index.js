"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.schemaIsSupported = exports.extensionIsSupported = void 0;
const commander_1 = require("commander");
const fs_1 = require("fs");
const process_1 = require("process");
const js_yaml_1 = require("js-yaml");
const path_1 = require("path");
const v3_1 = require("./generators/v3");
const options = new commander_1.Command()
    .requiredOption("-s, --source <path-to-openapi-file>", "The path to the openapi/swagger file that you want to convert to requests")
    .requiredOption("-o, --output <path-to-api-file>", "The path to the Typescript file that will contain the typed requests", "./api.ts")
    .parse(process_1.argv)
    .opts();
if ((0, fs_1.existsSync)(options.source)) {
    const contents = (0, fs_1.readFileSync)(options.source, { encoding: "utf-8" });
    const extension = (0, path_1.extname)(options.source).toLowerCase();
    if (!extensionIsSupported(extension))
        throw new Error("Only files with extensions `.yml`, `.yaml` and `.json` are supported.");
    const schema = extension === ".json" ? JSON.parse(contents) : (0, js_yaml_1.load)(contents);
    if (!schemaIsSupported(schema))
        throw new Error("This tool only works with OpenAPI v3");
    (0, fs_1.writeFileSync)(options.output, new v3_1.Generator(schema).generateTypedFunctions());
}
function extensionIsSupported(extension) {
    if ([".yml", ".yaml", ".json"].includes(extension))
        return true;
    return false;
}
exports.extensionIsSupported = extensionIsSupported;
function schemaIsSupported(schema) {
    return !("swagger" in schema || (schema.openapi && schema.openapi.slice(0, 2) !== "3."));
}
exports.schemaIsSupported = schemaIsSupported;
//# sourceMappingURL=index.js.map