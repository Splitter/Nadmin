# nadmin
Goal is to become an adminstration interface for Express/Mongoose based websites similar in fashion to Lumber or Keystone


![enter image description here](https://raw.githubusercontent.com/Splitter/nadmin/master/preview.png)


### Current state:
User management/authentication almost done
- supports register, sign in, sign out and password reset
- uses bcrypt encryption on password/token storage
- crypto randomly generated token for reset(with expiration)
- TODO: add CSRF protection to forms, use Handle module to secure headers and add rate limiting
