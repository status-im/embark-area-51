const fs = require('../../core/fs.js');
const utils = require('../../utils/utils.js');
const namehash = require('eth-ens-namehash');
const async = require('async');

const reverseAddrSuffix = '.addr.reverse';

class ENS {
  constructor(embark, _options) {
    this.env = embark.env;
    this.logger = embark.logger;
    this.events = embark.events;
    this.namesConfig = embark.config.namesystemConfig;
    this.registration = this.namesConfig.register || {};
    this.embark = embark;

    this.addENSToEmbarkJS();
    this.configureContracts();
    this.registerActionForEvents();
  }

  registerActionForEvents() {
    const self = this;
    self.embark.registerActionForEvent("contracts:deploy:afterAll", (cb) => {
      async.parallel([
        function getENSRegistry(paraCb) {
          self.events.request('contracts:contract', "ENSRegistry", (contract) => {
            paraCb(null, contract);
          });
        },
        function getRegistrar(paraCb) {
          self.events.request('contracts:contract', "FIFSRegistrar", (contract) => {
            paraCb(null, contract);
          });
        },
        function getResolver(paraCb) {
          self.events.request('contracts:contract', "Resolver", (contract) => {
            paraCb(null, contract);
          });
        }
      ], (err, results) => {
        // result[0] => ENSRegistry; result[1] => FIFSRegistrar; result[2] => FIFSRegistrar
        let config = {
          env: self.env,
          registration: self.registration,
          registryAbi: results[0].abiDefinition,
          registryAddress: results[0].deployedAddress,
          registrarAbi: results[1].abiDefinition,
          registrarAddress: results[1].deployedAddress,
          resolverAbi: results[2].abiDefinition,
          resolverAddress: results[2].deployedAddress
        };
        self.addSetProvider(config);
        self.registerAPI(config);

        if (!self.env === 'development' || !self.registration || !self.registration.subdomains || !Object.keys(self.registration.subdomains).length) {
          return cb();
        }
        self.registerConfigSubdomains(config, cb);
      });
    });
  }

  registerAPI(config) {
    let self = this;
    self.embark.registerAPICall(
      'get',
      '/embark-api/ens/resolve',
      (req, res) => {
        self.resolveName(req.query.name, config, (error, address) => {
          if (error) {
            return res.send({error: error.message});
          }
          res.send({address});
        });
      }
    );

    self.embark.registerAPICall(
      'get',
      '/embark-api/ens/lookup',
      (req, res) => {
        self.lookupAddress(req.query.address, config, (error, name) => {
          if (error) {
            return res.send({error: error.message});
          }
          res.send({name});
        });
      }
    );

    self.embark.registerAPICall(
      'post',
      '/embark-api/ens/register',
      (req, res) => {
        self.registerSubdomains({[req.body.subdomain]: req.body.address}, config, (error, transaction) => {
          if (error) {
            return res.send({error: error.message});
          }
          res.send({transaction});
        });
      }
    );
  }

  registerConfigSubdomains(config, callback) {
    this.registerSubdomains(this.registration.subdomains, config, callback);
  }

  lookupAddress(address, config, callback) {
    let self = this;
    self.createResolverContract(config, (err, resolver) => {
      if (err) {
        return callback(err);
      }

      if (address.startsWith("0x")) {
        address = address.slice(2);
      }
      let node = utils.soliditySha3(address.toLowerCase() + reverseAddrSuffix);
      resolver.methods.name(node).call(callback);
    });
  }

  resolveName(name, config, callback) {
    let self = this;
    self.createResolverContract(config, (err, resolver) => {
      if (err) {
        return callback(err);
      }

      let node = namehash.hash(name);
      resolver.methods.addr(node).call(callback);
    });
  }

  registerSubdomains(subdomains, config, callback) {
    const self = this;
    const register = require('./register');

    self.events.request("blockchain:defaultAccount:get", (defaultAccount) => {
      async.parallel({
        ens: self.createRegistryContract.bind(this, config),
        registrar: self.createRegistrarContract.bind(this, config),
        resolver: self.createResolverContract.bind(this, config)
      }, function (err, contracts) {
        if (err) {
          return callback(err);
        }
        const {ens, registrar, resolver} = contracts;

        async.each(Object.keys(subdomains), (subdomainName, eachCb) => {
          const address = subdomains[subdomainName];
          const reverseNode = utils.soliditySha3(address.toLowerCase().substr(2) + reverseAddrSuffix);
          register(ens, registrar, resolver, defaultAccount, subdomainName, self.registration.rootDomain,
            reverseNode, address, self.logger, eachCb);
        }, callback);
      });
    });
  }

  createRegistryContract(config, callback) {
    this.events.request("blockchain:contract:create", {
      abi: config.registryAbi,
      address: config.registryAddress
    }, (registry) => {
      callback(null, registry);
    });
  }

