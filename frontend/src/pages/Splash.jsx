import React, { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useVibeStore } from '../store/vibeStore'
import * as THREE from 'three'

export function Splash() {
  const { setActivePage, isInitialized, loadProfile } = useVibeStore()
  const vibeHubRef = useRef(null)
  const shaderCanvasRef = useRef(null)

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  useEffect(() => {
    if (isInitialized) {
      setActivePage('warroom')
    }
  }, [isInitialized, setActivePage])

  // Setup Shader Background Canvas
  useEffect(() => {
    const canvas = shaderCanvasRef.current
    if (!canvas) return
    const gl = canvas.getContext('webgl')
    if (!gl) return

    let width = window.innerWidth
    let height = window.innerHeight
    canvas.width = width
    canvas.height = height
    gl.viewport(0, 0, width, height)

    const handleResize = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width
      canvas.height = height
      gl.viewport(0, 0, width, height)
    }
    window.addEventListener('resize', handleResize)

    const vsSource = `
        attribute vec4 aVertexPosition;
        varying vec2 v_texCoord;
        void main() {
            gl_Position = aVertexPosition;
            v_texCoord = aVertexPosition.xy * 0.5 + 0.5;
        }
    `

    const fsSource = `
        precision highp float;
        varying vec2 v_texCoord;
        uniform float u_time;

        vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
        float snoise(vec2 v){
          const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                   -0.577350269189626, 0.024390243902439);
          vec2 i  = floor(v + dot(v, C.yy) );
          vec2 x0 = v -   i + dot(i, C.xx);
          vec2 i1;
          i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
          vec4 x12 = x0.xyxy + C.xxzz;
          x12.xy -= i1;
          i = mod(i, 289.0);
          vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
          + i.x + vec3(0.0, i1.x, 1.0 ));
          vec3 m = max(0.5 - vec4(dot(x0,x0), dot(x12.xy,x12.xy),
            dot(x12.zw,x12.zw), 0.0), 0.0);
          m = m*m ;
          m = m*m ;
          vec3 x = 2.0 * fract(p * C.www) - 1.0;
          vec3 h = abs(x) - 0.5;
          vec3 ox = floor(x + 0.5);
          vec3 a0 = x - ox;
          m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
          vec3 g;
          g.x  = a0.x  * x0.x  + h.x  * x0.y;
          g.yz = a0.yz * x12.xz + h.yz * x12.yw;
          return 130.0 * dot(m, g);
        }

        void main() {
            vec2 uv = v_texCoord;
            float n = snoise(uv * 3.0 + u_time * 0.2);
            
            vec3 c1 = vec3(0.486, 0.227, 0.929);
            vec3 c2 = vec3(0.929, 0.227, 0.541);
            vec3 c3 = vec3(1.0, 0.843, 0.0);
            vec3 c4 = vec3(0.988, 0.976, 0.972);
            
            vec3 color = mix(c1, c2, n * 0.5 + 0.5);
            color = mix(color, c3, snoise(uv * 5.0 - u_time * 0.1) * 0.3);
            color = mix(color, c4, 1.0 - smoothstep(0.0, 0.8, uv.y));
            
            gl_FragColor = vec4(color, 0.15);
        }
    `

    function createShader(gl, type, source) {
        const shader = gl.createShader(type)
        gl.shaderSource(shader, source)
        gl.compileShader(shader)
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          console.error('Shader compile error:', gl.getShaderInfoLog(shader))
          gl.deleteShader(shader)
          return null
        }
        return shader
    }

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource)
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource)
    if (!vertexShader || !fragmentShader) return

    const shaderProgram = gl.createProgram()
    gl.attachShader(shaderProgram, vertexShader)
    gl.attachShader(shaderProgram, fragmentShader)
    gl.linkProgram(shaderProgram)
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(shaderProgram))
      return
    }
    gl.useProgram(shaderProgram)

    const positions = new Float32Array([-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0])
    const positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)

    const vertexPosition = gl.getAttribLocation(shaderProgram, 'aVertexPosition')
    gl.enableVertexAttribArray(vertexPosition)
    gl.vertexAttribPointer(vertexPosition, 2, gl.FLOAT, false, 0, 0)

    const timeLocation = gl.getUniformLocation(shaderProgram, 'u_time')
    
    let startTime = Date.now()
    let animationFrameId

    const renderShader = () => {
        animationFrameId = requestAnimationFrame(renderShader)
        gl.uniform1f(timeLocation, (Date.now() - startTime) / 1000.0)
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    }
    renderShader()

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', handleResize)
      gl.deleteShader(vertexShader)
      gl.deleteShader(fragmentShader)
      gl.deleteBuffer(positionBuffer)
      gl.deleteProgram(shaderProgram)
    }
  }, [])

  // Setup Three.js 3D Vibe Hub Cylinder & Torus Ring
  useEffect(() => {
    const container = vibeHubRef.current
    if (!container) return

    const scene = new THREE.Scene()
    const width = container.clientWidth || 300
    const height = container.clientHeight || 300
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setSize(width, height)
    container.appendChild(renderer.domElement)

    const geometry = new THREE.CylinderGeometry(2, 2, 0.5, 32)
    const material = new THREE.MeshPhongMaterial({ 
        color: 0x7c3aed, 
        shininess: 100,
        emissive: 0x2e1065
    })
    const hub = new THREE.Mesh(geometry, material)
    hub.rotation.x = Math.PI / 2
    scene.add(hub)

    const torusGeo = new THREE.TorusGeometry(3, 0.1, 16, 100)
    const torusMat = new THREE.MeshBasicMaterial({ color: 0xec4899 })
    const ring = new THREE.Mesh(torusGeo, torusMat)
    scene.add(ring)

    const light = new THREE.PointLight(0xffffff, 1, 100)
    light.position.set(5, 5, 5)
    scene.add(light)
    scene.add(new THREE.AmbientLight(0x404040))

    camera.position.z = 8

    let animationFrameId
    const animate = () => {
        animationFrameId = requestAnimationFrame(animate)
        hub.rotation.y += 0.01
        ring.rotation.x += 0.005
        ring.rotation.y += 0.01
        renderer.render(scene, camera)
    }
    animate()

    const handleResize = () => {
        const w = container.clientWidth
        const h = container.clientHeight
        renderer.setSize(w, h)
        camera.aspect = w / h
        camera.updateProjectionMatrix()
    }
    window.addEventListener('resize', handleResize)

    return () => {
        cancelAnimationFrame(animationFrameId)
        window.removeEventListener('resize', handleResize)
        geometry.dispose()
        material.dispose()
        torusGeo.dispose()
        torusMat.dispose()
        renderer.dispose()
        if (container.contains(renderer.domElement)) {
            container.removeChild(renderer.domElement)
        }
    }
  }, [])

  const handleStart = () => {
    if (isInitialized) {
      setActivePage('warroom')
    } else {
      setActivePage('onboarding')
    }
  }

  const handleLearnMore = () => {
    window.scrollTo({
      top: window.innerHeight * 0.8,
      behavior: 'smooth'
    })
  }

  return (
    <div className="bg-[#faf7f2] text-[#1c1b1b] min-h-screen w-full overflow-x-hidden relative font-sans flex flex-col items-center select-none pb-24">
      {/* CSS Styles injection */}
      <style dangerouslySetInnerHTML={{__html: `
        .dark-curve {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 60%;
            background-color: #1c1b1b;
            clip-path: ellipse(120% 80% at 50% 0%);
            z-index: 0;
        }
        .rainbow-path {
            fill: none;
            stroke-linecap: round;
        }
        @keyframes draw-pipe {
            to { stroke-dashoffset: 0; }
        }
        .drawn-pipe {
            stroke-dasharray: 1000;
            stroke-dashoffset: 1000;
            animation: draw-pipe 3s forwards ease-in-out;
        }
        @keyframes rumble {
            0%, 100% { transform: translate(0, 0); }
            10%, 30%, 50%, 70%, 90% { transform: translate(-2px, -2px) rotate(-0.5deg); }
            20%, 40%, 60%, 80% { transform: translate(2px, 2px) rotate(0.5deg); }
        }
        @keyframes steady-pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.01); }
        }
        .rumble-pulse {
            animation: rumble 0.8s ease-out, steady-pulse 3s ease-in-out 0.8s infinite;
        }
        @keyframes shake-hover {
            0%, 100% { transform: rotate(0); }
            25% { transform: rotate(-3deg) translateY(-2px); }
            75% { transform: rotate(3deg) translateY(-2px); }
        }
        .btn-shake-hover:hover {
            animation: shake-hover 0.3s ease-in-out infinite;
            box-shadow: 16px 16px 0px 0px #1c1b1b !important;
        }
        @keyframes liquid-flow {
            from { stroke-dashoffset: 40; }
            to { stroke-dashoffset: 0; }
        }
        .liquid-pipe {
            stroke-dasharray: 10 10;
            animation: liquid-flow 1s linear infinite;
            stroke: #7c3aed;
        }
        @keyframes float-up {
            0% { transform: translateY(100vh) scale(0); opacity: 0; }
            20% { opacity: 1; transform: translateY(80vh) scale(1); }
            80% { opacity: 1; }
            100% { transform: translateY(-20vh) scale(1.5) rotate(180deg); opacity: 0; }
        }
        .particle {
            position: absolute;
            animation: float-up 10s linear infinite;
            color: #fde047;
            font-size: 24px;
            z-index: 15;
            pointer-events: none;
        }
        .p1 { left: 10%; animation-duration: 8s; animation-delay: 0s; }
        .p2 { left: 30%; animation-duration: 12s; animation-delay: 2s; color: #fd56a7; }
        .p3 { left: 60%; animation-duration: 9s; animation-delay: 4s; }
        .p4 { left: 80%; animation-duration: 15s; animation-delay: 1s; color: #ffb690; }
        .p5 { left: 90%; animation-duration: 11s; animation-delay: 3s; font-size: 16px; }
      `}} />

      {/* Shader Canvas Background */}
      <canvas ref={shaderCanvasRef} className="absolute inset-0 w-full h-full z-[5] pointer-events-none opacity-60 mix-blend-screen" />

      {/* Particles */}
      <div className="particle p1">✨</div>
      <div className="particle p2">⭐</div>
      <div className="particle p3">✨</div>
      <div className="particle p4">✧</div>
      <div className="particle p5">⭐</div>

      {/* Dark Top Section Background Curve */}
      <div className="dark-curve" />

      {/* Sweeping Rainbow Ribbons (Behind elements, over dark background) */}
      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
        <svg className="absolute w-[150vw] h-[150vh] top-[-20vh] left-[-25vw] opacity-100" preserveAspectRatio="xMidYMid slice" viewBox="0 0 1000 1000">
          {/* First Rainbow Sweep */}
          <path className="rainbow-path stroke-[#b4136d]" d="M -100,500 C 300,500 400,200 1100,600" strokeWidth="30" />
          <path className="rainbow-path stroke-[#7c3aed]" d="M -100,530 C 300,530 400,230 1100,630" strokeWidth="30" />
          <path className="rainbow-path stroke-[#fd56a7]" d="M -100,560 C 300,560 400,260 1100,660" strokeWidth="30" />
          <path className="rainbow-path stroke-[#ffb690]" d="M -100,590 C 300,590 400,290 1100,690" strokeWidth="30" />
          <path className="rainbow-path stroke-[#fde047]" d="M -100,620 C 300,620 400,320 1100,720" strokeWidth="30" />
          
          {/* Second Rainbow Sweep (Right side curve) */}
          <path className="rainbow-path stroke-[#b4136d]" d="M 700,-100 C 700,300 900,400 1100,300" strokeWidth="20" />
          <path className="rainbow-path stroke-[#7c3aed]" d="M 720,-100 C 720,320 900,420 1100,320" strokeWidth="20" />
          <path className="rainbow-path stroke-[#fd56a7]" d="M 740,-100 C 740,340 900,440 1100,340" strokeWidth="20" />
          <path className="rainbow-path stroke-[#ffb690]" d="M 760,-100 C 760,360 900,460 1100,360" strokeWidth="20" />
        </svg>
      </div>

      {/* Doodles & Illustrative Elements (Foreground) */}
      {/* Sun/Moon Character */}
      <div className="absolute top-[10%] left-[20%] z-20 mascot-doodle">
        <svg fill="none" height="80" viewBox="0 0 80 80" width="80" xmlns="http://www.w3.org/2000/svg">
          <circle cx="40" cy="40" fill="#fde047" r="30" stroke="#1c1b1b" strokeWidth="4" />
          <circle cx="25" cy="35" fill="#1c1b1b" r="4" />
          <circle cx="45" cy="35" fill="#1c1b1b" r="4" />
          <path d="M 30 50 Q 35 55 40 50" fill="none" stroke="#1c1b1b" strokeLinecap="round" strokeWidth="3" />
          {/* Moon overlay */}
          <path d="M 15 20 Q 30 10 40 15 Q 25 30 15 20" fill="#fd56a7" stroke="#1c1b1b" strokeWidth="2" />
        </svg>
      </div>

      {/* Flower Character */}
      <div className="absolute top-[20%] right-[15%] z-20 mascot-doodle" style={{ animationDelay: '1s' }}>
        <svg fill="none" height="120" viewBox="0 0 100 120" width="100" xmlns="http://www.w3.org/2000/svg">
          {/* Stem and leaves */}
          <path d="M 50 70 Q 60 100 50 120" fill="none" stroke="#86efac" strokeWidth="6" />
          <path d="M 50 90 Q 70 80 80 90 Q 60 100 50 90" fill="#86efac" stroke="#1c1b1b" strokeWidth="2" />
          <path d="M 50 100 Q 30 90 20 100 Q 40 110 50 100" fill="#86efac" stroke="#1c1b1b" strokeWidth="2" />
          {/* Petals */}
          <circle cx="50" cy="40" fill="#ffffff" r="30" stroke="#1c1b1b" strokeDasharray="10 10" strokeWidth="4" />
          <path d="M 50 10 A 15 15 0 0 1 65 25 A 15 15 0 0 1 80 40 A 15 15 0 0 1 65 55 A 15 15 0 0 1 50 70 A 15 15 0 0 1 35 55 A 15 15 0 0 1 20 40 A 15 15 0 0 1 35 25 A 15 15 0 0 1 50 10 Z" fill="#ffffff" stroke="#1c1b1b" strokeWidth="3" />
          {/* Face */}
          <circle cx="50" cy="40" fill="#fde047" r="15" stroke="#1c1b1b" strokeWidth="3" />
          <circle cx="45" cy="35" fill="#1c1b1b" r="2" />
          <circle cx="55" cy="35" fill="#1c1b1b" r="2" />
          <path d="M 45 45 Q 50 50 55 45" fill="none" stroke="#1c1b1b" strokeLinecap="round" strokeWidth="2" />
        </svg>
      </div>

      {/* Stars */}
      <div className="absolute top-[15%] left-[45%] z-20 star-doodle">
        <svg fill="none" height="30" viewBox="0 0 40 40" width="30" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 0L23.5 16.5L40 20L23.5 23.5L20 40L16.5 23.5L0 20L16.5 16.5L20 0Z" fill="#ffffff" stroke="#1c1b1b" strokeWidth="2" />
        </svg>
      </div>
      <div className="absolute top-[30%] right-[35%] z-20 star-doodle" style={{ animationDelay: '0.5s' }}>
        <svg fill="none" height="20" viewBox="0 0 40 40" width="20" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 0L23.5 16.5L40 20L23.5 23.5L20 40L16.5 23.5L0 20L16.5 16.5L20 0Z" fill="#ffb690" stroke="#1c1b1b" strokeWidth="2" />
        </svg>
      </div>

      {/* Machinery & Pipes (Background to content) */}
      <div className="absolute bottom-0 left-0 w-full h-[50vh] z-10 pointer-events-none rumble-pulse origin-bottom">
        <svg className="w-full h-full" preserveAspectRatio="xMidYMid slice" viewBox="0 0 1000 500">
          {/* Left complex pipe */}
          <path className="drawn-pipe" d="M -50,450 L 100,450 L 100,300 L 250,300 L 250,350 L 400,350" fill="none" stroke="#1c1b1b" strokeLinecap="round" strokeLinejoin="round" strokeWidth="12" />
          <path d="M -50,450 L 100,450 L 100,300 L 250,300 L 250,350 L 400,350" fill="none" stroke="#ffffff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="6" />
          <path className="liquid-pipe" d="M -50,450 L 100,450 L 100,300 L 250,300 L 250,350 L 400,350" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
          
          {/* Valve joint */}
          <circle cx="250" cy="300" fill="#fde047" r="20" stroke="#1c1b1b" strokeWidth="4" />
          <circle cx="250" cy="300" fill="#1c1b1b" r="5" />
          <rect fill="#ffffff" height="10" stroke="#1c1b1b" strokeWidth="3" transform="rotate(45 250 300)" width="40" x="230" y="295" />
          
          {/* Right complex pipe */}
          <path className="drawn-pipe" d="M 1050,400 L 800,400 L 800,250 L 600,250 L 600,350 L 450,350" fill="none" stroke="#1c1b1b" strokeLinecap="round" strokeLinejoin="round" strokeWidth="12" style={{ animationDelay: '0.5s' }} />
          <path d="M 1050,400 L 800,400 L 800,250 L 600,250 L 600,350 L 450,350" fill="none" stroke="#ffffff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="6" />
          <path className="liquid-pipe" d="M 1050,400 L 800,400 L 800,250 L 600,250 L 600,350 L 450,350" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
          
          {/* Central machine/boiler */}
          <path d="M 400,330 L 450,330 L 450,400 L 400,400 Z" fill="#eaddff" stroke="#1c1b1b" strokeWidth="4" />
          <circle cx="425" cy="365" fill="#fd56a7" r="15" stroke="#1c1b1b" strokeWidth="3" />
          <path d="M 425 350 L 425 330" stroke="#1c1b1b" strokeWidth="3" />
          <circle cx="425" cy="325" fill="#fde047" r="5" stroke="#1c1b1b" strokeWidth="2" />
          
          {/* Steam */}
          <path d="M 425 315 C 415 300, 440 280, 420 260 C 410 240, 440 220, 425 200" fill="none" stroke="#ffffff" strokeLinecap="round" strokeWidth="8" />
          
          {/* Random floating pipe chunks */}
          <path d="M 700,450 Q 750,480 800,450" fill="none" stroke="#1c1b1b" strokeLinecap="round" strokeWidth="10" />
          <path d="M 700,450 Q 750,480 800,450" fill="none" stroke="#ffffff" strokeLinecap="round" strokeWidth="4" />
          
          {/* Pressure gauge */}
          <circle cx="800" cy="250" fill="#ffffff" r="25" stroke="#1c1b1b" strokeWidth="4" />
          <circle cx="800" cy="250" fill="#ffb690" r="15" />
          <path d="M 800 250 L 810 240" stroke="#1c1b1b" strokeLinecap="round" strokeWidth="3" />
        </svg>
      </div>

      {/* Main Content Area */}
      <main className="relative z-30 flex flex-col items-center justify-start text-center px-4 w-full mt-24 md:mt-32">
        {/* Typography Group - VibeUp Branding */}
        <div className="mb-12 relative z-30 w-full flex flex-col items-center">
          <div ref={vibeHubRef} className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] md:w-[500px] md:h-[500px] -z-10 pointer-events-none" />
          <h1 
            className="font-display text-7xl md:text-8xl text-white mb-2 tracking-tighter leading-none" 
            style={{
              textShadow: '-2px -2px 0 #1c1b1b, 2px -2px 0 #1c1b1b, -2px 2px 0 #1c1b1b, 2px 2px 0 #1c1b1b, 8px 8px 0 #fd56a7'
            }}
          >
            VibeUp
          </h1>
          <p className="font-headline text-lg md:text-xl text-[#1c1b1b] tracking-tight bg-white px-6 py-2 border-3 border-[#1c1b1b] rounded-full transform rotate-1 mt-4 shadow-[4px_4px_0px_#1c1b1b]">
            your money. your move.
          </p>
        </div>

        {/* CTA Button */}
        <div className="mt-8 z-40 relative">
          {/* Connecting line to CTA */}
          <svg className="absolute -top-12 left-1/2 transform -translate-x-1/2 w-4 h-12 pointer-events-none" fill="none" stroke="#1c1b1b" strokeWidth="4">
            <path d="M 2 0 L 2 48" strokeDasharray="6 6" />
          </svg>
          <button 
            onClick={handleStart}
            className="group relative inline-flex items-center justify-center px-12 py-5 font-headline text-xl bg-white text-[#1c1b1b] rounded-full border-4 border-black shadow-[8px_8px_0px_0px_#1c1b1b] transition-all duration-200 active:translate-y-2 active:shadow-[0px_0px_0px_0px_#1c1b1b] overflow-hidden btn-shake-hover cursor-pointer"
          >
            <span className="relative z-10">Get Started</span>
            {/* Sparkle effect inside button on hover */}
            <span className="absolute inset-0 bg-[#fde047] transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-in-out z-0" />
            <span className="relative z-10 ml-3 group-hover:rotate-45 transition-transform text-2xl">➔</span>
          </button>
        </div>

        {/* Sub-section Header */}
        <div className="mt-48 mb-32 relative z-30 w-full flex flex-col items-center">
          <h2 
            className="font-display text-4xl md:text-6xl text-[#1c1b1b] mb-4 tracking-tighter leading-tight max-w-2xl text-center px-4" 
            style={{ textShadow: '2px 2px 0px #ffffff' }}
          >
            Investments<br />& Strategies
          </h2>
          <p className="font-headline text-sm text-[#1c1b1b] max-w-md text-center font-medium bg-white/80 backdrop-blur-sm p-3 rounded-xl border-3 border-[#1c1b1b]">
            We are the money makers and we are the dreamers of dreams.
          </p>
          <button 
            onClick={handleLearnMore}
            className="mt-6 px-8 py-3 font-headline text-base bg-white text-[#1c1b1b] rounded-full border-3 border-black shadow-[4px_4px_0px_0px_#1c1b1b] hover:bg-[#ffb690] transition-colors cursor-pointer active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_#1c1b1b]"
          >
            Learn more
          </button>
        </div>
      </main>

      {/* Mascot Peeking (Coin Character) */}
      <div className="absolute bottom-[20%] left-[5%] md:left-[15%] z-30 mascot-doodle origin-bottom">
        <img 
          className="w-24 md:w-44 object-contain drop-shadow-[4px_4px_0px_#1c1b1b]" 
          alt="A stylized, retro cartoon coin mascot peeking" 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBGCRbltQOfaAZFjkRbD1oC1xWyKCk7g6J8fuW0P29qcIYwOrYXUfeCv--kGwJ3LJTOn2_CQEZctfg0kJ_uzUPHccg7-DVfZ3BtXz1YaIIz7EFs-bs2qX9-B_gGYVossXBAYal1ugiFFSuOzfqk8vlkM7o2ih487cIOftFpqv32fD3h69scnXTR3PFCTiZ6UnUoJ5poZSD7410N2nk-zpzVDHCjIkV5zoFPDDgsFv7-W74T8pQdDFohiK1w3QYJ8hDBTDmBwhrjFzHs" 
        />
      </div>

      {/* Info Card (Left floating) */}
      <div className="absolute top-[30%] left-[5%] md:left-[10%] z-30 hidden md:block w-48 text-left">
        <p className="font-sans text-xs text-white mb-4 leading-normal bg-black/40 backdrop-blur-xs p-3 rounded-lg border border-white/10">
          Come with me to a land of creative investing, collaboration, and plenty of spectacular returns.
        </p>
        <button 
          onClick={handleLearnMore}
          className="w-12 h-12 rounded-full bg-[#fd56a7] border-2 border-black flex items-center justify-center shadow-[4px_4px_0px_#1c1b1b] hover:bg-[#ffb0cd] cursor-pointer"
        >
          <span className="text-white text-lg">▶</span>
        </button>
      </div>
    </div>
  )
}

export default Splash
