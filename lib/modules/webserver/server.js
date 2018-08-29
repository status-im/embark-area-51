const {canonicalHost, defaultHost, dockerHostSwap} = require('../../utils/host');
require('http-shutdown').extend();
var express = require('express');
var cors = require('cors');
let path = require('path');
var expressWebSocket = require('express-ws');
var bodyParser = require('body-parser');
var fs = require('../../core/fs.js');

class Server {
  constructor(options) {
    this.events = options.events;
    this.dist = options.dist || 'dist/';
    this.port = options.port || 8000;
    this.hostname = dockerHostSwap(options.host) || defaultHost;
    this.logger = options.logger;
    this.plugins = options.plugins;
    this.enableCatchAll = options.enableCatchAll;
  }

  start(callback) {
    callback = callback || function() {};
    const self = this;
    if (this.server && this.server.listening) {
      let message = __("a webserver is already running at") + " " +
        ("http://" + canonicalHost(this.hostname) +
          ":" + this.port).bold.underline.green;
      return callback(null, message);
    }
    var app = express();
    app.use(cors());
    app.use(express.static(path.join(fs.dappPath(this.dist)), {'index': ['index.html', 'index.htm']}));
    app.use('/old_backend', express.static(path.join(__dirname, './backend')));
    app.use('/embark', express.static(path.join(__dirname, '../../../embark-ui/build')));

    app.use(bodyParser.json()); // support json encoded bodies
    app.use(bodyParser.urlencoded({extended: true})); // support encoded bodies

    expressWebSocket(app);

    if (self.plugins) {
      let apiCalls = self.plugins.getPluginsProperty("apiCalls", "apiCalls");

      app.get('/embark-api/plugins', function(req, res) {
        res.send(JSON.stringify(self.plugins.plugins.map((plugin) => {
          return {name: plugin.name};
        })));
      });

      for (let apiCall of apiCalls) {
        console.dir("adding " + apiCall.method + " " + apiCall.endpoint);
        app[apiCall.method].apply(app, [apiCall.endpoint, apiCall.cb]);
      }
    }

    this.events.on('plugins:register:api', (apiCall) => {
      console.dir("adding " + apiCall.method + " " + apiCall.endpoint);
      app[apiCall.method].apply(app, [apiCall.endpoint, apiCall.cb]);
    });

    app.get('/embark/*', function(req, res) {
      self.logger.trace('webserver> GET ' + req.path);
      res.sendFile(path.join(__dirname, '../../../embark-ui/build', 'index.html'));
    });

    if (this.enableCatchAll === true) {
      app.get('/*', function(req, res) {
        self.logger.trace('webserver> GET ' + req.path);
        res.sendFile(path.join(fs.dappPath(self.dist, 'index.html')));
      });
    }

    app.listen(this.port);

    callback(null, __("webserver available at") +
      " " +
      ("http://" + canonicalHost(this.hostname) +
        ":" + this.port).bold.underline.green);
  }

  stop(callback) {
    callback = callback || function () {};
    if (!this.server || !this.server.listening) {
      return callback(null, __("no webserver is currently running"));
    }
    this.server.shutdown(function() {
      callback(null, __("Webserver stopped"));
    });
  }

}

module.exports = Server;