  createRegistrarContract(config, callback) {
    this.events.request("blockchain:contract:create", {
      abi: config.registrarAbi,
      address: config.registrarAddress
    }, (registrar) => {
      callback(null, registrar);
    });
  }

  createResolverContract(config, callback) {
    this.events.request("blockchain:contract:create", {
      abi: config.resolverAbi,
      address: config.resolverAddress
    }, (resolver) => {
      callback(null, resolver);
    });
  }

  addENSToEmbarkJS() {
    const self = this;
    // TODO: make this a shouldAdd condition
    if (this.namesConfig === {}) {
      return;
    }

    if ((this.namesConfig.available_providers.indexOf('ens') < 0) && (this.namesConfig.provider !== 'ens' || this.namesConfig.enabled !== true)) {
      return;
    }

    // get namehash, import it into file
    self.events.request("version:get:eth-ens-namehash", function (EnsNamehashVersion) {
      let currentEnsNamehashVersion = require('../../../package.json').dependencies["eth-ens-namehash"];
      if (EnsNamehashVersion !== currentEnsNamehashVersion) {
        self.events.request("version:getPackageLocation", "eth-ens-namehash", EnsNamehashVersion, function (err, location) {
          self.embark.registerImportFile("eth-ens-namehash", fs.dappPath(location));
        });
      }
    });

    let code = fs.readFileSync(utils.joinPath(__dirname, 'register.js')).toString();
    code += "\n" + fs.readFileSync(utils.joinPath(__dirname, 'embarkjs.js')).toString();
    code += "\nEmbarkJS.Names.registerProvider('ens', __embarkENS);";

    this.embark.addCodeToEmbarkJS(code);
  }

  configureContracts() {
    const config = {
      "default": {
        "gas": "auto"
      },
      "development": {
        "contracts": {
          "ENSRegistry": {
            "deploy": true,
            "args": []
          },
          "Resolver": {
            "deploy": true,
            "args": ["$ENSRegistry"]
          },
          "FIFSRegistrar": {
            "deploy": false
          }
        }
      },
      "ropsten": {
        "contracts": {
          "ENSRegistry": {
            "address": "0x112234455c3a32fd11230c42e7bccd4a84e02010"
          },
          "Resolver": {
            "deploy": false
          },
          "FIFSRegistrar": {
            "deploy": false
          }
        }
      },
      "rinkeby": {
        "contracts": {
          "ENSRegistry": {
            "address": "0xe7410170f87102DF0055eB195163A03B7F2Bff4A"
          },
          "Resolver": {
            "deploy": false
          },
          "FIFSRegistrar": {
            "deploy": false
          }
        }
      },
      "livenet": {
        "contracts": {
          "ENSRegistry": {
            "address": "0x314159265dd8dbb310642f98f50c066173c1259b"
          },
          "Resolver": {
            "deploy": false
          },
          "FIFSRegistrar": {
            "deploy": false
          }
        }
      }
    };

    if (this.registration && this.registration.rootDomain) {
      // Register root domain if it is defined
      const rootNode = namehash.hash(this.registration.rootDomain);
      config.development.contracts['FIFSRegistrar'] = {
        "deploy": true,
        "args": ["$ENSRegistry", rootNode],
        "onDeploy": [
          `ENSRegistry.methods.setOwner('${rootNode}', web3.eth.defaultAccount).send().then(() => {
              ENSRegistry.methods.setResolver('${rootNode}', "$Resolver").send();
              var reverseNode = web3.utils.soliditySha3(web3.eth.defaultAccount.toLowerCase().substr(2) + '${reverseAddrSuffix}');
              ENSRegistry.methods.setResolver(reverseNode, "$Resolver").send();
              Resolver.methods.setAddr('${rootNode}', web3.eth.defaultAccount).send();
              Resolver.methods.setName(reverseNode, '${this.registration.rootDomain}').send();
              })`
        ]
      };
    }

    this.embark.registerContractConfiguration(config);

    this.embark.events.request("config:contractsFiles:add", this.embark.pathToFile('./contracts/ENSRegistry.sol'));
    this.embark.events.request("config:contractsFiles:add", this.embark.pathToFile('./contracts/FIFSRegistrar.sol'));
    this.embark.events.request("config:contractsFiles:add", this.embark.pathToFile('./contracts/Resolver.sol'));
  }

  addSetProvider(config) {

    let code = "\nEmbarkJS.Names.setProvider('ens'," + JSON.stringify(config) + ");";

    let shouldInit = (namesConfig) => {
      return (namesConfig.provider === 'ens' && namesConfig.enabled === true);
    };

    this.embark.addProviderInit('names', code, shouldInit);
  }
}

module.exports = ENS;
