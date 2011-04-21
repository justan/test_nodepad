
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
app.get('/documents.:format?', function(req, res){
  Document.find({}, function(err, documents) {
    res.render('./documents', {documents: documents, title: 'documents'});
  });
});

// Create 
app.post('/documents.:format?', function(req, res){
  //console.log("-- " + JSON.stringify(req.body['document']));
  var document = new Document(req.body);
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
app.get('/documents/:id.:format?', function(req, res, next){
  Document.findById(req.params.id, function(err, document){
	switch(req.params.format){
	  case'json':
	    res.send(document.map(function(d){
		  return d.__doc;
		}));
	    break;
	  default:
	    !/(:?new)/i.test(req.params.id) ? res.render('./documents/show', {d: document, title: document.title}) : next();
	    break;
	};
  });
});

// Update
app.put('/documents/:id.:format?', function(req, res){
  Document.findById(req.params.id, function(err, d){
	d.title = req.body.title;
	d.data = req.body.data;
	d.save(function(){
	  switch(req.params.format){
	    case'json':
		  break;
		default:
		  res.redirect('./documents');
		  break;
	  }
	});
  });
});

// Delete
app.del('/documents/:id.:format?', function(req, res){
  console.log('del')
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

// Only listen on $ node app.js

if (!module.parent) {
  app.listen(3000);
  console.log("Express server listening on port %d", app.address().port);
}
