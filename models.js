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
  email: {type: String, index: {unique: true}},
  salt: String,
  hashed_password: String
});
User.virtual('password').set(function(password){
  this.salt = this.makeSalt();
  this._password = password;
  this.hashed_password = this.encryptPassword(password);
});

User.method('encryptPassword', function(password){
  return crypto.createHmac('sha1', this.salt).update(password).digest('hex');
});
User.method('makeSalt', function(){
  return Math.round((new Date().valueOf() * Math.random())) + ''
});
User.method('authenticate', function(plainText){
  return this.encryptPassword(plainText) === this.hashed_password;
});

mongoose.model('Document', Document);
mongoose.model('User', User);

exports.Document = function(db){
  return db.model('Document');
};
exports.User = function(db){
  return db.model('User');
};