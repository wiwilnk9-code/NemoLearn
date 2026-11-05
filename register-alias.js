const Module = require("module");
const path = require("path");

const origResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, isMain, options) {
  if (request.startsWith("@/")) {
    request = path.join(__dirname, "src", request.slice(2));
  }
  return origResolve.call(this, request, parent, isMain, options);
};
