var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var Document = new Schema({
  title: {type: String, index: true},
  data: {type: String},
  tags: {type: String},
  user_id: {type: Number, index: true},
});
  
mongoose.model('Document', Document);

exports.Document = function(db){
  return db.model('Document');
};