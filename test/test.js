'use strict';

require('should');

var Anyfetch = require('anyfetch');
var anyfetchHydrater = require('anyfetch-hydrater');
var sinon = require('sinon');

var ics = require('../lib');

var spyPost = sinon.spy(Anyfetch.prototype, 'postDocument');
var spyDelete = sinon.spy(Anyfetch.prototype, 'deleteDocumentByIdentifier');

var server = Anyfetch.createTestServer();
server.listen(1338, function() {
  console.log('Server listen on port 1338');
});

after(function() {
  server.close();
});

describe('Check results of ICS hydrater', function() {
  it('should not have error', function(done) {
    var document = {
      identifier: 'test',
      access_token: 'test',
      data: {},
      metadata: {},
    };

    var changes = anyfetchHydrater.defaultChanges();

    ics('./test/samples/calendar.ics', document, changes, function(err, changes) {
      if(err) {
        done(err);
      }
      changes.should.eql({});
      done();
    });
  });

  it('check numbers of created document', function(done) {
    spyPost.callCount.should.eql(9);
    done();
  });

  it('check numbers of deleted document', function(done) {
    spyDelete.callCount.should.eql(1);
    done();
  });
});
