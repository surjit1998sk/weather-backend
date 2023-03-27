const express = require("express");
const mongoose = require("mongoose");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();
const bodyParser = require("body-parser");
const Weather = require("./model/weather.model");
const app = express();
const PORT = 5000;
const HOST = "localhost";

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

app.get("/weather", async (req, res, next) => {
  try {
    const { location, lat, lon, zipCode, countryCode } = req.query;

    // Check dataBase first
    let cachedWeather;
    if (location) {
      cachedWeather = await Weather.findOne({ name: location });
    } else if (zipCode) {
      cachedWeather = await Weather.findOne({ zipCode: zipCode });
    } else {
      cachedWeather = await Weather.findOne({ $and: [{ lat, lon }] });
    }

    if (!!cachedWeather === true) {
      res.status(200).send({ message: "Data fetched", data: cachedWeather });
    } else {
      let data;

      if (zipCode) {
        const response = await axios.get(
          `http://api.openweathermap.org/geo/1.0/zip?zip=${zipCode},${countryCode}&appid=${process.env.API_KEY}`
        );

        data = {
          name: response?.data?.name,
          lat: response?.data?.lat,
          lon: response?.data?.lon,
          zipCode: response?.data?.zip,
          country: response?.data?.country,
        };
      } else if (location) {
        const response = await axios.get(
          `http://api.openweathermap.org/geo/1.0/direct?q=${location},${countryCode}&appid=${process.env.API_KEY}`
        );

        data = {
          name: response?.data?.[0]?.name,
          lat: response?.data?.[0]?.lat,
          lon: response?.data?.[0]?.lon,
          country: response?.data?.[0]?.country,
          state: response?.data?.[0]?.state,
        };
      } else {
        const response = await axios.get(
          `http://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=5&appid=${process.env.API_KEY}`
        );
        data = {
          name: response?.data?.[0]?.name,
          lat: response?.data?.[0]?.lat,
          lon: response?.data?.[0]?.lon,
          country: response?.data?.[0]?.country,
          state: response?.data?.[0]?.state,
        };
      }

      // fetch weather data
      let latValue;
      let lonValue;
      if (data.lat !== undefined && data.lon !== undefined) {
        latValue = data.lat;
        lonValue = data.lon;
      } else {
        latValue = lat;
        lonValue = lon;
      }
      const weatherData = await axios.get(
        `https://api.openweathermap.org/data/2.5/onecall?lat=${latValue}&lon=${lonValue}&exclude=hourly,daily&appid=${process.env.API_KEY}`
      );

      // Create new weather document and save it in the database

      let weather = {};
      if (data.name !== undefined && weatherData?.data !== undefined) {
        weather = new Weather({
          ...data,
          temp: weatherData?.data?.current?.temp,
          feels_like: weatherData?.data?.current?.feels_like,
          description: weatherData?.data?.current?.weather?.[0]?.description,
        });
        await weather.save();
      }

      res
        .status(200)
        .send({ message: "Data fetched successfully", data: weather });
    }
  } catch (error) {
    console.log("error", error);
    // next(error);
    res.status(500).send({ message: error });
  }
});

mongoose
  .connect("mongodb+srv://surjit:surjit01@cluster0.psb2du4.mongodb.net/test", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Connected!"))
  .then(() => {
    app.listen(PORT, HOST, () => {
      console.log(
        `Server Started on port
        ${PORT}`
      );
    });
  });
