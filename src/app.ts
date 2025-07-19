import { Request, Response, NextFunction } from "express";
import e from "express";
import { configDotenv } from "dotenv";
import { client } from "./redis";
import { retrieveWeatherData, validateLatLng, valideWeatherQuery } from "./middleware/weather";


configDotenv();

const app = e();
const port = 3000;

app.use(e.json());
app.use(e.urlencoded({ extended: false }));

//routes
app.get("/weather", validateLatLng, valideWeatherQuery, retrieveWeatherData)

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
