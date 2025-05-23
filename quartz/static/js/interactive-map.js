// Interactive Map Script for Quartz Obsidian
// Add this to your quartz/static/js/ directory or include in your main JS file

class QuartzInteractiveMap {
  constructor(element) {
    this.container = element
    this.image = element.querySelector("img")
    this.scale = 1
    this.maxScale = 4
    this.minScale = 0.5
    this.scaleStep = 0.1

    this.isDragging = false
    this.dragStart = { x: 0, y: 0 }
    this.imagePos = { x: 0, y: 0 }
    this.lastPos = { x: 0, y: 0 }

    this.init()
  }

  init() {
    this.setupStyles()
    this.setupEventListeners()
    this.addControls()
  }

  setupStyles() {
    // Add necessary CSS styles programmatically
    const style = document.createElement("style")
    style.textContent = `
            .interactive-map-container {
                position: relative;
                width: 100%;
                max-width: 1200px;
                margin: 2rem auto;
                border: 2px solid var(--lightgray, #ccc);
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
                background: var(--light, #fff);
            }
            
            .map-viewport {
                position: relative;
                width: 100%;
                height: 600px;
                overflow: hidden;
                cursor: grab;
                background: var(--light, #fff);
            }
            
            .map-viewport:active {
                cursor: grabbing;
            }
            
            .map-viewport img {
                position: absolute;
                top: 50%;
                left: 50%;
                transform-origin: center center;
                transition: transform 0.1s ease-out;
                user-select: none;
                -webkit-user-select: none;
                pointer-events: none;
                max-width: none;
                max-height: none;
            }
            
            .map-controls {
                position: absolute;
                top: 15px;
                right: 15px;
                display: flex;
                flex-direction: column;
                gap: 8px;
                z-index: 10;
            }
            
            .map-control-btn {
                width: 40px;
                height: 40px;
                background: rgba(255, 255, 255, 0.9);
                border: 2px solid var(--lightgray, #ccc);
                border-radius: 8px;
                color: var(--darkgray, #333);
                font-size: 18px;
                font-weight: bold;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
                backdrop-filter: blur(10px);
            }
            
            .map-control-btn:hover {
                background: rgba(255, 255, 255, 1);
                transform: scale(1.05);
            }
            
            .map-info {
                position: absolute;
                bottom: 15px;
                left: 15px;
                background: rgba(255, 255, 255, 0.9);
                padding: 8px 12px;
                border-radius: 8px;
                font-size: 14px;
                backdrop-filter: blur(10px);
                border: 1px solid var(--lightgray, #ccc);
                color: var(--darkgray, #333);
            }
            
            .zoom-indicator {
                position: absolute;
                bottom: 15px;
                right: 15px;
                background: rgba(255, 255, 255, 0.9);
                padding: 6px 10px;
                border-radius: 6px;
                font-size: 12px;
                backdrop-filter: blur(10px);
                border: 1px solid var(--lightgray, #ccc);
                color: var(--darkgray, #333);
                min-width: 60px;
                text-align: center;
            }
            
            .map-title {
                background: linear-gradient(135deg, var(--secondary, #4a90e2), var(--tertiary, #7b68ee));
                color: white;
                padding: 1rem;
                text-align: center;
                font-size: 1.2rem;
                font-weight: 600;
            }
            
            @media (max-width: 768px) {
                .map-viewport {
                    height: 400px;
                }
                .map-control-btn {
                    width: 35px;
                    height: 35px;
                    font-size: 16px;
                }
            }
        `
    document.head.appendChild(style)
  }

