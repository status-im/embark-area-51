var RemixDebug = require('remix-debug');
var CmdLine = RemixDebug.CmdLine;
var DebuggerManager = require('./debugger_manager.js');

class TransactionDebugger {
  constructor(embark, _options) {
    const self = this
    this.output = {}
    this.inputJson = {}
    this.embark = embark

    this.debugger_manager = new DebuggerManager("http://localhost:8545")
    embark.events.on('contracts:compile:solc', this.debugger_manager.setInputJson.bind(this.debugger_manager))
    embark.events.on('contracts:compiled:solc', this.debugger_manager.setOutputJson.bind(this.debugger_manager))

    embark.events.on('contracts:compile:solc', (inputJson) => {
      this.inputJson = inputJson
    });

    embark.events.on('contracts:compiled:solc', (output) => {
      this.output = output
    });

    this.tx_tracker = {}
    this.last_tx = ""

    this.isDebugging = false
    this.listenToEvents()
    this.listenToCommands()
    this.listentoAPI()
  }

  listenToEvents() {
    const self = this
    this.embark.events.on('blockchain:tx', (tx) => {
      this.embark.events.request("contracts:contract", tx.name, (contract) => {
        self.tx_tracker[tx.transactionHash] = {tx: tx, contract: contract}
        self.last_tx = tx.transactionHash
        if (tx.status !== '0x0') return

        self.embark.logger.info("Transaction failed");

        self.debugger_manager.getLastLine(tx.transactionHash, contract.filename, (lines) => {
          lines.forEach((line) => {
            self.embark.logger.error(line)
          })
        })
      })
    })
  }

  listentoAPI() {
    this.debuggerData = {}

    this.apiDebugger = false

    this.embark.registerAPICall('post', '/embark-api/debugger/start', (req, res) => {
      let txHash = req.body.params.txHash
      let filename = this.tx_tracker[txHash].contract.filename

      this.apiDebugger = this.debugger_manager.createDebuggerSession(txHash, filename)
      this.debuggerData = {}
      res.send({ok :true})
    });

    this.embark.registerAPICall('post', '/embark-api/debugger/JumpBack', (req, res) => {
      this.apiDebugger.debugger.step_manager.stepJumpNextBreakpoint()
      res.send({ok :true})
    })
    this.embark.registerAPICall('post', '/embark-api/debugger/JumpForward', (req, res) => {
      this.apiDebugger.debugger.step_manager.stepJumpPreviousBreakpoint()
      res.send({ok :true})
    })
    this.embark.registerAPICall('post', '/embark-api/debugger/StepOverForward', (req, res) => {
      this.apiDebugger.debugger.step_manager.stepOverForward(true)
      res.send({ok :true})
    })
    this.embark.registerAPICall('post', '/embark-api/debugger/StepOverBackward', (req, res) => {
      this.apiDebugger.debugger.step_manager.stepOverBack(true)
      res.send({ok :true})
    })
    this.embark.registerAPICall('post', '/embark-api/debugger/StepIntoForward', (req, res) => {
      this.apiDebugger.debugger.step_manager.stepIntoForward(true)
      res.send({ok :true})
    })
    this.embark.registerAPICall('post', '/embark-api/debugger/StepIntoBackward', (req, res) => {
      this.apiDebugger.debugger.step_manager.stepIntoBack(true)
      res.send({ok :true})
    });
    this.embark.registerAPICall('post', '/embark-api/debugger/breakpoint', (req, res) => {
      console.dir("new breakpoint")
      res.send({ok :true})
    });

    this.embark.registerAPICall('ws', '/embark-api/debugger', (ws, _req) => {
      if (!this.apiDebugger) return

      this.apiDebugger.events.on("source", (lineColumnPos, rawLocation) => {
        this.debuggerData.sources = {lineColumnPos, rawLocation}
        ws.send(JSON.stringify(this.debuggerData), () => {})
      })

      this.apiDebugger.events.on("locals", (data) => {
        this.debuggerData.locals = data
        ws.send(JSON.stringify(this.debuggerData), () => {})
      })

      this.apiDebugger.events.on("globals", (data) => {
        this.debuggerData.globals = data
        ws.send(JSON.stringify(this.debuggerData), () => {})
      })
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
          if (!self.cmd_line.debugger.step_manager.currentStepIndex) {
            console.dir("end of execution reached")
            this.isDebugging = false
            return self.cmd_line.debugger.unload()
          }
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
          if (!self.cmd_line.debugger.step_manager.currentStepIndex) {
            console.dir("end of execution reached")
            this.isDebugging = false
            return self.cmd_line.debugger.unload()
          }
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

    cmd_line.initDebugger(() => {
      this.isDebugging = true

      cmd_line.startDebug(txHash, filename, () => {

        cmd_line.getSource().forEach((line) => {
          console.dir(line)
        })

        cb()

      })
    })
  }
}

module.exports = TransactionDebugger
