const   express   = require("express"),
        helmet    = require("helmet"),
        glob = require( 'glob' ),
        path = require( 'path' ),
        helmetCSP = require("../../lib/utilities").helmetCSP
//adminApp is just an express object extended and manipulated
adminApp = express()

//override app.render so we dont have to pass full path to each view in res.render
//if we attempt to use adminApp.set('views',PATH) setting is overridden by main app so work around it
adminApp.nRender = adminApp.render;
adminApp.render = (name, options, callback)=>{
    adminApp.nRender(__dirname + "/../views/"+name,options,callback)
}

//Content Security policy middleware
adminApp.use(helmetCSP) 

//make static nadmin admin assets accessable
adminApp.use("/public",express.static(__dirname + "/../public"))

/**
 * Utility function to initialize a few things
 *
 * @param {Object} options
 */
adminApp.init = ( options ) => {
    //allow disabling of general helmet middleware, incase custom settings are used in main site
    //This keeps the CSP protection intact seperately for Nadmin routes
    if(options.enableHelmet){
        adminApp.use(helmet())
    }
    if(!Array.isArray(adminApp.pageArray) || !adminApp.pageArray.length){
        adminApp.getPages(options)
    }
}

/**
 * Gets all page models into array
 * 
 */
adminApp.getPages = ( options ) => {
    const page = require("./../../lib/page")
    const modelPath = options.appRoot + "/"+ options.modelDirectory;
    adminApp.pageArray = []
    glob.sync(modelPath+'/*.js').forEach( function( file ) {
        try {
            let nPage =  require( path.resolve( file ) )
            if (nPage instanceof page){
                adminApp.pageArray.push({
                    name : path.basename(file, '.js'),
                    class: nPage
                })
            }
        }
        catch (e) {
            console.log(e)
        }
    });
}

module.exports= adminApp