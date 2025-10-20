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
const CLOUD_DEFINITIONS = [
  { x: 140, y: 80, scale: 0.95, speed: 0.02 },
  { x: 420, y: 60, scale: 1.1, speed: 0.015 },
  { x: 780, y: 90, scale: 1.25, speed: 0.018 },
]

const IMAGE_DEFINITIONS = [
  { key: "boot", url: bootImageUrl, scale: 0.085 },
  { key: "fish", url: fishImageUrl, scale: 0.075 },
  { key: "hook", url: hookImageUrl, scale: 0.055 },
  {
    key: "manFishing",
    url: manFishingImageUrl,
    aboveWater: true,
    anchor: { x: 660, y: 150 },
    scale: 0.28,
  },
  { key: "seaweed", url: seaweedImageUrl, scale: 0.075 },
  { key: "tuna", url: tunaImageUrl, scale: 0.075 },
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

const randomBetween = (min, max) => min + Math.random() * (max - min)

const addLoadedImages = (app, imageUrls) => {
  const underwaterSprites = []
  const placedPositions = []
  const renderer = app.renderer
  const width = renderer.width
  const height = renderer.height
  const horizontalPadding = Math.min(160, width * 0.12)
  const verticalMin = WATERLINE_Y + 70
  const verticalMax = Math.max(verticalMin + 20, height - 140)
  const minDistance = 160

  IMAGE_DEFINITIONS.forEach(({ key, scale, url: assetUrl, aboveWater, anchor }, index) => {
    const resolvedUrl = imageUrls[key] ?? assetUrl
    if (!resolvedUrl) return

    const sprite = Sprite.from(resolvedUrl)
    sprite.anchor.set(0.5)
    sprite.scale.set(scale ?? DEFAULT_SCALE)
    let spriteX
    let spriteY
    if (aboveWater && anchor) {
      spriteX = anchor.x
      spriteY = anchor.y
    } else {
      let attempts = 0
      let found = false
      while (attempts < 24 && !found) {
        spriteX = randomBetween(horizontalPadding, Math.max(horizontalPadding + 1, width - horizontalPadding))
        spriteY = randomBetween(verticalMin, verticalMax)
        if (
          placedPositions.every(({ x, y }) => {
            const dx = x - spriteX
            const dy = y - spriteY
            return Math.sqrt(dx * dx + dy * dy) >= minDistance
          })
        ) {
          found = true
          placedPositions.push({ x: spriteX, y: spriteY })
        }
        attempts += 1
      }
      if (!found) {
        spriteX = randomBetween(horizontalPadding, Math.max(horizontalPadding + 1, width - horizontalPadding))
        spriteY = randomBetween(verticalMin, verticalMax)
        placedPositions.push({ x: spriteX, y: spriteY })
      }
    }

    sprite.x = spriteX
    sprite.y = spriteY
    sprite.eventMode = "none"
    sprite.baseY = sprite.y
    if (!aboveWater && sprite.y >= WATERLINE_Y) {
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

const drawBackground = (app) => {
  const background = new Graphics()
  const redraw = () => {
    background.clear()
    const width = app.renderer.width
    const height = app.renderer.height
    const skyHeight = Math.max(WATERLINE_Y, 0)
    const seaHeight = Math.max(height - WATERLINE_Y, 0)

    if (skyHeight > 0) {
      background.rect(0, 0, width, skyHeight)
      background.fill({ color: 0x86c5ff, alpha: 1 })
      background.rect(0, 0, width, skyHeight)
      background.fill({ color: 0xffffff, alpha: 0.05 })
    }

    if (seaHeight > 0) {
      background.rect(0, WATERLINE_Y, width, seaHeight)
      background.fill({ color: 0x022b51, alpha: 1 })
    }
  }
  redraw()
  background.eventMode = "none"
  background.zIndex = -10
  app.stage.addChild(background)
  if (app.renderer?.events?.on) {
    app.renderer.events.on("resize", redraw)
  }
  return background
}

const drawClouds = (app) => {
  const clouds = CLOUD_DEFINITIONS.map(({ x, y, scale, speed }) => {
    const cloud = new Graphics()
    cloud.circle(-40, -6, 28)
    cloud.circle(-12, -20, 34)
    cloud.circle(26, -8, 26)
    cloud.circle(0, 12, 24)
    cloud.fill({ color: 0xffffff, alpha: 0.9 })
    cloud.scale.set(scale)
    cloud.x = x
    cloud.y = y
    cloud.speed = speed
    cloud.alpha = 0.92
    cloud.eventMode = "none"
    cloud.zIndex = -5
    app.stage.addChild(cloud)
    return cloud
  })

  const updateWrapBounds = () => {
    const width = app.renderer.width
    clouds.forEach((cloud) => {
      cloud.wrapX = width + 200
    })
  }

  updateWrapBounds()

  if (app.renderer?.events?.on) {
    app.renderer.events.on("resize", updateWrapBounds)
  }

  return clouds
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

const animateClouds = (app, clouds) => {
  app.ticker.add((ticker) => {
    const delta = ticker.deltaMS
    clouds.forEach((cloud) => {
      cloud.x += (cloud.speed ?? 0.02) * delta
      const wrapX = cloud.wrapX ?? app.renderer.width + 200
      if (cloud.x - 150 > wrapX) {
        cloud.x = -150
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

  drawBackground(app)
  const clouds = drawClouds(app)
  const { underwaterSprites } = addLoadedImages(app, imageUrls)
  const waterOverlay = drawWaterOverlay(app)
  animateWater(app, waterOverlay, underwaterSprites)
  animateClouds(app, clouds)
}
