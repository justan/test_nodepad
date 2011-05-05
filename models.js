var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  ObjectId = Schema.ObjectId,
  crypto = require('crypto');

function validatePresenceOf(value){
  return value && value.length;
}
  
var User = new Schema({
  email: {type: String, index: {unique: true}, validate: [validatePresenceOf, 'an email is require']},
  salt: String,
  hashed_password: String
}),
Document = new Schema({
  title: {type: String, index: true},
  data: {type: String},
  tags: [String],
  user_id: ObjectId,
});

User.pre('save', function(next){
  if(!validatePresenceOf(this.password)){
    next(new Error('Invalid password'));
  }else{
    next();
  }
});

User.virtual('password').set(function(password){
  this.salt = this.makeSalt();
  this._password = password;
  this.hashed_password = this.encryptPassword(password);
}).get(function(){
  return this._password;
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