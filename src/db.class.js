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

    }

    static getRules(cb){
        return db.collection('rules_of_acquisition').doc('0').get().then(res => {
            cb && cb(res.data())
        }, err => { cb(err) });
    }

    static getUsers(cb){
        return db.collection('users').get()
        // .then(res => {
        //     const data = res.docs.map(doc => doc.data())
        //     cb && cb(data)
        // }, err => { cb(err) });
    }

    static getUser(id, cb){
        return db.collection('users').doc(id).get()
        // .then(res => {
        //     cb(res.data())
        // }, err => {
        //     err && console.log(err)
        // })
    }

    static setUser(id, payload, cb){
        db.collection('users').doc(id).set(payload, {merge: true}).then(res =>{
            // cb(res.isEqual())
            console.log("res:",res)
        }, err => {
            err && console.log(err)
        })
    }
}