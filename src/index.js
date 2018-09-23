import consul from 'consul';

const _ = require('lodash');
const CONSUL_PREFIX = 'consul';
var consulClient;

export default class ServerlessConsulVariables {

  constructor(serverless, options) {
    const consulSettings = (serverless.service.custom && serverless.service.custom['serverless-consul-variables']['consul_settings']) ? serverless.service.custom['serverless-consul-variables']['consul_settings'] : {};
    consulClient = consul({...consulSettings, promisify: true});

    const enableServiceRegistration = (serverless.service.custom && serverless.service.custom['serverless-consul-variables']['service']['enable_registration']) ?  serverless.service.custom['serverless-consul-variables']['service']['enable_registration'] : false;
    const service_endpoint_filter = (serverless.service.custom && serverless.service.custom['serverless-consul-variables']['service']['enpdoint_filters']) ? serverless.service.custom['serverless-consul-variables']['service']['enpdoint_filters'] : 'api';
    const consul_endpoint_key_path = (serverless.service.custom && serverless.service.custom['serverless-consul-variables']['service']['consul_endpoint_key_path']) ? serverless.service.custom['serverless-consul-variables']['service']['consul_endpoint_key_path'] : '/';
    

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
          if(enableServiceRegistration){
            this._generateEndpoint(service_endpoint_filter, consul_endpoint_key_path);
          }
          
       },
       'info:info': async () => {
          if(enableServiceRegistration){
            this._generateEndpoint(service_endpoint_filter, consul_endpoint_key_path);
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
  async _generateEndpoint(service_endpoint_filter, consul_endpoint_key_path){
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
            if(event.http) {
              let path;
              if (typeof event.http === 'object') {
                path = event.http.path;
              } else {
                path = event.http.split(' ')[1];
              }
              if(path == service_endpoint_filter) {
                endpoint = `${info.endpoint}/${path}`;
                this._registerEndpoint(endpoint, consul_endpoint_key_path);
              }

            }
        });
      });
    }

    
  };

  // Lets register the endpoint api into consul KV
  async _registerEndpoint(endpoint, consul_endpoint_key_path){
    
    const result = await consulClient.kv.set((consul_endpoint_key_path.startsWith('/') ? consul_endpoint_key_path.substr(1) : consul_endpoint_key_path), endpoint);
    if(!result){
      const errorMessage = 'Error trying to set ' + consul_endpoint_key_path + ', ' + err;
      throw new this.serverless.classes.Error(errorMessage);
    }
    console.log(`Endpoint ${endpoint} registered succesfully in Consul ${consul_endpoint_key_path}`);
    return result;
  }
  
}

