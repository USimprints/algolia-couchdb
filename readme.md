# Orchestrate-CouchDB

[![Build Status](https://travis-ci.org/orchestrate-io/orchestrate-couchdb.svg)](https://travis-ci.org/orchestrate-io/orchestrate-couchdb)
[![Coverage Status](https://coveralls.io/repos/orchestrate-io/orchestrate-couchdb/badge.png)](https://coveralls.io/r/orchestrate-io/orchestrate-couchdb)

[![NPM](https://nodei.co/npm/orchestrate-couchdb.png)](https://nodei.co/npm/orchestrate-couchdb/)

Pipe CouchDB changes into [Orchestrate.io][], to effortlessly add a search, events, and relations API.

## Install

    npm install orchestrate-couchdb

## Usage

```javascript
var OrchestrateMongo = require('orchestrate-couchdb');

var importer = new OrchestrateCouchDB({
  orchestrate: {
    api_key: 'your_orchestrate_api_key'
  },
  couchdb: {
    port: 5984,
    host: 'localhost',
    username: 'bobross',
    password: 'happylittletrees',
    database: 'joy-of-painting'
  }
});

importer.on('change.success', console.log);
```

Now whenever the importer successfully writes a document to Orchestrate, it will print a message.

## Using as a Daemon

You can also run orchestrate-couchdb as a daemon, so it will continue watching your CouchDB node autonomously. To start the web server, just do:

    sudo npm install -g orchestrate-couchdb
    export ORCHESTRATE_API_KEY=...
    export COUCHDB_HOST=...
    export COUCHDB_PORT=...
    export COUCHDB_USERNAME=...
    export COUCHDB_PASSWORD=...
    export COUCHDB_DATABASE=...
    orchestrate-couchdb
    # Now listening to [database]

Now the importer is running on `http://localhost:3000`.

## Usage on Heroku

To deploy `orchestrate-couchdb` on Heroku, you'll need the [heroku toolbelt][]. Then:

    git clone git@github.com:orchestrate-io/orchestrate-couchdb.git
    cd orchestrate-couchdb
    heroku create [app-name]
    heroku config:set ORCHESTRATE_API_KEY=...
    heroku config:set COUCHDB_HOST=...
    heroku config:set COUCHDB_PORT=...
    heroku config:set COUCHDB_USERNAME=...
    heroku config:set COUCHDB_PASSWORD=...
    heroku config:set COUCHDB_DATABASE=...
    git push heroku master

Now your app is running on Heroku! To prevent it from idling, scale the process to use two dynos:

  heroku ps:scale worker=2

## Options

`orchestrate-couchdb` takes one argument, an options object. It takes the following arguments, and has the following defaults:

    orchestrate: {
      api_key: process.env.ORCHESTRATE_API_KEY
    },
    couchdb: {
      port: process.env.COUCHDB_PORT || 27017,
      host: process.env.COUCHDB_HOST || 'localhost',
      username: process.env.COUCHDB_USERNAME,
      password: process.env.COUCHDB_PASSWORD
    }

You can set many of these options as environment variables, or you can pass them directly:

```javascript
var OrchestrateCouchDB = require('orchestrate-couchdb');

var importer = new OrchestrateCouchDB({
  orchestrate: {
    api_key: 'your_orchestrate_api_key'
  },
  mongodb: {
    port: 5984,
    host: 'localhost',
    username: 'bobross',
    password: 'happylittletrees'
  }
});
```

## Events

* `connect`
* `change`: Emitted whenever processing a change starts, succeeded, and errors out.
* `change.start`: Detected a change in MongoDB.
* `change.success`: Writing a document to Orchestrate.io succeeded!
* `change.error`: Writing a document to Orchestrate.io failed due to an error.
* `error`: The connection to MongoDB experienced an error.
* `drain`: The queue has run out of changes to process.

## Tests

    npm test

## License

[ISC][], yo.

[Orchestrate.io]: https://orchestrate.io/
[ISC]: http://opensource.org/licenses/ISC
