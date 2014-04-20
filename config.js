'use strict';

var fs = require('fs');

var globalConfig = {
  root: __dirname,
  port: 3000,
  mongo: {
    uri: process.env.BOXEN_MONGODB_URL ||
         process.env.MONGOHQ_URL ||
         'mongodb://localhost/channel6'
  }
}

var productionConfig  = Object.create(globalConfig);
productionConfig.port = 80;

module.exports = function() {
  switch(process.env.NODE_ENV) {
    case 'development':
      return globalConfig;
    case 'production':
      return productionConfig;
    default:
      return globalConfig;
  }
};

