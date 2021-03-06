
const   express       = require('express'),
        { body }      = require('express-validator/check'),
        bcrypt        = require('bcrypt'),
        crypto        = require('crypto'),
        nodemailer    = require('nodemailer')

const   resetToken    = require("../models/resetToken")
const   reset= express.Router()


//Get: show reset form
reset.get('/', (req, res)=>{
    res.render(__dirname + "/../views/reset",{title: res.__("Account Recovery")})
})

//Post: generate token and send reset link to users email
reset.post('/',[
    //Validation and sanitation
    body('email').isEmail().normalizeEmail()
], (req, res)=>{
    const errors = req.validationErrors()       
    if(errors){//validation errors
        res.render(__dirname + "/../views/reset",{title: res.__("Account Recovery"),error:errors[0].param +" : "+errors[0].msg})
    }  
    else{//check if user exists for given email 
        const user = require( req.nadminSettings.appRoot+"/"+req.nadminSettings.modelDirectory+"/"+req.nadminSettings.userModel ) 
        user.model.findOne( { email : req.body.email }, (err, userInfo) => { 
            if ( err ){                                
               return res.status(500).send(res.__("There was an error in your request. Please try again later."))
            }     

            if (!userInfo){//user with email does not exist
                res.render(__dirname + "/../views/reset",{title: res.__("Account Recovery"),error:res.__("User with that email does not exist")})
            } 
            else{//user exists with that email
                crypto.randomBytes(20, (err, buf) => {//generate random token
                    if ( err ){                                
                       return res.status(500).send(res.__("There was an error in your request. Please try again later."))
                    }
                    const token = buf.toString('hex');
                    bcrypt.hash(token, 12, (err, hash) => { //hash token to save hash in DB  
                        if ( err ){                                
                           return res.status(500).send(res.__("There was an error in your request. Please try again later."))
                        }       
                        //build document                        
                        const resetTokenModel = new resetToken.model({   
                            user_id:  userInfo._id,
                            tokenHash: hash,
                            expires: Date.now() + 10800000 //expires in 3 hours
                        });
                        //save document
                        resetTokenModel.save((err, doc)=>{ 
                            if ( err ){                                
                               return res.status(500).send(res.__("There was an error in your request. Please try again later."))
                            }   
                            
                            const   transporter = nodemailer.createTransport(req.emailOptions),
                                    mailOptions = {
                                        from: req.emailOptions.from,
                                        to: userInfo.email,
                                        subject: res.__('Account recovery for ')+req.headers.host,
                                        html: '<h4><b>'+res.__('Account Recovery')+'</b></h4>' +
                                        '<p>'+res.__('To reset your password, complete the form at the link below.')+'</p>' +
                                        '<p>'+res.__('(may need to copy and paste link into browser.)')+'</p>'+
                                        '<a href="' + req.protocol + '://' + req.headers.host + '/recovery?reset=' + token + '">' + req.protocol + '://' + req.headers.host + '/recovery/recovery?reset=' + token + '</a>' +
                                        '<br><br>' 
                                    }

                            transporter.sendMail(mailOptions, (err, info) => {
                                if (err) {
                                    res.render(__dirname + "/../views/reset", {
                                        error: res.__("Internal Error sending email, please try again later"),
                                        success: false,
                                        title: res.__("Account Recovery")
                                    })         
                                }
                                else{         
                                    res.render(__dirname + "/../views/reset", {
                                        error: false,
                                        success: res.__("An email with recovery instructions has been sent to the supplied email"),
                                        title: res.__("Account Recovery"),
                                        redirect: req.protocol + "://" + req.headers.host
                                    })         
                                }
                            }) 
                        })
                    })
                });
            }
        })
    }
})

module.exports = reset