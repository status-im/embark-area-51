
const Handlebars = require('handlebars');
const fs = require('../../core/fs');

class ScaffoldingTest {
    constructor(embark, options){
        this.embark = embark;
        this.options = options;

        this.embark.registerDappGenerator('embark-test', this.build.bind(this));
    }

    _generateFile(contract, templateFilename, extension, data){
        const filename = contract.className.toLowerCase() + '.' + extension;
        const filePath = './test/' + filename;
        
        if (fs.existsSync(filePath)){
            throw new Error("file '" + filePath + "' already exists");
        }

        const templatePath = fs.embarkPath('lib/modules/scaffolding-test/templates/' + templateFilename);
        const source = fs.readFileSync(templatePath).toString();
        const template = Handlebars.compile(source);

        // Write template
        const result = template(data);
        fs.writeFileSync(filePath, result);
    }


    build(contract){
        const filename = contract.className.toLowerCase();
        
        try {
            this._generateFile(contract, 'test.js.tpl', 'js',         
            {
                'title': contract.className,
                'contractName': contract.className,
                'functions': contract.abiDefinition.filter(x => x.type == 'function')
            });

            this.embark.logger.info('test/' + filename + ".js generated");
        } catch(err){
            this.embark.logger.error(err.message);
        }
    }
}

module.exports = ScaffoldingTest;
