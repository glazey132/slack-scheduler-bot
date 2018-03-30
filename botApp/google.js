'use strict';
//enable access to google apis and set the scope
//for users google api access
var google = require('googleapis');
var calendar = google.calendar('v3');
var OAuth2 = google.auth.OAuth2;
var scope = [
  'https://www.googleapis.com/auth/plus.me',
  'https://www.googleapis.com/auth/calendar'
];
//auth client with the info we save in env.sh
function getAuthClient() {
  return new OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URL
  );
}
module.exports = {
  generateAuthUrl(slackId) {
    return getAuthClient().generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope,
      state: slackId
    });
  },

  //allows us to get a token for the user that we can then save to
  //our mongodb
  getToken(code) {
    var client = getAuthClient();
    return new Promise(function(resolve, reject) {
      client.getToken(code, function(err, tokens) {
        if (err) {
          reject(err)
        } else {
          resolve(tokens);
        }
      });
    });
  },

  //allows our slack bot to create calendar events
  //we pass it info from our /google/callback route
  //in index.js to set the details of the event.
  //right now our event has hardcoded details in the
  //express route
  createCalendarEvent(tokens, title, date) {
    var client = getAuthClient();
    client.setCredentials(tokens);
    return new Promise(function(resolve, reject) {
      calendar.events.insert({
        auth: client,
        calendarId: 'primary',
        resource: {
          summary: title,
          start: {
            date,
            'timeZone': 'America/Los_Angeles',
          },
          end: {
            date,
            'timeZone': 'America/Los_Angeles'
          }
        }
      }, function(err, res) {
        if (err) {
          reject(err)
        } else {
          resolve(res);
        }
      })
    })
  }
};
