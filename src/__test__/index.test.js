import ServerlessConsulVariables from '../index';
import consul from 'consul';

const CONSUL_PREFIX = 'consul';
const OTHER_PREFIX = 'other';

jest.mock('consul');

const _slsGetValueFromSource = jest.fn(() => {});
const serverless = {
  cli: {
    log: jest.fn(),
  },
  variables: {
    getValueFromSource: _slsGetValueFromSource
  },
  classes: {
    Error: Error
  },
  service: {
    custom: {
      'serverless-consul-variables': {
        consul_settings: {
          host: 'localhost',
          port: 8500
        },
        service: {
          enable_registration: 'true',
          enpdoint_filters: 'api',
          consul_endpoint_key_path: 'dev_test/serverless/endpoints/auth'
        }
      }
    },
    provider: {
      environment: {
        STAGE: '${opt:stage, self:provider.stage}', // eslint-disable-line
        ENV_VAR: '${consul:ENV_VAR}' // eslint-disable-line
      }
    }
  }
};

test('Retrieve kv variable from consul', async () => {
  consul.mockImplementation(() => {
    return {
      kv: {
        get: jest.fn(async () => {
          return {
            Value: 'test_value'
          };
        })
      }
    }
  });

  new ServerlessConsulVariables(serverless);
  const result = await serverless.variables.getValueFromSource(`${CONSUL_PREFIX}:ENV_VAR`);
  expect(result).toEqual('test_value');

  const result_alt = await serverless.variables.getValueFromSource(`${CONSUL_PREFIX}:/ENV_VAR`);
  expect(result_alt).toEqual('test_value');
});

test('Retrieve cached kv variable', async () => {
  consul.mockImplementation(() => {
    return {
      kv: {
        get: jest.fn(async () => {
          return {
            Value: 'cached_value'
          };
        })
      }
    }
  });

  new ServerlessConsulVariables(serverless);
  const result = await serverless.variables.getValueFromSource(`${CONSUL_PREFIX}:ENV_VAR`);
  expect(result).toEqual('cached_value');

  const cached_result = await serverless.variables.getValueFromSource(`${CONSUL_PREFIX}:ENV_VAR`);
  expect(cached_result).toEqual('cached_value');
});

test('Retrieve kv variable from consul using default consul settings', async () => {
  var serverlessClone = JSON.parse(JSON.stringify(serverless));
  serverlessClone.variables.getValueFromSource = _slsGetValueFromSource;
  delete serverlessClone.service.custom['serverless-consul-variables'];
  consul.mockImplementation(() => {
    return {
      kv: {
        get: jest.fn(async () => {
          return {
            Value: 'test_value'
          };
        })
      }
    }
  });

  new ServerlessConsulVariables(serverlessClone);
  const result = await serverlessClone.variables.getValueFromSource(`${CONSUL_PREFIX}:ENV_VAR`);
  expect(result).toEqual('test_value');
});

test('Delegate variable logic to serverless', async () => {
  consul.mockImplementation(() => {
    return {
      kv: {
        get: jest.fn(async () => {
          return {
            Value: 'test_value'
          };
        })
      }
    }
  });

  new ServerlessConsulVariables(serverless);
  const otherVariable = `${OTHER_PREFIX}:ENV_VAR`;
  await serverless.variables.getValueFromSource(otherVariable);
  expect(_slsGetValueFromSource).toHaveBeenCalledWith(otherVariable);
});

test('Fail to retrieve kv variable from consul', async () => {
  consul.mockImplementation(() => {
    return {
      kv: {
        get: jest.fn(async () => {
          return;
        })
      }
    }
  });

  new ServerlessConsulVariables(serverless);
  const result = serverless.variables.getValueFromSource(`${CONSUL_PREFIX}:ENV_VAR`);
  await expect(result).rejects.toEqual(new Error('Error getting variable from Consul: ENV_VAR. Variable not found.'));
});

