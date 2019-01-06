const mongoose = require('mongoose')
const mSchema = mongoose.Schema

const   utilities  =    require("../utilities")

class page {
    constructor( name , options = {}){
        this.settings = {
            type        : "list",
            cancreate   : true,
            canEdit     : true
        }
        this.settings = utilities.extend(this.settings, options)
        this.name = name
    }
    createModel( schema ){
        this.schema = new mSchema( schema )
        this.model = mongoose.model( this.name, this.schema )
        return this.model
    }
}


module.exports = page