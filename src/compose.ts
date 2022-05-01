import { ConstantBlueprint, FunctionBlueprint, InterfaceBlueprint } from "./types/blueprint";
import { Indent, joinArguments, d } from "./utils";

/**
 * Composes a simple jsDoc for something
 * @param lines the individual lines of the jsDoc
 * @returns the jsDoc as a string
 */
export function composeJsDoc(lines: string[]): string {
  if (lines.length === 0) return "";
  else if (lines.length === 1) return `/** ${lines[0]} */\n`;
  else return `/**\n * ${lines.join("\n * ")}\n */\n`;
};

/**
 * Composes an interface to be used a part of another type
 * @param blueprint the blueprint
 * @returns the interface as a string
 */
export function composeInterface(blueprint: InterfaceBlueprint) {
  return `${composeJsDoc(blueprint.jsDocLines)}export interface ${blueprint.name} ${blueprint.schema};`;
}

/**
 * Composes a constant
 * @param blueprint the blueprint
 * @returns the constant as a string
 */
export function composeConstant(blueprint: ConstantBlueprint) {
  return `${composeJsDoc(blueprint.jsDocLines)}export const ${blueprint.name}${blueprint.type ? ": " + blueprint.type : ""} = ${blueprint.value};`;
}

/**
 * Composes a function that offers type safe access to an API endpoint
 * @param blueprint the blueprint
 * @param indent the indent
 * @returns the function as a string
 */
export const composeAccessorFunction = (blueprint: FunctionBlueprint, indent?: Indent): string =>
  `${composeJsDoc(blueprint.jsDocLines)}export async function ${blueprint.name}(${joinArguments(blueprint.funcParams, 40, 0, indent)}): Promise<Res<${blueprint.responseSignature}>> {
${d(indent, 1)}try {
${d(indent, 2)}const r = await fetch(${joinArguments(blueprint.fetchParams, 60, 2, indent)});
${d(indent, 2)}try {
${d(indent, 3)}return { ok: r.ok, data: ${blueprint.autoResultPreprocessing} };
${d(indent, 2)}} catch (e) {
${d(indent, 3)}return { ok: r.ok };
${d(indent, 2)}}
${d(indent, 1)}} catch (e) {
${d(indent, 2)}console.error(e);
${d(indent, 2)}return { ok: false, networkError: true };
${d(indent, 1)}}
}`;
