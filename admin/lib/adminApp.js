
const   express   = require("express"),
        helmet    = require("helmet")
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
}


module.exports= adminApp