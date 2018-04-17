let finalhandler = require('finalhandler');
let http = require('http');
let serveStatic = require('serve-static');
require('http-shutdown').extend();
var express = require('express');
let path = require('path');

class Server {
  constructor(options) {
    this.dist = options.dist || 'dist/';
    this.port = options.port || 8000;
    this.hostname = options.host || 'localhost';
    this.logger = options.logger;
  }

  start(callback) {
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
    app.use('/backend', serveStatic(path.join(__dirname, 'backend'), {'backend': ['index.html', 'index.htm']}));

    //app.get('/embark', function (req, res) {
    //  res.send('Welcome to Embark')
    //});

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
