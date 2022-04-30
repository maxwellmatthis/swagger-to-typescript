import { readFileSync, existsSync } from "fs";
import { extname } from "path";
import { load } from "js-yaml";

/**
 * Checks if a given file extension is supported to be parsed
 * @param extension a file extension including the dot
 * @returns `true` if the extension is supported, otherwise `false`
 */
export function extensionIsSupported(extension: string): boolean {
  if ([".yml", ".yaml", ".json"].includes(extension)) return true;
  return false;
}

/**
 * Checks if a given schema version is supported to be parsed
 * @param schema an OpenAPI schema
 * @returns `true` if the schema version is supported, otherwise `false`
 */
export function schemaIsSupported(schema: any) {
  if (typeof schema === "object") {
    return !("swagger" in schema || ("openapi" in schema && schema.openapi.slice(0, 2) !== "3."));
  } else {
    console.warn("The schema is not an object: " + String(schema).slice(200));
  }
  return false;
}

/**
 * Escapes and recases identifiers to make them safe to use in JavaScript
 * @param context the data from which to make the new identifier
 * @returns the safe identifier as a `string`
 * 
 * __For example:__ `hello-world` becomes `helloWorld`
 */
export function safeVariableName(context: string): string {
  const allowed = /[A-Za-z0-9_$]/;
  return context
    .trim()
    .split("")
    .reverse()
    .map((char, index, parts) => char.match(allowed)
      ? (index + 1 < parts.length && !parts.slice(index + 1, index + 2)[0].match(allowed))
        ? char.toUpperCase()
        : char
      : ""
    )
    .reverse()
    .join("");
}

/**
 * Transforms paths into template strings allowing path parameters to be set programmatically
 * @param path a pathname (__for example:__ `/user/{username}/pictures`)
 * @param varPrefix a string to add before each variable to have some control over the namespace the variable accesses, this prefix is not applied to the names in `variables`
 * @return the template literal (without the backtags "`") as well as the variables needed in the template
 */
export function pathToTemplateLiteral(path: string, varPrefix?: string): {
  templateLiteral: string,
  variables: string[];
} {
  const variables: string[] = [];
  const pathParam = /{[A-Za-z0-9\-_]+}/g;

  return {
    templateLiteral: path.replace(pathParam, (param) => {
      const name = safeVariableName(param.slice(1, -1));
      variables.push(name);
      return "${" + (varPrefix || "") + name + "}";
    }),
    variables
  };
}

/**
 * Joins arguments in a formatted way to be used in a function
 * @param args raw strings that may be used as function arguments (__for example__: `name: string`)
 * @param maxLength maximum length of a line before it is reformatted to span multiple lines
 * @param baseIndentSize the amount of spaces that the code is already indented
 * @returns the joined and formatted parameters
 */
export function joinArguments(
  args: string[],
  maxLength: number = 60,
  baseIndentSize: number = 0,
  indentSize: number = 2
): string {
  maxLength = Math.abs(maxLength);
  baseIndentSize = Math.abs(baseIndentSize);
  indentSize = Math.abs(indentSize);
  const indent = " ".repeat(indentSize + baseIndentSize);
  const simpleJoin = args.join(", ");
  return simpleJoin.length > maxLength || args.some((arg) => arg.includes("\n"))
    ? "\n" + indent + args.map((arg) => arg.split("\n").join("\n" + indent)).join(",\n" + indent) + "\n" + " ".repeat(baseIndentSize)
    : simpleJoin;
}

/**
 * Removes the `undefined` elements from an array
 * @param elems Some elements of type `<T>` and `undefined`
 * @returns a pure array of elements of type `<T>`
 */
export function filterDefined<T>(...elems: (T | undefined)[]) {
  return elems.filter((elem) => elem) as T[];
}

/**
 * Loads a JSON reference
 * @param ref valid JSON reference (__for example:__ `file.json#/path/to/something`)
 * @returns whatever the reference was pointing to or undefined, if the reference could not be loaded
 */
export function loadRef<T extends object>(schema: T, ref: string): any {
  const validRef = /^([\/A-Za-z0-9_\-\.\(\)]+)*#(\/[A-Za-z0-9_]+)*$/;
  if (validRef.test(ref)) {
    if (isInternalJSONReference(ref)) return retrieve(schema, ref);
    else {
      const filePath = ref.split("#")[0];
      const extension = extname(filePath);
      if (!extensionIsSupported(extension)) throw new Error(`Extension "${extension}" is not supported.`);
      else if (!existsSync(filePath)) throw new Error(`File "${filePath}}" does not exist.`);
      else {
        const contents = readFileSync(filePath, { encoding: "utf-8" });
        const schema: T = extension === ".json" ? JSON.parse(contents) : load(contents);
        if (!schemaIsSupported(schema))
          throw new Error(`Schema in "${filePath}" not supported. This tool only supports with OpenAPIv3.`);
        else return retrieve(schema, ref);
      }
    }
  } else {
    console.error(`Invalid reference: ${ref}`);
    return undefined;
  }

  /**
   * Retrieves the at `ref`
   * @param object some object to be retrieved
   * @param ref a valid JSON reference
   * @returns whatever the reference was pointing to or undefined, if the reference was not able to be loaded
   */
  function retrieve(object: object, ref: string): any | undefined {
    const keys = ref.split("/").slice(1);
    for (const key of keys) {
      if (key in object) object = object[key as keyof typeof object];
      else {
        console.error(`Unable to load reference ${ref}: entry not found`);
        return undefined;
      }
    }
    return object;
  };
}

/**
 * Tests if a JSON reference is an internal or external reference
 * @param ref a valid JSON reference
 * @returns `true` if the reference is internal, otherwise false
 */
export function isInternalJSONReference(ref: string): boolean {
  return ref.startsWith("#/");
}
