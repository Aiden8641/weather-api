import { test, expect, vi, Mock } from "vitest";
import { Request, Response } from "express";
import { retrieveWeatherData, valideWeatherQuery } from "./middleware/weather";
import { weatherApiResponse } from "./mocks/data";
import { client } from "./redis";

const url = "http://localhost:3000"
const lat = 40.7128
const lng = -74.0060
const city = "America/New_York"

const req = (lat: any, lng: any, city: any): Partial<Request> => {
  return {
    query: {
      lat: lat.toString(),
      lng: lng.toString(),
      city: city
    }
  }
}

const resGen = (data?: any): Partial<Response> => {
  return {
    json: vi.fn(),
    status: vi.fn(() => ({ json: vi.fn() })),
    locals: {
      cache: {
        data: data ?? false
      }
    }
  }
}

const next = vi.fn()

test("fetch google weather api", async () => {
  const res = resGen()
  await retrieveWeatherData(req(lat, lng, city) as Request, res as Response)

  // console.log((res.json as Mock).mock.calls[0][0])
  expect((res.json as Mock).mock.calls[0][0]).toMatchObject({ key: expect.anything(), data: expect.anything() })
})

test("regex", async () => {
  const res = resGen()

  await valideWeatherQuery(req(lat, lng, city) as Request, res as Response, next)

  const cache = res.locals!.cache.data

  const expectedKeys = Object.keys(weatherApiResponse)
  const actualKeys = Object.keys(JSON.parse(cache))

  expect(next).toHaveBeenCalledOnce()
  expect(cache).toBeDefined()
  expect(actualKeys).toStrictEqual(expectedKeys)
})

test("regex", async () => {
  const badKeys = [
    "america/new_york",       // lowercase start
    "AmericaNewYork",         // no slash
    "america/New_YOrk",       // lowercase first part
    "america/New_york",       // lowercase 'york'
    "America/new_York",       // lowercase after slash
    "AMERICA/new_York",       // all caps first part
    "America/",               // nothing after slash
    "/New_York",              // nothing before slash
  ];

  let statusCodes = []
  for (let i = 0; i < badKeys.length; i++) {
    const badReq = req(lat, lng, badKeys[i])

    const res = resGen() as unknown as Response

    await valideWeatherQuery(badReq as Request, res as Response, next)
    // console.log(res.status.mock.calls[0][0])

    statusCodes.push((res.status as Mock).mock.calls[0][0])
  }

  expect(statusCodes.every((code) => code === 400)).toBe(true)
})

test("missing lat, lng values", async () => {
  const response = await fetch(`${url}/weather`)

  expect(await response.json()).toBe("values for latitude, longitude, and the city is required for this request!")
})

test("fetch weather, no cache", async () => {
  client.del(city)

  const response = await fetch(`${url}/weather?lat=${lat}&lng=${lng}&city=${city}`)
  const data = await response.json()

  expect(data).toBeInstanceOf(Object)
  expect(data.key).toBeTruthy()
})

test("fetch weather, with cache", async () => {

  const response = await fetch(`${url}/weather?lat=${lat}&lng=${lng}&city=${city}`)
  const data = await response.json()

  expect(data).toBeInstanceOf(Object)
  expect(data.key).toBeFalsy()
})
