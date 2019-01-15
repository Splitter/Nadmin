
const   express    = require('express')
const   staticPage = express.Router()


staticPage.get("/",(req, res )=>{
    res.send("STATIC PAGE")
})

module.exports = staticPage