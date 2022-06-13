import { OpenAPIv3, Operation, Responses, XResponse, Schema, RequestBody, PathItem, ReferenceObject } from "../types/openapi-v3";
import { Blueprint, ConstantBlueprint, FunctionBlueprint, InterfaceBlueprint } from "../types/blueprint";
import { safeVariableName, joinArguments, loadRef, filterDefined, isInternalJSONReference, pathToTemplateLiteral, Indent } from "../utils";

/**
 * Creates a `Blueprint` from a schema
 * @param schema the `OpenAPIv3` schema to use
 * @param inline if as many things as possible should be inlined
 * @param indent the indent
 * @returns the blueprint
 */
export function generateBlueprint(schema: OpenAPIv3, inline: boolean, indent?: Indent): Blueprint {
  const constants: ConstantBlueprint[] = [];
  return {
    constants,
    functions: generateFunctionBlueprints(schema, constants, inline, indent),
    interfaces: [resultInterface, ...inline ? [] : generateInterfaceBlueprints(schema)],
  };
}

/**
 * The standard result interface for describing the return signature of an accessor function
 * 
 * This interface must always be included in the generated source code because
 * it is used in every generated function
 */
// TODO: maybe make this inlineable too?
const resultInterface: InterfaceBlueprint = {
  name: "Res<Data>",
  schema: `{ ok: boolean, data?: Data, networkError?: boolean }`,
  jsDocLines: ["The result of an accessor function"]
};

/**
 * Creates all the `InterfaceBlueprints`s from a schema
 * @param schema the `OpenAPIv3` schema to use
 * @returns the blueprints
 */
function generateInterfaceBlueprints(schema: OpenAPIv3): InterfaceBlueprint[] {
  const interfaces: InterfaceBlueprint[] = [];
  if (schema.components && schema.components.schemas) {
    for (const [schemaName, JSONSchema] of Object.entries(schema.components.schemas)) {
      interfaces.push({
        name: safeVariableName(schemaName),
        schema: schemaToTypescriptDefinition(JSONSchema, false, schema),
        jsDocLines: []
      });
    }
  }
  return interfaces;
}

type ServerDetails = { type: "main" | "scoped", url: string, variable?: string, description?: string; } | { type: "param"; };

/**
 * Creates all the `FunctionBlueprint`s from the schema
 * @param schema the `OpenAPIv3` schema to use
 * @param constants a reference to the `ConstantBlueprint` array
 * @param inline if as many things as possible should be inlined
 * @param indent the indent
 * @returns the blueprints
 */
function generateFunctionBlueprints(
  schema: OpenAPIv3,
  constants: ConstantBlueprint[],
  inline: boolean,
  indent?: Indent
): FunctionBlueprint[] {
  const functions: FunctionBlueprint[] = [];

  if (typeof schema.servers === "object" && schema.servers.length > 1) {
    console.warn("Multiple main servers detected in `#/servers`."
      + "The first one will be used as default for all routes. The other servers will be ignored.");
  }
  const globalScopeServer: ServerDetails = schema.servers?.[0].url
    ? inline
      ? { type: "main", url: schema.servers[0].url, }
      : { type: "main", url: schema.servers[0].url, description: schema.servers[0].description, variable: "mainServer" }
    : { type: "param" };

  for (const [pathName, path] of Object.entries(schema.paths)) {
    // resolve $ref if needed
    if (path.$ref) Object.assign(path, loadRef(schema, path.$ref));

    if (typeof path.servers === "object" && path.servers.length > 1) {
      console.warn(`Multiple main servers detected in \`#/paths${pathName}/servers\`. `
        + "The first one will be used as default for all methods. The other servers will be ignored.");
    }
    const pathScopeServer: ServerDetails = path.servers?.[0].url
      ? inline
        ? { type: "scoped", url: path.servers[0].url }
        : { type: "scoped", url: path.servers[0].url, variable: safeVariableName(pathName) + "Server" }
      : globalScopeServer;

    // Only add the constant if needed
    if ((pathScopeServer.type === "main" || pathScopeServer.type === "scoped") &&
      pathScopeServer.variable &&
      !constants.some((c) => c.name === pathScopeServer.variable)) {
      constants.push({
        name: pathScopeServer.variable,
        type: "string",
        value: `"${pathScopeServer.url}"`,
        jsDocLines: filterDefined(pathScopeServer.description)
      });
    }

    for (const [operationName, operation] of Object.entries(extractOperations(path))) {
      if (!operation) continue;
      if (operation.deprecated) {
        console.warn(`Skipping \`#/paths${pathName}/${operationName}\` because it's marked as deprecated.`);
        continue;
      };

      functions.push(generateFunctionBlueprint(
        schema,
        inline,
        indent,
        pathName,
        operationName,
        operation,
        pathScopeServer
      ));
    }
  }

  return functions;
}

