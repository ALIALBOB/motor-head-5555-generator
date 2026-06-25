(() => {
  "use strict";

  const canvas = document.getElementById("particles");
  const ctx = canvas.getContext("2d", { alpha: true });
  const archive = document.querySelector(".archive");
  const particles = [];
  const maxParticles = 34;
  let size = 0;
  let lastFrame = 0;
  let running = true;

  function resize() {
    const rect = archive.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    size = Math.max(1, Math.floor(rect.width));
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function resetParticle(particle, initial) {
    particle.x = size * (0.18 + Math.random() * 0.64);
    particle.y = initial ? Math.random() * size : size * (0.56 + Math.random() * 0.2);
    particle.radius = 0.55 + Math.random() * 1.65;
    particle.speed = size * (0.000035 + Math.random() * 0.000065);
    particle.drift = (Math.random() - 0.5) * size * 0.000025;
    particle.alpha = 0.1 + Math.random() * 0.42;
    particle.warm = Math.random() > 0.68;
  }

  function seed() {
    particles.length = 0;
    for (let index = 0; index < maxParticles; index += 1) {
      const particle = {};
      resetParticle(particle, true);
      particles.push(particle);
    }
  }

  function draw(now) {
    if (!running) return;
    requestAnimationFrame(draw);
    if (now - lastFrame < 33) return;
    const delta = Math.min(now - lastFrame || 33, 70);
    lastFrame = now;
    ctx.clearRect(0, 0, size, size);

    for (const particle of particles) {
      particle.y -= particle.speed * delta;
      particle.x += particle.drift * delta;
      if (particle.y < size * 0.12) resetParticle(particle, false);

      const glow = particle.warm ? "255, 190, 66" : "75, 232, 218";
      ctx.beginPath();
      ctx.fillStyle = `rgba(${glow}, ${particle.alpha})`;
      ctx.shadowColor = `rgba(${glow}, 0.8)`;
      ctx.shadowBlur = particle.radius * 5;
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }

  document.addEventListener("visibilitychange", () => {
    running = !document.hidden;
    if (running) requestAnimationFrame(draw);
  });
  window.addEventListener("resize", resize, { passive: true });

  resize();
  seed();
  requestAnimationFrame(draw);
})();
