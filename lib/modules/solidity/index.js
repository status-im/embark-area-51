let async = require('../../utils/async_extend.js');
let SolcW = require('./solcW.js');
const fs = require('../../core/fs');

class Solidity {

  constructor(embark, options) {
    this.logger = embark.logger;
    this.events = embark.events;
    this.ipc = options.ipc;
    this.contractDirectories = embark.config.contractDirectories;
    this.solcAlreadyLoaded = false;
    this.solcW = null;
    this.useDashboard = options.useDashboard;
    this.options = embark.config.embarkConfig.options.solc;

    embark.registerCompiler(".sol", this.compile_solidity.bind(this));

    embark.registerAPICall(
      'post',
      '/embark-api/contract/compile',
      (req, res) => {
        const sourceCode = req.body.codeToCompile;
        if (!sourceCode) {
          return res.status(204).send(); // send emptry response
        }
        if (typeof sourceCode !== 'string') {
          return res.status(422).send({error: 'Body parameter \'codeToCompile\' must be a string'});
        }
        const input = {'fiddle': {content: sourceCode.replace(/\r\n/g, '\n')}};
        this.compile_solidity_code(input, {}, true, (error, compilationResult, errors) => {
          if (error) res.status(500).send({error: error.message});

          // write code to filesystem so we can view the source after page refresh
          const compilationClasses = Object.keys(compilationResult);
          const className = compilationClasses.length === 0 ? 'temp' : compilationClasses.join('_');
          this._writeFiddleToFile(sourceCode, className, Boolean(compilationResult), (err) => {
            if (err) this.logger.trace('Error writing fiddle to filesystem: ', err);
          }); // async, do not need to wait

          const responseData = {errors, compilationResult};
          this.logger.trace(`POST response /embark-api/contract/compile:\n ${JSON.stringify(responseData)}`);
          res.send(responseData);
        });
      }
    );
  }

  _writeFiddleToFile(code, className, isCompiled, cb) {
    fs.mkdirp('.embark/fiddles', (err) => {
      if (err) return cb(err);

      // always write to temp.sol file
      const filePath = Solidity._getFiddlePath('temp');
      fs.writeFile(filePath, code, 'utf8', cb);

      // if it's compiled, also write to [classname].sol
      if (isCompiled) {
        const filePath = Solidity._getFiddlePath(className);
        fs.writeFile(filePath, code, 'utf8', cb);
      }
    });
  }

  static _getFiddlePath(className) {
    return fs.dappPath(`.embark/fiddles/${className}.sol`);
  }

  _compile(jsonObj, returnAllErrors, callback) {
    const self = this;
    self.solcW.compile(jsonObj, function (err, output) {
      self.events.emit('contracts:compile:solc', jsonObj);

      if (err) {
        return callback(err);
      }

      if (output.errors) {
        for (let i = 0; i < output.errors.length; i++) {
          if (output.errors[i].type === 'Warning') {
            self.logger.warn(output.errors[i].formattedMessage);
          }
          if ((output.errors[i].type === 'Error' || output.errors[i].severity === 'error') && !returnAllErrors) {
            return callback(new Error("Solidity errors: " + output.errors[i].formattedMessage).message);
          }
        }
      }

      self.events.emit('contracts:compiled:solc', output);
      callback(null, output);
    });
  }

  compile_solidity_code(codeInputs, originalFilepaths, returnAllErrors, cb) {
    const self = this;

    async.waterfall([
      function loadCompiler(callback) {
        if (self.solcAlreadyLoaded) {
          return callback();
        }
        self.solcW = new SolcW({logger: self.logger, events: self.events, ipc: self.ipc, useDashboard: self.useDashboard});

        self.logger.info(__("loading solc compiler") + "..");
        self.solcW.load_compiler(function (err) {
          self.solcAlreadyLoaded = true;
          callback(err);
        });
      },
      function compileContracts(callback) {
        self.logger.info(__("compiling solidity contracts") + "...");
        let jsonObj = {
          language: 'Solidity',
          sources: codeInputs,
          settings: {
            optimizer: {
              enabled: self.options.optimize,
              runs: self.options["optimize-runs"]
            },
            outputSelection: {
              '*': {
                '': [
                  'ast',
                  'legacyAST'
                ],
                '*': [
                  'abi',
                  'devdoc',
                  'evm.bytecode',
                  'evm.deployedBytecode',
                  'evm.gasEstimates',
                  'evm.legacyAssembly',
                  'evm.methodIdentifiers',
                  'metadata',
                  'userdoc'
                ]
              }
            }
          }
        };

        self._compile(jsonObj, returnAllErrors, callback);
      },
      function createCompiledObject(output, callback) {
        let json = output.contracts;

        if (!output || !output.contracts) {
          return callback(new Error(__("error compiling for unknown reasons")));
        }

        if (Object.keys(output.contracts).length === 0 && output.sourceList && output.sourceList.length > 0) {
          return callback(new Error(__("error compiling. There are sources available but no code could be compiled, likely due to fatal errors in the solidity code")).message);
        }

        let compiled_object = {};

        for (let contractFile in json) {
          for (let contractName in json[contractFile]) {
            let contract = json[contractFile][contractName];

            const className = contractName;
            let filename = contractFile;
            if (filename === 'fiddle') filename = Solidity._getFiddlePath(className);

            compiled_object[className] = {};
            compiled_object[className].code = contract.evm.bytecode.object;
            compiled_object[className].runtimeBytecode = contract.evm.deployedBytecode.object;
            compiled_object[className].realRuntimeBytecode = contract.evm.deployedBytecode.object.slice(0, -68);
            compiled_object[className].swarmHash = contract.evm.deployedBytecode.object.slice(-68).slice(0, 64);
            compiled_object[className].gasEstimates = contract.evm.gasEstimates;
            compiled_object[className].functionHashes = contract.evm.methodIdentifiers;
            compiled_object[className].abiDefinition = contract.abi;
            compiled_object[className].filename = filename;
            compiled_object[className].originalFilename = originalFilepaths[filename];
          }
        }

        callback(null, compiled_object, output.errors);
      }
    ], function (err, result, errors) {
      if (returnAllErrors) {
        return cb(err, result, errors);
      }
      cb(err, result);
    });
  }

  compile_solidity(contractFiles, cb) {
    if (!contractFiles.length) {
      return cb();
    }
    let self = this;
    let input = {};
    let originalFilepath = {};

    async.waterfall([
      function prepareInput(callback) {
        async.each(contractFiles,
          function (file, fileCb) {
            let filename = file.filename;

            for (let directory of self.contractDirectories) {
              let match = new RegExp("^" + directory);
              filename = filename.replace(match, '');
            }

            originalFilepath[filename] = file.filename;

            file.content(function (fileContent) {
              if (!fileContent) {
                self.logger.error(__('Error while loading the content of ') + filename);
                return fileCb();
              }
              input[filename] = {content: fileContent.replace(/\r\n/g, '\n')};
              fileCb();
            });
          },
          function (err) {
            callback(err);
          }
        );
      },
      function compile(callback) {
        self.compile_solidity_code(input, originalFilepath, false, callback);
      }
    ], function (err, result) {
      cb(err, result);
    });
  }

}

module.exports = Solidity;
