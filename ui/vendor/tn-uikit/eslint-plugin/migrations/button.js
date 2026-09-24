"use strict";

const { defineMigration } = require("../core/define-migration");

module.exports = defineMigration({
  component: "TNButton",
  props: {
    action: { kind: "to-enum", prop: "type", value: "action", since: "7.0.0" },
    white: { kind: "to-enum", prop: "type", value: "white", since: "7.0.0" },
    secondary: { kind: "to-enum", prop: "type", value: "default", since: "7.0.0" },
    outline: { kind: "to-enum", prop: "type", value: "outline", since: "7.0.0" },
    link: { kind: "to-enum", prop: "type", value: "link", since: "7.0.0" }
  }
});
