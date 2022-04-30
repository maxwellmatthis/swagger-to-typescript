"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isInternalJSONReference = exports.loadRef = exports.filterDefined = exports.joinArguments = exports.pathToTemplateLiteral = exports.safeVariableName = exports.schemaIsSupported = exports.extensionIsSupported = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const js_yaml_1 = require("js-yaml");
/**
 * Checks if a given file extension is supported to be parsed
 * @param extension a file extension including the dot
 * @returns `true` if the extension is supported, otherwise `false`
 */
function extensionIsSupported(extension) {
    if ([".yml", ".yaml", ".json"].includes(extension))
        return true;
    return false;
}
exports.extensionIsSupported = extensionIsSupported;
/**
 * Checks if a given schema version is supported to be parsed
 * @param schema an OpenAPI schema
 * @returns `true` if the schema version is supported, otherwise `false`
 */
function schemaIsSupported(schema) {
    if (typeof schema === "object") {
        return !("swagger" in schema || ("openapi" in schema && schema.openapi.slice(0, 2) !== "3."));
    }
    else {
        console.warn("The schema is not an object: " + String(schema).slice(200));
    }
    return false;
}
exports.schemaIsSupported = schemaIsSupported;
/**
 * Escapes and recases identifiers to make them safe to use in JavaScript
 * @param context the data from which to make the new identifier
 * @returns the safe identifier as a `string`
 *
 * __For example:__ `hello-world` becomes `helloWorld`
 */
function safeVariableName(context) {
    const allowed = /[A-Za-z0-9_$]/;
    return context
        .trim()
        .split("")
        .reverse()
        .map((char, index, parts) => char.match(allowed)
        ? (index + 1 < parts.length && !parts.slice(index + 1, index + 2)[0].match(allowed))
            ? char.toUpperCase()
            : char
        : "")
        .reverse()
        .join("");
}
exports.safeVariableName = safeVariableName;
/**
 * Transforms paths into template strings allowing path parameters to be set programmatically
 * @param path a pathname (__for example:__ `/user/{username}/pictures`)
 * @param varPrefix a string to add before each variable to have some control over the namespace the variable accesses, this prefix is not applied to the names in `variables`
 * @return the template literal (without the backtags "`") as well as the variables needed in the template
 */
function pathToTemplateLiteral(path, varPrefix) {
    const variables = [];
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
exports.pathToTemplateLiteral = pathToTemplateLiteral;
/**
 * Joins arguments in a formatted way to be used in a function
 * @param args raw strings that may be used as function arguments (__for example__: `name: string`)
 * @param maxLength maximum length of a line before it is reformatted to span multiple lines
 * @param baseIndentSize the amount of spaces that the code is already indented
 * @returns the joined and formatted parameters
 */
function joinArguments(args, maxLength = 60, baseIndentSize = 0, indentSize = 2) {
    maxLength = Math.abs(maxLength);
    baseIndentSize = Math.abs(baseIndentSize);
    indentSize = Math.abs(indentSize);
    const indent = " ".repeat(indentSize + baseIndentSize);
    const simpleJoin = args.join(", ");
    return simpleJoin.length > maxLength || args.some((arg) => arg.includes("\n"))
        ? "\n" + indent + args.map((arg) => arg.split("\n").join("\n" + indent)).join(",\n" + indent) + "\n" + " ".repeat(baseIndentSize)
        : simpleJoin;
}
exports.joinArguments = joinArguments;
/**
 * Removes the `undefined` elements from an array
 * @param elems Some elements of type `<T>` and `undefined`
 * @returns a pure array of elements of type `<T>`
 */
function filterDefined(...elems) {
    return elems.filter((elem) => elem);
}
exports.filterDefined = filterDefined;
/**
 * Loads a JSON reference
 * @param ref valid JSON reference (__for example:__ `file.json#/path/to/something`)
 * @returns whatever the reference was pointing to or undefined, if the reference could not be loaded
 */
function loadRef(schema, ref) {
    const validRef = /^([\/A-Za-z0-9_\-\.\(\)]+)*#(\/[A-Za-z0-9_]+)*$/;
    if (validRef.test(ref)) {
        if (isInternalJSONReference(ref))
            return retrieve(schema, ref);
        else {
            const filePath = ref.split("#")[0];
            const extension = (0, path_1.extname)(filePath);
            if (!extensionIsSupported(extension))
                throw new Error(`Extension "${extension}" is not supported.`);
            else if (!(0, fs_1.existsSync)(filePath))
                throw new Error(`File "${filePath}}" does not exist.`);
            else {
                const contents = (0, fs_1.readFileSync)(filePath, { encoding: "utf-8" });
                const schema = extension === ".json" ? JSON.parse(contents) : (0, js_yaml_1.load)(contents);
                if (!schemaIsSupported(schema))
                    throw new Error(`Schema in "${filePath}" not supported. This tool only supports with OpenAPIv3.`);
                else
                    return retrieve(schema, ref);
            }
        }
    }
    else {
        console.error(`Invalid reference: ${ref}`);
        return undefined;
    }
    /**
     * Retrieves the at `ref`
     * @param object some object to be retrieved
     * @param ref a valid JSON reference
     * @returns whatever the reference was pointing to or undefined, if the reference was not able to be loaded
     */
    function retrieve(object, ref) {
        const keys = ref.split("/").slice(1);
        for (const key of keys) {
            if (key in object)
                object = object[key];
            else {
                console.error(`Unable to load reference ${ref}: entry not found`);
                return undefined;
            }
        }
        return object;
    }
    ;
}
exports.loadRef = loadRef;
/**
 * Tests if a JSON reference is an internal or external reference
 * @param ref a valid JSON reference
 * @returns `true` if the reference is internal, otherwise false
 */
function isInternalJSONReference(ref) {
    return ref.startsWith("#/");
}
exports.isInternalJSONReference = isInternalJSONReference;
//# sourceMappingURL=utils.js.map