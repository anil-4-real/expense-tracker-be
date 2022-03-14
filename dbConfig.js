require("dotenv").config();
var mongoDb = require("mongodb");
var mongoClient = mongoDb.MongoClient;
var dbUrl = process.env.DB_URL;

module.exports = { mongoDb, mongoClient, dbUrl };
