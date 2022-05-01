"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.composeAccessorFunction = exports.composeConstant = exports.composeInterface = exports.composeJsDoc = void 0;
const utils_1 = require("./utils");
/**
 * Composes a simple jsDoc for something
 * @param lines the individual lines of the jsDoc
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
 * @param indent the indent
 * @returns the function as a string
 */
const composeAccessorFunction = (blueprint, indent) => `${composeJsDoc(blueprint.jsDocLines)}export async function ${blueprint.name}(${(0, utils_1.joinArguments)(blueprint.funcParams, 40, 0, indent)}): Promise<Res<${blueprint.responseSignature}>> {
${(0, utils_1.d)(indent, 1)}try {
${(0, utils_1.d)(indent, 2)}const r = await fetch(${(0, utils_1.joinArguments)(blueprint.fetchParams, 60, 2, indent)});
${(0, utils_1.d)(indent, 2)}try {
${(0, utils_1.d)(indent, 3)}return { ok: r.ok, data: ${blueprint.autoResultPreprocessing} };
${(0, utils_1.d)(indent, 2)}} catch (e) {
${(0, utils_1.d)(indent, 3)}return { ok: r.ok };
${(0, utils_1.d)(indent, 2)}}
${(0, utils_1.d)(indent, 1)}} catch (e) {
${(0, utils_1.d)(indent, 2)}console.error(e);
${(0, utils_1.d)(indent, 2)}return { ok: false, networkError: true };
${(0, utils_1.d)(indent, 1)}}
}`;
exports.composeAccessorFunction = composeAccessorFunction;
//# sourceMappingURL=compose.js.map