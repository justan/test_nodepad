
/**
 * Module dependencies.
 */

var express = require('express'),
  mongoose = require('mongoose'),
  db = mongoose.connect('mongodb://localhost/nodepad'),
  Document = require('./models').Document(db);

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes

app.get('/', function(req, res){
  res.render('index', {
    title: 'Express'
  });
});

// List
app.get('/documents.:format', function(req, res) {
});

// Create 
app.post('/documents.:format?', function(req, res) {
  var document = new Document(req.body['document']);
  document.save(function(){
	switch(req.params.format){
	  case'json':
	    res.send(document.__doc);
	    break;
	  default:
	    res.redirect('./documents');
	    break;
	}
  });
});

// Read
app.get('/documents/:id.:format?', function(req, res, next) {
  Document.findById(req.params.id, function(documents){
	switch(req.params.format){
	  case'json':
	    documents ? res.send(documents.map(function(d){
		  return d.__doc;
		})) : next();
	    break;
	  default:
	    !/(:?new)/i.test(req.params.id) ? res.render('./documents/show', {documents: documents, title: req.params.id}) : next();
	    break;
	};
  });
});

// Update
app.put('/documents/:id.:format?', function(req, res) {
});

// Delete
app.del('/documents/:id.:format?', function(req, res) {
});

app.get('/documents', function(req, res) {
  Document.find({}, function(err, documents) {
    res.render('./documents', {documents: documents, title: 'documents'});
  });
});

//new
app.get('/documents/new', function(req, res){
  res.render('./documents/new', {d: new Document(), title: 'New document'});
});

//edit
app.get('/documents/:id.:format?/edit', function(req, res){
  Document.findById(req.params.id, function(err, d){
    res.render('./documents/edit', {d: d, title: 'edit ' + d.title});
  });
});

app.get('*', function(req, res){
  res.send('not found', 404);
});

// Only listen on $ node app.js

if (!module.parent) {
  app.listen(3000);
  console.log("Express server listening on port %d", app.address().port);
}
