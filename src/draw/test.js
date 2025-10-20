import {
  Application,
  Assets,
  Sprite,
  Graphics,
  MeshRope,
  Texture,
  Point,
} from "pixi.js"
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
  { key: "fish", url: fishImageUrl, scale: 0.075, swim: true },
  { key: "hook", url: hookImageUrl, scale: 0.055, followsLine: true },
  {
    key: "manFishing",
    url: manFishingImageUrl,
    aboveWater: true,
    anchor: { x: 660, y: 150 },
    scale: 0.28,
  },
  { key: "seaweed", url: seaweedImageUrl, scale: 0.075 },
  { key: "tuna", url: tunaImageUrl, scale: 0.075, swim: true },
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
  let boatSprite = null
  let hookSprite = null
  const swimmingSprites = []
  const placedPositions = []
  const renderer = app.renderer
  const width = renderer.width
  const height = renderer.height
  const horizontalPadding = Math.min(160, width * 0.12)
  const verticalMin = WATERLINE_Y + 70
  const verticalMax = Math.max(verticalMin + 20, height - 140)
  const minDistance = 160

  IMAGE_DEFINITIONS.forEach(
    ({ key, scale, url: assetUrl, aboveWater, anchor, followsLine, swim }, index) => {
    const resolvedUrl = imageUrls[key] ?? assetUrl
    if (!resolvedUrl) return

    const sprite = Sprite.from(resolvedUrl)
    if (followsLine) {
      sprite.anchor.set(0.5, 0)
    } else {
      sprite.anchor.set(0.5)
    }
    sprite.scale.set(scale ?? DEFAULT_SCALE)
    let spriteX
    let spriteY
    if (aboveWater && anchor) {
      spriteX = anchor.x
      spriteY = anchor.y
      boatSprite = sprite
      sprite.zIndex = 40
    } else if (followsLine) {
      hookSprite = sprite
      spriteX = 0
      spriteY = 0
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
    if (!aboveWater && !followsLine && sprite.y >= WATERLINE_Y) {
      sprite.tint = 0x6fb8ff
      sprite.alpha = 0.88
      sprite.baseAlpha = sprite.alpha
      sprite.wavePhase = index * UNDERWATER_PHASE_OFFSET
      underwaterSprites.push(sprite)
      if (swim) {
        const direction = Math.random() < 0.5 ? -1 : 1
        const baseScaleX = Math.abs(sprite.scale.x)
        sprite.scale.x = baseScaleX * direction
        swimmingSprites.push({
          sprite,
          direction,
          speed: randomBetween(45, 90),
          amplitude: randomBetween(8, 18),
          verticalSpeed: randomBetween(1.2, 2.2),
          time: randomBetween(0, Math.PI * 2),
          baseScaleX,
          horizontalMargin: 80,
        })
      }
    }
    if (!aboveWater && !followsLine) {
      app.stage.addChild(sprite)
    }
  },
  )

  return { underwaterSprites, boatSprite, hookSprite, swimmingSprites }
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

const createFishingLine = (app, boatSprite, hookSprite) => {
  if (!boatSprite) return null

  const hook =
    hookSprite ??
    (() => {
      const sprite = Sprite.from(hookImageUrl)
      sprite.scale.set(0.055)
      sprite.anchor.set(0.5, 0)
      return sprite
    })()
  hook.anchor.set(0.5, 0)
  hook.eventMode = "none"

  const basePoints = [
    { x: 0, y: 0 },
    { x: -2, y: 48 },
    { x: -3, y: 108 },
    { x: -3, y: 168 },
    { x: -2, y: 228 },
    { x: -1, y: 288 },
    { x: 0, y: 336 },
  ]
  const ropePoints = basePoints.map(({ x, y }) => new Point(x, y))

  const rope = new MeshRope({
    texture: Texture.WHITE,
    points: ropePoints,
  })
  rope.tint = 0xf7f7f7
  rope.alpha = 0.8
  rope.zIndex = (boatSprite.zIndex ?? 0) - 1
  rope.eventMode = "none"

  const updateHookTint = () => {
    const bottomPoint = ropePoints[ropePoints.length - 1]
    hook.x = rope.position.x + bottomPoint.x
    hook.y = rope.position.y + bottomPoint.y
    if (hook.y >= WATERLINE_Y) {
      hook.tint = 0x6fb8ff
      hook.alpha = 0.9
    } else {
      hook.tint = 0xffffff
      hook.alpha = 1
    }
  }

  const updatePosition = () => {
    const offsetX = boatSprite.width * 0.305
    const offsetY = boatSprite.height * 0.02
    rope.position.set(boatSprite.x - offsetX, boatSprite.y + offsetY)
    updateHookTint()
  }

  updatePosition()
  app.stage.addChild(rope)
  hook.zIndex = rope.zIndex + 1
  app.stage.addChild(hook)

  if (app.renderer?.events?.on) {
    app.renderer.events.on("resize", updatePosition)
  }

  return { rope, hook, basePoints, ropePoints, updateHookTint, updatePosition }
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

const animateSwimmingFish = (app, swimmers) => {
  if (!swimmers.length) return

  const stageMargin = 80

  app.ticker.add((ticker) => {
    const deltaSeconds = ticker.deltaMS / 1000
    const width = app.renderer.width
    const height = app.renderer.height
    const lowerBand = WATERLINE_Y + 70
    const upperBand = Math.max(lowerBand + 30, height - 140)
    swimmers.forEach((swimmer) => {
      swimmer.time += deltaSeconds
      const { sprite, speed, direction, amplitude, verticalSpeed, baseScaleX } =
        swimmer
      sprite.x += speed * direction * deltaSeconds
      sprite.y = sprite.baseY + Math.sin(swimmer.time * verticalSpeed) * amplitude
      if (direction > 0 && sprite.x > width + stageMargin) {
        sprite.x = -stageMargin
        sprite.baseY = randomBetween(lowerBand, upperBand)
        sprite.y = sprite.baseY
        swimmer.time = randomBetween(0, Math.PI * 2)
      } else if (direction < 0 && sprite.x < -stageMargin) {
        sprite.x = width + stageMargin
        sprite.baseY = randomBetween(lowerBand, upperBand)
        sprite.y = sprite.baseY
        swimmer.time = randomBetween(0, Math.PI * 2)
      }
      const desiredScaleX = baseScaleX * (direction > 0 ? -1 : 1)
      if (sprite.scale.x !== desiredScaleX) {
        sprite.scale.x = desiredScaleX
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
  const { underwaterSprites, boatSprite, hookSprite, swimmingSprites } = addLoadedImages(
    app,
    imageUrls,
  )
  const fishingLine = createFishingLine(app, boatSprite, hookSprite)
  setupFishingLineControls(app, fishingLine)
  animateSwimmingFish(app, swimmingSprites)
  if (boatSprite) {
    app.stage.addChild(boatSprite)
  }
  const waterOverlay = drawWaterOverlay(app)
  animateWater(app, waterOverlay, underwaterSprites)
  animateClouds(app, clouds)
}
const setupFishingLineControls = (app, fishingLineData) => {
  if (!fishingLineData) return

  const { rope, hook, basePoints, ropePoints, updateHookTint, updatePosition } =
    fishingLineData
  if (!rope || !hook) return

  let reelFactor = 1
  const minFactor = 0.35
  const reelSpeed = 0.006
  const releaseSpeed = 0.004
  let reeling = false

  const applyRopeScale = () => {
    for (let i = 1; i < ropePoints.length; i += 1) {
      ropePoints[i].y = basePoints[i].y * reelFactor
    }
    updateHookTint()
  }

  const onKeyDown = (event) => {
    if (event.code === "Space") {
      reeling = true
      event.preventDefault()
    }
  }

  const onKeyUp = (event) => {
    if (event.code === "Space") {
      reeling = false
      event.preventDefault()
    }
  }

  window.addEventListener("keydown", onKeyDown)
  window.addEventListener("keyup", onKeyUp)

  app.ticker.add((ticker) => {
    const deltaRatio = ticker.deltaMS / 16.67
    const target = reeling ? minFactor : 1
    const speed = reeling ? reelSpeed : releaseSpeed
    reelFactor += (target - reelFactor) * speed * deltaRatio
    reelFactor = Math.min(1, Math.max(minFactor, reelFactor))
    applyRopeScale()
    updatePosition()
  })
}
