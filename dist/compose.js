"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.composeAccessorFunction = exports.composeConstant = exports.composeInterface = exports.composeJsDoc = void 0;
const utils_1 = require("./utils");
/**
 * Composes a simple jsDoc for something
 * @returns the jsDoc as a string
 */
function composeJsDoc(lines) {
    if (lines.length === 0)
        return "";
    else if (lines.length === 1)
        return `/** ${lines[0]} */\n`;
    else
        return `/**\n * ${lines.join("\n * ")}\n */\n`;
}
exports.composeJsDoc = composeJsDoc;
;
/**
 * Composes an interface to be used a part of another type
 * @param blueprint the blueprint
 * @returns the interface as a string
 */
function composeInterface(blueprint) {
    return `${composeJsDoc(blueprint.jsDocLines)}export interface ${blueprint.name} ${blueprint.schema};`;
}
exports.composeInterface = composeInterface;
/**
 * Composes a constant
 * @param blueprint the blueprint
 * @returns the constant as a string
 */
function composeConstant(blueprint) {
    return `${composeJsDoc(blueprint.jsDocLines)}export const ${blueprint.name}${blueprint.type ? ": " + blueprint.type : ""} = ${blueprint.value};`;
}
exports.composeConstant = composeConstant;
/**
 * Composes a function that offers type safe access to an API endpoint
 * @param blueprint the blueprint
 * @returns the function as a string
 */
// TODO: add a different way of deserializing other than `await r.json()` for non-json data
const composeAccessorFunction = (blueprint) => `${composeJsDoc(blueprint.jsDocLines)}export async function ${blueprint.name}(${(0, utils_1.joinArguments)(blueprint.funcParams, 40)}): Promise<Res<${blueprint.responseSignature}>> {
  try {
    const r = await fetch(${(0, utils_1.joinArguments)(blueprint.fetchParams, 60, 4, 2)});
    try {
      return { ok: r.ok, data: ${blueprint.autoResultPreprocessing} };
    } catch (e) {
      return { ok: r.ok };
    }
  } catch (e) {
    console.error(e);
    return { ok: false, networkError: true };
  }
}`;
exports.composeAccessorFunction = composeAccessorFunction;
//# sourceMappingURL=compose.js.map