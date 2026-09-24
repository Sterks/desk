"use strict";

// Реестр хендлеров по видам миграций. Порядок = порядок отчётов на одном элементе.
// Добавить новый вид: создать handlers/<kind>.js и дописать его сюда.
const toEnum = require("./to-enum");
const remove = require("./remove");
const rename = require("./rename");
const valueMap = require("./value-map");

/** @type {Array<{kind: string, messages: Record<string,string>, report: Function}>} */
module.exports = [remove, rename, valueMap, toEnum];
