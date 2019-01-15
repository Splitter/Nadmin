
const    nadmin = require("nadmin")

const categoryPage = new nadmin.Page('categories',{displayOrder:3});

categoryPage.createModel({    
    name: String
})

module.exports =  categoryPage