
const   express       = require('express')
const   dashboard     = express.Router()


dashboard.get("/",(req,res)=>{
        res.locals.nadminDashModels = []
        if(Array.isArray(dashboard.pageArray) ){
                //Loop through pages to get data for dashboard index
                let pageCount = 0
                dashboard.pageArray.forEach((page) => {
                        //For each page type see how many records there are
                        page.object.model.find({}, (err, docs)=>{
                                if ( err ){                                
                                    return res.status(500).send(res.__("There was an error in your request. Please try again later."))
                                }   
                                //Add data to locals befor rendering index
                                res.locals.nadminDashModels.push({
                                        name:page.name,
                                        count:(docs ? docs.length : 0),
                                        canCreate: page.object.settings.canCreate,
                                        dispOrder: page.object.settings.displayOrder

                                })
                                
                                pageCount ++
                                //If we are at the last item in loop
                                if ( pageCount >= dashboard.pageArray.length){
                                        //Sort items by their dispOrder option
                                        res.locals.nadminDashModels.sort((a,b)=>{
                                            if(a.dispOrder < b.dispOrder){
                                                return -1
                                            }
                                            if(a.dispOrder > b.dispOrder){
                                                return 1
                                            }
                                            return 0
                                        })
                                        //render index page
                                        res.render("index")     
                                }                                
                        })
                })              
        }
        else{
                return res.status(500).send(res.__("ERROR: no page models available"))
        }
})

module.exports= dashboard 