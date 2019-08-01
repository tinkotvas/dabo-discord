var serviceAccount = require("./firebaseAccountKey.json");
var admin = require("firebase-admin");
admin.initializeApp( {
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://botman-5da0d.firebaseio.com"
})
var db = admin.firestore();
const fs = require("fs");

function msg(m){
    console.log(m)
}

module.exports = class DB {
    constructor() {
        // this.getUser('201004098600828928',msg)
        this.getUsers(msg);
        // this.setUser('201004098600828928', {latinum: 666999666}, msg)
        
    }

    getUsers(cb){
        db.collection('users').get().then(res => {
            const data = res.docs.map(doc => doc.data())
            cb(data)
        }, err => { cb(err) });
    }

    getUser(id, cb){
        db.collection('users').doc(id).get().then(res => {
            cb(res.data())
        })
    }

    setUser(id, payload, cb){
        db.collection('users').doc(id).set(payload, {merge: true}).then(res =>{
            // cb(res.isEqual())
        })
    }
}