  setupEventListeners() {
    // Mouse wheel zoom
    this.container.addEventListener("wheel", (e) => {
      e.preventDefault()
      const rect = this.container.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      if (e.deltaY < 0) {
        this.zoomAt(mouseX, mouseY, this.scaleStep)
      } else {
        this.zoomAt(mouseX, mouseY, -this.scaleStep)
      }
    })

    // Mouse drag
    this.container.addEventListener("mousedown", (e) => this.startDrag(e))
    document.addEventListener("mousemove", (e) => this.drag(e))
    document.addEventListener("mouseup", () => this.endDrag())

    // Touch events
    this.container.addEventListener("touchstart", (e) => {
      if (e.touches.length === 1) {
        this.startDrag(e.touches[0])
      }
    })

    document.addEventListener("touchmove", (e) => {
      if (e.touches.length === 1) {
        e.preventDefault()
        this.drag(e.touches[0])
      }
    })

    document.addEventListener("touchend", () => this.endDrag())

    // Prevent context menu
    this.container.addEventListener("contextmenu", (e) => e.preventDefault())
  }

  addControls() {
    const controlsHTML = `
            <div class="map-controls">
                <button class="map-control-btn zoom-in" title="Zoom In">+</button>
                <button class="map-control-btn zoom-out" title="Zoom Out">−</button>
                <button class="map-control-btn reset-view" title="Reset View">⌂</button>
            </div>
            <div class="map-info">🖱️ Scroll to zoom | Drag to pan</div>
            <div class="zoom-indicator">100%</div>
        `

    this.container.insertAdjacentHTML("beforeend", controlsHTML)

    // Add control event listeners
    this.container.querySelector(".zoom-in").addEventListener("click", () => this.zoomIn())
    this.container.querySelector(".zoom-out").addEventListener("click", () => this.zoomOut())
    this.container.querySelector(".reset-view").addEventListener("click", () => this.resetView())
  }

  startDrag(e) {
    this.isDragging = true
    this.dragStart.x = e.clientX - this.imagePos.x
    this.dragStart.y = e.clientY - this.imagePos.y
    this.container.style.cursor = "grabbing"
  }

  drag(e) {
    if (!this.isDragging) return

    this.imagePos.x = e.clientX - this.dragStart.x
    this.imagePos.y = e.clientY - this.dragStart.y
    this.updateTransform()
  }

  endDrag() {
    this.isDragging = false
    this.container.style.cursor = "grab"
  }

  zoomAt(x, y, delta) {
    const newScale = Math.max(this.minScale, Math.min(this.maxScale, this.scale + delta))

    if (newScale !== this.scale) {
      const scaleFactor = newScale / this.scale

      // Calculate new position to zoom at mouse position
      this.imagePos.x = x - scaleFactor * (x - this.imagePos.x)
      this.imagePos.y = y - scaleFactor * (y - this.imagePos.y)

      this.scale = newScale
      this.updateTransform()
      this.updateZoomIndicator()
    }
  }

  zoomIn() {
    const rect = this.container.getBoundingClientRect()
    this.zoomAt(rect.width / 2, rect.height / 2, this.scaleStep)
  }

  zoomOut() {
    const rect = this.container.getBoundingClientRect()
    this.zoomAt(rect.width / 2, rect.height / 2, -this.scaleStep)
  }

  resetView() {
    this.scale = 1
    this.imagePos = { x: 0, y: 0 }
    this.updateTransform()
    this.updateZoomIndicator()
  }

  updateTransform() {
    const transform = `translate(calc(-50% + ${this.imagePos.x}px), calc(-50% + ${this.imagePos.y}px)) scale(${this.scale})`
    this.image.style.transform = transform
  }

  updateZoomIndicator() {
    const indicator = this.container.querySelector(".zoom-indicator")
    if (indicator) {
      indicator.textContent = `${Math.round(this.scale * 100)}%`
    }
  }
}

// Initialize maps when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  // Auto-initialize any element with .interactive-map class
  document.querySelectorAll(".interactive-map").forEach((mapElement) => {
    // Transform the element into proper structure
    const img = mapElement.querySelector("img")
    if (img) {
      const title = mapElement.dataset.title || img.alt || "Interactive Map"

      // Restructure the HTML
      mapElement.innerHTML = `
                <div class="map-title">${title}</div>
                <div class="map-viewport">
                    ${img.outerHTML}
                </div>
            `

      mapElement.classList.add("interactive-map-container")
      new QuartzInteractiveMap(mapElement)
    }
  })
})

// Export for manual initialization
window.QuartzInteractiveMap = QuartzInteractiveMap
