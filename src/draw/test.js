import { Application, Assets, Sprite } from "pixi.js"
import fontUrl from "@/assets/fonts/OpenSans-Medium.ttf?url"
import bootImageUrl from "@/assets/images/boot.png?url"
import fishImageUrl from "@/assets/images/fish.png?url"
import hookImageUrl from "@/assets/images/hook.png?url"
import manFishingImageUrl from "@/assets/images/manfishing.png?url"
import seaweedImageUrl from "@/assets/images/seaweed.png?url"
import tunaImageUrl from "@/assets/images/tuna.png?url"

const DEFAULT_SCALE = 0.1

const IMAGE_DEFINITIONS = [
  { key: "boot", url: bootImageUrl, position: { x: 220, y: 420 }, scale: 0.085 },
  { key: "fish", url: fishImageUrl, position: { x: 360, y: 420 }, scale: 0.075 },
  { key: "hook", url: hookImageUrl, position: { x: 480, y: 420 }, scale: 0.055 },
  {
    key: "manFishing",
    url: manFishingImageUrl,
    position: { x: 660, y: 150 },
    scale: 0.28,
  },
  { key: "seaweed", url: seaweedImageUrl, position: { x: 840, y: 420 }, scale: 0.075 },
  { key: "tuna", url: tunaImageUrl, position: { x: 960, y: 420 }, scale: 0.075 },
]

const IMAGE_URLS = IMAGE_DEFINITIONS.reduce((acc, { key, url }) => {
  acc[key] = url
  return acc
}, {})

const loadAssets = async () => {
  const resources = [
    fontUrl,
    ...Object.values(IMAGE_URLS),
  ]
  await Assets.load(resources)
  return {
    imageUrls: IMAGE_URLS,
  }
}

const addLoadedImages = (app, imageUrls) => {
  IMAGE_DEFINITIONS.forEach(({ key, position, scale }) => {
    const url = imageUrls[key]
    if (!url) return

    const sprite = Sprite.from(url)
    sprite.anchor.set(0.5)
    sprite.scale.set(scale ?? DEFAULT_SCALE)
    sprite.x = position.x
    sprite.y = position.y
    sprite.eventMode = "none"
    app.stage.addChild(sprite)
  })
}

export const test = async () => {
  const app = new Application()
  await app.init({ background: "#000000", resizeTo: window })
  document.body.appendChild(app.canvas)

  const { imageUrls } = await loadAssets()

  addLoadedImages(app, imageUrls)
}
