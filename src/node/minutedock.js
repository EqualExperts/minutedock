var fs = require('fs');
var express = require('express');
var favicon = require('serve-favicon');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var cookieParser = require('cookie-parser');
var compress = require('compression');
var session = require('express-session');
var errorHandler = require('express-error-handler');
var logger = require('morgan');
var path = require('path');
var passport = require('passport');
var ejs = require('ejs');

var config = require('config');

var index = require('./routes/index');
var auth = require('./routes/auth');
var register = require('./routes/register');
var entries = require('./routes/entries');
var contacts = require('./routes/contacts');
var projects = require('./routes/projects');

var app = express();

app.set('env', process.env.NODE_ENV || "development");
app.set('port', config["app.port"]);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.enable('case sensitive routing');

app.engine('html', ejs.renderFile);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(methodOverride());
app.use(compress());

app.use(session({
    secret: config["session.cookie.secret"],
    cookie: {secure: false, httpOnly : config["cookie.httpOnly"]},
    resave: true,
    saveUninitialized: true
}));
app.use(express.static(path.join(__dirname, '../static')));

// express logger used after static path binding so that it does not logs static files
app.use(errorHandler({ dumpExceptions: true, showStack: true }));
if("production" === app.get('env')){
  app.enable('view cache');
  var requestLogStream = fs.createWriteStream('./logs/requests.log', {flags : 'a'});
  app.use(logger({stream : requestLogStream}));
} else {
  app.use(logger('dev'));
}

app.use(passport.initialize());
app.use(passport.session());

app.use(function(err, req, res, next){
  console.error(err);
	res.send(500);
});

function requireAuthentication(req, res, next) {
  if (req.user && req.user.identifier) {
    return next();
  } else if(req.url !== '/')  {
    res.sendStatus(401);
  }
  else{
    req.logout();
    res.redirect('/login');
  }
};

app.get('/login', auth.login);
app.get('/logout', auth.logout);

app.get('/auth/login', auth.authLogin);
app.get('/auth/callback', auth.callback);
app.get('/auth/checkApiKey', auth.checkApiKey);


// placed here to authenticate all below mentioned routes
app.all('*', requireAuthentication);

app.get('/',index.index);

app.post('/register', register.register);

app.get('/contacts', contacts.list);

app.get('/projects', projects.list);

app.get('/entries', entries.list);
app.post('/entries/bulk/add', entries.bulkAdd);
app.delete('/entries/:entryId', entries.delete);
app.post('/entries/bulk/delete', entries.bulkDelete);

if(config["use.https"]){
  var https = require('https');

  var privateKey  = fs.readFileSync(config["ssl.key.path"], 'utf8');
  var certificate = fs.readFileSync(config["ssl.cert.path"], 'utf8');
  var credentials = { key: privateKey, cert: certificate };

  https.createServer(credentials,app).listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
  });
}
else{
  var http = require('http');
  http.createServer(app).listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
  });  
}
