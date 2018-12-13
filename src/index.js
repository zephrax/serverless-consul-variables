import consul from 'consul';
import {createDebug} from './logger/index';
import Promise from 'bluebird';
import _ from 'lodash';

const debug = createDebug(__filename);
const CONSUL_PREFIX = 'consul';

export default class ServerlessConsulVariables {

  constructor(serverless, options) {
    this._consulSettings = (serverless.service.custom && serverless.service.custom['serverless-consul-variables'] && serverless.service.custom['serverless-consul-variables']['consul_settings']) ? serverless.service.custom['serverless-consul-variables']['consul_settings'] : {};
    this._consulClient = consul({...this._consulSettings, promisify: true});
    this._enableServiceRegistration = (serverless.service.custom && serverless.service.custom['serverless-consul-variables'] && serverless.service.custom['serverless-consul-variables']['service'] && serverless.service.custom['serverless-consul-variables']['service']['enable_registration']) ?  serverless.service.custom['serverless-consul-variables']['service']['enable_registration'] : false;
    this._serviceEndpointFilter = (serverless.service.custom && serverless.service.custom['serverless-consul-variables'] && serverless.service.custom['serverless-consul-variables']['service'] && serverless.service.custom['serverless-consul-variables']['service']['enpdoint_filters']) ? serverless.service.custom['serverless-consul-variables']['service']['enpdoint_filters'] : 'api';
    this._consulEndpointKeyPath = (serverless.service.custom && serverless.service.custom['serverless-consul-variables'] && serverless.service.custom['serverless-consul-variables']['service'] && serverless.service.custom['serverless-consul-variables']['service']['consul_endpoint_key_path']) ? serverless.service.custom['serverless-consul-variables']['service']['consul_endpoint_key_path'] : '/';

    if (this._consulEndpointKeyPath.endsWith('/')) {
      this._consulEndpointKeyPath = this._consulEndpointKeyPath
          .substring(0, this._consulEndpointKeyPath.length - 1);
    }

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
          if (this._enableServiceRegistration) {
            this._generateEndpoints();
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

    let data = await this._consulClient.kv.get(variable.startsWith('/') ? variable.substr(1) : variable);
    if (!data) {
      let errorMessage = `Error getting variable from Consul: ${variable}. Variable not found.`;
      throw new this.serverless.classes.Error(errorMessage);
    }
    this.resolvedValues[variable] = data.Value;
    return data.Value;
  }

  async _generateEndpoints() {
    let infoPlugin = this.serverless.pluginManager.plugins.find((plugin) => plugin.constructor.name == 'AwsInfo');
    let info = infoPlugin ? infoPlugin.gatheredData.info : null;
    let filterRegExp = new RegExp(this._serviceEndpointFilter);
    let endpoint;

    if (info.endpoint) {
      let events = [];

      _.forEach(this.serverless.service.functions, (functionObject) => {
        let httpEvents = functionObject.events.filter(event => event.http);
        events = events.concat(httpEvents);
      });

      return Promise.map(events, (event) => {
        let path;
        let method = '';

        if (typeof event.http === 'object') {
          path = event.http.path;
          method = event.http.method;
        } else {
          path = event.http.split(' ')[1];
        }

        if (filterRegExp.test(path)) {
          endpoint = `${info.endpoint}/${path}`;
          let consulPath = `${this._consulEndpointKeyPath}/${path}_${method}`;
          return this._registerEndpoint(consulPath, endpoint);
        }
      });
    }
  }

  async _registerEndpoint(consulPath, endpoint) {
    debug(`Setting ${consulPath} to '${endpoint}'...`);
    let result = await this._consulClient.kv.set(consulPath, endpoint);

    if (!result) {
      let errorMessage = `Error trying to set ${consulPath} to '${endpoint}'`;
      debug(errorMessage);
      throw new this.serverless.classes.Error(errorMessage);
    }

    debug(`Endpoint ${endpoint} registered succesfully in Consul ${consulPath}`);
    return result;
  }
}

