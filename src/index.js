import consul from 'consul';

const CONSUL_PREFIX = 'consul';
var consulClient;

export default class ServerlessConsulVariables {

  constructor(serverless) {
    const consulSettings = (serverless.service.custom && serverless.service.custom['serverless-consul-variables']) ? serverless.service.custom['serverless-consul-variables'] : {};
    consulClient = consul({...consulSettings, promisify: true});

    this.serverless = serverless;
    this.resolvedValues = {};

    const delegate = serverless.variables
      .getValueFromSource.bind(serverless.variables);

    serverless.variables.getValueFromSource = (variableString) => {
      if (variableString.startsWith(`${CONSUL_PREFIX}:`)) {
        const variable = variableString.split(`${CONSUL_PREFIX}:`)[1];
        return this._getValueFromConsul(variable);
      }

      return delegate(variableString);
    }
  }

  async _getValueFromConsul(variable) {
    if (this.resolvedValues[variable]) {
      return this.resolvedValues[variable];
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

