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

  profileContract(contract, isDeployed, returnCb){
    const self = this;
    let profileObj = {};
    profileObj.name = contract.className;
    profileObj.methods = [];

    if (!contract || (!contract.deployedAddress && isDeployed)) {
      return returnCb("--  couldn't profile " + contract.className + " - it's not deployed or could be an interface");
    }
    self.gasEstimator.estimateGas(contract, isDeployed, function(_err, gastimates, _name) {
      contract.abiDefinition.forEach((abiMethod) => {
        let methodName = abiMethod.name;
        if (['constructor', 'fallback'].indexOf(abiMethod.type) >= 0) {
          methodName = abiMethod.type;
        }

        profileObj.methods.push({
          name: methodName,
          payable: abiMethod.payable,
          mutability: abiMethod.stateMutability,
          inputs: abiMethod.inputs || [],
          outputs: abiMethod.outputs || [],
          gasEstimates: !isDeployed ? "not deployed" : (gastimates && gastimates[methodName])
        });
      });

      returnCb(null, profileObj);
    });
  }

  profileJSON(contractName, returnCb) {
    this.events.request('contracts:contract', contractName, (contract) => {
      this.profileContract(contract, true, returnCb);
    });
  }

  profile(contractName, returnCb) {
    const self = this;

    this.profileJSON(contractName, (err, profileObj) => {
      if (err) {
        return returnCb(err);
      }

      let table = new asciiTable(contractName);
      table.setHeading('Function', 'Payable', 'Mutability', 'Inputs', 'Outputs', 'Gas Estimates');
      profileObj.methods.forEach((method) => {
        table.addRow(method.name, method.payable, method.mutability, self.formatParams(method.inputs), self.formatParams(method.outputs), method.gasEstimates);
      });
      return returnCb(null, table.toString());
    });
  }

  formatParams(params) {
    return "(" + (params || []).map(param => param.type).join(',') + ")";
  }

  registerConsoleCommand() {
    const self = this;
    self.embark.registerConsoleCommand((cmd, _options) => {
      let cmdName = cmd.split(' ')[0];
      let contractName = cmd.split(' ')[1];

      return {
        match: () => cmdName === 'profile',
        process: (callback) => {
          this.profile(contractName, callback);
        }
      };
    });
  }

  registerApi() {
    this.embark.registerAPICall(
      'get',
      '/embark-api/profiler/:contractName',
      (req, res) => {
        let contractName = req.params.contractName;

        this.profileJSON(contractName, (err, table) => {
          if (err) {
            return res.send({error: err.message});
          }
          res.send(table);
        });
      }
    );

    this.embark.registerAPICall(
      'post',
      '/embark-api/profiler/profile',
      (req, res) => {
        let contract = req.body.compilationResult;
        if (!contract) {
          return res.status(204).send(); // send emptry response
        }
        if (typeof contract !== 'object') {
          return res.status(422).send({error: 'Body parameter \'compilationResult\' must be an object'});
        }
        if(Object.keys(contract).length === 0){
          return res.status(204).send(); // send emptry response
        }
        // use the first child of the object
        const className = Object.keys(contract)[0];
        contract = contract[className];
        contract.className = className;

        this.profileContract(contract, false, (err, table) => {
          if (err) {
            return res.send({error: err.message});
          }
          res.send(table);
        });
      }
    );
  }

}

module.exports = Profiler;
