import { atTheRestaurant } from "./at-the-restauraunt"
import { atTheFruitVendor } from "./at-the-fruit-vendor"
import { kosharyShop } from "./koshary-shop"
import { atTheBarbers } from "./at-the-barbers"
import { atTheHotel } from "./at-the-hotel"
import { omarAndSarah } from "./omar-and-sarah"

export const stories = {
  'at-the-restaurant':  {
    isPaywalled: false,
    story: atTheRestaurant,
    description: 'With audio',
  },
  'at-the-fruit-vendor': {
    isPaywalled: true,
    story: atTheFruitVendor,
    description: 'With audio',
    type: 'sentence-by-sentence-audio',
  },
  'koshary-shop': {
    isPaywalled: true,
    story: kosharyShop,
    description: 'With audio',
    type: 'sentence-by-sentence-audio',
  },
  'at-the-barbers': {
    isPaywalled: true,
    story: atTheBarbers,
    description: 'With audio',
    type: 'sentence-by-sentence-audio',
  },
  'at-the-hotel': {
    isPaywalled: true,
    story: atTheHotel,
    description: 'With audio',
    type: 'sentence-by-sentence-audio'
  },
  'omar-and-sarah': {
    isPaywalled: true,
    story: omarAndSarah,
    description: 'With audio',
    type: 'audio'
  },
}
