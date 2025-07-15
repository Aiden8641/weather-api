import { Request, Response, NextFunction } from "express";
import e from "express";
import { createClient } from "redis";
import { configDotenv } from "dotenv";


configDotenv();

const app = e();
const port = 3000;

app.use(e.json());
app.use(e.urlencoded({ extended: false }));

// redis setup
const client = createClient({
  username: `${process.env.REDIS_USERNAME}`,
  password: `${process.env.REDIS_PASSWORD}`,
  socket: {
    host: 'redis-11260.c8.us-east-1-3.ec2.redns.redis-cloud.com',
    port: 11260,
  }

});

client.on('error', err => console.log('Redis Client Error', err));
client.connect()

//routes
app.get("/weather", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lat, lng, city } = req.query

    if (!lat || !lng) {
      res.json("values for latitude, longitude, and the city is required for this request!")
      return
    }

    // validates whethe key follows the form of Continent/City_Name
    let cacheData
    let regex = /[A-Z].*\/[A-Z].*(?:_[A-Z])?/

    if (city) {
      if (!regex.test(city as string)) {
        res.status(400).json({ error: "Invalid key format. Expected format: Continent/City_Name or Contient/City" });
        return
      }

      cacheData = await client.get(city as string)
    }

    if (!cacheData) {
      const weatherApiUrl = `https://weather.googleapis.com/v1/forecast/days:lookup?key=${process.env.WEATHER_API_KEY}&location.latitude=${lat}&location.longitude=${lng}&days=1`;

      const response = await fetch(weatherApiUrl, {
        method: "GET",
      });

      if (!response.ok) {
        res.json("Weather couldn't be found for the provided location!")
        return
      }

      const data = await response.json();

      // the timezone.id is in the form of Continent/City_Name good enough for key name following the same format
      const key = data.timeZone.id

      await client.set(key as string, JSON.stringify(data))

      const midnight = new Date
      midnight.setDate(midnight.getDate() + 1)
      midnight.setHours(0, 0, 0, 0)

      await client.expireAt(key as string, midnight)

      res.json({ key: key, data: data });

    } else {
      console.log("retreived data through cache!")
      res.json(JSON.parse(cacheData))
    }
  } catch (error) {
    console.log(error)
    res.json("Failed to retreive weather data");
  }
});


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
