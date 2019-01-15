
const   mongoose        = require('mongoose'),
        express         = require('express'),
        cookieParser    = require('cookie-parser'),
        bodyParser      = require('body-parser'),
        expressValidator= require('express-validator'),
        session         = require('express-session'),
        mongoStore      = require('connect-mongo')(session),
        appRoot         = require('app-root-path'),
        expressBrute    = require('express-brute'),
        mongBruteStore  = require('express-brute-mongoose'),
        mongBruteSchema = require('express-brute-mongoose/dist/schema'),
        helmet          = require('helmet'),
        csrf            = require('csurf')

const   register        = require("../controllers/register"),
        reset           = require("../controllers/reset"),
        recovery        = require("../controllers/recovery"),
        sessionManager  = require("../controllers/sessionManager"),
        utilities       = require("./utilities"),
        admin           = require("../admin"),
        helmetCSP       = utilities.helmetCSP




//Main Nadmin middleware
const nadmin = (app, options = {} ) =>{
    
    /********************/
    /*     SETTINGS     */
    /********************/
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
        enableHelmet    : true,
        adminRoute      : "/admin",
        adminTitle      : "Dashboard"
    }
    settings = utilities.extend(settings, options)

    /************************/
    /* 3RD PARTY MIDDLEWARE */ 
    /************************/
    app.use(cookieParser())
    app.use(bodyParser.urlencoded({extended: true}))
    app.use(bodyParser.json())
    app.use(expressValidator())   
    //setup rate limiter for login page
    const loginLimitStore = new mongBruteStore(mongoose.model( 'loginRateLimiter', mongBruteSchema ))        
    const loginRateLimiter = new expressBrute(loginLimitStore, {
        freeRetries: 5,
        minWait: 5*60*1000, // 5 minutes
        maxWait: 60*60*1000 // 1 hour
    });
    //allow disabling of general helmet middleware, incase custom settings are used in main site
    //This keeps the CSP protection intact seperately for Nadmin routes
    if(settings.enableHelmet){
        app.use(helmet())
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
    //enable csrf protection
    app.use(csrf())    
    
    /************************/
    /*   NADMIN MIDDLEWARE  */ 
    /************************/
    //initialize sessionManager middleware
    app.use(sessionManager.init)
    //Check for CSRF errors
    app.use(sessionManager.csrfErrorCheck)
    //Attach settings so all of nadmin can access
    app.use(( req, res, next )=>{
        req.nadminSettings = settings
        next();        
    })

    //begin routing

    /********************/
    /* USER AUTH ROUTES */
    /********************/
    //route public requests of user auth routes to correct public folder
    app.use(["/register", "/signup","/login" , "/signin","/logout", "/signout","/forgotpassword",'/recovery'],(req,res, next)=>{        
        //make static nadmin auth assets accessable
        app.use("/public",express.static(__dirname + "/../public"))
        next()
    })
    //registration route
    app.use(["/register", "/signup"] ,helmetCSP , register)     
    //session routes
    app.use(["/login" , "/signin"] , loginRateLimiter.prevent, helmetCSP , sessionManager)
    app.use(["/logout", "/signout"]  ,helmetCSP , sessionManager.destroy)
    //account recovery routes
    app.use("/forgotpassword" ,helmetCSP , reset)
    app.use('/recovery',helmetCSP , recovery)
    // - USER AUTH ROUTES

    /********************/
    /*   ADMIN ROUTE    */
    /********************/
    
    admin.init( settings )
    app.use( settings.adminRoute , admin )

}

module.exports = nadmin;