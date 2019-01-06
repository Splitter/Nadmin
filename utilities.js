//Set of utility functions

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
    }

}



module.exports = utilities