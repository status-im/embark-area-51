describe("{{title}}", function() {
  this.timeout(0);
  
  before(function(done) {
    this.timeout(0);
    var contractsConfig = {
      "{{title}}": {
        args: []
      }
    };
    EmbarkSpec.deployAll(contractsConfig, () => { done() });
  });

  {{#each functions}}
  xit("{{name}} should do something", async () => {
      {{#each inputs}}
      let {{name}} = null;
      {{/each}}
      {{#ifview stateMutability}}
      let result = await {{../contractName}}.methods{{methodname ../functions name inputs}}({{#each inputs}}{{name}}{{#unless @last}}, {{/unless}}{{/each}}).call()
      {{else}}
      let receipt = await {{../contractName}}.methods{{methodname ../functions name inputs}}({{#each inputs}}{{name}}{{#unless @last}}, {{/unless}}{{/each}}).send({
                      {{#if payable}}
                      value: 0,
                      {{/if}}
                      from: web3.eth.defaultAccount
                    });
      {{/ifview}}
  });

  {{/each}}
});
