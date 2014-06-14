var nock = require('nock');
var path = require('path');
var fs = require('fs');

module.exports = function (name, options) {
  // options tell us where to store our fixtures
  options = options || {};
  var test_folder = options.test_folder || 'test';
  var fixtures_folder = options.fixtures_folder || 'fixtures';
  var fp = path.join(test_folder, fixtures_folder, name + '.js');
  // NOCK_RECORDING indicates whether we 
  var force_recording = !!process.env.NOCK_RECORD;
  // `has_fixtures` indicates whether the test has fixtures we should read,
  // or doesn't, so we should record and save them.
  var has_fixtures;

  return {
    // starts recording, or ensure the fixtures exist
    before: function () {
      if (!force_recording) try {
        require('../' + fp);
        has_fixtures = true;
      } catch (e) {
        nock.recorder.rec({
          dont_print: true
        });
      } else {
        nock.recorder.rec({
          dont_print: true
        });
      }
    },
    // saves our recording if fixtures didn't already exist
    after: function (done) {
      if (!has_fixtures) {
        has_fixtures = nock.recorder.play();
        var text = "var nock = require('nock');\n" + fixtures.join('\n');
        fs.writeFile(fp, text, done);
      } else {
        done();
      }
    }
  }
};
