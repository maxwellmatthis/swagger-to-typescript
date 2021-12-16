"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Generator = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const index_1 = require("../index");
const js_yaml_1 = require("js-yaml");
class Generator {
    constructor(schema) {
        this.schema = schema;
    }
    /**
     * @returns code made of individual accessor functions meant to be saved to a TypeScript module File
     */
    generateTypedFunctions() {
        var _a, _b;
        let code = "";
        for (const pathName in this.schema.paths) {
            let path = this.schema.paths[pathName];
            if (path.$ref)
                path = this.loadRef(path.$ref);
            const operations = {
                get: path.get,
                put: path.put,
                post: path.post,
                delete: path.delete,
                options: path.options,
                head: path.options,
                patch: path.patch,
                trace: path.trace,
            };
            for (const operationName of Object.keys(operations)) {
                const operation = path[operationName];
                if (!operation)
                    continue;
                if (operation.deprecated) {
                    console.warn(`Skipping ${pathName}.${operationName} because it's maked as deprecated.`);
                    continue;
                }
                ;
                code += this.generateTypedFunction(pathName, ((_a = path.servers) === null || _a === void 0 ? void 0 : _a[0]) || ((_b = this.schema.servers) === null || _b === void 0 ? void 0 : _b[0]) || null, operationName, operation);
            }
        }
        return code.trim();
    }
    /**
     * @param pathName the url to the resource the operation is part of
     * @param server an OpenAPI v3 `Server` object from which the operation can inherit the host
     * @param operationName the name (method) of the operation
     * @param operation the operation itself
     * @returns a typed function to access a specific API resource
     */
    generateTypedFunction(pathName, server, operationName, operation) {
        const funcParams = [];
        const fetchParams = [];
        // Host
        // TODO: parse pathName for path parameters
        if (!(server === null || server === void 0 ? void 0 : server.url)) {
            funcParams.push("host: string");
            fetchParams.push(`\`${"${host}"}${pathName}\``);
        }
        else
            fetchParams.push(`${server.url}${pathName}`);
        // Fetch Request Options
        const requestParams = [];
        if (operation.requestBody) {
            const rb = "$ref" in operation.requestBody
                ? this.loadRef(operation.requestBody.$ref)
                : operation.requestBody;
            if (rb) {
                const mediaType = Object.keys(rb.content)[0];
                // TODO: add more media type support
                if (mediaType.toLowerCase() === "application/json") {
                    const schema = rb.content[mediaType].schema;
                    funcParams.push(`body: ${schema ? this.schemaToTypescriptDefinition(schema) : "any"}`);
                    requestParams.push("body: JSON.stringify(body)", "headers: { \"Content-Type\": \"application/json\" }");
                }
                else
                    console.error(`Media type "${mediaType}" is not supported`);
            }
        }
        if (requestParams.length > 0)
            fetchParams.push("{" + joinArguments(requestParams, 30) + "}");
        return composeAccessorFunction(genJsDoc(pathName, operationName, operation.summary), safeVariableName(operation.operationId || `${operationName}-${pathName}`), funcParams, fetchParams, this.genReturnTypes(operation.responses));
    }
    /**
     * @param responses an OpenAPI v3 `Responses` object to be parsed
     * @returns string of TypeScript union type of valid API Responses
     */
    genReturnTypes(responses) {
        const types = [];
        for (const responseName of Object.keys(responses)) {
            let response = responses[responseName];
            if (response) {
                if ("$ref" in response)
                    response = this.loadRef(response.$ref);
                // TODO: add Header and Link types to response
                if (response === null || response === void 0 ? void 0 : response.content) {
                    const mediaType = Object.keys(response.content)[0];
                    const schema = response.content[mediaType].schema;
                    if (schema)
                        types.push(this.schemaToTypescriptDefinition(schema));
                    else {
                        console.warn(`${responseName}.content.${response.content[mediaType]} has no schema.`);
                        types.push("any");
                    }
                }
                else
                    types.push("undefined");
            }
        }
        return [...new Set(types)].join(" | ");
    }
    /**
     * @param thing valid OpenAPI v3 `Schema` object
     * @returns a valid TypeScript definition for the given schema
     */
    schemaToTypescriptDefinition(thing) {
        var _a;
        if (thing) {
            if ("$ref" in thing && thing.$ref) {
                return this.schemaToTypescriptDefinition(this.loadRef(thing.$ref));
            }
            else {
                if (thing.type && ["string", "number", "boolean", "integer"].includes(thing.type))
                    return (thing.type === "integer" ? "number" : thing.type);
                else if (thing.type === "object") {
                    let keys = [];
                    if (thing.properties) {
                        for (const key of Object.keys(thing.properties)) {
                            keys.push(`${key}: ${this.schemaToTypescriptDefinition(thing.properties[key])}`);
                        }
                    }
                    if ((_a = thing.additionalProperties) === null || _a === void 0 ? void 0 : _a.type)
                        keys.push(`[key:string]: ${this.schemaToTypescriptDefinition(thing.additionalProperties)}`);
                    if (keys.length > 0)
                        return `{ ${keys.join(", ")} }`;
                    else {
                        console.warn(`${JSON.stringify(thing)} has no properties`);
                        return "{}";
                    }
                }
                else if (thing.type === "array") {
                    if (thing.items) {
                        return `${this.schemaToTypescriptDefinition(thing.items)}[]`;
                    }
                    console.warn(`${JSON.stringify(thing)} has no items`);
                    return "[]";
                }
            }
        }
        console.warn(`${JSON.stringify(thing)} has no type`);
        return "any";
    }
    ;
    /**
     * loads a json reference
     * @param ref valid json reference (__example:__ `file.json#/path/to/something`)
     * @returns whatever the reference was pointing to or undefined, if the reference could not be loaded
     */
    loadRef(ref) {
        const validRef = /^([\/A-Za-z0-9_\-\.\(\)]+)*#(\/[A-Za-z0-9_]+)*$/;
        if (validRef.test(ref)) {
            const pathParts = ref.split("/").slice(1);
            if (ref.startsWith("#/"))
                return search(this.schema, pathParts);
            else {
                const filePath = ref.split("#")[0];
                const extension = (0, path_1.extname)(filePath);
                if (!(0, index_1.extensionIsSupported)(extension))
                    throw new Error(`Extension "${extension}" is not supported.`);
                else if (!(0, fs_1.existsSync)(filePath))
                    throw new Error(`File "${filePath}}" does not exist.`);
                else {
                    const contents = (0, fs_1.readFileSync)(filePath, { encoding: "utf-8" });
                    const schema = extension === ".json" ? JSON.parse(contents) : (0, js_yaml_1.load)(contents);
                    if (!(0, index_1.schemaIsSupported)(schema))
                        throw new Error(`Schema in "${filePath}" not supported. This tool only works with OpenAPI v3.`);
                    else
                        return search(schema, pathParts);
                }
            }
        }
        else {
            console.error(`Invalid reference: ${ref}`);
            return undefined;
        }
        /**
         * searches an object of objects recursivly until its location matches the path
         * @param object some object to be searched
         * @param remainingPath the remaining keys to be searched
         * @returns whatever the reference was pointing to or undefined, if the reference could not be loaded
         */
        function search(object, remainingPath) {
            for (const key of Object.keys(object)) {
                if (key === remainingPath[0]) {
                    const currentObject = object[key];
                    remainingPath.shift();
                    if (remainingPath.length === 0)
                        return currentObject;
                    else
                        return search(currentObject, remainingPath);
                }
            }
            console.error(`Unable to load reference ${ref}`);
            return undefined;
        }
        ;
    }
}
exports.Generator = Generator;
/**
 * @param jsDoc a jsDoc about the function
 * @param name a valid JavaScript function name
 * @param funcParams an array of named parameters of the function
 * @param fetchParams an array of unnamed parameters to be used as arguments of the `window.fetch()` function
 * @param returnSignature a valid TypeScript type that is returned after parsing the APIs response
 * @returns a fully ready accessor function as a string
 */
