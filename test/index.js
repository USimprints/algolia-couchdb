var record = require('./record');
var nano = require('nano');
var orchestrate = require('orchestrate');
var OrchestrateCouchDB = require('../lib-cov');
var async = require('async');

describe('OrchestrateCouchDB', function () {
  // TODO fix fixtures, currently broken due to socket error in `follow`
  // var recorder = record('OrchestrateCouchDB');
  // before(recorder.before);

  before(function () {
    // set up db connections
    this.collection = 'orchestrate-couchdb';
    this.nano = nano('http://localhost:5984');
    this.couchdb = this.nano.use(this.collection);
    this.orc = orchestrate(process.env.ORCHESTRATE_API_KEY);
  });

  before(function (done) {
    // create couchdb database
    this.nano.db.create(this.collection, function (err) {
      done(err);
    });
  });

  before(function () {
    // start watcher
    this.watcher = OrchestrateCouchDB({
      couchdb: {
        database: this.collection
      }
    });
  });

  after(function (done) {
    var self = this;
    // delete collections
    async.parallel([
      function (done) {
        self.nano.db.destroy(self.collection, done);
      },
      function (done) {
        self.orc.deleteCollection(self.collection)
        .then(function () {
          done();
        })
        .fail(done);
      }
    ], done);
  });

  it('should sync CouchDB changes to Orchestrate', function (done) {
    var self = this;
    var id = 'derpderp';
    // write documents to couchdb
    this.couchdb.insert({
      hello: 'goodbye'
    }, id, function (err) {
      if (err) done(err);
    });
    // wait for the watcher to report the change
    this.watcher.on('change.success', function (change) {
      if (id === change.id) {
        self.watcher.stop();
        done();
      }
    });
  });

  // after(recorder.after);
});
