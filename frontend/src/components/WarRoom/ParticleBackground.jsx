import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'

export function ParticleBackground() {
  const containerRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const width = container.clientWidth
    const height = container.clientHeight

    // Scene
    const scene = new THREE.Scene()
    
    // Camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 1, 1000)
    camera.position.z = 150

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)

    // Particles Data
    const particleCount = 150
    const points = []
    const velocities = []
    const particleGeometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)

    const boundary = 160 // Box boundaries

    for (let i = 0; i < particleCount; i++) {
      const x = (Math.random() - 0.5) * boundary * 2
      const y = (Math.random() - 0.5) * boundary * 2
      const z = (Math.random() - 0.5) * boundary * 2

      points.push(new THREE.Vector3(x, y, z))
      velocities.push(new THREE.Vector3(
        (Math.random() - 0.5) * 0.2,
        (Math.random() - 0.5) * 0.2,
        (Math.random() - 0.5) * 0.2
      ))

      positions[i * 3] = x
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = z
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    // Particle Texture (create a circular glow procedurally)
    const createCircleTexture = () => {
      const canvas = document.createElement('canvas')
      canvas.width = 16
      canvas.height = 16
      const ctx = canvas.getContext('2d')
      const gradient = ctx.createRadialGradient(8, 8, 0, 8, 8, 8)
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
      gradient.addColorStop(0.3, 'rgba(124, 58, 237, 0.8)') // violet
      gradient.addColorStop(0.6, 'rgba(6, 182, 212, 0.2)') // cyan
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, 16, 16)
      return new THREE.CanvasTexture(canvas)
    }

    // Material
    const pointsMaterial = new THREE.PointsMaterial({
      size: 4,
      map: createCircleTexture(),
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      opacity: 0.8
    })

    const pointCloud = new THREE.Points(particleGeometry, pointsMaterial)
    scene.add(pointCloud)

    // Lines Geometry for Connections
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x7c3aed,
      transparent: true,
      opacity: 0.08,
      blending: THREE.AdditiveBlending
    })

    const lineGeometry = new THREE.BufferGeometry()
    const lineSegments = new THREE.LineSegments(lineGeometry, lineMaterial)
    scene.add(lineSegments)

    // Animation Loop
    let animationFrameId
    const maxConnectionDistance = 65

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)

      const posAttribute = pointCloud.geometry.attributes.position
      const localPositions = posAttribute.array

      // Move points
      for (let i = 0; i < particleCount; i++) {
        const pt = points[i]
        const vel = velocities[i]

        pt.add(vel)

        // Bounce back from boundaries
        if (Math.abs(pt.x) > boundary) vel.x *= -1
        if (Math.abs(pt.y) > boundary) vel.y *= -1
        if (Math.abs(pt.z) > boundary) vel.z *= -1

        localPositions[i * 3] = pt.x
        localPositions[i * 3 + 1] = pt.y
        localPositions[i * 3 + 2] = pt.z
      }
      
      posAttribute.needsUpdate = true

      // Rebuild lines between close particles
      const linePositions = []
      const lineColors = []
      const colorViolet = new THREE.Color('#7c3aed')
      const colorCyan = new THREE.Color('#06b6d4')

      for (let i = 0; i < particleCount; i++) {
        const pA = points[i]
        for (let j = i + 1; j < particleCount; j++) {
          const pB = points[j]
          const dist = pA.distanceTo(pB)

          if (dist < maxConnectionDistance) {
            linePositions.push(pA.x, pA.y, pA.z)
            linePositions.push(pB.x, pB.y, pB.z)
          }
        }
      }

      lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3))
      
      // Rotate the whole scene slowly
      pointCloud.rotation.y += 0.0005
      pointCloud.rotation.x += 0.0002
      lineSegments.rotation.y += 0.0005
      lineSegments.rotation.x += 0.0002

      renderer.render(scene, camera)
    }

    animate()

    // Handle Resize
    const handleResize = () => {
      if (!containerRef.current) return
      const w = container.clientWidth
      const h = container.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }

    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationFrameId)
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
      scene.clear()
      pointsMaterial.dispose()
      lineMaterial.dispose()
      renderer.dispose()
    }
  }, [])

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none opacity-40 z-0 bg-transparent"
    />
  )
}

export default ParticleBackground