function composeAccessorFunction(jsDoc, name, funcParams, fetchParams, returnSignature) {
    // TODO: use a different way of deserializing than `await r.json()` for non-json data
    return `${jsDoc}
export async function ${name}(${joinArguments(funcParams, 40)}): Promise<{ data: ${returnSignature}; } & Response> {
  const r = await fetch(${joinArguments(fetchParams, 60, 2, 2)});
  const d = await r.json();
  return Object.assign(r, { data: d });
}\n\n`;
}
;
/**
 * @param pathName of the operation
 * @param summary of the operation
 * @returns a simple jsDoc for an operation
 */
function genJsDoc(pathName, operationName, summary) {
    const lines = [];
    lines.push(`@route ${operationName.toUpperCase()} \`${pathName}\``);
    if (summary)
        lines.push(summary);
    // for (const param of params) {
    //   if (param.deprecated) {
    //     console.warn(`Skipping param ${param.name} because it's deprecated.`);
    //     continue;
    //   }
    //   if (param.description) lines.push(`@param ${param.name} ${param.description}`);
    // }
    // if (requestBody?.description) lines.push(`@param body ${requestBody.description}`);
    lines.push("@returns `Promise` of possible API responses");
    return `/**\n * ${lines.join("\n * ")}\n*/`;
}
/**
 * @returns string that can be safely used as a variable name in JavaScript
 */
function safeVariableName(context) {
    const allowed = /[A-Za-z0-9_$]/;
    return context
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
/**
 * @param params raw strings that may be used as function arguments
 * @param maxLength maximum length
 * @returns a joined and correctly indented string to be used as a parameter for a function
 */
function joinArguments(args, maxLength = 60, baseIndentSize = 0, indentSize = 2) {
    maxLength = Math.abs(maxLength);
    baseIndentSize = Math.abs(baseIndentSize);
    indentSize = Math.abs(indentSize);
    const indent = " ".repeat(indentSize + baseIndentSize);
    return args.join(", ").length > maxLength || args.some((arg) => arg.includes("\n"))
        ? "\n" + indent + args.map((arg) => arg.split("\n").join("\n" + indent)).join(",\n" + indent) + "\n" + " ".repeat(baseIndentSize)
        : args.join(", ");
}
//# sourceMappingURL=v3.js.map