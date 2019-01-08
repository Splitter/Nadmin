
const app = require("./lib/adminApp");



app.get("/", ( req, res ) =>{
    if(req.session.isLoggedIn()){
        res.send('Hello '+req.session.userInfo.displayName)  
    }
    else{        
        res.render("index")
    }
});


module.exports = app