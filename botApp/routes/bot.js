"use strict";

var WebClient = require('@slack/client').WebClient;
var RtmClient = require('@slack/client').RTMClient;
var token = process.env.SLACK_BOT_TOKEN || '';
var dialogflow = require('./dialogflow');
const sessionId = 'bob';
var { Task, Meeting, User, InviteRequest } = require('../models/index.js');

var rtm = new RtmClient(token);
var web = new WebClient(token);
rtm.start();

setTimeout(() => {
  //(rtm.connected, rtm.authenticated)
}, 1000)

rtm.on('team_join', function greetAndGooglePrompt(team) {
  //('user id is ', team.user.id)
  web.chat.postMessage({token: token, channel: team.user.id, text: 'Welcome to the group'})
  .then((result) => {
    //(result)
  })
  .catch((err) => {
    //(err)
  })
});

rtm.on('message', function handleRtmMessage(message) {
  var user;
  //('message******', message)
  dialogflow.interpretUserMessage(message.text, sessionId)
  .then(res => {
    const intent = res.result.metadata.intentName; // checks the intent type, like reminder.add or meeting.add
    if ((intent === 'reminder.add' || intent === 'meeting.add') && message.subtype !== 'bot_message') {

      User.findOrCreate(message.user) // checks if user exists in database and makes one if it isn't found
      .then(u => {
        //('the user is: ', u)
        user = u;
        if (!u.googleCalendarAccount.isSetupComplete) {
          return web.chat.postMessage({
            token: token,
            channel: message.channel,
            text: `Hello, please give access to your Google Calendar http://localhost:3000/setup?slackId=${message.user}`
          });
        }
        if (res.result.actionIncomplete) {
          web.chat.postMessage({
            token: token,
            channel: message.channel,
            text: res.result.fulfillment.speech // next thing the bot wants the user to respond to
          });
          return null;
        } else {
          user.pending.description = res.result.parameters.subject[0];
          user.pending.date = res.result.parameters.date;
          return user.save()
          .then(function() {
            if (intent === 'reminder.add') {
              console.log('message', message)
              web.chat.postMessage({
                token: token,
                channel: message.channel,
                text: `Awesome! So I'll create a reminder for you to ${res.result.parameters.subject} on ${res.result.parameters.date} :tada:`,
                attachments: JSON.stringify([
                  {
                    "fields": [
                      {
                        "title": "Subject",
                        "value": res.result.parameters.subject[0]
                      },
                      {
                        "title": "Day",
                        "value": res.result.parameters.date
                      }
                    ],
                    "text": "Is this reminder right?",
                    "fallback": "You cannot add a new Calendar event",
                    "callback_id": "reminder",
                    "color": "#3AA3E3",
                    "actions": [
                      {
                        "name": "yes",
                        "text": "Yes",
                        "type": "button",
                        "value": "true",
                        "style": "primary"
                      },
                      {
                        "name": "cancel",
                        "text": "Cancel",
                        "type": "button",
                        "value": "false",
                        "style": "danger"
                      }
                    ]
                  }
                ])
              })
            }
            if (intent === 'meeting.add') {
              web.chat.postMessage(token, message.channel, {
                "text": `Awesome! So I'll schedule a meeting for ${res.result.parameters.invitees} at ${res.result.parameters.time} on ${res.result.parameters.date} :tada:`,
                "attachments": [
                  {
                    "fields": [
                      {
                        "title": "Invitees",
                        "value": res.result.parameters.invitees
                      },
                      {
                        "title": "Time",
                        "value": res.result.parameters.time
                      },
                      {
                        "title": "Day",
                        "value": res.result.parameters.date
                      }
                    ],
                    "text": "Is this scheduled meeting right?",
                    "fallback": "You cannot add a new Calendar event",
                    "callback_id": "meeting",
                    "color": "#3AA3E3",
                    "actions": [
                      {
                        "name": "yes",
                        "text": "Yes",
                        "type": "button",
                        "value": "true",
                        "style": "primary"
                      },
                      {
                        "name": "cancel",
                        "text": "Cancel",
                        "type": "button",
                        "value": "false",
                        "style": "danger"
                      }
                    ]
                  }
                ]
              })
            }
          })
        }
      })
      .catch(err => {
        //('Error finding or creating user', err);
      });
    }
  })
  .catch(function(err) {
    console.log('Error sending message to Dialogflow!!!', err);
    web.chat.postMessage(token, message.channel,
      `Failed to understand your request.`
    );
  });
});
