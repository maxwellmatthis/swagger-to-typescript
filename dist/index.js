"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const process_1 = require("process");
const path_1 = require("path");
const commander_1 = require("commander");
const js_yaml_1 = require("js-yaml");
const utils_1 = require("./utils");
const v3_1 = require("./generators/v3");
const compose_1 = require("./compose");
function cli() {
    const options = new commander_1.Command()
        .requiredOption("-s, --source <path-to-openapi-file>", "The path to the openapi/swagger file that you want to convert to requests")
        .requiredOption("-o, --output <path-to-api-file>", "The path to the Typescript file that will contain the typed requests", "./api.ts")
        .option("-i, --inline", "If as many things as possible should be inlined or may be spread out over different interfaces and constants")
        .option("-d, --dent <n+(tab/t/space/s)>", "The amount of spaces or tabs with which to indent")
        .parse(process_1.argv)
        .opts();
    // options.indent is actually a string so lets quickly process before using
    if (typeof options.dent === "string") {
        const parts = options.dent.split("+");
        options.dent = undefined;
        if (!parts.length)
            console.warn("Please add a `+` sign between the number and type of indent");
        else if (!["t", "tab", "s", "space"].includes(parts[1]))
            console.warn("Indent type must be one of: `t`, `tab`, `s` or `space`");
        else {
            let type = parts[1];
            if (type === "t")
                type = "tab";
            else if (type === "s")
                type = "space";
            options.dent = { size: Number(parts[0]), type: type };
        }
    }
    if ((0, fs_1.existsSync)(options.source)) {
        const contents = (0, fs_1.readFileSync)(options.source, { encoding: "utf-8" });
        const extension = (0, path_1.extname)(options.source).toLowerCase();
        if (!(0, utils_1.extensionIsSupported)(extension))
            throw new Error("Only files with extensions `.yml`, `.yaml` and `.json` are supported.");
        const schema = extension === ".json" ? JSON.parse(contents) : (0, js_yaml_1.load)(contents);
        if (!(0, utils_1.schemaIsSupported)(schema))
            throw new Error("This tool only works with OpenAPIv3");
        const blueprint = (0, v3_1.generateBlueprint)(schema, options.inline || false, options.dent);
        const code = [
            ...blueprint.interfaces.map((i) => (0, compose_1.composeInterface)(i)),
            ...blueprint.constants.map((c) => (0, compose_1.composeConstant)(c)),
            ...blueprint.functions.map((f) => (0, compose_1.composeAccessorFunction)(f, options.dent))
        ].join("\n\n");
        (0, fs_1.writeFileSync)(options.output, code + "\n");
    }
    else {
        console.error(`File ${options.source} does not exist!`);
    }
}
// Prevents the code in `cli()` from running on import
if (typeof require !== 'undefined' && require.main === module) {
    cli();
}
//# sourceMappingURL=index.js.map