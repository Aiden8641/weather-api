### Weather-Api with Redis

A simple weather api using Express.js and typescript. Retreives weather data for a specific location using google's weather api and caching for a faster data retreival.

---

#### Features

- Weather data fetching: Accurate and reliable weather data based on latitude and longitude from google
- Caching with redis: Leverages Redis's fast in memory system for faster data retreival and reduce api calls

---

#### Setup

Clone the project:

```
git clone https://github.com/Aiden8641/weather-api.git
cd weather-api
```

Install dependencies

```
npm i
```

Setup environment variables

```
# .env
WEATHER_API_KEY=your_google_api_key

REDIS_USERNAME=your_redis_configuration_username
REDIS_PASSWORD=your_redis_configuration_password
```

Compile Typescript

```
npx tsc
```

Run the application

```
npm run dev
```

---

#### Usage

```
GET /weather?lat=...&lng=...&city=...
```

lat (latitude) \n
lng (longitude)

**lat and lng of the location are required values** \n
city name is optional and will be in the format of Continent/City or Continent/City_Name (capitilization matters)
