
const   express    = require('express'),
        { body }   = require('express-validator/check'),
        bcrypt     = require('bcrypt')

const   register   = express.Router()

const loggedInStatement = "You are already logged in!",
      pageTitle         = "Register"

//Get: show form
register.get('/', (req, res)=>{
    //if logged in then do not allow registration
    if(req.session.isLoggedIn()){
        error = loggedInStatement
        let redirect = req.protocol + "://" + req.headers.host
        res.render(__dirname + "/../views/message",{
            errors: error,
            success: false,
            title: pageTitle,
            redirect: redirect
        })
    }
    else{ //new user so allow registration
        res.render(__dirname + "/../views/register", {title: pageTitle})
    }
})

//Post: new registration
register.post('/',[
    //Validation and sanitation
    body('displayname').not().isEmpty().trim().escape(),
    body('email').isEmail().normalizeEmail(), 
    body('confirmEmail').isEmail().normalizeEmail(), 
    body('password').not().isEmpty().trim().escape(),
    body('confirmPassword').not().isEmpty().trim().escape()
], (req, res)=>{
    //if logged in then do not allow registration
    if(req.session.isLoggedIn()){
        error = loggedInStatement
        let redirect = req.protocol + "://" + req.headers.host
        res.render(__dirname + "/../views/message",{
            errors: error,
            success: false,
            title: pageTitle,
            redirect: redirect
        })
    }
    else{ //new user so allow registration
        //check for validation errors
        const errors = req.validationErrors()
        //If these variables get set then they show in the template
        let success
        let errorList = []//Is an array of error messages

        //if no errors validating then see if fields match or user data already exists before trying to create new user
        if(!errors){
            //make sure emails match
            const mEmail = ( req.body.email == req.body.confirmEmail ) ? req.body.email : null;
            if(!mEmail){ errorList.push( "Email and Confirmation email do not match" ) }
            //make sure passwords match
            const password = ( req.body.password == req.body.confirmPassword ) ? req.body.password : null;
            if(!password){ errorList.push( "Password and Confirmation password do not match" ) }

            //get User model
            const user = require( req.nadminSettings.appRoot+"/"+req.nadminSettings.modelDirectory+"/"+req.nadminSettings.userModel )     
            if(errorList.length == 0){//Fields match so see if user data already exists
                user.model.find({ displayName : req.body.displayname }, (err, docs) => {
                    if (docs.length){ 
                        //username is already in use so add to errorList      
                        errorList.push("Username is already taken")
                    }
                    //make sure email not already in use
                    user.model.find({ email : mEmail }, (err, mdocs) => {
                        //email is in use
                        if (mdocs.length){
                            //username is already in use so add to errorList   
                            errorList.push("Email is already in use")
                        }                
                        //errors so re-render registration form with errors
                        if(errorList.length > 0){
                            res.render(__dirname + "/../views/register", {
                                errors: errorList,
                                title: pageTitle,
                                success: success
                            })
                        }// no error so attempt save new user 
                        else{
                            //Hash password
                            bcrypt.hash(password, 12, (err, hash) => {                            
                                //Saving new user
                                //create user model
                                const userModel = new user.model({ 
                                    displayName: req.body.displayname,
                                    email: mEmail,
                                    passwordHash: hash,
                                    activated: true,
                                    usergroup: "User", 
                                    isAdmin: false
                                });
                                //save user model
                                userModel.save().then( () => {
                                    //render registration page with success message and redirect to home page after N seconds
                                    success = "Successfully registered!"
                                    let redirect = req.protocol + "://" + req.headers.host
                                    res.render(__dirname + "/../views/register", {
                                        errors: false,
                                        success: success,
                                        title: pageTitle,
                                        redirect: redirect
                                    })                                
                                });        
                            });                       
                        }
                    });
                });
            }
            else{//Fields do not match so show error messages
                res.render(__dirname + "/../views/register", {
                    errors: errorList,
                    title: pageTitle,
                    success: success
                })
            }
        }//normal validation errors
        else{                
            for(i=0 ; i < errors.length; i++){
                errorList.push(errors[i].param +" : "+errors[i].msg);
            }
            res.render(__dirname + "/../views/register", {
                errors: errorList,
                title: pageTitle,
                success: success
            })
        }
    }
})

module.exports = register
