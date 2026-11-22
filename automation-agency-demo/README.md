# AutoFlow · animated agency website (demo)

Showcase website for **AutoFlow**, a fictional automation and AI agency. Built by Ziad El Alami.

🌐 **Live demo:** https://elalamiz605-tech.github.io/automation-agency-demo/

## Features

- Intro preloader with counter, then a staged hero reveal (GSAP timelines)
- Real-time isometric 3D scene (Three.js) in the hero: a worker typing at a laptop with live code, floating dashboards (animated charts, auto-ticking task list, mail counter), interlocking gears, a conveyor carrying documents through a scanner, data streams with travelling packets, soft shadows, mouse parallax and scroll-linked camera
- Smooth scrolling (Lenis) and scroll-triggered reveals (GSAP ScrollTrigger)
- Custom cursor, magnetic buttons and 3D tilting cards with a pointer glare
- Minimalist looping video background: perspective light grid, horizon glow and data pulses (rendered in Python with OpenCV, encoded with FFmpeg)
- Animated SVG interface: rotating rings, radar sweep, orbiting icons and data flows
- Rotating headline words, scanner light, glowing borders and hover shine on cards
- Scroll-reveal sections using CSS scroll-driven animations
- Responsive layout; all animations stop for visitors who prefer reduced motion
- No build step: plain HTML, CSS and JavaScript modules; libraries are vendored in `vendor/`

## Files

```
index.html   Page content and base styles
pro.css      Preloader, cursor, tilt and WebGL styles
main.js      Animations: preloader, GSAP, Lenis, cursor, tilt
scene.js     Real-time isometric 3D scene (Three.js)
vendor/      three.js (+ RoundedBoxGeometry), GSAP + ScrollTrigger, Lenis
hero.mp4     10-second seamless background loop (1920×1080)
poster.jpg   Still frame shown while the video loads
```
