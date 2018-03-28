"use strict";
var apiai = require('apiai');
var app = apiai(process.env.APIAI_CLIENT_ACCESS);

// You can find your project ID in your Dialogflow agent settings
const projectId = 'saaabot-a6d9a'; //https://dialogflow.com/docs/agents#settings
const sessionId = 'bob';
const query = 'remind me on wed';
const languageCode = 'en-US';

// Instantiate a DialogFlow client.
const dialogflow = require('dialogflow');
const sessionClient = new dialogflow.SessionsClient();





module.exports = {
  interpretUserMessage(message, sessionId) {
    return new Promise(function(resolve, reject){
      var request = app.textRequest(message, {
          sessionId
      });

      request.on('response', function(response) {
          console.log('the response is: ', JSON.stringify(response, null, 2))
          resolve(response)
      });

      request.on('error', function(error) {
          reject(error);
      });
      request.end();
    })
  }
}
