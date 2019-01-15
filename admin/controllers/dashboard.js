
const   express       = require('express')
const   dashboard     = express.Router()

//Internal Error statement
const   serverErrorStatement = "There was an error in your request. Please try again later."


dashboard.get("/",(req,res)=>{
        res.locals.nadminDashModels = []
        if(Array.isArray(dashboard.pageArray) ){
                let pageCount = 0
                dashboard.pageArray.forEach((page) => {
                        page.object.model.find({}, (err, docs)=>{
                                if ( err ){                                
                                    return res.status(500).send(serverErrorStatement)
                                }   
                                if(docs){
                                        res.locals.nadminDashModels.push({
                                                name:page.name,
                                                count:docs.length,
                                                canCreate: page.object.settings.canCreate,
                                                dispOrder: page.object.settings.displayOrder

                                        })
                                }
                                else{
                                        res.locals.nadminDashModels.push({
                                                name:page.name,
                                                count:0,
                                                canCreate: page.object.settings.canCreate,
                                                dispOrder: page.settings.displayOrder
                                        })
                                }
                                pageCount ++
                                if ( pageCount >= dashboard.pageArray.length){
                                        res.locals.nadminDashModels.sort((a,b)=>{
                                            if(a.dispOrder < b.dispOrder){
                                                return -1
                                            }
                                            if(a.dispOrder > b.dispOrder){
                                                return 1
                                            }
                                            return 0
                                        })
                                        res.render("index")     
                                }                                
                        })
                })              
        }
        else{
                return res.status(500).send("ERROR: no page models available")
        }
})

module.exports= dashboard 