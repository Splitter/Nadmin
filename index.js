const   mongoose        = require('mongoose'),
        express         = require('express'),
        bodyParser      = require('body-parser'),
        expressValidator= require('express-validator'),
        session         = require('express-session'),
        mongoStore      = require('connect-mongo')(session),
        appRoot         = require('app-root-path'),
        expressBrute    = require('express-brute'),
        mongBruteStore  = require('express-brute-mongoose'),
        mongBruteSchema = require('express-brute-mongoose/dist/schema'),
        helmet          = require('helmet')
        
const   page            = require("./controllers/page"),
        register        = require("./controllers/register"),
        reset           = require("./controllers/reset"),
        recovery        = require("./controllers/recovery"),
        sessionManager  = require("./controllers/sessionManager"),
        utilities       = require("./utilities")

//Make mongoose use newer native driver api's and get rid of depreciation warnings
mongoose.set('useFindAndModify', false)
mongoose.set('useCreateIndex', true);

//setup rate limiter for login page
const loginLimitStore = new mongBruteStore(mongoose.model( 'loginRateLimiter', mongBruteSchema ))        
const loginRateLimiter = new expressBrute(loginLimitStore, {
    freeRetries: 5,
    minWait: 5*60*1000, // 5 minutes
    maxWait: 60*60*1000 // 1 hour
});

//Main Nadmin middleware
const nadmin = (app, options = {} ) =>{
    settings = {
        appRoot         : appRoot,
        modelDirectory  : "models",
        userModel       : "user",
        sessionSecret   : "$2b$12$wuJPlBlIRh2SXt18AwbBDOjuh5xPNniStXzTcrytS/Y1aF/zlVyuK",
        sessionExpire   : 4, //days
        emailOptions    : {
            from: 'yourname@gmail.com',
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: "username",
                pass: "password"
            }
        },
        enableHelmet    : true
    }
    settings = utilities.extend(settings, options)

    //attach middleware
    app.use(bodyParser.urlencoded({extended: true}))
    app.use(bodyParser.json())
    app.use(expressValidator())
    
    //allow disabling of general helmet middleware, incase custom settings are used in main site
    //This keeps the CSP protection intact seperately for Nadmin routes
    if(settings.enableHelmet){
        app.use(helmet())
    }

    //middleware function for helmet contentSecurity policy -seperated from helmets main middleware
    //used for nadmin specific routes
    const helmetCSP = (req, res, next)=>{        
        helmet.contentSecurityPolicy({
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", 'stackpath.bootstrapcdn.com', 'code.jquery.com'],
                styleSrc:  ["'self'", 'stackpath.bootstrapcdn.com', 'use.fontawesome.com'],
                fontSrc:   ["'self'", 'stackpath.bootstrapcdn.com', 'use.fontawesome.com']
            }
        })(req,res,next)
    }

    //setup session
    app.use(session({
        store: new mongoStore( { 
            mongooseConnection: mongoose.connection,
            ttl: ( settings.sessionExpire * 24 * 60 * 60 ) //days * hours * minutes * seconds    
        } ),
        secret: settings.sessionSecret,
        saveUninitialized: true,
        resave: true,
        cookie: {
            path: "/",
            maxAge:  ( settings.sessionExpire * 24 * 60 * 60 * 1000 ), //days * hours * minutes * seconds * milliseconds        
            httpOnly: true
        },
        name: "id"
    }))

    //middleware function
    return ( req, res, next )=>{
        //attach extra data to res so controllers can access
        req.modelDirectory = settings.appRoot+"/"+settings.modelDirectory
        req.userModel = settings.userModel
        req.emailOptions = settings.emailOptions

        //utility function to tell whether user is logged in
        req.session.isLoggedIn = () =>{ return req.session.userInfo ? true : false}
        
        //make static nadmin assets accessable
        req.app.use("/nadmin_public",express.static(__dirname + "/nadmin_public"))
        
        //route registration routes
        req.app.use(["/register", "/signup"] ,helmetCSP , (req, res)=>{
            //if logged in then do not allow registration
            if(req.session.isLoggedIn()){
                error = "You are already logged in!"
                let redirect = req.protocol + "://" + req.headers.host
                res.render(__dirname + "/views/message",{
                    errors: error,
                    success: false,
                    title:error,
                    redirect: redirect
                })
            }
            else{ //new user so allow registration
                register(req, res)
            }
        })        

        //route session routes
        req.app.use(["/login" , "/signin"] , loginRateLimiter.prevent, helmetCSP , (req,res)=>{
            //if logged in then do not allow logging in again
            if(req.session.isLoggedIn()){
                error = "You are already logged in!"
                let redirect = req.protocol + "://" + req.headers.host
                res.render(__dirname + "/views/message",{
                    errors: error,
                    success: false,
                    title:error,
                    redirect: redirect
                })
            }
            else{ //new user so allow logging in
                sessionManager(req, res)
            }          
        })
        req.app.use(["/logout", "/signout"]  ,helmetCSP , (req,res)=>{
            //if logged in then allow logging out
            if(req.session.isLoggedIn()){
                sessionManager.destroy(req,res)
            }
            else{ //Not logged in so no need to log out
                error = "You are not logged in!"
                let redirect = req.protocol + "://" + req.headers.host
                res.render(__dirname + "/views/message",{
                    errors: error,
                    success: false,
                    title:error,
                    redirect: redirect
                })                
            }          
        })

        //account recovery
        req.app.use("/forgotpassword" ,helmetCSP , reset)
        req.app.use('/recovery',helmetCSP , recovery)

        //call next middleware
        next();        
    }
}

nadmin.Page = page

module.exports = nadmin;

