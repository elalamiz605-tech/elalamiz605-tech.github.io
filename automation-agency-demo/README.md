# AutoFlow · animated agency website (demo)

Showcase website for **AutoFlow**, a fictional automation and AI agency. Built by Ziad El Alami.

🌐 **Live demo:** https://elalamiz605-tech.github.io/automation-agency-demo/

## Features

- Intro preloader with counter, then a staged hero reveal (GSAP timelines)
- Real-time WebGL data globe (Three.js): 4,200 twinkling points, data arcs with travelling packets, orbit rings, mouse parallax and scroll-linked zoom
- Smooth scrolling (Lenis) and scroll-triggered reveals (GSAP ScrollTrigger)
- Custom cursor, magnetic buttons and 3D tilting cards with a pointer glare
- Looping holographic video background (rendered in Python with OpenCV and encoded with FFmpeg)
- Animated SVG interface: rotating rings, radar sweep, orbiting icons and data flows
- Rotating headline words, scanner light, glowing borders and hover shine on cards
- Scroll-reveal sections using CSS scroll-driven animations
- Responsive layout; all animations stop for visitors who prefer reduced motion
- No build step: plain HTML, CSS and JavaScript modules; libraries are vendored in `vendor/`

## Files

```
index.html   Page content and base styles
pro.css      Preloader, cursor, tilt and WebGL styles
main.js      Animations: preloader, GSAP, Lenis, Three.js globe
vendor/      three.js, GSAP + ScrollTrigger, Lenis
hero.mp4     8-second seamless background loop (1280×720)
poster.jpg   Still frame shown while the video loads
```
