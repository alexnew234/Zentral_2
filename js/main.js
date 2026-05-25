"use strict";

(() => {
  const header = document.querySelector("[data-header]");
  const menuToggle = document.querySelector("[data-menu-toggle]");
  const navMenu = document.querySelector("[data-nav-menu]");
  const revealNodes = document.querySelectorAll(".reveal");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const setHeaderState = () => {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 12);
  };

  const closeMenu = () => {
    if (!menuToggle || !navMenu) return;
    menuToggle.classList.remove("is-open");
    navMenu.classList.remove("is-open");
    document.body.classList.remove("menu-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Abrir menú");
  };

  const toggleMenu = () => {
    if (!menuToggle || !navMenu) return;
    const isOpen = menuToggle.classList.toggle("is-open");
    navMenu.classList.toggle("is-open", isOpen);
    document.body.classList.toggle("menu-open", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Cerrar menú" : "Abrir menú");
  };

  const initReveal = () => {
    if (!revealNodes.length) return;

    if (!("IntersectionObserver" in window) || reduceMotion.matches) {
      revealNodes.forEach((node) => node.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.16,
        rootMargin: "0px 0px -8% 0px",
      }
    );

    revealNodes.forEach((node) => observer.observe(node));
  };

  const initCanvas = () => {
    const canvas = document.getElementById("network-canvas");
    if (!(canvas instanceof HTMLCanvasElement) || reduceMotion.matches) return;

    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;

    const pointer = {
      active: false,
      x: 0,
      y: 0,
    };

    let width = 0;
    let height = 0;
    let particles = [];
    let animationFrame = 0;

    const makeParticle = () => {
      const speed = 0.12 + Math.random() * 0.28;
      const angle = Math.random() * Math.PI * 2;

      return {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 1.1 + Math.random() * 1.8,
        accent: Math.random() > 0.72,
      };
    };

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      const targetCount = width < 680 ? 42 : width < 1100 ? 58 : 76;
      particles = Array.from({ length: targetCount }, makeParticle);
    };

    const drawLine = (a, b, distance, maxDistance) => {
      const opacity = (1 - distance / maxDistance) * 0.28;
      const gradient = context.createLinearGradient(a.x, a.y, b.x, b.y);
      gradient.addColorStop(0, `rgba(37, 168, 255, ${opacity})`);
      gradient.addColorStop(1, `rgba(255, 139, 61, ${opacity * 0.75})`);
      context.strokeStyle = gradient;
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(a.x, a.y);
      context.lineTo(b.x, b.y);
      context.stroke();
    };

    const draw = () => {
      context.clearRect(0, 0, width, height);

      const maxDistance = width < 680 ? 112 : 148;

      particles.forEach((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x < -20 || particle.x > width + 20) particle.vx *= -1;
        if (particle.y < -20 || particle.y > height + 20) particle.vy *= -1;

        if (pointer.active) {
          const dx = pointer.x - particle.x;
          const dy = pointer.y - particle.y;
          const distance = Math.hypot(dx, dy);

          if (distance < 150 && distance > 0) {
            particle.x -= (dx / distance) * 0.28;
            particle.y -= (dy / distance) * 0.28;
          }
        }
      });

      for (let i = 0; i < particles.length; i += 1) {
        for (let j = i + 1; j < particles.length; j += 1) {
          const a = particles[i];
          const b = particles[j];
          const distance = Math.hypot(a.x - b.x, a.y - b.y);
          if (distance < maxDistance) drawLine(a, b, distance, maxDistance);
        }
      }

      particles.forEach((particle) => {
        context.beginPath();
        context.fillStyle = particle.accent
          ? "rgba(255, 139, 61, 0.78)"
          : "rgba(110, 206, 255, 0.72)";
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        context.fill();
      });

      animationFrame = window.requestAnimationFrame(draw);
    };

    const handlePointerMove = (event) => {
      pointer.active = true;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
    };

    const handlePointerLeave = () => {
      pointer.active = false;
    };

    resize();
    draw();

    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerleave", handlePointerLeave);

    const stopCanvasOnReduce = (event) => {
      if (!event.matches) return;
      window.cancelAnimationFrame(animationFrame);
      context.clearRect(0, 0, width, height);
    };

    if (typeof reduceMotion.addEventListener === "function") {
      reduceMotion.addEventListener("change", stopCanvasOnReduce);
    } else if (typeof reduceMotion.addListener === "function") {
      reduceMotion.addListener(stopCanvasOnReduce);
    }
  };

  setHeaderState();
  initReveal();
  initCanvas();

  window.addEventListener("scroll", setHeaderState, { passive: true });

  if (menuToggle) {
    menuToggle.addEventListener("click", toggleMenu);
  }

  if (navMenu) {
    navMenu.addEventListener("click", (event) => {
      const target = event.target;
      const link = target instanceof Element ? target.closest("a") : null;
      if (link) closeMenu();
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });
})();
