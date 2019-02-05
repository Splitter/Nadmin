
const   express       = require('express'),
        { body }      = require('express-validator/check'),
        bcrypt        = require('bcrypt')

const   sessionManager= express.Router()
sessionManager.destroy= express.Router()//second router for signing out


/**
 * Middleware function adds session data to res variable
 *
 * @param {Object} request
 * @param {Object} response
 */
sessionManager.init = (req, res, next)=>{    
    res.locals.csrfTokenGet = req.csrfToken
    //utility function to tell whether user is logged in
    req.session.isLoggedIn = () =>{ return req.session.userInfo ? true : false}    
    next()
}

/**
 * Middleware Error function checks for bad CSRF token
 *
 * @param {Object} error
 * @param {Object} request
 * @param {Object} response
 * 
 * @return {Boolean} based on whether error was CSRF token error
 */
sessionManager.csrfErrorCheck = ( err, req, res, next )=>{
    if(err.code == 'EBADCSRFTOKEN'){
        res.render(__dirname + "/views/message",{
            error: res.__("Session has expired or form has been tampered with."),
            success: false,
            title: res.__("Error"),
            redirect: req.protocol + "://" + req.headers.host
        }) 
    }
    else{
        next()
    }
}

//Get(logout or signout): user wants to sign out
sessionManager.destroy.get('/',(req, res) =>{
    //destroy session
    //if logged in then allow logging out
    if(req.session.isLoggedIn()){
        let success = res.__("You have been successfully signed out")
        req.session.destroy((err) => {
            if ( err ){                                
               return res.status(500).send(res.__("There was an error in your request. Please try again later."))
            }
            res.render(__dirname + "/../views/message",{
                errors: false,
                success: success ,
                title: success,
                redirect: req.protocol + "://" + req.headers.host
            })        
        })
    }
    else{ //Not logged in so no need to log out
        error = res.__("You are not logged in!")
        let redirect = req.protocol + "://" + req.headers.host
        res.render(__dirname + "/../views/message",{
            errors: error,
            success: false,
            title: res.__("Sign in"),
            redirect: redirect
        })                
    }          
})

//Get(login or signin): show sign in form
sessionManager.get('/', (req, res)=>{
    //if logged in then do not allow logging in again
    if(req.session.isLoggedIn()){
        error = res.__("You are already logged in!")
        let redirect = req.protocol + "://" + req.headers.host
        res.render(__dirname + "/../views/message",{
            errors: error,
            success: false,
            title: res.__("Sign in"),
            redirect: redirect
        })
    }
    else{ //new user so allow logging in
        res.render(__dirname + "/../views/login",{title:"Sign In"})
    }
})

//Post(login or signin): user signing in
sessionManager.post('/',[
    //Validation and sanitation
    body('email').isEmail().normalizeEmail(), 
    body('password').not().isEmpty().trim().escape()
], (req, res)=>{
    //if logged in then do not allow logging in again
    if(req.session.isLoggedIn()){
        error = res.__("You are already logged in!")
        let redirect = req.protocol + "://" + req.headers.host
        res.render(__dirname + "/../views/message",{
            errors: error,
            success: false,
            title: res.__("Sign in"),
            redirect: redirect
        })
    }
    else{ //not logged in so allow logging in
        //check for validation errors
        const errors = req.validationErrors()
        if(!errors){//no validation errors
            //get User model
            const user = require( req.nadminSettings.appRoot+"/"+req.nadminSettings.modelDirectory+"/"+req.nadminSettings.userModel ) 
            user.model.findOne( { email : req.body.email }, (err, userInfo) => {
                
                if ( err ){                                
                    return res.status(500).send(res.__("There was an error in your request. Please try again later."))
                }
                
                if (!userInfo){//user with email does not exist
                    res.render(__dirname + "/../views/login",{title: res.__("Sign in"),errors:[errorStatement]})
                }                
                else{//user exists
                    //compare password to users stored hashed password
                    bcrypt.compare( req.body.password, userInfo.passwordHash, (err, result) => {
                                    
                        if ( err ){                                
                            return res.status(500).send(res.__("There was an error in your request. Please try again later."))
                        }
                        if ( result ) {//correct password
                            userInfo.passwordHash = null; //delete hash before saving user info in session
                            //create new session apon signing in
                            req.session.regenerate( (err) => {
                                if ( err ){                                
                                    return res.status(500).send(res.__("There was an error in your request. Please try again later."))
                                }
                                else{       
                                    req.session.userInfo = userInfo;
                                    if(req.body.remember != "remember-me"){                                 
                                        //if remember me checkbox not set then expire in half hour
                                        var halfHour = 1800000
                                        req.session.cookie.expires = new Date( Date.now() + halfHour )
                                        req.session.cookie.maxAge = halfHour
                                    }
                                    //render success message then redirect to app root
                                    let success = res.__("You have successfully signed in!")
                                    req.brute.reset()//reset rate limiter
                                    res.render(__dirname + "/../views/login",{
                                        errors: false,
                                        success: success,
                                        title: res.__("Sign in"),
                                        redirect: req.protocol + "://" + req.headers.host
                                    })
                                }
                            })         
                        } else {//wrong password      
                            res.render(__dirname + "/../views/login",{title: res.__("Sign in"),errors:[errorStatement]})
                        }
                    })
                }
            })
        }
        else{//validation errors
            let errorList = []            
            for(i=0 ; i < errors.length; i++){
                errorList.push(errors[i].param +" : "+errors[i].msg);
            }
            res.render(__dirname + "/../views/login",{title: res.__("Sign in"),errors:errorList})
        }
    }
})




module.exports = sessionManager

