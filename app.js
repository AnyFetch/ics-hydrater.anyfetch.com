'use strict';

// Load configuration and initialize server
var anyfetchHydrater = require('anyfetch-hydrater');

var config = require('./config/configuration.js');
var icsHydrater = require('./lib');

var serverConfig = {
  concurrency: config.concurrency,
  hydrater_function: icsHydrater
};

var server = anyfetchHydrater.createServer(serverConfig);

// Expose the server
module.exports = server;
