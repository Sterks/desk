"use strict";

const { defineMigration } = require("../core/define-migration");

module.exports = defineMigration({
  component: "TNBottomSheet",
  props: {
    mobileBreakPoint: {
      kind: "remove",
      since: "7.0.0",
      hint: "Брейкпоинт задаётся глобально через useLibraryOptions при установке кита."
    }
  }
});
