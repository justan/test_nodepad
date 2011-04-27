
/**
 * Module dependencies.
 */

var sys = require('sys'),
  express = require('express'),
  mongoose = require('mongoose'),
  mongoStore = require('connect-mongodb'),
  db = mongoose.connect('mongodb://localhost/nodepad'),
  Document = require('./models').Document(db),
  User = require('./models').User(db);
  
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
  if (req.session.user_id && req.session.currentUser) {
  //console.log(req.session)
  //console.log(req.sessionStroe)
    //User.findById(req.session.user_id, function(err, user) {
      //if (user) {
        //req.session.currentUser = user;
        next();
     // } else {
       // res.redirect('/sessions/new');
     // }
  //  });
  } else {
    res.redirect('/sessions/new');
  }
}

app.get('/', loadUser, function(req, res){
  res.render('index', {
    title: 'Express'
  });
});

//documents
(function(){

// List
app.get('/documents.:format?', loadUser, function(req, res){
  Document.find({}, function(err, documents) {
    res.render('./documents', {documents: documents, currentUser: req.session.currentUser, title: 'documents'});
  });
});

// Create 
app.post('/documents.:format?', loadUser, function(req, res){
  //console.log("-- " + JSON.stringify(req.body['document']));
  var document = new Document(req.body);
  document.save(function(){
	switch(req.params.format){
	  case'json':
	    res.send(document.doc);
	    break;
	  default:
	    res.redirect('./documents');
	    break;
	}
  });
});

// Read
app.get('/documents/:id.:format?', loadUser, function(req, res, next){
  Document.findById(req.params.id, function(err, document){
    if(err){
	  next(err);
	}else{
		switch(req.params.format){
		  case'json':
			res.send(document.map(function(d){
			  return d.doc;
			}));
			break;
		  default:
			!/(:?new)/i.test(req.params.id) ? res.render('./documents/show', {d: document, currentUser: req.session.currentUser, title: document.title}) : next();
			break;
		};
	}
  });
});

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
app.put('/documents/:id.:format?', loadUser, update, function(req, res){
  switch(req.params.format){
    case'json':
    break;
  default:
    res.redirect('./documents');
    break;
  }
});

// Delete
app.del('/documents/:id.:format?', loadUser, update, function(req, res){
  res.send('{"result": true}');
});

//new
app.get('/documents/new', loadUser, function(req, res){
  res.render('./documents/new', {d: new Document(), currentUser: req.session.currentUser, title: 'New document'});
});

//edit
app.get('/documents/:id.:format?/edit', loadUser, function(req, res){
  Document.findById(req.params.id, function(err, d){
    res.render('./documents/edit', {d: d, currentUser: req.session.currentUser, title: 'edit ' + d.title});
  });
});
})();

// Sessions
app.get('/sessions/new', function(req, res) {
  res.render('sessions/new', {
    locals: { user: new User(), title: 'Log in'}
  });
});

// log in
app.post('/sessions', function(req, res) {
  User.findOne({email: req.body.email}, function(err, user){
    if(user && user.authenticate(req.body.password)){
	  req.session.user_id = user.id;
	  req.session.currentUser = user;
	  res.redirect('/documents');
	}else{
	  //TODO: show error
	  res.redirect('/sessions/new');
	}
  });
});

// log out
app.del('/sessions', loadUser, function(req, res){
  // Remove the session
  if (req.session) {
    req.session.destroy(function() {
	  //delete(req.currentUser);
	});
  }
  console.log('1234567');
  res.redirect('/sessions/new');
});

//register
app.post('/users.:format?', function(req, res) {
  var user = new User(req.body);
  function userSaved() {
    switch (req.params.format) {
      case 'json':
        res.send(user.doc);
      break;

      default:
        req.session.user_id = user.id;
        res.redirect('/documents');
    }
  }
  function userSaveFailed() {
    res.render('./users/new', { user: user });
  }

  user.save(function(err){
    if(err){
	  userSaveFailed()
	}else{
      userSaved()
	}
  });
});

app.get('/users/new', function(req, res){
  res.render('./users/new', {user: new User(), title: 'Register'})
});

//comet
app.get('/comet', function(req, res, next){
  //console.log(req.headers)
  if(req.headers['x-requested-with'] == 'XMLHttpRequest'){
    setTimeout(function(){res.end('{}')}, 60000)
  }else{
    next();
  }
});

(function _errror(){
  function NotFound(msg){
    this.name = 'NotFound';
	Error.call(this, msg);
	Error.captureStackTrace(this, arguments.callee);
  }
  
  sys.inherits(NotFound, Error);
  
  app.error(function(err, req, res, next){
    console.log('1234567890-');
    if(err instanceof NotFound){
	  res.render('404', 404);
	}else{
	  next(err);
	}
  });
  
  app.error(function(err, req, res){
    res.render('500', {status: 500, locals: {error: err}});
  });
})();


// Only listen on $ node app.js

if (!module.parent) {
  app.listen(3000);
  console.log("Express server listening on port %d", app.address().port);
}
