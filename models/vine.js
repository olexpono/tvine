'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

/**
 * Vine Schema
 */
var Vine = new Schema({
  tweetId: String,
  videoUrl: String,
  tweetText: String,
  tags: { type: [String], index: true }
}, {read: 'secondaryPreferred'});

/**
 * Validations
 */

module.exports = mongoose.model('Vine', Vine);
