// const winston = require("winston");
const mongoose = require("mongoose");
const config = require("config");

module.exports = function () {
  const db = config.get("db");
  // console.log(db);
  // db = "mongodb+srv://vidlyuser:vidlyuser@vidly.uxxnn.azure.mongodb.net/vidly?retryWrites=true&w=majority";
  // console.log(db);
  mongoose
    .connect(db, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
    })
    .then(() => console.log(`Connected to ${db}...`));
};
