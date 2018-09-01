import consul from 'consul';
import Promise from 'bluebird';

const CONSUL_PREFIX = 'consul';
var consulClient;

export default class ServerlessConsulVariables {

  constructor(serverless, options) {
    const consulSettings = (serverless.service.custom && serverless.service.custom['serverless-consul-variables']) ? serverless.service.custom['serverless-consul-variables'] : {};
    consulClient = consul({...consulSettings, promisify: true});

    this.serverless = serverless;
    this.options = options;
    this.resolvedValues = {};

    this.commands = {
      consul: {
        usage: 'Gets value for Key Path from consul KV',
        lifecycleEvents: [
          'getValue'
        ],
        options: {
          'get-key': {
            usage:
              'Specify the Key Path you want to get '
              + '(e.g. "--get-key \'my_folder/key\'")',
            required: true,
          },
        },
      },
    };

    this.hooks = {
      'consul:getValue': async () => {
        const result = await this._getValueFromConsul.call(this, options['get-key']);
        console.log(result);
       }
        
    }

    const delegate = serverless.variables
    .getValueFromSource.bind(serverless.variables);

    serverless.variables.getValueFromSource = (variableString) => {
      if (variableString.startsWith(`${CONSUL_PREFIX}:`)) {
        return this._getValueFromConsul(variableString.split(`${CONSUL_PREFIX}:`)[1]);
      }

      return delegate(variableString);
    }
  }

  async _getValueFromConsul(variable) {

    if (this.resolvedValues[variable]) {
      return Promise.resolve(this.resolvedValues[variable]);
    }

    const data = await consulClient.kv.get(variable.startsWith('/') ? variable.substr(1) : variable);
    if (!data) {
      const errorMessage = `Error getting variable from Consul: ${variable}. Variable not found.`;
      throw new this.serverless.classes.Error(errorMessage);
    }
    this.resolvedValues[variable] = data.Value;
    return data.Value;
  }

  
}

