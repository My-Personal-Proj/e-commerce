const mongodb = require('mongodb');

const Mongoclient = mongodb.MongoClient;

let _db;

const mongoConnnect = (callback) => {
    
    Mongoclient.connect('mongodb+srv://shameel_admin:t0jlhZMTLkeQsnQq@cluster0.5kef0.mongodb.net/shop?retryWrites=true&w=majority',{useNewUrlParser: true, useUnifiedTopology: true})
    .then( client => {
        console.log('connected');
        _db = client.db();
        callback();
    })
    .catch(err =>{
        console.log(err);
        throw err;    
    });
};

const getDb = () => {
    if(_db){
        return _db;
    }
    throw 'No database Found';
}

exports.mongoConnnect = mongoConnnect;
exports.getDb = getDb;