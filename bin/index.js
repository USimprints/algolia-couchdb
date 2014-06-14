#!/usr/bin/env node

var OrchestrateCouchDB = require('../lib');

var watcher = new OrchestrateCouchDB();

watcher.on('connect', console.log);
watcher.on('change', console.log);
watcher.on('error', console.log);
watcher.on('drain', console.log);