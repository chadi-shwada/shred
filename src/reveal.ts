/**
 * Apparition douce des blocs au défilement (fondu et léger glissement).
 * Seuls les blocs encore sous l'écran sont masqués, puis révélés à leur
 * arrivée : rien n'est caché sans JavaScript, ni si prefers-reduced-motion.
 */

const SELECTOR = [
  '.section__head',
  '.showcase-video',
  '.starts > li',
  '.recent-breaches > li',
  '.showcase > *',
  '.bento > *',
  '.faq',
  '.cta-band',
].join(', ');

export function revealOnScroll(root: ParentNode = document): () => void {
  if (typeof IntersectionObserver === 'undefined') return () => {};
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return () => {};

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-revealed');
        io.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px' },
  );

  root.querySelectorAll<HTMLElement>(SELECTOR).forEach((el) => {
    // Déjà visible au chargement : on ne le fait pas clignoter.
    if (el.getBoundingClientRect().top < window.innerHeight) return;
    const index = el.parentElement ? [...el.parentElement.children].indexOf(el) : 0;
    el.style.setProperty('--reveal-delay', `${(index % 4) * 70}ms`);
    el.classList.add('reveal');
    io.observe(el);
  });

  return () => io.disconnect();
}
