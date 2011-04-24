
/**
 * Module dependencies.
 */

var express = require('express'),
  mongoose = require('mongoose'),
  mongoStore = require('connect-mongodb'),
  db = mongoose.connect('mongodb://localhost/nodepad'),
  Document = require('./models').Document(db),
  User = require('./models').Document(db);
  
var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.session({
    secret: 'justan',
    store: mongoStore({
        dbname: 'nodepad',
        //host: db.db.serverConfig.host,
        //port: db.db.serverConfig.port,
        //username: db.uri.username,
        //password: db.uri.password
      })
  }));
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

function loadUser(req, res, next) {
  if (req.session.user_id) {
    User.findById(req.session.user_id, function(user) {
      if (user) {
        req.currentUser = user;
        next();
      } else {
        res.redirect('/sessions/new');
      }
    });
  } else {
    res.redirect('/sessions/new');
  }
}

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


//documents
(function(){

function update(req, res, next){
	Document.findById(req.params.id, function(err, d){
    var fn = "save";
    if(err){
      next(new Error('no this doc'));
    }
    if(req.method == "DELETE"){
      fn = 'remove';
    }else if(req.method == 'PUT'){
      fn = 'save';
      d.title = req.body.title;
      d.data = req.body.data;
    }
	  d[fn](function(){
	    next();
	  });
  });
}

// Update
app.put('/documents/:id.:format?', update, function(req, res){
  switch(req.params.format){
    case'json':
    break;
  default:
    res.redirect('./documents');
    break;
  }
});

// Delete
app.del('/documents/:id.:format?', update, function(req, res){
  res.send('{"result": true}');
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
})();

// Sessions
app.get('/sessions/new', function(req, res) {
  res.render('sessions/new', {
    locals: { user: new User() }
  });
});

app.post('/sessions', function(req, res) {
  // Find the user and set the currentUser session variable
});

app.del('/sessions', loadUser, function(req, res) {
  // Remove the session
  if (req.session) {
    req.session.destroy(function() {});
  }
  res.redirect('/sessions/new');
});

app.post('/users.:format?', function(req, res) {
  var user = new User(req.body);

  function userSaved() {
    switch (req.params.format) {
      case 'json':
        res.send(user.__doc);
      break;

      default:
        req.session.user_id = user.id;
        res.redirect('/documents');
    }
  }

  function userSaveFailed() {
    res.render('users/new', {
      locals: { user: user }
    });
  }

  user.save(userSaved, userSaveFailed);
});

//comet
app.get('/comet', function(req, res, next){
  //console.log(req.headers)
  if(req.headers['x-requested-with'] == 'XMLHttpRequest'){
    setTimeout(function(){res.end('')}, 30000)
  }else{
    next();
  }
});

// Only listen on $ node app.js

if (!module.parent) {
  app.listen(3000);
  console.log("Express server listening on port %d", app.address().port);
}
