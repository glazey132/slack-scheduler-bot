"use strict";

var WebClient = require('@slack/client').WebClient;
var RtmClient = require('@slack/client').RTMClient;
var token = process.env.SLACK_BOT_TOKEN || '';
var dialogflow = require('./dialogflow');
var { Task, Meeting, User, InviteRequest } = require('../models/index.js');

var rtm = new RtmClient(token);
var web = new WebClient(token);
rtm.start();

setTimeout(() => {
  console.log(rtm.connected, rtm.authenticated)
}, 1000)

rtm.on('team_join', function greetAndGooglePrompt(team) {
  console.log('user id is ', team.user.id)
  web.chat.postMessage({token: token, channel: team.user.id, text: 'Welcome to the group'})
  .then((result) => {
    console.log(result)
  })
  .catch((err) => {
    console.log(err)
  })
});

rtm.on('message', function handleRtmMessage(message) {
  dialogflow.interpretUserMessage(message.text, message.user)
  .then(res => {
    const intent = res.result.metadata.intentName; // checks the intent type, like reminder.add or meeting.add
    if (intent === 'reminder.add' || intent === 'meeting.add') {
      User.findOrCreate(message.user) // checks if user exists in database and makes one if it isn't found
      .then(u => {
        if (u.googleCalendarAccount.accessToken === undefined) {
          return web.chat.postMessage({
            token: token,
            channel: message.channel,
            text: `Hello, please give access to your Google Calendar http://localhost:3000/setup?slackId=${message.user} and send your request again, please`
          });
        }
        if (res.result.actionIncomplete) {
          web.chat.postMessage({
            token: token,
            channel: message.channel,
            text: res.result.fulfillment.speech // next thing the bot wants the user to respond to
          });
        } else {
          if (intent === 'reminder.add') {
            web.chat.postMessage({
              token: token,
              channel: message.channel,
              text: `Awesome! So I'll create a reminder for you to ${res.result.parameters.subject} on ${res.result.parameters.date} :tada:`,
              attachments: JSON.stringify([
                {
                  "fields": [
                    {
                      "title": "Subject",
                      "value": res.result.parameters.subject
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
        }
      })
      .catch(err => {
        console.log('Error finding or creating user', err);
      });
    }
  })
  .catch(function(err) {
    console.log('Error sending message to Dialogflow', err);
    web.chat.postMessage(token, message.channel,
      `Failed to understand your request.`
    );
  });
});
