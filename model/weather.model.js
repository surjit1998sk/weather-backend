const { Schema, model } = require("mongoose");

const weatherSchema = new Schema(
  {
    zipCode: { type: Number },
    name: { type: String },
    lat: { type: Number },
    lon: { type: Number },
    country: { type: String },
    state: { type: String },
    temp: { type: Number },
    feels_like: { type: Number },
    description: { type: String },
  },
  {
    timestamps: true,
  }
);

const Weather = model("Weather", weatherSchema);

module.exports = Weather;
