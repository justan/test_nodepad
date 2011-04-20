var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

mongoose.model('Document', new Schema({
  properties: ['title', 'data', 'tags', 'user_id'],
  indexes: [
    'title',
	'user_id'
  ]
}));

exports.Document = function(db){
  return db.model('Document');
};