let finalhandler = require('finalhandler');
let http = require('http');
let serveStatic = require('serve-static');
const {canonicalHost, defaultHost, dockerHostSwap} = require('../../utils/host');
require('http-shutdown').extend();
var express = require('express');
let path = require('path');
var expressWebSocket = require('express-ws');
var bodyParser = require('body-parser');

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
    let serve = serveStatic(this.dist, {'index': ['index.html', 'index.htm']});

    var app = express();

    app.use(serve);
    app.use('/embark', serveStatic(path.join(__dirname, 'backend'), {'backend': ['index.html', 'index.htm']}));

    app.use(bodyParser.json()); // support json encoded bodies
    app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

    expressWebSocket(app);

    let apiCalls = self.plugins.getPluginsProperty("apiCalls", "apiCalls");
    console.dir(apiCalls);
    for (let apiCall of apiCalls) {
      console.dir("adding " + apiCall.method + " " + apiCall.endpoint);
      app[apiCall.method].apply(app, [apiCall.endpoint, apiCall.cb]);
    }

    app.get('/embark', function (req, res) {
      res.send('Welcome to Embark')
    });

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
