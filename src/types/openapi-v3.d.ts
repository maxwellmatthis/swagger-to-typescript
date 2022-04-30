export interface OpenAPIv3 {
  openapi: string,
  info: Info,
  servers?: Server[],
  paths: Paths,
  components?: Components,
  security?: SecurityRequirement,
  tags?: Tag,
  externalDocs?: ExternalDocumentation,
}
export interface Info {
  title: string,
  description?: string,
  termsOfService?: string,
  contact?: Contact,
  license?: License,
  version: string,
}
export interface Contact {
  name?: string,
  url?: string,
  email?: string,
}
export interface License {
  name: string,
  url: string,
}
export interface Server {
  url: string,
  description?: string,
  variables?: { [key: string]: ServerVariableObject, },
}
export interface ServerVariableObject {
  enum: string[],
  default: string,
  description: string,
}
export interface Components {
  schemas?: { [key: string]: Schema | ReferenceObject, },
  responses?: { [key: string]: XResponse | ReferenceObject, },
  parameter?: { [key: string]: Parameter | ReferenceObject, },
  examples?: { [key: string]: Example | ReferenceObject, },
  requestBodies?: { [key: string]: RequestBody | ReferenceObject, },
  headers?: { [key: string]: Header | ReferenceObject, },
  securitySchemes?: { [key: string]: SecurityScheme | ReferenceObject, },
  links?: { [key: string]: Link | ReferenceObject, },
  callbacks?: { [key: string]: Callback | ReferenceObject, },
}
export interface Paths {
  [key: string]: PathItem,
}
export interface PathItem {
  $ref?: string,
  summary?: string,
  description?: string,
  get?: Operation,
  put?: Operation,
  post?: Operation,
  delete?: Operation,
  options?: Operation,
  head?: Operation,
  patch?: Operation,
  trace?: Operation,
  servers?: Server[],
  parameters?: (Parameter | ReferenceObject)[],
}
export interface Operation {
  tags?: string[],
  summary?: string,
  description?: string,
  externalDocs?: ExternalDocumentation,
  operationId?: string,
  parameters?: (Parameter | ReferenceObject)[],
  requestBody?: RequestBody | ReferenceObject,
  responses: Responses,
  callbacks?: { [key: string]: Response | ReferenceObject, },
  deprecated?: boolean,
  security?: SecurityRequirement,
  servers?: Server,
}
export interface ExternalDocumentation {
  description?: string,
  url: string,
}
export interface Parameter {
  name: string,
  in: "query" | "header" | "path" | "cookie",
  description?: string,
  required?: boolean,
  deprecated?: boolean,
  allowEmptyValue?: boolean,
  style?: "matrix" | "label" | "form" | "simple" | "spaceDelimited" | "pipeDelimited" | "deepObject",
  explode?: boolean,
  allowReserved?: boolean,
  schema?: Schema | ReferenceObject,
  example?: any,
  examples?: { [key: string]: Example | ReferenceObject, },
  content?: { [key: string]: MediaType, },
}
export interface RequestBody {
  description?: string,
  content: { [key: string]: MediaType, },
  required: boolean,
}
export interface MediaType {
  schema?: Schema,
  example?: any,
  examples?: { [key: string]: Example | ReferenceObject, },
  encoding?: { [key: string]: Encoding, },
}
export interface Encoding {
  contentType?: string,
  headers?: { [key: string]: Header | ReferenceObject, },
  style?: string,
  explode: boolean,
  allowReserved: boolean,
}
export interface Responses {
  default: XResponse | ReferenceObject,
  "100"?: XResponse | ReferenceObject,
  "101"?: XResponse | ReferenceObject,
  "102"?: XResponse | ReferenceObject,
  "103"?: XResponse | ReferenceObject,
  "200"?: XResponse | ReferenceObject,
  "201"?: XResponse | ReferenceObject,
  "202"?: XResponse | ReferenceObject,
  "203"?: XResponse | ReferenceObject,
  "204"?: XResponse | ReferenceObject,
  "205"?: XResponse | ReferenceObject,
  "206"?: XResponse | ReferenceObject,
  "207"?: XResponse | ReferenceObject,
  "208"?: XResponse | ReferenceObject,
  "226"?: XResponse | ReferenceObject,
  "300"?: XResponse | ReferenceObject,
  "301"?: XResponse | ReferenceObject,
  "302"?: XResponse | ReferenceObject,
  "303"?: XResponse | ReferenceObject,
  "304"?: XResponse | ReferenceObject,
  "305"?: XResponse | ReferenceObject,
  "306"?: XResponse | ReferenceObject,
  "307"?: XResponse | ReferenceObject,
  "308"?: XResponse | ReferenceObject,
  "400"?: XResponse | ReferenceObject,
  "401"?: XResponse | ReferenceObject,
  "402"?: XResponse | ReferenceObject,
  "403"?: XResponse | ReferenceObject,
  "404"?: XResponse | ReferenceObject,
  "405"?: XResponse | ReferenceObject,
  "406"?: XResponse | ReferenceObject,
  "407"?: XResponse | ReferenceObject,
  "408"?: XResponse | ReferenceObject,
  "409"?: XResponse | ReferenceObject,
  "410"?: XResponse | ReferenceObject,
  "411"?: XResponse | ReferenceObject,
  "412"?: XResponse | ReferenceObject,
  "413"?: XResponse | ReferenceObject,
  "414"?: XResponse | ReferenceObject,
  "415"?: XResponse | ReferenceObject,
  "416"?: XResponse | ReferenceObject,
  "417"?: XResponse | ReferenceObject,
  "418"?: XResponse | ReferenceObject,
  "419"?: XResponse | ReferenceObject,
  "420"?: XResponse | ReferenceObject,
  "421"?: XResponse | ReferenceObject,
  "422"?: XResponse | ReferenceObject,
  "423"?: XResponse | ReferenceObject,
  "424"?: XResponse | ReferenceObject,
  "425"?: XResponse | ReferenceObject,
  "426"?: XResponse | ReferenceObject,
  "428"?: XResponse | ReferenceObject,
  "429"?: XResponse | ReferenceObject,
  "431"?: XResponse | ReferenceObject,
  "451"?: XResponse | ReferenceObject,
  "500"?: XResponse | ReferenceObject,
  "501"?: XResponse | ReferenceObject,
  "502"?: XResponse | ReferenceObject,
  "503"?: XResponse | ReferenceObject,
  "504"?: XResponse | ReferenceObject,
  "505"?: XResponse | ReferenceObject,
  "506"?: XResponse | ReferenceObject,
  "507"?: XResponse | ReferenceObject,
  "508"?: XResponse | ReferenceObject,
  "509"?: XResponse | ReferenceObject,
  "510"?: XResponse | ReferenceObject,
  "511"?: XResponse | ReferenceObject,
}
export interface XResponse {
  description: string,
  headers?: { [key: string]: Header | ReferenceObject, },
  content?: { [key: string]: MediaType, },
  links?: { [key: string]: Link | ReferenceObject, },
}
export interface Callback {
  [key: string]: PathItem,
}
export interface Example {
  summary?: string,
  description?: string,
  value?: any,
  externalValue: string,
}
export interface Link {
  operationRef?: string,
  operationId?: string,
  parameters: { [key: string]: any, },
  requestBody: any,
  description: string,
  server: Server,
}
export interface Tag {
  name: string,
  description?: string,
  externalDocs?: ExternalDocumentation,
}
/** close enough to Parameter */
export type Header = Parameter;
export interface ReferenceObject {
  $ref: string,
}
export type Schema = {
  title?: string,
  multipleOf?: number,
  maximum?: number,
  exclusiveMaximum?: boolean,
  minimum?: number,
  exclusiveMinimum?: boolean,
  maxLength?: number,
  minLength?: number,
  pattern?: string,
  maxItems?: number,
  minItems?: number,
  uniqueItems?: boolean,
  maxProperties?: number,
  minProperties?: number,
  required?: string[],
  enum?: any[],
  type?: "array" | "boolean" | "integer" | "number" | "object" | "string",
  allOf?: Schema,
  oneOf?: Schema,
  anyOf?: Schema,
  not?: Schema,
  items?: Schema,
  properties?: Schema,
  additionalProperties?: Schema,
  description?: string,
  format?: "int32" | "int64" | "float" | "double" | "byte" | "binary" | "date" | "date-time" | "password" | "string" | "number" | "integer" | "boolean",
  default?: string | number | boolean | any[],
  nullable?: boolean,
  discriminator?: Discriminator,
  readOnly?: boolean,
  writeOnly?: boolean,
  xml?: XML,
  externalDocs?: ExternalDocumentation,
  deprecated?: boolean,
  $ref: ReferenceObject["$ref"];
} & {
  [key: string]: Schema,
};
export interface Discriminator {
  propertyName: string,
  mapping?: { [key: string]: string, },
}
export interface XML {
  name?: string,
  namespace?: string,
  prefix?: string,
  attribute?: boolean,
  wrapped?: boolean,
}
export interface SecurityScheme {
  type: string,
  description?: string,
  name: string,
  in: string,
  scheme: string,
  bearerFormat?: string,
  flows: OAuthFlows,
  openIdConnectUrl: string,
}
export interface OAuthFlows {
  implicit?: OAuthFlow,
  password?: OAuthFlow,
  clientCredentials: OAuthFlow,
  authorizationCode: OAuthFlow,
}
export interface OAuthFlow {
  authorizationUrl: string,
  tokenUrl: string,
  refreshUrl: string,
  scopes: { [key: string]: string, },
}
export interface SecurityRequirement {
  [key: string]: string[],
}
