const asciiTable = require('ascii-table');
const GasEstimator = require('./gasEstimator.js');

class Profiler {
  constructor(embark, options) {
    this.embark = embark;
    this.logger = embark.logger;
    this.events = embark.events;
    this.plugins = options.plugins;
    this.gasEstimator = new GasEstimator(embark);

    this.registerConsoleCommand();
    this.registerApi();
  }

  profileJSON(contractName, returnCb) {
    const self = this;

    let profileObj = {};
    profileObj.name = contractName;
    profileObj.methods = [];

    self.events.request('contracts:contract', contractName, (contract) => {
      if (!contract || !contract.deployedAddress) {
        return returnCb("--  couldn't profile " + contractName + " - it's not deployed or could be an interface");
      }
      self.gasEstimator.estimateGas(contractName, function(err, gastimates, name) {
        if (err) {
          return returnCb(err);
        }

        contract.abiDefinition.forEach((abiMethod) => {
          let methodName = abiMethod.name;
          if (['constructor', 'fallback'].indexOf(abiMethod.type) >= 0) {
            methodName = abiMethod.type;
          }

          profileObj.methods.push({
            name: methodName,
            payable: abiMethod.payable,
            mutability: abiMethod.stateMutability,
            inputs: self.formatParams(abiMethod.inputs),
            outputs: self.formatParams(abiMethod.outputs),
            gasEstimates: gastimates[methodName]
          });
        });

        returnCb(null, profileObj);
      });
    });
  }

  profile(contractName, returnCb) {
    const self = this;

    this.profileJSON(contractName, (err, profileObj) => {
      if (err) {
        self.logger.error(JSON.stringify(err));
        return returnCb(err);
      }

      let table = new asciiTable(contractName);
      table.setHeading('Function', 'Payable', 'Mutability', 'Inputs', 'Outputs', 'Gas Estimates');
      profileObj.methods.forEach((method) => {
        table.addRow(method.name, method.payable, method.mutability, method.inputs, method.outputs, method.gasEstimates);
      });
      return returnCb(null, table.toString());
    });
  }

  formatParams(params) {
    if (!params || !params.length) {
      return "()";
    }
    let paramString = "(";
    let mappedParams = params.map(param => param.type);
    paramString += mappedParams.join(',');
    paramString += ")";
    return paramString;
  }

  registerConsoleCommand() {
    const self = this;
    self.embark.registerConsoleCommand((cmd, _options) => {
      let cmdName = cmd.split(' ')[0];
      let contractName = cmd.split(' ')[1];
      if (cmdName === 'profile') {
        self.logger.info("--  profile for " + contractName);
        self.profile(contractName, (err, table) => {
          self.logger.info(table);
        });
        return "";
      }
      return false;
    });
  }

  registerApi() {
    const self = this;

    let plugin = this.plugins.createPlugin('profiler', {});
    plugin.registerAPICall(
      'get',
      '/embark-api/profiler/:contractName',
      (req, res) => {
        let contractName = req.params.contractName;

        self.profileJSON(contractName, (err, table) => {
          if (err) {
            return res.send({error: err});
          }
          res.send(table);
        });
      }
    );
  }

}

module.exports = Profiler;
