import { Application, Assets, Sprite } from "pixi.js"
import fontUrl from "@/assets/fonts/OpenSans-Medium.ttf?url"
import boatImageUrl from "@/assets/images/boat.png?url"
import bootImageUrl from "@/assets/images/boot.png?url"
import fishImageUrl from "@/assets/images/fish.png?url"
import hookImageUrl from "@/assets/images/hook.png?url"
import manFishingImageUrl from "@/assets/images/manfishing.png?url"
import seaweedImageUrl from "@/assets/images/seaweed.png?url"
import tunaImageUrl from "@/assets/images/tuna.png?url"

const IMAGE_DEFINITIONS = [
  { key: "boat", url: boatImageUrl, position: { x: 160, y: 420 } },
  { key: "boot", url: bootImageUrl, position: { x: 320, y: 420 } },
  { key: "fish", url: fishImageUrl, position: { x: 480, y: 420 } },
  { key: "hook", url: hookImageUrl, position: { x: 640, y: 420 } },
  { key: "manFishing", url: manFishingImageUrl, position: { x: 800, y: 420 } },
  { key: "seaweed", url: seaweedImageUrl, position: { x: 960, y: 420 } },
  { key: "tuna", url: tunaImageUrl, position: { x: 1120, y: 420 } },
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
  IMAGE_DEFINITIONS.forEach(({ key, position }) => {
    const url = imageUrls[key]
    if (!url) return

    const sprite = Sprite.from(url)
    sprite.anchor.set(0.5)
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
