const mongoose = require('mongoose');
const connect = process.env.MONGODB_URI;

mongoose.connect(connect);

var UserSchema = mongoose.Schema({
  slackName: {
    type: String
  },
  slackId: {
    type: String
  },
  googleProfile: {
    type: Object
  },
  channel: {
    type: String
  }
})

var TaskSchema = mongoose.Schema({
  subject: {
    type: String
  },
  date: {
    type: Date
  },
  userSlackId: {
    type: String
  }
})

var User = mongoose.model('User', UserSchema);
var Task = mongoose.model('Task', TaskSchema);

module.exports = {
  User: User,
  Task: Task
}
