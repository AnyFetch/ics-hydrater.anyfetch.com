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
          actions: document.actions,
          creation_date: new Date(document.creation_date),
          modification_date: new Date(document.modification_date),
          identifier: generateIdentifier(document.identifier, event),
          metadata: {},
          user_access: document.user_access
        };

        if(event.geo) {
          event.geolocation = event.geo.latitude + ";" + event.geo.longitude;
        }

        ['startDate', 'endDate', 'name', 'description', 'attendee', 'location', 'geolocation', 'organizer'].forEach(function(param) {
          if(event[param]) {
            eventDocument.metadata[param] = event[param];
          }
        });

        if(eventDocument.metadata.description && eventDocument.metadata.description.match(/https:\/\/www\.google\.com\/calendar\/event\?action=VIEW/)) {
          delete eventDocument.metadata.description;
        }

        eventDocument.metadata.attendee = eventDocument.metadata.attendee || [];

        if(eventDocument.metadata.organizer) {
          eventDocument.metadata.attendee.push(eventDocument.metadata.organizer);
        }

        for(var i = 0; i < eventDocument.metadata.attendee.length; i += 1) {
          for(var j = i + 1; j < eventDocument.metadata.attendee.length; j += 1) {
            if((eventDocument.metadata.attendee[i].name && eventDocument.metadata.attendee[i].name === eventDocument.metadata.attendee[j].name) ||
              (eventDocument.metadata.attendee[i].mail && eventDocument.metadata.attendee[i].mail === eventDocument.metadata.attendee[j].mail)) {
              eventDocument.metadata.attendee[i].name = eventDocument.metadata.attendee[i].name || eventDocument.metadata.attendee[j].name;
              eventDocument.metadata.attendee[i].mail = eventDocument.metadata.attendee[i].mail || eventDocument.metadata.attendee[j].mail;

              eventDocument.metadata.attendee.splice(j, 1);
            }
          }
        }

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
        finalCb(err, null);
      });
    });
  });
};
