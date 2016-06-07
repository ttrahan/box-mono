'use strict';

var dvURL = 'http://localhost/';

var superagent = require('superagent');
var chai = require('chai');
var expect = chai.expect;
var should = require('should');

describe('Index', function () {
  it('Testing Index call to ' + dvURL, function (done) {
    superagent.get(dvURL)
      .end(function (err, res) {
        (err === null).should.equal(true);
        res.statusCode.should.equal(200);
        done();
      });
  });
});
