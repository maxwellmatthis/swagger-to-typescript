# swagger-to-typed-requests

## About

This program translates OpenAPI/swagger files to TypeScript functions to make calling and receiving information from api endpoints easier and type safe.

## Usage

### Options

- -s, --source <path-to-openapi-file>  The path to the openapi/swagger file that you want to convert to requests
- -o, --output <path-to-api-file>      The path to the Typescript file that will contain the typed requests (default: "./api.ts")
- -h, --help                           display help for command

### Example

```bash
node dist/index.js -s ./openapi.json -o ./api.ts
```

## Limitations

This project is supposed to stay lightweight and readable. Due to this **it currently only supports `OpenAPIv3` format and the `application/json` type** for request being made and received. This is fine for my current project, since it uses `application/json` format for everything. Future versions of this project could be smarter to deal with more diverse requests or allow developers to work closer with the raw data directly, while keeping the typings.
