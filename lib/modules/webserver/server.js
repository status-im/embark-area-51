let finalhandler = require('finalhandler');
let http = require('http');
let serveStatic = require('serve-static');
const {canonicalHost, defaultHost, dockerHostSwap} = require('../../utils/host');
require('http-shutdown').extend();
var express = require('express');
let path = require('path');

class Server {
  constructor(options) {
    this.dist = options.dist || 'dist/';
    this.port = options.port || 8000;
    this.hostname = dockerHostSwap(options.host) || defaultHost;
  }

  start(callback) {
    if (this.server && this.server.listening) {
      let message = __("a webserver is already running at") + " " +
                      ("http://" + canonicalHost(this.hostname) +
                      ":" + this.port).bold.underline.green;
      return callback(null, message);
    }
    let serve = serveStatic(this.dist, {'index': ['index.html', 'index.htm']});

    var app = express();

    app.use(serve);
    app.use('/backend', serveStatic(path.join(__dirname, 'backend'), {'backend': ['index.html', 'index.htm']}));

    //app.get('/embark', function (req, res) {
    //  res.send('Welcome to Embark')
    //});

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
