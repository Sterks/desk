"use strict";

// Центральный реестр миграций. Чтобы добавить компонент —
// создайте migrations/<name>.js через defineMigration и допишите его сюда.
const button = require("./button");
const tabs = require("./tabs");
const select = require("./select");
const multiselect = require("./multiselect");
const scrollSelect = require("./scroll-select");
const datepicker = require("./datepicker");
const rangeDatepicker = require("./range-datepicker");
const search = require("./search");
const dropdown = require("./dropdown");
const bottomSheet = require("./bottom-sheet");

/** @type {import("../core/define-migration").Migration[]} */
module.exports = [button, tabs, select, multiselect, scrollSelect, datepicker, rangeDatepicker, search, dropdown, bottomSheet];
