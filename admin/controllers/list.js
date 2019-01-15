
const   express    = require('express')
const   listPage   = express.Router()


listPage.get("/",(req, res )=>{
    res.send("LIST PAGE")
})

module.exports = listPage