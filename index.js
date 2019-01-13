
const   mongoose    = require('mongoose')
        
const   page        = require("./lib/page"),
        nadmin      = require("./lib/nadmin")

//Make mongoose use newer native driver api's and get rid of depreciation warnings
mongoose.set('useFindAndModify', false)
mongoose.set('useCreateIndex', true);

//expose models
nadmin.Page = page

module.exports = nadmin;

