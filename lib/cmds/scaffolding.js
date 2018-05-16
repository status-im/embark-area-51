const Handlebars = require('handlebars');

Handlebars.registerHelper('capitalize', function(word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
});

Handlebars.registerHelper('ifview', function(stateMutability, options) {
    let result = stateMutability == 'view' || stateMutability == 'pure' || stateMutability == 'constant';
    if (result) {
        return options.fn(this);
    } 
    return options.inverse(this);
});

Handlebars.registerHelper('ifeq', function(elem, value, options){
    if (elem == value) {
        return options.fn(this);
    }
    return options.inverse(this);
});

Handlebars.registerHelper('iflengthgt', function(arr, val, options) {
    if (arr.length > val) {
        return options.fn(this);
    }    
    return options.inverse(this);
});

Handlebars.registerHelper('emptyname', function(name, index) {
    return name ? name : 'output' + index;
});

Handlebars.registerHelper('methodname', function(abiDefinition, functionName, inputs){
    let funCount = abiDefinition.filter(x => x.name == functionName).length;
    if(funCount == 1){
        return '.' + functionName;
    }
    return new Handlebars.SafeString(`['${functionName}(${inputs !== null ? inputs.map(input => input.type).join(',') : ''})']`);
});

class Scaffolding {
    constructor(embark, options){
        this.embark = embark;
        this.options = options;
        this.test = options.test;
        this.framework = options.framework;
        this.frameworkPlugin = null;
    }

    isContract(contractName){
        return this.embark.config.contractsConfig.contracts[contractName] !== undefined;
    }

    generate(contractName, contractConfiguration){
        if(this.test){
            this.framework = 'embark-test';
            this.embark.plugins.loadInternalPlugin('scaffolding-test', this.options);
        } else {
            if(this.framework == 'react'){
                this.embark.plugins.loadInternalPlugin('scaffolding-react', this.options);
            }
        }
        

        let dappGenerators = this.embark.plugins.getPluginsFor('dappGenerator');
        let build = null;
        dappGenerators.forEach((plugin) => {
            plugin.dappGenerators.forEach((d) => {
                if(d.framework == this.framework){
                    build = d.cb;
                }
            });
        });

        if(build === null){
            if(this.test) {
                throw new Error("Could not find plugin for generating test cases");
            }
            throw new Error("Could not find plugin for framework '" + this.framework + "'");
        }

        if(!this.isContract(contractName)){
            return new Error("contract '" + contractName + "' does not exist");
        }

        const contract = contractConfiguration.contracts[contractName];

        build(contract);
    }
}


module.exports = Scaffolding;
