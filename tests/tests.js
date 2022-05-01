/**
 * The most minimalistic testing framework ever
 * @param {string} label the label
 * @param {*} test the output of whatever is being tested
 * @param {*} target the desired output
 */
function eq(label, test, target) {
  test = JSON.stringify(test);
  target = JSON.stringify(target);
  if (test === target) console.log(`${label}: ok`);
  else console.error(`${label}: ${test} does not equal ${target}!`);
}

const utils = require("../dist/utils");

// tests for `utils.safeVariableName()`
eq("safeVariableName_1", utils.safeVariableName("hello super-world"), "helloSuperWorld");
eq("safeVariableName_2", utils.safeVariableName("  hello-world.1    "), "helloWorld1");

// tests for `utils.pathToTemplateLiteral()`
eq("pathToTemplateLiteral_1", utils.pathToTemplateLiteral("/user/{username}/pictures"), { templateLiteral: "/user/${username}/pictures", variables: ["username"] });
eq("pathToTemplateLiteral_2", utils.pathToTemplateLiteral("/{broken/{username-123}/url/{thingy  }/{}"), { templateLiteral: "/{broken/${username123}/url/{thingy  }/{}", variables: ["username123"] });
eq("pathToTemplateLiteral_3", utils.pathToTemplateLiteral("/another/{path}", "super."), { templateLiteral: "/another/${super.path}", variables: ["path"] });

// tests for `utils.joinArguments()`
eq("joinArguments_1", utils.joinArguments(["hello: string", "world: string"]), "hello: string, world: string");
eq(
  "joinArguments_2",
  utils.joinArguments(["a_very_long_identifier: string", "and_another_extremely_long_identifier: WithACrazyHugeType"]),
  "\n  a_very_long_identifier: string,\n  and_another_extremely_long_identifier: WithACrazyHugeType\n"
);
eq(
  "joinArguments_3",
  utils.joinArguments(["something: { " + utils.joinArguments(["hello: string", "world: string"]) + " }", "someOtherThing: number"]),
  "\n  something: { hello: string, world: string },\n  someOtherThing: number\n"
);
eq(
  "joinArguments_4",
  utils.joinArguments([
    "something: {" + utils.joinArguments(
      ["a_very_long_identifier: string", "and_another_extremely_long_identifier: WithACrazyHugeType"],
      undefined,
      undefined,
      { size: 2, type: "tab" }
    ) + "}",
    "someOtherThing: number"
  ], undefined, 2, { size: 2, type: "tab" }),
  "\n\t\t\t\t\t\tsomething: {\n\t\t\t\t\t\t\t\ta_very_long_identifier: string,\n\t\t\t\t\t\t\t\tand_another_extremely_long_identifier: WithACrazyHugeType\n\t\t\t\t\t\t},\n\t\t\t\t\t\tsomeOtherThing: number\n\t\t\t\t"
);
