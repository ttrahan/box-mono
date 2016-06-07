var self = main;
module.exports = self;

var mongoose = require('mongoose');
var async = require('async');
var _ = require('underscore');
var fs = require('fs');

var box = require('./Model.js');
var DB_URL = process.env.DB_URL;
var RANDOM_NUMBER = process.env.RANDOM_NUMBER.toString();
var ENVIRONMENT = process.env.ENVIRONMENT;
var CRON_INTERVAL = Number(process.env.CRON_INTERVAL) || 3000;
var COLOR = '#000';

function worker() {
  var oldBox = {
    random: RANDOM_NUMBER
  };
  var updatedBox = {
    $set: {
      color: COLOR,
      random: RANDOM_NUMBER,
      environment: ENVIRONMENT,
      updatedAt: Date.now()
    }
  };
  console.log(updatedBox);
  var bag = {};
  bag.oldBox = oldBox;
  bag.updatedBox = updatedBox;
  async.series([
      _findOldBoxes.bind(null, bag),
      _removeOldBoxes.bind(null, bag),
      _updateThisBox.bind(null, bag)
    ],
    function (err) {
      if (err)
        console.log('Error: ', err);
      console.log('Going for sleep for ', CRON_INTERVAL, 'milli-seconds');
      _.delay(worker, CRON_INTERVAL);
    });
}

function _findOldBoxes(bag, next) {
  box.find({updatedAt: {$lte: new Date().getTime() - (CRON_INTERVAL * 2)}},
    function (err, response) {
      if (err)
        return next(err);
      if (response.length > 0) {
        console.log('Stale Boxes', _.pluck(response, 'environment'));
        bag.shouldRemoveOldBoxes = true;
      }
      return next();
    }
  );
}

function _removeOldBoxes(bag, next) {
  if (!bag.shouldRemoveOldBoxes) return next();
  box.remove({
      updatedAt: {$lte: new Date().getTime() - (CRON_INTERVAL * 2)}
    },
    function (err) {
      return next(err);
    }
  );
}

function _updateThisBox(bag, next) {
  box.update(bag.oldBox, bag.updatedBox, {upsert: true}, function (err) {
    return next(err);
  });
}

function connectToMongo(callback) {
  mongoose.connect(DB_URL, {}, function (err) {
    if (err) {
      console.log('Error connecting to mongo database: ', err);
      console.log('DB_URL:', DB_URL);
    }
    else {
      console.log('Successfully connected to mongo');
    }
    return callback(err);
  });
}

function checkEnvironmentVariables() {
  if (!ENVIRONMENT)
    return 'ENVIRONMENT not found';
  if (!RANDOM_NUMBER)
    return 'RANDOM_NUMBER not found';
  if (!DB_URL)
    return 'DB_URL not found';
}

function readColor() {
  COLOR = require('./color.js').color;
}

function main() {
  console.log('Starting cron');
  var err = checkEnvironmentVariables();
  if (err)
    console.log('Error: ', err);
  else
    connectToMongo(
      function (err) {
        if (err)
          console.log('Fatal Error in connecting to mongo. Shutting Down');
        else {
          readColor();
          worker();
        }
      }
    );
}

main();
