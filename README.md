# nadmin
Goal is to become an adminstration interface for Node/Express/Mongoose based websites similar in fashion to Lumber or Keystone


![enter image description here](https://raw.githubusercontent.com/Splitter/nadmin/master/preview.png)


### Current state:
User management/authentication
- supports register, sign in, sign out and password reset
- bcrypt encryption on password/token storage
- crypto module to randomly generate token for reset(with expiration and hashed storage of token)
- express-brute module to rate limit login attempts
- helmet module to secure headers
- csurf module for csrf protection
