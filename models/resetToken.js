
const    Page = require("../controllers/page")

const resetToken = new Page('resettokens');

resetToken.createModel({  
    user_id: String,
    tokenHash: String,
    expires: String
})

module.exports = resetToken