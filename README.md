# serverless-consul-variables
[![Build Status](https://travis-ci.org/zephrax/serverless-consul-variables.svg?branch=master)](https://travis-ci.org/zephrax/serverless-consul-variables)

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

yarn install -D serverless-consul-variables
```

Then inside of your project's `serverless.yml` file add the following to the plugins section. You should change the consul host & port to match your build environment.

```yaml
custom:
  serverless-consul-variables:
    host: 127.0.0.1
    port: 8500
plugins:
    - serverless-consul-variables
```

## Contributing

Pull requests are always welcome. Please see the [contributing](https://github.com/zephrax/serverless-consul-variables/blob/master/CONTRIBUTING.md) guidelines.

## License

[MIT](https://github.com/zephrax/serverless-consul-variables/blob/master/LICENSE)
