const webpack = require('webpack');

module.exports = function override(config, env) {
    //do stuff with the webpack config...
    config.resolve.fallback = {
        url: require.resolve('url'),
        assert: require.resolve('assert'),
        crypto: require.resolve('crypto-browserify'),
        http: require.resolve('stream-http'),
        https: require.resolve('https-browserify'),
        os: require.resolve('os-browserify/browser'),
        buffer: require.resolve('buffer'),
        stream: require.resolve('stream-browserify'),
    };
    config.resolve.alias = {
        handlebars: 'handlebars/dist/handlebars.min.js'
    }
    config.plugins.push(
        new webpack.ProvidePlugin({
            process: 'process/browser',
            Buffer: ['buffer', 'Buffer'],
        }),
        new webpack.DefinePlugin({
            DATAAPI: JSON.stringify(process.env.DATAAPI)
        })
    );

    return config;
  }