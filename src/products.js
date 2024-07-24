const express = require("express");
const app = express();
const PORT = 8080;
const cors = require("cors");
const { Sequelize, Model, DataTypes } = require("sequelize");

app.use(cors());
const Product = sequelize.define("product", {
  title: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  description: {
    type: Sequelize.TEXT,
    allowNull: false,
  },
  price: {
    type: Sequelize.DECIMAL(10, 2),
    allowNull: false,
  },
});

module.exports = Product;
