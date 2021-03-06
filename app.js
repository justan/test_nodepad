
/**
 * Module dependencies.
 */

var sys = require('sys'),
  express = require('express'),
  url = require('url'),
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
  app.use(function(req, res, next){
    next(new NotFound(req.url));
  });
  
  app.error(function(err, req, res, next){
    console.log('1234567890-');
    if(err instanceof NotFound){
	  res.render('404', 404);
	}else{
	  next(err);
	}
  });
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes

app.param('docId', function(req, res, next, id){
  Document.findById(id, function(err, document){
    if(err){
      next(err);
    }else{
      req.document = document;
      next();
    }
  });
});

function loadUser(req, res, next) {
  if (req.session.currentUser) {
    next();
  } else {
    res.redirect('/sessions/new?redirect=' + encodeURIComponent(req.url));
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
  document.user_id = req.session.currentUser._id;
  document.save(function(err){
    if(err){
	  console.error(err)
	}
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
app.get('/documents/:docId.:format?', loadUser, function(req, res, next){
  switch(req.params.format){
    case'json':
    res.send(req.document.doc);
    break;
    default:
    !/(:?new)/i.test(req.params.docId) ?
      res.render('./documents/show', {d: req.document, currentUser: req.session.currentUser, title: req.document.title, author: req.document.user_id}) :
      next();
    break;
  };
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
  res.render('documents/new', {d: new Document(), currentUser: req.session.currentUser, title: 'New document'});
});

//edit
app.get('/documents/:id.:format?/edit', loadUser, function(req, res){
  Document.findById(req.params.id, function(err, d){
    res.render('./documents/edit', {d: d, currentUser: req.session.currentUser, title: 'edit ' + d.title, author: d.user_id});
  });
});
})();

// Sessions
app.get('/sessions/new', function(req, res) {
  res.render('sessions/new', {
    locals: { user: new User(), title: 'Log in', query: url.parse(req.url).query}
  });
});

// log in
app.post('/sessions', function(req, res) {
  User.findOne({email: req.body.email}, function(err, user){
    var rurl = '/documents', query = url.parse(req.url, true).query;
    if(user && user.authenticate(req.body.password)){
      //req.session.user_id = user.id;
      req.session.currentUser = user;
      if(query.redirect){
        rurl = decodeURIComponent(query.redirect);
      }
      req.flash('info', 'Welcom %s', user.email);
      res.redirect(rurl);
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
  console.log('logout');
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
        req.session.currentUser = user;
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
  if(req.xhr){
    setTimeout(function(){res.end('{}')}, 60000)
  }else{
    next();
  }
});


//(function _error(){
function NotFound(path){
    this.name = 'NotFound';
	console.log('path: ' + path)
	if(path){
	  Error.call(this, 'Cannot find ' + path);
	  this.path = path;
	}else{
	  Error.call(this, 'Not Found');
	}
	Error.captureStackTrace(this, arguments.callee);
}
  
  app.get('/404', function(req, res){
    console.log('234')
    throw new NotFound
  });
  
  NotFound.prototype.__proto__ = Error.prototype;
  

  
  app.error(function(err, req, res){
    console.log('890');
    res.render('500', {status: 500, locals: {error: err}});
  });
//})();


// Only listen on $ node app.js

if (!module.parent) {
  app.listen(3000);
  console.log("Express server listening on port %d", app.address().port);
}
