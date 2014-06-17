#!/usr/bin/env node

var OrchestrateCouchDB = require('../lib');

var watcher = new OrchestrateCouchDB();

watcher.on('connect', console.log);
watcher.on('change', console.log);
watcher.on('change.error', function (change, err) {
  console.error(err.body);
});
watcher.on('error', function (err) {
  console.error(err.body);
});
watcher.on('drain', console.log);