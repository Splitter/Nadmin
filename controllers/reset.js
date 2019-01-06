
const   express       = require('express'),
        { body }      = require('express-validator/check'),
        bcrypt        = require('bcrypt'),
        crypto        = require('crypto'),
        nodemailer    = require('nodemailer')

const   resetToken    = require("../models/resetToken")
const   reset= express.Router()

//Internal Error statement
const   serverErrorStatement = "There was an error in your request. Please try again later."

//Get: show reset form
reset.get('/', (req, res)=>{
    res.render(__dirname + "/../views/reset",{title:"Account recovery"})
})

//Post: generate token and send reset link to users email
reset.post('/',[
    //Validation and sanitation
    body('email').isEmail().normalizeEmail()
], (req, res)=>{
    const errors = req.validationErrors()       
    if(errors){//validation errors
        res.render(__dirname + "/../views/reset",{title:"Account recovery",error:errors[0].param +" : "+errors[0].msg})
    }  
    else{//check if user exists for given email 
        const user = require( req.modelDirectory+"/"+req.userModel )    
        user.model.findOne( { email : req.body.email }, (err, userInfo) => { 
            if ( err ){                                
               return res.status(500).send(serverErrorStatement)
            }     

            if (!userInfo){//user with email does not exist
                res.render(__dirname + "/../views/reset",{title:"Account recovery",error:"User with that email does not exist"})
            } 
            else{//user exists with that email
                crypto.randomBytes(20, (err, buf) => {//generate random token
                    if ( err ){                                
                       return res.status(500).send(serverErrorStatement)
                    }
                    const token = buf.toString('hex');
                    bcrypt.hash(token, 12, (err, hash) => { //hash token to save hash in DB  
                        if ( err ){                                
                           return res.status(500).send(serverErrorStatement)
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
                               return res.status(500).send(serverErrorStatement)
                            }   
                            
                            const   transporter = nodemailer.createTransport(req.emailOptions),
                                    mailOptions = {
                                        from: req.emailOptions.from,
                                        to: userInfo.email,
                                        subject: 'Account recovery for '+req.headers.host,
                                        html: '<h4><b>Account Recovery</b></h4>' +
                                        '<p>To reset your password, complete the form at the link below.</p>' +
                                        '<p>(may need to copy and paste link into browser.)</p>'+
                                        '<a href="' + req.protocol + '://' + req.headers.host + '/recovery?reset=' + token + '">' + req.protocol + '://' + req.headers.host + '/recovery/recovery?reset=' + token + '</a>' +
                                        '<br><br>' 
                                    }

                            transporter.sendMail(mailOptions, (err, info) => {
                                if (err) {
                                    res.render(__dirname + "/../views/reset", {
                                        error: "Internal Error sending email, please try again later",
                                        success: false,
                                        title:"Account recovery"
                                    })         
                                }
                                else{         
                                    res.render(__dirname + "/../views/reset", {
                                        error: false,
                                        success: "An email with recovery instructions has been sent to the supplied email",
                                        title:"Account recovery",
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