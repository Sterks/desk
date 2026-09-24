#!/usr/bin/env node
import { runCli } from './run.js';
try { process.exitCode = await runCli(process.argv.slice(2)); } catch (e) { process.stderr.write(`desk: ${e instanceof Error ? (e.stack ?? e.message) : String(e)}\n`); process.exitCode = 1; }
