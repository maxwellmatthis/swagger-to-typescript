import { ConstantBlueprint, FunctionBlueprint, InterfaceBlueprint } from "./types/blueprint";
import { joinArguments } from "./utils";

/**
 * Composes a simple jsDoc for something
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
 * @returns the function as a string
 */
// TODO: add a different way of deserializing other than `await r.json()` for non-json data
export const composeAccessorFunction = (blueprint: FunctionBlueprint): string =>
  `${composeJsDoc(blueprint.jsDocLines)}export async function ${blueprint.name}(${joinArguments(blueprint.funcParams, 40)}): Promise<Res<${blueprint.responseSignature}>> {
  try {
    const r = await fetch(${joinArguments(blueprint.fetchParams, 60, 4, 2)});
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
