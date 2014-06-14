var record = require('./record');
var nano = require('nano');
var orchestrate = require('orchestrate');
var OrchestrateCouchDB = require('../lib-cov');

describe('OrchestrateCouchDB', function () {
  var recorder = record('OrchestrateCouchDB');
  before(recorder.before);

  before(function (done) {
    // start watcher
    this.watcher = OrchestrateCouchDB();
    // set up db connections
    this.collection = 'orchestrate-couchdb';
    this.nano = nano('http://localhost:5984');
    this.couchdb = this.nano.use(this.database);
    this.orc = orchestrate(process.env.ORCHESTRATE_API_KEY);
  });

  beforeEach(function (done) {
    // create couchdb database
    this.nano.db.create(this.collection, done);
  });

  afterEach(function (done) {
    // delete collections
    async.parallel([
      this.nano.db.destroy.bind(this.nano.db, this.collection),
      this.orc.deleteCollection.bind(this.orc, this.collection)
    ], done);
  });

  it('should sync CouchDB changes to Orchestrate', function (done) {
    var id = 'derpderp';
    // write documents to couchdb
    this.couchdb.insert(id, {}, function (err) {
      if (err) done(err);
    });
    // wait for the watcher to report the change
    this.watcher.on('change.success', function (change_id) {
      if (id === change_id) done();
    });
  });

  after(recorder.after);
});
