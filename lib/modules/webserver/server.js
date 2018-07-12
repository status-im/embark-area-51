require('http-shutdown').extend();
const express = require('express');
const path = require('path');
const expressWebSocket = require('express-ws');
const bodyParser = require('body-parser');
const fs = require('../../core/fs');

class Server {
  constructor(options) {
    this.events = options.events;
    this.dist = options.dist || 'dist/';
    this.port = options.port || 8000;
    this.hostname = options.host || 'localhost';
    this.logger = options.logger;
    this.plugins = options.plugins;
    this.enableCatchAll = options.enableCatchAll;
  }

  start(callback) {
    const self = this;
    if (this.server && this.server.listening) {
      this.logger.warn(__("a webserver is already running at") + " " + ("http://" + this.hostname + ":" + this.port).bold.underline.green);
      if (callback) {
        callback();
      }
      return;
    }

    var app = express();

    app.use(serve);
    //app.use('/embark', serveStatic(path.join(__dirname, 'backend'), {'backend': ['index.html', 'index.htm']}));
    //app.use('/backend', serveStatic(path.join(__dirname, 'backend'), {'backend': ['index.html', 'index.htm']}));
    //app.get('/embark', function (req, res) {
    //  res.sendFile(path.join(__dirname, 'backend', 'index.html'));
    //});

    // support static files
    app.use(express.static(path.join(fs.dappPath(this.dist)), {'index': ['index.html', 'index.htm']}));
    app.use(['/embark', '/backend', '/admin'], express.static(path.join(__dirname, 'backend'), {'index': ['index.html', 'index.htm']})); // mount the sub app

    // support json encoded bodies
    app.use(bodyParser.json()); 

    // support encoded bodies
    app.use(bodyParser.urlencoded({extended: true}));

    // support websockets
    expressWebSocket(app);

    // register any api calls
    if(self.plugins){
      let apiCalls = self.plugins.getPluginsProperty("apiCalls", "apiCalls");
      for (let apiCall of apiCalls) {
        app[apiCall.method](apiCall.endpoint, apiCall.cb);
        this.logger.trace(`webserver> registered api call ${apiCall.method.toUpperCase()} ${apiCall.endpoint}`);
      }
    }

    // catchall to support react routing
    if(this.enableCatchAll === true){
      app.get('/*', function (req, res) {
        self.logger.trace('webserver> GET ' + req.path);
        res.sendFile(path.join(fs.dappPath(self.dist, 'index.html')));
      });
    }

    app.listen(this.port);

    //this.logger.info(__("webserver available at") + " " + ("http://" + this.hostname + ":" + this.port).bold.underline.green);
    //this.server.listen(this.port, this.hostname);

    //app.get('/embark', function (req, res) {
    //  res.send('Welcome to Embark')
    //});

    this.logger.info("webserver available at " + ("http://" + this.hostname + ":" + this.port).bold.underline.green);

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
