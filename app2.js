const Client = require('./src/client.class.js')
const auth = require("./auth.json");

new Client(auth.token);