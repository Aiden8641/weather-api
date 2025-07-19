import { Request, Response, NextFunction } from "express"
import { client } from "../redis"

// const weatherApiUrl = `https://weather.googleapis.com/v1/forecast/days:lookup?key=${process.env.WEATHER_API_KEY}&location.latitude=${lat}&location.longitude=${lng}&days=1`;
export const weatherApiUrl = "https://weather.googleapis.com/v1/forecast/days:lookup"
const weatherQuery = (lat: any, lng: any) => { return `?key=${process.env.WEATHER_API_KEY}&location.latitude=${lat}&location.longitude=${lng}&days=1` }

export const validateLatLng = (req: Request, res: Response, next: NextFunction) => {
  const { lat, lng } = req.query

  if (!lat || !lng) {
    res.json("values for latitude, longitude, and the city is required for this request!")
    return
  }

  return next()
}
export const valideWeatherQuery = async (req: Request, res: Response, next: NextFunction) => {
  const { city } = req.query
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

  res.locals.cache.data = cacheData

  return next()
}

export const retrieveWeatherData = async (req: Request, res: Response) => {
  try {
    const { lat, lng } = req.query
    const cacheData = res.locals.cache.data

    if (!cacheData) {
      const response = await fetch(weatherApiUrl + weatherQuery(lat, lng), {
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
};
