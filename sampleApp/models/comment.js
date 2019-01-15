
const    nadmin = require("nadmin")

const commentPage = new nadmin.Page('comments',{displayOrder:2});

commentPage.createModel({    
    displayName: String,
    userid: String,
    comment: String
})

module.exports =  commentPage