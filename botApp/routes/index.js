//express server routes. we must run our app with a special command
//since index.js and users.js are run through .bin/www
var express = require('express');
var router = express.Router();
var google = require('../google');
var request = require('request')
// const { RTMClient } = require('@slack/client');

var apiai = require('apiai')
var app = apiai(process.env.APIAI_CLIENT_ACCESS)

// var RtmClient = require('@slack/client').RtmClient,
//     RTM_EVENTS = require('@slack/client').RTM_EVENTS;
//
// var rtm = new RtmClient(botAccessToken);
//
// rtm.start();
var models = require('../models');
var User = models.User;
var Task = models.Task;

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/message_action', function(req, res, next) {
  var payload = JSON.parse(req.body.payload);
  if (payload.actions[0].value) {
    User.findOne({slackId: payload.user.id})
    .then(function(user) {
      //("User in message_action", user)
      return google.createCalendarEvent(user.googleCalendarAccount.tokens, user.pending.description, user.pending.date);
    })
    .then(function() {
      res.send('successfully created reminder :)')
    })
    .catch(function(error) {
      //("Error in message_action", error)
      res.send('error creating reminder', error);
    });
  } else {
    //("Truthy test message_action", payload.actions[0].value == true)
    res.send('cancelled');
  }
})


router.get('/setup', function(req, res) {
  //('REQ QUERY IS **** ', req.query);
  var user, tokens;
  var url = google.generateAuthUrl(req.query.slackId);
  //('slack id', req.query.slackId);
  //('url', url);
  res.redirect(url);
})
router.get('/google/callback', function(req, res, next) {
  //('query', req);
  User.findOne({ slackId: req.query.state })
  .then(function(u) {
    user = u;
    //('user', user);
    return google.getToken(req.query.code)
  })
  .then(function (t) {
    //('user again', user);
    tokens = t;
    user.googleCalendarAccount.tokens = tokens;
    user.googleCalendarAccount.isSetupComplete = true;
    return user.save()
    // return google.createCalendarEvent(tokens, 'MY LAST TEST!! >:)', '2018-03-30')
  })
  .then(function() {
    res.send('You are now autheniticated with Google. Thanks!')
  })
  .catch(function (err) {
    //('ERROR receiving token', err);
    res.status(500).send('Sorry we were unable to receive the Google token')
  });
})

router.get('/redirect', (req, res) =>{
  //('in here')
    var options = {
        uri: 'https://slack.com/api/oauth.access?code='
            +req.query.code+
            '&client_id='+process.env.CLIENT_ID+
            '&client_secret='+process.env.CLIENT_SECRET+
            '&redirect_url=https://ee2cb516.ngrok.io/redirect/getGoogle',
        method: 'GET'
    }
    request(options, (error, response, body) => {
        var JSONresponse = JSON.parse(body)
        if (!JSONresponse.ok){
            //(JSONresponse)
            res.send("Error encountered: \n"+JSON.stringify(JSONresponse)).status(200).end()
        }else{
            //(JSONresponse)
            // res.send("Success!")
            res.redirect('/redirect/getGoogle')
        }
    })
})


router.post('/testing', (req, res) => {

  var request = app.textRequest('<Your text query>', {
      sessionId: '<unique session id>'
  });


  // //('req is', req)
  //('request parameters are', req.body.result.parameters)
  //('resolvedQuery is ', req.body.resolvedQuery)
  // //('req.params is ', req.params)
  // //('req.query is ', req.query)

  // ***** check database for that slackUser id req.body.originalRequest.data.event.user
  // see if it exists in database AND if it has a googleAuth token
  // if it doesn't exist, add it and send link to google auth form
  // if it does exist but no googleAuth token send link to google auth form
  //('req.body.originalRequest.data is ', req.body.originalRequest.data)
  // res.setHeader('Content-Type', 'application/json')
  res.send({"displayText": "Successfully sent custom response"})
})

// router.post('/end', (req, res) => {
//   //('req.body is', req.body)
//   res.json(req.body.challenge)
// })
module.exports = router;
