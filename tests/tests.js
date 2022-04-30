/** The most minimalistic testing framework ever */
function eq(label, a, b) {
  a = JSON.stringify(a);
  b = JSON.stringify(b);
  if (a === b) console.log(`${label}: ok`);
  else console.error(`${label}: ${a} does not equal ${b}!`);
}

const utils = require("../dist/utils");

// tests for `utils.safeVariableName()`
eq("safeVariableName_1", utils.safeVariableName("hello super-world"), "helloSuperWorld");
eq("safeVariableName_2", utils.safeVariableName("  hello-world.1    "), "helloWorld1");

// tests for `utils.pathToTemplateLiteral()`
eq("pathToTemplateLiteral_1", utils.pathToTemplateLiteral("/user/{username}/pictures"), { templateLiteral: "/user/${username}/pictures", variables: ["username"] });
eq("pathToTemplateLiteral_2", utils.pathToTemplateLiteral("/{broken/{username-123}/url/{thingy  }/{}"), { templateLiteral: "/{broken/${username123}/url/{thingy  }/{}", variables: ["username123"] });
eq("pathToTemplateLiteral_2", utils.pathToTemplateLiteral("/another/{path}", "super."), { templateLiteral: "/another/${super.path}", variables: ["path"] });
