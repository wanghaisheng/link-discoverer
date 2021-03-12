const oauth2 = require('simple-oauth2')

const {
  G5_AUTH_CLIENT_ID: id,
  G5_AUTH_CLIENT_SECRET: secret,
  TOKEN_HOST: tokenHost
} = process.env

const credentials = {
  client: { id, secret },
  auth: { tokenHost }
}

const client = new oauth2.ClientCredentials(credentials)

module.exports = {
  getToken () {
    return client.getToken({})
  }
}
