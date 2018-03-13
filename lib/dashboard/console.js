let utils = require('../utils/utils.js');

class Console {
  constructor(options) {
    const self = this;
    this.events = options.events;
    this.plugins = options.plugins;
    this.version = options.version;
    this.contractsConfig = options.contractsConfig;

    let plugin = this.plugins.createPlugin('dashboard', {});
    plugin.registerAPICall(
      'post',
      '/embark/console',
      (req, res) => {
        self.events.request('console:command', req.body.cmd, res.send.bind(res));
      }
    );
  }

  runCode(code) {
    this.events.request('runcode:eval', code);
  }

  processEmbarkCmd (cmd) {
    if (cmd === 'help' || cmd === __('help')) {
      let helpText = [
        __('Welcome to Embark') + ' ' + this.version,
        '',
        __('possible commands are:'),
        'versions - ' + __('display versions in use for libraries and tools like web3 and solc'),
        // TODO: only if the blockchain is actually active!
        // will need to pass te current embark state here
        'ipfs - ' + __('instantiated js-ipfs object configured to the current environment (available if ipfs is enabled)'),
        'web3 - ' + __('instantiated web3.js object configured to the current environment'),
        'quit - ' + __('to immediatly exit (alias: exit)'),
        '',
        __('The web3 object and the interfaces for the deployed contracts and their methods are also available')
      ];
      return helpText.join('\n');
    } else if (['quit', 'exit', 'sair', 'sortir', __('quit')].indexOf(cmd) >= 0) {
      utils.exit();
    }
    return false;
  }

  executeCmd(cmd, callback) {
    var pluginCmds = this.plugins.getPluginsProperty('console', 'console');
    for (let pluginCmd of pluginCmds) {
      let pluginOutput = pluginCmd.call(this, cmd, {});
      if (pluginOutput !== false && pluginOutput !== 'false' && pluginOutput !== undefined) return callback(pluginOutput);
    }

    let output = this.processEmbarkCmd(cmd);
    if (output) {
      return callback(output);
    }

    try {
      this.events.request('runcode:eval', cmd, (err, result) => {
        callback(result);
      });
    }
    catch (e) {
      if (e.message.indexOf('not defined') > 0) {
        return callback(("error: " + e.message).red + ("\n" + __("Type") + " " + "help".bold + " " + __("to see the list of available commands")).cyan);
      } else {
        return callback(e.message);
      }
    }
  }
}

module.exports = Console;
