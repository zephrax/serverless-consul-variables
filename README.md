# serverless-consul-variables
[![Build Status](https://travis-ci.org/zephrax/serverless-consul-variables.svg?branch=master)](https://travis-ci.org/zephrax/serverless-consul-variables)
[![Coverage Status](https://coveralls.io/repos/github/zephrax/serverless-consul-variables/badge.svg?branch=master)](https://coveralls.io/github/zephrax/serverless-consul-variables?branch=master)
[![devDependency Status](https://david-dm.org/zephrax/serverless-consul-variables/dev-status.svg)](https://david-dm.org/zephrax/serverless-consul-variables#info=devDependencies)
[![Dependency Status](https://david-dm.org/zephrax/serverless-consul-variables.svg)](https://david-dm.org/zephrax/serverless-consul-variables)

This [Serverless](https://github.com/serverless/serverless) plugin allows you to populate environment variables from a Consul server. This is done at build time.

## Documentation

- [Installation](#installation)
- [Contributing](#contributing)
- [License](#license)

## Installation

First install the plugin using npm or yarn

```bash
npm install serverless-consul-variables --save-dev

#or

yarn add -D serverless-consul-variables
```

Then inside of your project's `serverless.yml` file add the following to the plugins section. You should change the consul host & port to match your build environment.

**FYI**: It defaults to this values with no need to put them in `serverless.yml`. If you use other values, please, put what you need here.

```yaml
custom:
  serverless-consul-variables:
    consul_settings:
      host: 127.0.0.1
      port: 8500
    service:
      enable_registration: true
      enpdoint_filters: 'api'
      consul_endpoint_key_path: 'dev_test/serverless/endpoints/auth'
plugins:
    - serverless-consul-variables
```

To reference a consul variable, you must prefix it with ${consul:}. For example:

```yaml
environment:
  SOME_VARIABLE: ${consul:path/to/kv/variable}
```

=======
### Service Registration in Consul KV

The parent for this options is ```service``` under the custom ```serverless-consul-variables``` structure.
If enabled in ```enable_registration: true``` the service will be added to a KV of your choice. Defaults to ```false```
The full path should be in ```consul_endpoint_key_path```

#### Endpoint filters

For now it only support one filter. The basic usage is to select the function you want to register in case there are more
than one.

Usage:

```enpdoint_filters: 'api'``` will only return the functions with api.

Let's assume this case:

```yaml
functions:
  Controller1:
    handler: handler.default
    events:
      - http:
          path: api
          method: post

  Controller2:
    handler: tasks.apigw
    events:
      - http:
          path: task
          method: post
```

Now setting the filter to ```api``` as above, will only register the function with api in the path.

**TODO**: Support for multiple and more intelligent filters.

## Contributors

- [brahama](https://github.com/brahama)
 
## Contributing

Pull requests are always welcome. Please see the [contributing](https://github.com/zephrax/serverless-consul-variables/blob/master/CONTRIBUTING.md) guidelines.

## License

[MIT](https://github.com/zephrax/serverless-consul-variables/blob/master/LICENSE)
