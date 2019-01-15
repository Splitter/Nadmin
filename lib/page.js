const mongoose   = require('mongoose')
const mSchema = mongoose.Schema

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
        
        this.name = name
    }
    createModel( schema ){
        this.schema = new mSchema( schema )
        this.model = mongoose.model( this.name, this.schema )
        return this.model
    }
    route(req, res){
        res.send("HERE WE ARE")
    }
}


module.exports = page