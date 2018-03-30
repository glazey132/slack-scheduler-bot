const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI);
const Schema = mongoose.Schema;

const TaskSchema = new Schema({
  subject: {
    type: String,
    required: true
  },
  day: {
    type: Date,
    required: true
  },
  googleCalendarEventId: {
    type: String
  },
  requesterId: {
    type: Schema.ObjectId,
    ref: 'User'
  }
});

const MeetingSchema = new Schema({
  day: {
    type: Date,
    required: true
  },
  time: {
    type: Date,
    required: true
  },
  invitees: {
    type: Array,
    required: true
  },
  subject: {
    type: String,
    default: 'Meeting'
  },
  meetingLength: String,
  status: Boolean,
  requesterId: {
    type: Schema.ObjectId,
    ref: 'User'
  }
});


const UserSchema = new Schema({
  googleCalendarAccount: {
    tokens: Object,
    isSetupComplete: {
      type: Boolean,
      default: false
    }
  },
  slackId: {
    type: String,
    required: true,
    unique: true
  },
  slackUsername: {
    type: String
  },
  slackEmail: {
    type: String
  },
  slackDMIds: {
    type: Array
  },
  pending: {
    date: String,
    description: String
  }
});

UserSchema.statics.findOrCreate = function(slackId) {
  return User.findOne({
    slackId
  }).then(function(user) {
    if (user) {
      return user;
    } else {
      return new User({
        slackId
      }).save();
    }
  });
};

var User = mongoose.model('User', UserSchema);

const InviteRequestSchema = new Schema({
  eventId: {
    type: Schema.ObjectId,
    ref: 'Meeting'
  },
  inviteeId: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  requesterId: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  status: {
    type: Boolean
  }
});

module.exports = {
  Task: mongoose.model('Task', TaskSchema),
  Meeting: mongoose.model('Meeting', MeetingSchema),
  User: User,
  InviteRequest: mongoose.model('InviteRequest', InviteRequestSchema)
};
