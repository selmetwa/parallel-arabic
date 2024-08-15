import { atTheRestaurant } from "./at-the-restauraunt"
import { atTheFruitVendor } from "./at-the-fruit-vendor"
import { kosharyShop } from "./koshary-shop"
import { atTheBarbers } from "./at-the-barbers"
import { atTheHotel } from "./at-the-hotel"
import { coffeeShop } from "./cafe"

export const stories = {
  'at-the-restaurant':  {
    isPaywalled: false,
    story: atTheRestaurant
  },
  'at-the-fruit-vendor': {
    isPaywalled: true,
    story: atTheFruitVendor
  },
  'koshary-shop': {
    isPaywalled: true,
    story: kosharyShop
  },
  'at-the-barbers': {
    isPaywalled: true,
    story: atTheBarbers
  },
  'at-the-hotel': {
    isPaywalled: true,
    story: atTheHotel
  },
  'cafe': {
    isPaywalled: true,
    story: coffeeShop
  },
}
