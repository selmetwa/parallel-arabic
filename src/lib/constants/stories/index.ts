import { atTheRestaurant } from "./at-the-restauraunt"
import { atTheFruitVendor } from "./at-the-fruit-vendor"
import { kosharyShop } from "./koshary-shop"
import { atTheBarbers } from "./at-the-barbers"
import { atTheHotel } from "./at-the-hotel"
import { coffeeShop } from "./cafe"
import { omarAndSarah } from "./omar-and-sarah"
export const stories = {
  'at-the-restaurant':  {
    isPaywalled: false,
    story: atTheRestaurant,
    description: 'Sentence by sentence audio',
    // type: 'sentence-by-sentence-audio'
  },
  'at-the-fruit-vendor': {
    isPaywalled: true,
    story: atTheFruitVendor,
    description: 'Sentence by sentence audio',
    type: 'sentence-by-sentence-audio'
  },
  'koshary-shop': {
    isPaywalled: true,
    story: kosharyShop,
    description: 'Sentence by sentence audio',
    type: 'sentence-by-sentence-audio'
  },
  'at-the-barbers': {
    isPaywalled: true,
    story: atTheBarbers,
    description: 'Sentence by sentence audio',
    type: 'sentence-by-sentence-audio'
  },
  'at-the-hotel': {
    isPaywalled: true,
    story: atTheHotel,
    description: 'Sentence by sentence audio',
    type: 'sentence-by-sentence-audio'
  },
  'omar-and-sarah': {
    isPaywalled: true,
    story: omarAndSarah,
    description: 'Audio for the whole story',
    type: 'audio'
  },
  'cafe': {
    isPaywalled: true,
    story: coffeeShop,
    description: 'AI generated, no audio'
  },
}
