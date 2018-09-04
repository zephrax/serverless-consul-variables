import consul from 'consul';

const _ = require('lodash');
const CONSUL_PREFIX = 'consul';
var consulClient;
// True if we want to register the endpoint in Consul
var custom_enable_register = true;
var custom_endpoint_filter = 'api';
var custom_consul_key_path = '/dev/serverless/endpoints';

export default class ServerlessConsulVariables {

  constructor(serverless, options) {
    const consulSettings = (serverless.service.custom && serverless.service.custom['serverless-consul-variables']['consul_settings']) ? serverless.service.custom['serverless-consul-variables']['consul_settings'] : {};
    consulClient = consul({...consulSettings, promisify: true});
    this.serverless = serverless;
    this.options = options;
    this.resolvedValues = {};

    this.commands = {
      consul: {
        usage: 'Gets value for Key Path from consul KV',
        lifecycleEvents: [
          'getValue',
          'getEndpoint',
          'registerEndpoint'
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
        this.serverless.cli.log(result);
       },
       'after:deploy:deploy': async () => {
          if(true){
            this._generateEndpoint.call(this);
          }
          
       },
       'info:info': async () => {
          if(true){
            this._generateEndpoint.call(this);
          }
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

  // Generate AWS Endpoint from API Gateway plus the task name.
  async _generateEndpoint(){
    var info;
    let plugins = this.serverless.pluginManager.plugins;
    plugins.forEach( plugin => {
      if(plugin.constructor.name == 'AwsInfo'){
        info = plugin.gatheredData.info;
      }
    });

    var endpoint;

    // Only if we have an endpoint makes sense.
    if(info.endpoint) {
      _.forEach(this.serverless.service.functions, functionObject => {
        functionObject.events.forEach( event => {
          console.log(event);
            if(event.http) {
              let path;
              if (typeof event.http === 'object') {
                path = event.http.path;
              } else {
                path = event.http.split(' ')[1];
              }
              if(path == custom_endpoint_filter) {
                endpoint = `${info.endpoint}/${path}`;
                console.log('Endpoint is ' + endpoint);
                //_registerEndpoint(endpoint);
              }

            }
        });
      });
    }

    
  };
  
}

