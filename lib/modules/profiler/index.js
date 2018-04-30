const asciiTable = require('ascii-table');

class Profiler {
  constructor(embark ,options) {
    this.embark = embark;
    this.logger = embark.logger;
    this.events = embark.events;
    this.plugins = embark.plugins;

    this.registerConsoleCommand();
  }

  profile(contractName, contract) {
    const self = this;
    let table = new asciiTable(contractName);
    table.setHeading('Function', 'Payable', 'Mutability', 'Inputs', 'Outputs');
    contract.abiDefinition.forEach((abiMethod) => {
      self.logger.info(abiMethod.outputs)
      self.logger.info(abiMethod.inputs)
      switch(abiMethod.type) {
        case "constructor": 
          table.addRow("constructor", abiMethod.payable, abiMethod.stateMutability, this.formatParams(abiMethod.inputs), this.formatParams(abiMethod.outputs));
          break;
        default:
          table.addRow(abiMethod.name, abiMethod.payable, abiMethod.stateMutability, this.formatParams(abiMethod.inputs), this.formatParams(abiMethod.outputs));
      }
    });
    self.logger.info(table.toString());
  }

  formatParams(params) {
    if (params === undefined) {
      return "()"
    }
    let paramString = "("
    let mappedParams = params.map(param => param.type);
    this.logger.info("MappedParams: ", mappedParams);
    paramString += ")"
    return paramString;
  }

  registerConsoleCommand() {
    const self = this;
    self.embark.registerConsoleCommand((cmd, _options) => {
      let cmdName = cmd.split(' ')[0];
      let contractName = cmd.split(' ')[1];
      if (cmdName === 'profile') {
          self.events.request('contracts:contract', contractName, (contract) => {
               self.logger.info("--  profile for " + contractName);
               return this.profile(contractName, contract);
          });
          return "profiled...";
      }
      return false;
    });
  }
}

module.exports = Profiler;