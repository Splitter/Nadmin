const   express       = require('express'),
        { body }      = require('express-validator/check'),
        bcrypt        = require('bcrypt')

const   resetToken    = require("../models/resetToken")
const   recovery= express.Router()


recovery.get("/", (req, res) => {
    if(!req.query.reset){                     
        return res.status(403).send(res.__("There was an error in your request. Please try again later."))
    }   
    //get all tokens from DB
    resetToken.model.find( {expires: { $gt: Date.now() } }, (err, tokens) => {
        if ( err ){                                
            return res.status(500).send(res.__("There was an error in your request. Please try again later."))
        }   
        
        let count = 0
        let foundToken = false
        if(tokens.length){
        //cycle through all tokens in DB
            tokens.forEach((token)=>{
                //see if queried hash matches current token
                bcrypt.compare( req.query.reset, token.tokenHash,  (err, result)=> {
                    if ( err ){                                
                        return res.status(500).send(res.__("There was an error in your request. Please try again later."))
                    }   
                    count = count + 1
                    if ( result ) {//tokens match - render form
                        foundToken = true
                        res.render(__dirname + "/../views/new-password",{
                            error: false,
                            success: false,
                            title: res.__("Account Recovery"),
                            token: req.query.reset
                        }) 
                    }
                    if(!foundToken && count >= tokens.length-1){
                        res.render(__dirname + "/../views/message",{
                            error: res.__("Invalid attempt at password reset, if you followed a link it may have expired"),
                            success: false,
                            title: res.__("Account Recovery"),
                            redirect: req.protocol + "://" + req.headers.host
                        })        
                    }   
                })
            })
        }
        else{//all tokens are expired
            res.render(__dirname + "/../views/message",{
                error: res.__("Invalid attempt at password reset, if you followed a link it may have expired"),
                success: false,
                title: res.__("Account Recovery"),
                redirect: req.protocol + "://" + req.headers.host
            })        
        }   
    })
})

recovery.post("/", [
  //Validation and sanitation
    body('confirmPassword').not().isEmpty().trim().escape(), 
    body('password').not().isEmpty().trim().escape(),
    body('token').not().isEmpty().trim().escape()
], (req,res)=>{
    const errors = req.validationErrors()
    if(!errors){//no validation errors
        if(req.body.password != req.body.confirmPassword){ //passwords do not match            
            res.render(__dirname + "/../views/new-password",{
                error: res.__("Invalid attempt at password reset, if you followed a link it may have expired"),
                success: false,
                title: res.__("Account Recovery"),
                token: req.body.token
            }) 
        }
        else{//passwords match
            //Check reset token against DB again before submitting new password to DB
            //only tokens not yet expired
            resetToken.model.find( {expires: { $gt: Date.now() } }, (err, tokens) => {
                if ( err ){                                
                    return res.status(500).send(res.__("There was an error in your request. Please try again later."))
                }   
                
                let count = 0
                let foundToken = false
                if(tokens.length){
                //cycle through all tokens in DB
                    tokens.forEach((token)=>{
                        //see if queried hash matches current token
                        bcrypt.compare( req.body.token, token.tokenHash,  (err, result)=> {
                            if ( err ){                                
                                return res.status(500).send(res.__("There was an error in your request. Please try again later."))
                            }   
                            count = count + 1
                            if ( result ) {//tokens match update password
                                foundToken = true
                                const user = require( req.nadminSettings.appRoot+"/"+req.nadminSettings.modelDirectory+"/"+req.nadminSettings.userModel ) 
                                bcrypt.hash(req.body.password, 12, (err, hash) => {   
                                    if ( err ){                                
                                        return res.status(500).send(res.__("There was an error in your request. Please try again later."))
                                    }   
                                    //update users record
                                    user.model.findOneAndUpdate({ _id : token.user_id }, { passwordHash : hash }, (err, doc)=>{
                                        if ( err ){                                
                                            return res.status(500).send(res.__("There was an error in your request. Please try again later."))
                                        }   
                                        //delete reset token
                                        resetToken.model.deleteOne({ _id: token._id }, (err) => {
                                            if ( err ){                                
                                                return res.status(500).send(res.__("There was an error in your request. Please try again later."))
                                            }   
                                            res.render(__dirname + "/../views/message",{
                                                error: false,
                                                success:  res.__("Password has been successfully changed") ,
                                                title: res.__("Account Recovery"),
                                                redirect: req.protocol + "://" + req.headers.host
                                            })       
                                        });
                                    });
                                })
                            }
                            if(!foundToken && count >= tokens.length-1){
                                res.render(__dirname + "/../views/message",{
                                    error: res.__("Invalid attempt at password reset, if you followed a link it may have expired"),
                                    success: false,
                                    title: res.__("Account Recovery"),
                                    redirect: req.protocol + "://" + req.headers.host
                                })        
                            }   
                        })
                    })
                }
                else{//all tokens are expired
                    res.render(__dirname + "/../views/message",{
                        error: res.__("Invalid attempt at password reset, if you followed a link it may have expired"),
                        success: false,
                        title: res.__("Account Recovery"),
                        redirect: req.protocol + "://" + req.headers.host
                    })        
                }   
            })
        }
    }
    else{//validation error(only possible if empty field)
        let error = errors[0]+" : "+errors[0].msg
        res.render(__dirname + "/../views/new-password",{
            error: error,
            success: false,
            title: res.__("Account Recovery"),
            token: req.body.token
        }) 
    }
})

module.exports = recovery