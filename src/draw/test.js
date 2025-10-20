import { Application, Assets, Sprite, Graphics } from "pixi.js"
import fontUrl from "@/assets/fonts/OpenSans-Medium.ttf?url"
import bootImageUrl from "@/assets/images/boot.png?url"
import fishImageUrl from "@/assets/images/fish.png?url"
import hookImageUrl from "@/assets/images/hook.png?url"
import manFishingImageUrl from "@/assets/images/manfishing.png?url"
import seaweedImageUrl from "@/assets/images/seaweed.png?url"
import tunaImageUrl from "@/assets/images/tuna.png?url"

const DEFAULT_SCALE = 0.1
const WATERLINE_Y = 210
const WATER_BOB_AMPLITUDE = 8
const WATER_BOB_SPEED = 0.002
const UNDERWATER_ALPHA_VARIANCE = 0.06
const UNDERWATER_PHASE_OFFSET = 0.6

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
  const underwaterSprites = []

  IMAGE_DEFINITIONS.forEach(({ key, position, scale }, index) => {
    const url = imageUrls[key]
    if (!url) return

    const sprite = Sprite.from(url)
    sprite.anchor.set(0.5)
    sprite.scale.set(scale ?? DEFAULT_SCALE)
    sprite.x = position.x
    sprite.y = position.y
    sprite.eventMode = "none"
    sprite.baseY = sprite.y
    if (sprite.y >= WATERLINE_Y) {
      sprite.tint = 0x6fb8ff
      sprite.alpha = 0.88
      sprite.baseAlpha = sprite.alpha
      sprite.wavePhase = index * UNDERWATER_PHASE_OFFSET
      underwaterSprites.push(sprite)
    }
    app.stage.addChild(sprite)
  })

  return { underwaterSprites }
}

const drawWaterOverlay = (app) => {
  const overlay = new Graphics()
  const redraw = () => {
    overlay.clear()
    const waterHeight = Math.max(app.renderer.height - WATERLINE_Y, 0)
    overlay.rect(0, 0, app.renderer.width, waterHeight)
    overlay.fill({ color: 0x0a4f94, alpha: 0.25 })
  }
  redraw()
  overlay.eventMode = "none"
  overlay.zIndex = 50
  overlay.y = WATERLINE_Y
  app.stage.addChild(overlay)
  if (app.renderer?.events?.on) {
    app.renderer.events.on("resize", redraw)
  }
  return overlay
}

const animateWater = (app, overlay, underwaterSprites) => {
  let elapsed = 0

  app.ticker.add((ticker) => {
    elapsed += ticker.deltaMS
    const wave = Math.sin(elapsed * WATER_BOB_SPEED) * WATER_BOB_AMPLITUDE
    overlay.y = WATERLINE_Y + wave

    underwaterSprites.forEach((sprite) => {
      const phase = (sprite.wavePhase ?? 0) + elapsed * WATER_BOB_SPEED
      sprite.y = sprite.baseY + Math.sin(phase) * (WATER_BOB_AMPLITUDE * 0.35)
      if (sprite.baseAlpha !== undefined) {
        const alphaVariance = Math.sin(phase) * UNDERWATER_ALPHA_VARIANCE
        sprite.alpha = Math.min(
          1,
          Math.max(0, sprite.baseAlpha + alphaVariance),
        )
      }
    })
  })
}

export const test = async () => {
  const app = new Application()
  await app.init({ background: "#000000", resizeTo: window })
  document.body.appendChild(app.canvas)
  app.stage.sortableChildren = true

  const { imageUrls } = await loadAssets()

  const { underwaterSprites } = addLoadedImages(app, imageUrls)
  const waterOverlay = drawWaterOverlay(app)
  animateWater(app, waterOverlay, underwaterSprites)
}
