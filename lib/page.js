const mongoose   = require('mongoose'),
      express    = require('express')
const listPage       = require("../admin/controllers/list"),
      staticPage     = require("../admin/controllers/static")
const mSchema    = mongoose.Schema

const   utilities  =    require("./utilities")

class page {
    constructor( name , options = {}){
        this.settings = {
            type         : "list",
            canCreate    : true,
            canEdit      : true,
            displayOrder : 0,
        }
        this.settings = utilities.extend(this.settings, options)
        this.router = express.Router()       
        if(this.settings.type == "list"){
            this.router.use('/', listPage)
        }
        else if(this.settings.type == "static"){
            this.router.use('/', staticPage)
        }
        else{
            throw new Error("Nadmin page can only be of type 'static' or 'list'")
        }
        this.name = name
    }
    createModel( schema ){
        this.schema = new mSchema( schema )
        this.model = mongoose.model( this.name, this.schema )
        return this.model
    }
}


module.exports = page