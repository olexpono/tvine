'use strict';

var fs = require('fs');

var globalConfig = {
  root: __dirname,
  port: process.env.PORT || 3000,
  mongo: {
    uri: process.env.BOXEN_MONGODB_URL ||
         process.env.MONGOHQ_URL ||
         'mongodb://localhost/channel6'
  }
}

module.exports = function() {
  switch(process.env.NODE_ENV) {
    case 'development':
      return globalConfig;
    case 'production':
      return globalConfig;
    default:
      return globalConfig;
  }
};