/**
 * Isolates the operations of a given path
 * @param path a valid `OpenAPIv3` `PathItem` object
 * @returns an object of operations
 */
function extractOperations(path: PathItem) {
  return {
    get: path.get,
    put: path.put,
    post: path.post,
    delete: path.delete,
    options: path.options,
    head: path.options,
    patch: path.patch,
    trace: path.trace,
  };
}

/**
 * Generates a `FunctionBlueprint` for a certain operation
 * @param schema the `OpenAPIv3` schema to use
 * @param inline if as many things as possible should be inlined
 * @param indent the indent
 * @param pathName the URL pathname (`/path/to/resource`)
 * @param operationName the HTTP operation (`GET`, `POST`, etc.)
 * @param operation the details of the operation
 * @param server the details of the server that the request is aimed at
 * @returns the blueprint
 */
function generateFunctionBlueprint(
  schema: OpenAPIv3,
  inline: boolean,
  indent: Indent | undefined,
  pathName: string,
  operationName: string,
  operation: Operation,
  server: ServerDetails,
): FunctionBlueprint {
  const { funcParams, fetchParams } = requestHandler(schema, inline, indent, pathName, operationName, operation, server);
  const { responseSignature, autoResultPreprocessing } = responseHandler(schema, inline, operation.responses);

  return {
    name: safeVariableName(operation.operationId || `${operationName}-${pathName}`),
    funcParams,
    responseSignature,
    fetchParams,
    autoResultPreprocessing,
    jsDocLines: filterDefined(
      `@route ${operationName.toUpperCase()} \`${pathName}\``,
      operation.summary,
      "@returns `Promise` of possible API responses"
    )
  };
}

/**
 * Provides the parameters for the function and the fetch function call wrapped within
 * @param schema the `OpenAPIv3` schema to use
 * @param inline if as many things as possible should be inlined
 * @param indent the indent
 * @param pathName the URL pathname (`/path/to/resource`)
 * @param operationName the HTTP operation (`GET`, `POST`, etc.)
 * @param operation the details of the operation
 * @param server the details of the server that the request is aimed at
 * @returns the parameters for both functions
 */
function requestHandler(
  schema: OpenAPIv3,
  inline: boolean,
  indent: Indent | undefined,
  pathName: string,
  operationName: string,
  operation: Operation,
  server: ServerDetails
): {
  funcParams: string[],
  fetchParams: string[],
} {
  const funcParams: string[] = [];
  const fetchParams: string[] = [];

  // Host
  const { templateLiteral, variables } = pathToTemplateLiteral(pathName, "path.");
  if (variables.length > 0) funcParams.push(`path: { ${joinArguments(variables.map((v) => v + ": string"), undefined, undefined, indent)} }`);
  if (server.type === "main" || server.type === "scoped") {
    if (server.variable) fetchParams.push(`\`\${${server.variable}}${templateLiteral}\``);
    else fetchParams.push(`"${server.url}${pathName}"`);
  } else {
    funcParams.push("host: string");
    fetchParams.push(`\`\${host}${templateLiteral}\``);
  }

  // Request data
  const requestParams: string[] = [];
  requestParams.push(`method: "${operationName.toUpperCase()}"`);
  if (operation.requestBody) {
    const rb: RequestBody | undefined = "$ref" in operation.requestBody
      ? loadRef(schema, operation.requestBody.$ref)
      : operation.requestBody;

    if (rb) {
      const mediaType = Object.keys(rb.content)[0];
      // TODO: add more media type support
      if (mediaType.toLowerCase() === "application/json") {
        funcParams.push(`body: ${schemaToTypescriptDefinition(rb.content[mediaType].schema, inline, schema)}`);
        requestParams.push("body: JSON.stringify(body)", "headers: { \"Content-Type\": \"application/json\" }");
      }
      else console.error(`Media type "${mediaType}" is not supported`);
    }
  }
  if (requestParams.length > 0) fetchParams.push("{" + joinArguments(requestParams, 30, undefined, indent) + "}");

  return { funcParams, fetchParams };
}

