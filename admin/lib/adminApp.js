
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

/**
 * Utility function to get nadmin options from nadmin root into adminApp
 *
 * @param {Object} options
 */
adminApp.setOptions = ( options ) => {
    adminApp.nadminSettings = options 
    //allow disabling of general helmet middleware, incase custom settings are used in main site
    //This keeps the CSP protection intact seperately for Nadmin routes
    if(adminApp.nadminSettings.enableHelmet){
        adminApp.use(helmet())
    }
    if(!Array.isArray(adminApp.pageArray) || !adminApp.pageArray.length){
        adminApp.getPages()
    }
}

/**
 * Gets all users page models into array
 * 
 */
adminApp.getPages = () => {
    const page = require("./../../lib/page")
    const modelPath = adminApp.nadminSettings.appRoot + "/"+ adminApp.nadminSettings.modelDirectory;
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