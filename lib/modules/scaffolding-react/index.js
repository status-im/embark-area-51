
const Handlebars = require('handlebars');
const fs = require('../../core/fs');

class ScaffoldingReact {
    constructor(embark, options){
        this.embark = embark;
        this.options = options;

        this.embark.registerDappGenerator('react', this.build.bind(this));
    }

    _generateFile(contract, templateFilename, extension, data){
        const filename = contract.className.toLowerCase() + '.' + extension;
        const filePath = './app/' + filename;
        if (fs.existsSync(filePath)){
            throw new Error("file '" + filePath + "' already exists");
        }

        const templatePath = fs.embarkPath('lib/modules/scaffolding-react/templates/' + templateFilename);
        const source = fs.readFileSync(templatePath).toString();
        const template = Handlebars.compile(source);

        // Write template
        const result = template(data);
        fs.writeFileSync(filePath, result);
    }

    _buildHTML(contract){
        const filename = contract.className.toLowerCase();
        this._generateFile(contract, 'index.html.tpl', 'html',
        {
            'title': contract.className, 
            'filename': filename
        });
    }

    async build(contract){
        try {
            this._buildHTML(contract);

            const filename = contract.className.toLowerCase();

            this._generateFile(contract, 'dapp.js.tpl', 'js',         
            {
                'title': contract.className,
                'contractName': contract.className,
                'functions': contract.abiDefinition.filter(x => x.type == 'function')
            });

            // Update config
            const contents = fs.readFileSync("./embark.json");
            let embarkJson = JSON.parse(contents);
            embarkJson.app["js/" + filename + ".js"] = "app/" + filename + '.js';
            embarkJson.app[filename + ".html"] = "app/" + filename + '.html';

            fs.writeFileSync("./embark.json", JSON.stringify(embarkJson, null, 4));

            this.embark.logger.info('./app/' + filename + ".html generated");
        } catch(err){
            this.embark.logger.error(err.message);
        }
    }
}

module.exports = ScaffoldingReact;
