var orc = require('orchestrate')(process.env.ORCHESTRATE_API_KEY);
var follow = require('follow');
var EventEmitter = require('events').EventEmitter;
var async = require('async');

function update (collection, key, doc) {
  return orc.put(collection, key, doc);
}

function destroy (collection, key) {
  return orc.remove(collection, key);
}

function OrchestrateCouchDB (options) {
  function set_options (opts) {
    opts = opts || {};
    opts.orchestrate = opts.orchestrate || {};
    opts.couchdb = opts.couchdb || {};
    return {
      orchestrate: {
        api_key: opts.orchestrate.api_key || process.env.ORCHESTRATE_API_KEY
      },
      couchdb: {
        url: opts.couchdb.url || process.env.COUCHDB_URL || 'http://localhost:5984',
        username: opts.couchdb.username || process.env.COUCHDB_USERNAME,
        password: opts.couchdb.password || process.env.COUCHDB_PASSWORD,
        database: opts.couchdb.database || process.env.COUCHDB_DATABASE
      }
    };
  }

  var opts = set_options(options);
  var events = new EventEmitter();

  function process_change (change, done) {
    events.emit('change', change);
    events.emit('change.start', change);
    
    var promise;
    var deletion = !!change.deleted;

    if (deletion) {
      promise = destroy(opts.couchdb.database, change.id);
    } else {
      promise = update(opts.couchdb.database, change.id, change.doc);
    }
    promise
    .then(function () {
      events.emit('change', change);
      events.emit('change.success', change);
      done();
    })
    .fail(function (err) {
      events.emit('change', change, err);
      events.emit('change.error', change, err);
      done(err);
    });
  }

  var queue = async.queue(process_change, 1);
  queue.drain = function () {
    events.emit('drain');
  };

  var db_url = [opts.couchdb.url, opts.couchdb.database].join('/');
  var auth;
  if (opts.couchdb.username && opts.couchdb.password) {
    auth = 'Basic ' + new Buffer([opts.couchdb.username, opts.couchdb.password].join(':')).toString('base64');
  }

  var stream = new follow.Feed({
    db: [opts.couchdb.url, opts.couchdb.database].join('/'),
    include_docs: true
  });
  if (auth) stream.headers.Authentication = auth;

  stream.on('change', function (change) {
    queue.push(change);
  });
  stream.on('error', function (err) {
    events.emit('error', err);
  });

  stream.follow();
  events.stop = stream.stop.bind(stream);
  return events;
}

module.exports = OrchestrateCouchDB;