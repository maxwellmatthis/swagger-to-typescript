# swagger-to-typescript

## About

This program converts OpenAPI/swagger files into TypeScript code to make calling and receiving information from API endpoints easier and most of all type safe.

I looked around for a while but couldn't find a tool that gave me clean, native (using fetch) and minimalistic output code. The code bases didn't look very clean either and were often not written in typescript and ES6 syntax, which made reading them quite difficult.

## Usage

```bash
node dist/index.js [options]
```

### Options

- -s, --source &lt;path-to-openapi-file&gt;  The path to the openapi/swagger file that you want to convert to requests
- -o, --output &lt;path-to-api-file&gt;      The path to the Typescript file that will contain the typed requests (default: "./api.ts")
- -i, --inline                               If as many things as possible should be inlined or may be spread out over different interfaces and constants
- -d, --dent &lt;n+(tab/t/space/s)&gt;       The amount of spaces or tabs with which to indent
- -h, --help                                 Display help for the program

## Limitations

This project is supposed to stay lightweight and readable. Due to this **it currently only supports `OpenAPIv3` format and the `application/json` media type** for requests being made and received. This is fine for my current project, since it uses the `application/json` media type for everything. Future versions of this project will contain support for more media types.

### Example

First define a swagger file:

```yaml
# openapi.yaml
openapi: 3.0.0
info:
  title: International Greeter
  version: 2.5.1
servers:
  - url: https://greeting.example.com
    description: The main production server
paths:
  /v1/hello:
    post:
      description: Returns hello in a random language
      operationId: randomHello
      responses:
        200:
          description: Hello in a random language along with the language
          content:
            application/json:
              schema:
                type: object
                required:
                  - language
                  - text
                properties:
                  language:
                    type: string
                    example: German
                  text:
                    type: string
                    example: Hallo
  /v1/hello/{language}:
    post:
      description: Returns hello in the specified language
      operationId: helloByLanguage
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - apiKey
                - language
              properties:
                apiKey:
                  type: string
      responses:
        200:
          description: Hello in the specified language
          content:
            application/json:
              schema:
                type: object
                required:
                  - text
                properties:
                  text:
                    type: string
                    example: 你好
        401:
          description: apiKey has expired
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
        405:
          description: Invalid language
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
components:
  schemas:
    Error:
      type: object
      required:
        - error
      properties:
        error:
          type: object
          required:
            - message
          properties:
            message:
              type: string
```

Then run the codegen:

```bash
# bash
node dist/index.js -s ./openapi.yaml -o ./api.ts
```

This is the result:

```typescript
// api.ts

/** The result of an accessor function */
export interface Res<Data> { ok: boolean, data?: Data, networkError?: boolean };

export interface Error { error: { message: string } };

/** The main production server */
export const mainServer: string = "https://greeting.example.com";

/**
 * @route POST `/v1/hello`
 * @returns `Promise` of possible API responses
 */
export async function randomHello(): Promise<Res<{ language: string, text: string }>> {
  try {
    const r = await fetch(`${mainServer}/v1/hello`, {method: "POST"});
    try {
      return { ok: r.ok, data: await r.json() };
    } catch (e) {
      return { ok: r.ok };
    }
  } catch (e) {
    console.error(e);
    return { ok: false, networkError: true };
  }
}

/**
 * @route POST `/v1/hello/{language}`
 * @returns `Promise` of possible API responses
 */
export async function helloByLanguage(
  path: { language: string },
  body: { apiKey: string }
): Promise<Res<{ text: string } | Error>> {
  try {
    const r = await fetch(
      `${mainServer}/v1/hello/${path.language}`,
      {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" }
      }
    );
    try {
      return { ok: r.ok, data: await r.json() };
    } catch (e) {
      return { ok: r.ok };
    }
  } catch (e) {
    console.error(e);
    return { ok: false, networkError: true };
  }
}
```

The interfaces, constant and function can now be imported into any other ES module. It could look something like this:

```typescript
import { apiKey } from "./config";
import { randomHello, helloByLanguage } from "./api";

async function printRandomHello() {
  const res = await randomHello();
  if (res.ok && res.data) {
    console.log(`${res.data.language}: "${res.data.text}"`);
  } else if (res.networkError) {
    console.error("A network error occurred.");
  }
}

async function printHelloByLanguage(language: string) {
  const res = await helloByLanguage({ language }, { apiKey });
  if (res.ok && res.data && "text" in res.data) {
    console.log(res.data.text);
  } else if ("error" in res.data) {
    console.error(res.data.error.message);
  } else if (res.networkError) {
    console.error("A network error occurred.");
  }
}
```
