let finalhandler = require('finalhandler');
let http = require('http');
let serveStatic = require('serve-static');
const {canonicalHost, defaultHost, dockerHostSwap} = require('../../utils/host');
require('http-shutdown').extend();
var express = require('express');
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
  }

  start(callback) {
    const self = this;
    if (this.server && this.server.listening) {
      let message = __("a webserver is already running at") + " " +
                      ("http://" + canonicalHost(this.hostname) +
                      ":" + this.port).bold.underline.green;
      return callback(null, message);
    }
    var app = express();

		app.use(express.static(path.join(fs.dappPath(this.dist)), {'index': ['index.html', 'index.htm']}));
    app.use('/embark', express.static(path.join(__dirname, '../../../embark-ui/build')));

    app.use(bodyParser.json()); // support json encoded bodies
    app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

    expressWebSocket(app);

    if (self.plugins) {
      let apiCalls = self.plugins.getPluginsProperty("apiCalls", "apiCalls");
      for (let apiCall of apiCalls) {
        console.dir("adding " + apiCall.method + " " + apiCall.endpoint);
        app[apiCall.method].apply(app, [apiCall.endpoint, apiCall.cb]);
      }
    }

    app.get('/embark/*', function (req, res) {
      self.logger.trace('webserver> GET ' + req.path);
      res.sendFile(path.join(__dirname, '../../../embark-ui/build', 'index.html'));
    });

    if (this.enableCatchAll === true) {
      app.get('/*', function (req, res) {
        self.logger.trace('webserver> GET ' + req.path);
        res.sendFile(path.join(fs.dappPath(self.dist, 'index.html')));
      });
    }

    app.listen(this.port);

    let message = __("webserver available at") +
                    " " +
                    ("http://" + canonicalHost(this.hostname) +
                    ":" + this.port).bold.underline.green;
    this.server.listen(this.port, this.hostname);
    callback(null, message);
  }

  stop(callback) {
    if (!this.server || !this.server.listening) {
      return callback(null, __("no webserver is currently running"));
    }
    this.server.shutdown(function() {
      callback(null, __("Webserver stopped"));
    });
  }

}

module.exports = Server;