/**
 * Provides a reponse signature and if possible steps to process the raw data
 * to achive the response signature
 * @param schema the `OpenAPIv3` schema to use
 * @param inline if as many things as possible should be inlined
 * @param responses the possible `Responses` of a certain `Operation`
 * @returns the response signature as a TypeScript union type and steps for automatic preprocessing
 */
function responseHandler(schema: OpenAPIv3, inline: boolean, responses: Responses): {
  responseSignature: string,
  autoResultPreprocessing: string,
} {
  const types: string[] = [];

  for (let [responseName, response] of Object.entries(responses)) {
    if (response) {
      if ("$ref" in response) response = loadRef(schema, response.$ref) as XResponse | undefined;

      // TODO: add Header and Link types to response
      if (response?.content) {
        const mediaType = Object.keys(response.content)[0];
        if (!response.content[mediaType].schema)
          console.warn(`${responseName}.content.${response.content[mediaType]} has no schema.`);
        types.push(schemaToTypescriptDefinition(response.content[mediaType].schema, inline, schema));
      }
      else types.push("undefined");
    }
  }

  return {
    responseSignature: [...new Set(types)].join(" | "),
    // TODO: add other preprocessors
    autoResultPreprocessing: "await r.json()"
  };
}

/**
 * Turns the (slightly modiefied OpenAPIv3) JSON schemas into TypeScript types
 * @param thing a valid `OpenAPIv3` `Schema` object
 * @param inline if as many things as possible should be inlined
 * @param schema the `OpenAPIv3` schema to use
 * @returns the TypeScript definition for the given schema
 */
function schemaToTypescriptDefinition(
  thing: Schema | ReferenceObject | undefined,
  inline: boolean,
  schema: OpenAPIv3 | undefined,
): string {
  if (thing) {
    if (thing.$ref) {
      if (!schema) {
        // technically its not required in non-inline mode when the reference is internal but its good to have it
        console.warn("A schema is required for objects that include `$ref`s");
        return "any";
      }
      if (inline) return schemaToTypescriptDefinition(loadRef(schema, thing.$ref), inline, schema);
      else {
        const parts = thing.$ref.split("/");
        const lastPart = parts[parts.length - 1];
        // add external JSON schemas to the current schema so that they are transformed in the interface blueprint step
        if (!isInternalJSONReference(thing.$ref)) {
          if (!schema.components) schema.components = {};
          if (!schema.components.schemas) schema.components.schemas = {};
          // try to find an available identifier to save the schema as
          for (let i = 0; i < 1000; i++) {
            const identifier = lastPart + (i === 0 ? "" : i.toString());
            if (!schema.components.schemas[identifier]) schema.components.schemas[identifier] = loadRef(schema, thing.$ref);
          }
        }
        return safeVariableName(lastPart);
      }
    } else {
      if ("type" in thing && thing.type && ["string", "number", "boolean", "integer"].includes(thing.type)) {
        return (thing.type === "integer" ? "number" : thing.type);
      } else if ("type" in thing && thing.type === "object") {
        let keys: string[] = [];
        if (thing.properties) {
          for (const key of Object.keys(thing.properties) as [keyof Schema]) {
            keys.push(`${typeof key === "string" ? safeVariableName(key) : key}: ${schemaToTypescriptDefinition(thing.properties[key], inline, schema)}`);
          }
        }
        if (thing.additionalProperties?.type) keys.push(`[key:string]: ${schemaToTypescriptDefinition(thing.additionalProperties, inline, schema)}`);
        if (keys.length > 0) return `{ ${keys.join(", ")} }`;
        else {
          console.warn(`${JSON.stringify(thing)} has no properties`);
          return "{}";
        }
      } else if ("type" in thing && thing.type === "array") {
        if (thing.items) {
          return `${schemaToTypescriptDefinition(thing.items, inline, schema)}[]`;
        }
        console.warn(`${JSON.stringify(thing)} has no items`);
        return "[]";
      }
    }
  }
  console.warn(`${JSON.stringify(thing)} has no type`);
  return "any";
};
