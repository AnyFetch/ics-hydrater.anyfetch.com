'use strict';

var fs = require('fs');
var async = require('async');

module.exports = function(path, document, changes, finalCb) {
  finalCb(null, changes);
};
