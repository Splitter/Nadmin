//Set of utility functions
const   helmet  = require('helmet')

const utilities = {

    //Shallow copy of objects properties
    //From https://github.com/Raynos/xtend
    extend : ( target ) => {
        for (var i = 0; i < arguments.length; i++) {
            var source = arguments[i]
    
            for (var key in source) {
                if (Object.prototype.hasOwnProperty.call(source, key)) {
                    target[key] = source[key]
                }
            }
        }
        return target
    },
    
    //middleware function for helmet content security policy -seperated from helmets main middleware
    //used for nadmin specific routes
    helmetCSP : (req, res, next)=>{        
        helmet.contentSecurityPolicy({
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", 'stackpath.bootstrapcdn.com', 'code.jquery.com'],
                styleSrc:  ["'self'", 'stackpath.bootstrapcdn.com', 'use.fontawesome.com'],
                fontSrc:   ["'self'", 'stackpath.bootstrapcdn.com', 'use.fontawesome.com']
            }
        })(req,res,next)
    }


}



module.exports = utilities