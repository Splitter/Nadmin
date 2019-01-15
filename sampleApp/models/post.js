
const    nadmin = require("nadmin")

const postPage = new nadmin.Page('posts',{displayOrder:1});

postPage.createModel({    
    author: String,
    authorid: String,
    title: String,
    tags: String,
    post: String,
})

module.exports =  postPage