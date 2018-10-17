var RemixDebug = require('remix-debug');
var CmdLine = RemixDebug.CmdLine;

class TransactionDebugger {
  constructor(embark, _options) {
    const self = this
    this.output = {}
    this.inputJson = {}
    this.embark = embark

    embark.events.on('contracts:compile:solc', (inputJson) => {
      this.inputJson = inputJson
    });

    embark.events.on('contracts:compiled:solc', (output) => {
      this.output = output
    });

    this.tx_tracker = {}
    this.last_tx = ""


    embark.events.on('blockchain:tx', (tx) => {
      embark.events.request("contracts:contract", tx.name, (contract) => {
        self.tx_tracker[tx.transactionHash] = {tx: tx, contract: contract}
        self.last_tx = tx.transactionHash
        if (tx.status === '0x0') {
          embark.logger.info("got a failed tx");

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
              cmd_line.events.on("source", () => {
                cmd_line.getSource().forEach((line) => {
                  console.dir(line)
                })
              })

              let total_size = cmd_line.debugger.step_manager.traceLength
              cmd_line.debugger.step_manager.jumpTo(total_size - 1)
              cmd_line.debugger.unload()
            }, 1000)
          }, 1000)
        }
      })
    })

    this.isDebugging = false
    this.listenToCommands()
    this.listentoAPI()
  }

  listentoAPI() {
    this.embark.registerAPICall('post', '/embark-api/debugger/start', (req, res) => {
      let txHash = req.body.params.txHash
      this.debug(txHash, () => {})
      res.send({})
    });
    this.embark.registerAPICall('post', '/embark-api/debugger/next', (req, res) => {
      this.cmd_line.debugger.step_manager.stepOverForward(true)
    });
    this.embark.registerAPICall('post', '/embark-api/debugger/previous', (req, res) => {
      this.cmd_line.debugger.step_manager.stepOverBack(true)
    });

    this.embark.registerAPICall('ws', '/embark-api/debugger', (ws, _req) => {

      if (this.isDebugging) {
        this.cmd_line.events.on("source", (lineColumnPos, rawLocation) => {
          ws.send(JSON.stringify({sources: {lineColumnPos, rawLocation}}), () => {})
        })

        this.cmd_line.events.on("locals", (data) => {
          ws.send(JSON.stringify({locals: data}), () => {})
        })
        this.cmd_line.events.on("globals", (data) => {
          ws.send(JSON.stringify({globals: data}), () => {})
        })
      }

      // setInterval(() => {
      //   ws.send(JSON.stringify({test: "test"}), () => {})
      // }, 1000)
    });
  }

  listenToCommands() {
    const self = this

    this.embark.registerConsoleCommand((cmd, _options) => {
      let cmdName = cmd.split(" ")[0]
      let tx = cmd.split(" ")[1]
      return {
        match: () => cmdName === 'debug',
        process: (cb) => {
          if (tx) {
            return self.debug(tx, cb)
          }
          self.debug(self.last_tx, cb)
        }
      };
    })

    this.embark.registerConsoleCommand((cmd, _options) => {
      return {
        match: () => (cmd === 'next' || cmd === 'n'),
        process: (cb) => {
          self.cmd_line.debugger.step_manager.stepOverForward(true)
          self.cmd_line.getSource().forEach((line) => {
            console.dir(line)
          })
        }
      };
    })

    this.embark.registerConsoleCommand((cmd, _options) => {
      return {
        match: () => (cmd === 'previous' || cmd === 'p'),
        process: (cb) => {
          self.cmd_line.debugger.step_manager.stepOverBack(true)
          self.cmd_line.getSource().forEach((line) => {
            console.dir(line)
          })
        }
      };
    })

    this.embark.registerConsoleCommand((cmd, _options) => {
      return {
        match: () => (cmd === 'var local' || cmd === 'v l' || cmd === 'vl'),
        process: (cb) => {
          self.cmd_line.displayLocals()
        }
      };
    })

    this.embark.registerConsoleCommand((cmd, _options) => {
      return {
        match: () => (cmd === 'var global' || cmd === 'v g' || cmd === 'vg'),
        process: (cb) => {
          self.cmd_line.displayGlobals()
        }
      };
    })
  }

  debug(txHash, cb) {
    console.dir("debugging tx " + txHash)
    if (!this.tx_tracker[txHash]) {
      console.error("can't find a contract & source associated to this tx")
      return cb();
    }

    let filename = this.tx_tracker[txHash].contract.filename

    var cmd_line = new CmdLine()
    this.cmd_line = cmd_line
    cmd_line.connect("http", "http://localhost:8545")
    let data = {}
    data.data = this.output
    data.source = { sources: this.inputJson.sources }
    cmd_line.loadCompilationResult(data)
    cmd_line.initDebugger()

    this.isDebugging = true

    setTimeout(function() {
      cmd_line.startDebug(txHash, filename)
    }, 1000)
    cb()
  }
}

module.exports = TransactionDebugger
