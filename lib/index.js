'use strict';

var fs = require('fs');
var async = require('async');
var ics = require('ics-parser');
var Anyfetch = require('anyfetch');

function generateIdentifier(baseIdentifier, event) {
  var identifier = event.type;

  if(event.uid) {
    identifier = event.uid;
  }
  else {
    if(event.summary) {
      identifier += "-" + event.summary;
    }
    if(event.start) {
      identifier += "-" + event.start;
    }
    if(event.end) {
      identifier += "-" + event.end;
    }
  }

  return baseIdentifier + " - " + (new Buffer(identifier).toString('base64'));
}

module.exports = function(path, document, changes, finalCb) {
  fs.readFile(path, function(err, data) {
    if(err) {
      finalCb(err);
    }
    var events = ics(data.toString());
    
    var anyfetch = new Anyfetch(document.access_token);
    anyfetch.setApiUrl(finalCb.apiUrl);

    async.each(events, function(event, cb) {
      if(event.type === "VEVENT") {
        var eventDocument = {
          document_type: "event",
          identifier: generateIdentifier(document.identifier, event),
          metadata: {}
        };

        if(event.geo) {
          event.geolocation = event.geo.latitude + ";" + event.geo.longitude;
        }

        ['startDate', 'endDate', 'name', 'description', 'attendee', 'location', 'geolocation'].forEach(function(param) {
          if(event[param]) {
            eventDocument.metadata[param] = event[param];
          }
        });

        anyfetch.postDocument(eventDocument, cb);
      }
      else {
        cb();
      }
    },
    function(err) {
      if(err) {
        return finalCb(err);
      }
      anyfetch.deleteDocumentByIdentifier(document.identifier, function(err) {
        finalCb(err, {});
      });
    });
  });
};
