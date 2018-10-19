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
    this.cmdDebugger = false

    this.embark.registerConsoleCommand((cmd, _options) => {
      let cmdName = cmd.split(" ")[0]
      let txHash = cmd.split(" ")[1]
      return {
        match: () => cmdName === 'debug',
        process: (cb) => {
          if (txHash) {
            let filename = self.tx_tracker[txHash].contract.filename
            self.cmdDebugger = self.debugger_manager.createDebuggerSession(txHash, filename)
            return
          }
          let filename = self.tx_tracker[self.last_tx].contract.filename
          self.cmdDebugger = self.debugger_manager.createDebuggerSession(self.last_tx, filename)
        }
      };
    })

    this.embark.registerConsoleCommand((cmd, _options) => {
      return {
        match: () => (cmd === 'next' || cmd === 'n'),
        process: (cb) => {
          if (!self.cmdDebugger.debugger.step_manager.currentStepIndex) {
            console.dir("end of execution reached")
            return self.cmdDebugger.debugger.unload()
          }
          self.cmdDebugger.debugger.step_manager.stepOverForward(true)
          self.cmdDebugger.getSource().forEach((line) => {
            console.dir(line)
          })
        }
      };
    })

    this.embark.registerConsoleCommand((cmd, _options) => {
      return {
        match: () => (cmd === 'previous' || cmd === 'p'),
        process: (cb) => {
          if (!self.cmdDebugger.debugger.step_manager.currentStepIndex) {
            console.dir("end of execution reached")
            this.isDebugging = false
            return self.cmdDebugger.debugger.unload()
          }
          self.cmdDebugger.debugger.step_manager.stepOverBack(true)
          self.cmdDebugger.getSource().forEach((line) => {
            console.dir(line)
          })
        }
      };
    })

    this.embark.registerConsoleCommand((cmd, _options) => {
      return {
        match: () => (cmd === 'var local' || cmd === 'v l' || cmd === 'vl'),
        process: (cb) => {
          self.cmdDebugger.displayLocals()
        }
      };
    })

    this.embark.registerConsoleCommand((cmd, _options) => {
      return {
        match: () => (cmd === 'var global' || cmd === 'v g' || cmd === 'vg'),
        process: (cb) => {
          self.cmdDebugger.displayGlobals()
        }
      };
    })
  }

}

module.exports = TransactionDebugger
