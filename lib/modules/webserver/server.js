let finalhandler = require('finalhandler');
let http = require('http');
let serveStatic = require('serve-static');
const {canonicalHost, defaultHost, dockerHostSwap} = require('../../utils/host');
require('http-shutdown').extend();
var express = require('express');
var cors = require('cors')
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
    const self = this;
    if (this.server && this.server.listening) {
      this.logger.warn(__("a webserver is already running at") +
                       " " +
                       ("http://" + canonicalHost(this.hostname) +
                        ":" + this.port).bold.underline.green);
      if (callback) {
        callback();
      }
      return;
    }
    var app = express();
    app.use(cors());
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

    this.logger.info(__("webserver available at") + " " + ("http://" + canonicalHost(this.hostname) + ":" + this.port).bold.underline.green);
    //this.server.listen(this.port, this.hostname);

    //this.server = http.createServer(function onRequest(req, res) {
    //  serve(req, res, finalhandler(req, res));
    //}).withShutdown();

    //this.logger.info("webserver available at " + ("http://" + this.hostname + ":" + this.port).bold.underline.green);
    //this.server.listen(this.port, this.hostname);
    if (callback) {
      callback();
    }
  }

  stop(callback) {
    if (!this.server || !this.server.listening) {
      this.logger.warn(__("no webserver is currently running"));
      if (callback) {
        callback();
      }
      return;
    }
    this.server.shutdown(function() {
      if (callback) {
        callback();
      }
    });
  }

}

module.exports = Server;
