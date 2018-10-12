var RemixDebug = require('remix-debug');
var CmdLine = RemixDebug.CmdLine;

class TransactionDebugger {
  constructor(embark, _options) {
    this.output = {}
    this.inputJson = {}

    embark.events.on('contracts:compile:solc', (inputJson) => {
      this.inputJson = inputJson
    });

    embark.events.on('contracts:compiled:solc', (output) => {
      this.output = output
    });

    embark.events.on('blockchain:tx', (tx) => {
      if (tx.status === '0x0') {
        embark.events.request("contracts:contract", tx.name, (contract) => {
          console.dir(contract)
          embark.logger.info("got a failed tx");
          embark.logger.info(tx);
          console.dir(tx);
          console.dir(contract.filename);
          console.dir(this.output);

          let filename = contract.filename

          var cmd_line = new CmdLine()
          cmd_line.connect("http", "http://localhost:8545")
          let data = {}
          data.data = this.output
          data.source = { sources: this.inputJson.sources }
          cmd_line.loadCompilationResult(data)
          cmd_line.initDebugger()

          setTimeout(function() {
            cmd_line.startDebug(tx.transactionHash, filename)
            setTimeout(function() {
              let total_size = cmd_line.debugger.step_manager.traceLength
              cmd_line.debugger.step_manager.jumpTo(total_size - 1)
              cmd_line.debugger.unload()
            }, 1000)
          }, 1000)
        })
      }
    })
  }
}

module.exports = TransactionDebugger
