const Botman = require('./src/botman.class.js')
const auth = require("./auth.json");

const bot = new Botman(auth.token);