var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  crypto = require('crypto');

var Document = new Schema({
  title: {type: String, index: true},
  data: {type: String},
  tags: {type: String},
  user_id: {type: Number, index: true},
}),
User = new Schema({
  email: {type: String, index: true, unique: true},
  salt: {type: String, default: function(){
    return Math.round((new Date().valueOf() * Math.random())) + '';
  }}
});
User.virtual('password').set(function(password){
  this.set('_password', crypto.createHmac('sha1', this.salt).update(password).digest('hex'));
});

mongoose.model('Document', Document);
mongoose.model('User', User);

exports.Document = function(db){
  return db.model('Document');
};
exports.User = function(db){
  return db.model('User');
};