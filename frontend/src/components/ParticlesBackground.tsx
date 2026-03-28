import { useEffect, useRef } from "react";
import * as THREE from "three";

export const ParticlesBackground = () => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1200);
    camera.position.z = 260;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    mount.appendChild(renderer.domElement);

    const particleCount = 1600;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const colorA = new THREE.Color("#60a5fa");
    const colorB = new THREE.Color("#3b82f6");

    const spriteCanvas = document.createElement("canvas");
    spriteCanvas.width = 64;
    spriteCanvas.height = 64;
    const spriteContext = spriteCanvas.getContext("2d");
    if (!spriteContext) return;
    const gradient = spriteContext.createRadialGradient(32, 32, 4, 32, 32, 32);
    gradient.addColorStop(0, "rgba(191, 219, 254, 1)");
    gradient.addColorStop(0.55, "rgba(96, 165, 250, 0.95)");
    gradient.addColorStop(1, "rgba(96, 165, 250, 0)");
    spriteContext.fillStyle = gradient;
    spriteContext.beginPath();
    spriteContext.arc(32, 32, 32, 0, Math.PI * 2);
    spriteContext.fill();
    const spriteTexture = new THREE.CanvasTexture(spriteCanvas);

    for (let index = 0; index < particleCount; index += 1) {
      const stride = index * 3;
      positions[stride] = (Math.random() - 0.5) * 900;
      positions[stride + 1] = (Math.random() - 0.5) * 720;
      positions[stride + 2] = (Math.random() - 0.5) * 500;

      const mix = index % 2 === 0 ? colorA : colorB;
      colors[stride] = mix.r;
      colors[stride + 1] = mix.g;
      colors[stride + 2] = mix.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 4.5,
      transparent: true,
      opacity: 0.9,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      map: spriteTexture,
      alphaMap: spriteTexture,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    let animationFrame = 0;
    const animate = () => {
      animationFrame = window.requestAnimationFrame(animate);
      particles.rotation.y += 0.0008;
      particles.rotation.x += 0.00035;
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.cancelAnimationFrame(animationFrame);
      geometry.dispose();
      material.dispose();
      spriteTexture.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className="pointer-events-none fixed inset-0 z-0 opacity-80" />;
};
