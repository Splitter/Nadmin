const   express   = require("express"),
        helmet    = require("helmet")(),
        glob = require( 'glob' ),
        path = require( 'path' ),
        helmetCSP = require("../../lib/utilities").helmetCSP

const   dashboard = require("../controllers/dashboard")
//adminApp is just an express object extended and manipulated
adminApp = express()
//easy access to admin root url and helmet protections
adminApp.use("/", (req, res, next)=>{
        res.locals.nadminAdminURL = req.protocol + "://" + req.headers.host + req.nadminSettings.adminRoute
        helmet(req,res,next)
})
//Content Security policy middleware
adminApp.use(helmetCSP) 
    

/**
 * Initialize adminApp 
 *
 * @param {Object} options
 */
adminApp.init = ( options ) => {
    //get page array if non-existant
    if(!Array.isArray(adminApp.pageArray) || !adminApp.pageArray.length){
        adminApp.setupPages(options)
    }
    //Output well formatted html
    adminApp.locals.pretty = true
    //set admin dashboard title
    adminApp.locals.nadminAdminTitle = options.adminTitle

    //override app.render so we dont have to pass full path to each view in res.render
    //if we attempt to use adminApp.set('views',PATH) the setting is overridden by main app so work around it
    adminApp.nRender = adminApp.render;
    adminApp.render = (name, options, callback)=>{
        adminApp.nRender(__dirname + "/../views/"+name,options,callback)
    }    
    
    //make static nadmin admin assets accessable
    adminApp.use("/public",express.static(__dirname + "/../public"))
}

/**
 * Gets all page models into array and direct routes to page 
 * 
 */
adminApp.setupPages = ( options ) => {
    const page = require("./../../lib/page")
    const modelPath = options.appRoot + "/"+ options.modelDirectory;
    adminApp.pageArray = []
    adminApp.locals.nadminAdminLinks = []
    glob.sync(modelPath+'/*.js').forEach( function( file ) {
        try {
            let nPage =  require( path.resolve( file ) )
            if (nPage instanceof page){
                //collect array of pages for rendering admin index and navigation
                adminApp.pageArray.push({
                    name : nPage.name,
                    object: nPage
                })
                //route /name to 'route' method of page object
                adminApp.use(("/"+nPage.name), (req, res)=>{
                    nPage.route(req,res)
                })
            }
        }
        catch (e) {
            console.log(e)
        }
    });
    adminApp.pageArray.sort((a,b)=>{
        if(a.object.settings.displayOrder < b.object.settings.displayOrder){
            return -1
        }
        if(a.object.settings.displayOrder > b.object.settings.displayOrder){
            return 1
        }
        return 0
    })
    adminApp.pageArray.forEach((nPage)=>{    
        adminApp.locals.nadminAdminLinks.push(nPage.name)
    })
    dashboard.pageArray = adminApp.pageArray
    
}

adminApp.use("/",dashboard)


module.exports= adminApp