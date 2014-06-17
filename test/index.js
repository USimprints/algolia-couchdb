var record = require('./record');
var nano = require('nano');
var orchestrate = require('orchestrate');
var OrchestrateCouchDB = require('../lib-cov');
var async = require('async');
var assert = require('assert');

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

  describe('syncing changes', function () {
    beforeEach(function () {
      // start watcher
      this.watcher = OrchestrateCouchDB({
        couchdb: {
          database: this.collection
        }
      });
    });

    afterEach(function () {
      this.watcher.stop();
    });

    it('should sync CouchDB changes to Orchestrate', function (done) {
      this.timeout(4000);
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
          done();
        }
      });
    });

    it('should sync changes in order', function (done) {
      this.timeout(4000);
      var self = this;
      var id = 'multipass';
      var changes = [];
      var rev;

      async.parallel([
        // watch changes
        function (done) {
          self.watcher.on('change.success', function (change) {
            changes.push(change);
            if (changes.length === 3) {
              done();
            }
          });
        },
        // write, update, delete doc
        async.waterfall.bind(async, [
          function (done) {
            self.couchdb.insert({
              hello: 'hello!'
            }, id, function (err, body) {
              done(err, body.rev);
            });
          },
          function (rev, done) {
            self.couchdb.insert({
              hello: 'goodbye!',
              _rev: rev
            }, id, function (err, body) {
              done(err, body.rev);
            });
          },
          self.couchdb.destroy.bind(self.couchdb, id)
        ])
      ], function (err) {
        assert(!err);
        async.series([
          function (done) {
            setTimeout(done, 100);
          },
          function (done) {
            self.orc.get(self.collection, id)
            .then(function (doc) {
              done(new Error("doc should not exist"));
            })
            .fail(function (err) {
              assert.equal(err.statusCode, 404);
              done();
            });
          }
        ], done);
      });
    });
  });

  describe('orchestrate errors', function () {
    beforeEach(function () {
      var bad_api_key = 'notarealapikey';
      // start watcher with bad api key
      this.watcher = OrchestrateCouchDB({
        orchestrate: {
          api_key: bad_api_key
        },
        couchdb: {
          database: this.collection
        }
      });
    });

    afterEach(function () {
      this.watcher.stop();
    });

    it('should be handled effectively', function (done) {
      var id = 'hello-ms-frizzle';

      // write doc to couchdb
      this.couchdb.insert({
        magic: 'school bus'
      }, id, function (err) {
        if (err) done(err);
      });

      // catch orchestrate error when you try to write it
      var is_done;
      this.watcher.on('change.error', function (change, err) {
        assert(err.statusCode, 401);
        if (!is_done) {
          is_done = true;
          done();
        }
      });
    });
  });

  describe('couchdb errors', function () {
    beforeEach(function () {
      // start watcher with bad api key
      this.watcher = OrchestrateCouchDB({
        couchdb: {
          database: 'bad-' + this.collection
        }
      });
    });

    afterEach(function () {
      this.watcher.stop();
    });

    it('should be handled effectively', function (done) {
      this.watcher.on('error', function (err) {
        assert(err.message.indexOf('no_db_file') > -1);
        done();
      });
    });
  });

  // after(recorder.after);
});
