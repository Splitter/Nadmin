
const    nadmin = require("nadmin")

const userPage = new nadmin.Page('users',{displayOrder:4});

userPage.createModel({    
    displayName: String,
    email: String,
    passwordHash: String,
    activated: Boolean,
    usergroup: String, 
    isAdmin: Boolean
})

module.exports = userPage