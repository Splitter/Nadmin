
const   express       = require('express'),
        { body }      = require('express-validator/check'),
        bcrypt        = require('bcrypt')

const   sessionManager= express.Router()
sessionManager.destroy= express.Router()//second router for signing out

//Error statements
const   errorStatement       = "Credentials are incorrect, please check fields and try again",
        serverErrorStatement = "There was an error in your request. Please try again later."


//Get(logout or signout): user wants to sign out
sessionManager.destroy.get('/',(req, res) =>{
    //destroy session
    req.session.destroy((err) => {
        if ( err ){                                
           return res.status(500).send(serverErrorStatement)
        }
        let success = "You have been successfully signed out"
        res.render(__dirname + "/views/message",{
            errors: false,
            success: success ,
            title: success,
            redirect: req.protocol + "://" + req.headers.host
        })        
    })
})

//Get(login or signin): show sign in form
sessionManager.get('/', (req, res)=>{
    res.render(__dirname + "/../views/login",{title:"Sign In"})
})

//Post(login or signin): user signing in
sessionManager.post('/',[
    //Validation and sanitation
    body('email').isEmail().normalizeEmail(), 
    body('password').not().isEmpty().trim().escape()
], (req, res)=>{
    //check for validation errors
    const errors = req.validationErrors()
    if(!errors){//no validation errors
        //get User model
        const user = require( req.modelDirectory+"/"+req.userModel )    
        user.model.findOne( { email : req.body.email }, (err, userInfo) => {
            
            if ( err ){                                
                return res.status(500).send(serverErrorStatement)
            }
            
            if (!userInfo){//user with email does not exist
                res.render(__dirname + "/../views/login",{title:"Sign In",errors:[errorStatement]})
            }                
            else{//user exists
                //compare password to users stored hashed password
                bcrypt.compare( req.body.password, userInfo.passwordHash, (err, result) => {
                                
                    if ( err ){                                
                        return res.status(500).send(serverErrorStatement)
                    }
                    if ( result ) {//correct password
                        userInfo.passwordHash = null; //delete hash before saving user info in session
                        //create new session apon signing in
                        req.session.regenerate( (err) => {
                            if ( err ){                                
                                return res.status(500).send(serverErrorStatement)
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
                                let success = "You have successfully signed in!"
                                res.render(__dirname + "/../views/login",{
                                    errors: false,
                                    success: success,
                                    title: success,
                                    redirect: req.protocol + "://" + req.headers.host
                                })
                            }
                        })         
                    } else {//wrong password      
                        res.render(__dirname + "/../views/login",{title:"Sign In",errors:[errorStatement]})
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
        res.render(__dirname + "/../views/login",{title:"Sign In",errors:errorList})
    }
})




module.exports = sessionManager

