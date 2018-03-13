let finalhandler = require('finalhandler');
let http = require('http');
let serveStatic = require('serve-static');
require('http-shutdown').extend();
var express = require('express');
let path = require('path');
var expressWebSocket = require('express-ws');

class Server {
  constructor(options) {
    this.events = options.events;
    this.dist = options.dist || 'dist/';
    this.port = options.port || 8000;
    this.hostname = options.host || 'localhost';
    this.logger = options.logger;
    this.plugins = options.plugins;
  }

  start(callback) {
    const self = this;
    if (this.server && this.server.listening) {
      this.logger.warn("a webserver is already running at " + ("http://" + this.hostname + ":" + this.port).bold.underline.green);
      if (callback) {
        callback();
      }
      return;
    }
    let serve = serveStatic(this.dist, {'index': ['index.html', 'index.htm']});

    var app = express();

    app.use(serve);
    app.use('/embark', serveStatic(path.join(__dirname, 'backend'), {'backend': ['index.html', 'index.htm']}));

    expressWebSocket(app);

    app.ws('/embark/logs', function(ws, req) {
      self.events.on("log", function(logLevel, logMsg) {
        ws.send(JSON.stringify({msg: logMsg, msg_clear: logMsg.stripColors, logLevel: logLevel}), () => {});
      });
    });

    let apiCalls = self.plugins.getPluginsProperty("apiCalls", "apiCalls");
    for (let apiCall of apiCalls) {
      app[apiCall.method].apply(app, [apiCall.endpoint, apiCall.cb]);
    }

    app.get('/embark', function (req, res) {
      res.send('Welcome to Embark')
    });

    app.get('/embark/console', function (req, res) {
      self.events.request('console:command', req.query.cmd, res.send.bind(res));
    });

    app.listen(this.port);

    this.logger.info("webserver available at " + ("http://" + this.hostname + ":" + this.port).bold.underline.green);

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
      this.logger.warn("no webserver is currently running");
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
