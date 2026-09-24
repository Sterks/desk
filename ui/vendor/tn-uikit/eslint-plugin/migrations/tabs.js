"use strict";

const { defineMigration } = require("../core/define-migration");

module.exports = defineMigration({
  component: "TNTabs",
  props: {
    soft: { kind: "to-enum", prop: "type", value: "soft", since: "7.0.0" }
  }
});
