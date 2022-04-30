export interface Blueprint {
  interfaces: InterfaceBlueprint[],
  constants: ConstantBlueprint[],
  functions: FunctionBlueprint[],
}

export interface InterfaceBlueprint {
  /** A valid TypeScript interface identifier */
  name: string,
  /** An object defining fields and TypeScript types */
  schema: string,
  /** A few lines of information to create a jsDoc with */
  jsDocLines: string[],
}

export interface ConstantBlueprint {
  /** A valid JavaScript function identifier */
  name: string,
  /** A valid TypeScript type */
  type?: string,
  /** A valid JavaScript value */
  value: string,
  /** A few lines of information to create a jsDoc with */
  jsDocLines: string[],
}

export interface FunctionBlueprint {
  /** A valid JavaScript function identifier */
  name: string,
  /** Array of named parameters of the function */
  funcParams: string[],
  /** Valid TypeScript type that is returned after parsing the APIs response */
  responseSignature: string,
  /** Array of unnamed parameters to be used as arguments of the `Window.fetch()` function */
  fetchParams: string[],
  /**
   * An expression that transforms `const r = await fetch(...)` into something useable
   * 
   * ## Examples
   * 
   * - `await r.json()` for JSON results
   * - `await r.text()` for simple text based results
   */
  autoResultPreprocessing: string,
  /** A few lines of information to create a jsDoc with */
  jsDocLines: string[],
}
