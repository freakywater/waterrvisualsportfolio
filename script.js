// Register GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

// Navbar Scroll Effect
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  if (window.scrollY > 30) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

// Initial Page Load — Hero Animations
// ─── SEEK LOCAL VIDEO THUMBNAILS (works on originals + clones) ───
function seekLocalThumbs(root) {
  (root || document).querySelectorAll('.local-thumb-video').forEach(vid => {
    const doSeek = () => { try { vid.currentTime = 2; } catch(e) {} };
    if (vid.readyState >= 1) doSeek();
    else vid.addEventListener('loadedmetadata', doSeek, { once: true });
  });
}

window.addEventListener('DOMContentLoaded', () => {
  gsap.to('.hero .fade-up', {
    opacity: 1,
    y: 0,
    duration: 0.85,
    stagger: 0.13,
    ease: 'power3.out'
  });
  seekLocalThumbs();
});

// Scroll Reveal Animations
document.querySelectorAll('section:not(.hero)').forEach(section => {
  const elements = section.querySelectorAll('.fade-up');
  if (elements.length > 0) {
    gsap.to(elements, {
      scrollTrigger: {
        trigger: section,
        start: 'top 85%',
        toggleActions: 'play none none none'
      },
      opacity: 1,
      y: 0,
      duration: 0.75,
      stagger: 0.1,
      ease: 'power3.out'
    });
  }
});

// ─── OPTIMIZED BACKGROUND SCROLL PARALLAX ───
if (document.getElementById('bg-dots')) {
  gsap.to('#bg-dots', {
    y: '80px',
    ease: 'none',
    scrollTrigger: {
      trigger: 'body',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.8
    }
  });
}

// ─── PLAY VIDEO ON CLICK — event delegation so clones work too ───
function handleCardClick(card) {
  const videoId   = card.getAttribute('data-video');
  const localSrc  = card.getAttribute('data-local-video');
  const posterSrc = card.getAttribute('data-poster') || '';
  const thumb     = card.querySelector('.project-thumb') || card.querySelector('.short-thumb');

  if (thumb && !card.classList.contains('is-playing')) {
    // Pause any other currently playing local videos
    document.querySelectorAll('video.video-frame').forEach(v => {
      try { v.pause(); } catch (e) {}
    });

    if (localSrc) {
      const encodedSrc = encodeURI(localSrc);
      const posterAttr = posterSrc ? `poster="${encodeURI(posterSrc)}"` : '';
      thumb.innerHTML = `<video class="video-frame" src="${encodedSrc}" ${posterAttr} controls autoplay playsinline preload="auto" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;"></video>`;
      const vid = thumb.querySelector('video.video-frame');
      if (vid) {
        const playPromise = vid.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            vid.muted = true;
            vid.play().catch(() => {});
          });
        }
      }
    } else if (videoId) {
      thumb.innerHTML = `<iframe class="video-frame" src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1" title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
    }
    card.classList.add('is-playing');
    const playBtn = card.querySelector('.play-btn');
    if (playBtn) playBtn.style.display = 'none';
  }
}

// Delegated listener — catches clicks on original cards AND carousel clones
document.addEventListener('click', (e) => {
  const card = e.target.closest('[data-video], [data-local-video]');
  if (card) handleCardClick(card);
});

// ─── FAQ ACCORDION ───
document.querySelectorAll('.faq-item').forEach(item => {
  const btn = item.querySelector('.faq-btn');
  
  btn.addEventListener('click', () => {
    const isActive = item.classList.contains('active');
    
    // Close other FAQ items
    document.querySelectorAll('.faq-item').forEach(otherItem => {
      otherItem.classList.remove('active');
    });
    
    // Toggle active state
    if (!isActive) {
      item.classList.add('active');
    }
  });
});

// ─── REUSABLE INFINITE-LOOP CAROUSEL ───
function createCarousel({ trackId, prevBtnId, nextBtnId, dotsId, wrapperId }) {
  const track = document.getElementById(trackId);
  const prevBtn = document.getElementById(prevBtnId);
  const nextBtn = document.getElementById(nextBtnId);
  const dotsContainer = document.getElementById(dotsId);

  if (!track || !prevBtn || !nextBtn) return null;

  let realSlides = [];
  let currentIndex = 0; // index into realSlides
  let isTransitioning = false;

  function getSlidesPerPage() {
    const width = window.innerWidth;
    if (width <= 480) return 1;
    if (width <= 768) return 2;
    if (width <= 1100) return 3;
    return 4;
  }

  function getSlideWidth() {
    const allSlides = track.querySelectorAll('.carousel-slide');
    if (!allSlides.length) return 0;
    return allSlides[0].getBoundingClientRect().width;
  }

  function getGap() { return 24; }

  // Build infinite loop by cloning: [clones-end | originals | clones-start]
  function buildClones() {
    // Remove existing clones
    track.querySelectorAll('.carousel-clone').forEach(c => c.remove());
    realSlides = Array.from(track.querySelectorAll('.carousel-slide'));
    const count = realSlides.length;
    if (count === 0) return;

    // Append clones of first N slides at the end
    realSlides.forEach(slide => {
      const clone = slide.cloneNode(true);
      clone.classList.add('carousel-clone');
      clone.removeAttribute('id');
      track.appendChild(clone);
    });

    // Prepend clones of last N slides at the beginning
    [...realSlides].reverse().forEach(slide => {
      const clone = slide.cloneNode(true);
      clone.classList.add('carousel-clone');
      clone.removeAttribute('id');
      track.insertBefore(clone, track.firstChild);
    });
  }

  function getAllSlides() {
    return Array.from(track.querySelectorAll('.carousel-slide, .carousel-clone'));
  }

  // The real slides start at offset = realSlides.length (because of prepended clones)
  function getRealOffset() { return realSlides.length; }

  function setPosition(index, animated) {
    const slideWidth = getSlideWidth();
    const gap = getGap();
    const allOffset = getRealOffset() + index; // absolute position in the full cloned track
    const px = allOffset * (slideWidth + gap);
    if (!animated) {
      track.style.transition = 'none';
    } else {
      track.style.transition = 'transform 0.45s cubic-bezier(0.25, 1, 0.5, 1)';
    }
    track.style.transform = `translateX(-${px}px)`;
  }

  function updateDots() {
    if (!dotsContainer) return;
    const dots = dotsContainer.querySelectorAll('.dot');
    const perPage = getSlidesPerPage();
    const activeDot = Math.floor(currentIndex / 1) % realSlides.length;
    dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === currentIndex % Math.max(1, realSlides.length));
    });
  }

  function renderDots() {
    if (!dotsContainer) return;
    dotsContainer.innerHTML = '';
    if (realSlides.length <= 1) { dotsContainer.style.display = 'none'; return; }
    dotsContainer.style.display = 'flex';
    realSlides.forEach((_, i) => {
      const dot = document.createElement('div');
      dot.className = `dot ${i === currentIndex % realSlides.length ? 'active' : ''}`;
      dot.setAttribute('aria-label', `Slide ${i + 1}`);
      dot.addEventListener('click', () => {
        currentIndex = i;
        setPosition(currentIndex, true);
        updateDots();
      });
      dotsContainer.appendChild(dot);
    });
  }

  function refreshDotActive() {
    if (!dotsContainer) return;
    const dots = dotsContainer.querySelectorAll('.dot');
    const active = ((currentIndex % realSlides.length) + realSlides.length) % realSlides.length;
    dots.forEach((dot, i) => dot.classList.toggle('active', i === active));
  }

  function nextSlide() {
    if (isTransitioning || realSlides.length === 0) return;
    isTransitioning = true;
    currentIndex++;
    setPosition(currentIndex, true);
    refreshDotActive();
  }

  function prevSlide() {
    if (isTransitioning || realSlides.length === 0) return;
    isTransitioning = true;
    currentIndex--;
    setPosition(currentIndex, true);
    refreshDotActive();
  }

  // After transition ends, silently reset if we're in clone zone
  track.addEventListener('transitionend', () => {
    isTransitioning = false;
    const count = realSlides.length;
    if (count === 0) return;
    if (currentIndex >= count) {
      currentIndex = currentIndex % count;
      setPosition(currentIndex, false);
      // Force reflow to apply no-transition jump instantly
      track.getBoundingClientRect();
    }
    if (currentIndex < 0) {
      currentIndex = ((currentIndex % count) + count) % count;
      setPosition(currentIndex, false);
      track.getBoundingClientRect();
    }
    refreshDotActive();
  });

  nextBtn.addEventListener('click', (e) => { e.stopPropagation(); nextSlide(); });
  prevBtn.addEventListener('click', (e) => { e.stopPropagation(); prevSlide(); });

  // Touch/swipe
  let touchStartX = 0;
  track.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
  track.addEventListener('touchend', e => {
    const diff = touchStartX - e.changedTouches[0].screenX;
    if (diff > 40) nextSlide();
    if (diff < -40) prevSlide();
  }, { passive: true });

  window.addEventListener('resize', () => {
    buildClones();
    setPosition(currentIndex, false);
    renderDots();
  });

  // Always show buttons when slides exist
  function showButtons() {
    if (realSlides.length > 1) {
      prevBtn.style.display = 'flex';
      nextBtn.style.display = 'flex';
    } else {
      prevBtn.style.display = 'none';
      nextBtn.style.display = 'none';
    }
  }

  // Init
  setTimeout(() => {
    buildClones();
    setPosition(0, false);
    renderDots();
    showButtons();
    // Seek all video thumbnails including clones
    seekLocalThumbs(track);
  }, 120);

  return { nextSlide, prevSlide, renderDots };
}


// Initialize Featured Shorts Carousel
const featuredCarousel = createCarousel({
  trackId: 'featured-shorts-track',
  prevBtnId: 'featured-shorts-prev',
  nextBtnId: 'featured-shorts-next',
  dotsId: 'featured-carousel-dots',
  wrapperId: 'featured-shorts-wrapper'
});

// Initialize Gaming Shorts Carousel
const gamingCarousel = createCarousel({
  trackId: 'gaming-shorts-track',
  prevBtnId: 'gaming-shorts-prev',
  nextBtnId: 'gaming-shorts-next',
  dotsId: 'gaming-carousel-dots',
  wrapperId: 'gaming-shorts-wrapper'
});

// ─── AUTO-SLIDE FOR BOTH CAROUSELS ───
function startAutoSlide(carousel, intervalMs) {
  if (!carousel) return null;
  let timer = setInterval(() => carousel.nextSlide(), intervalMs);
  return timer;
}

let featuredTimer = startAutoSlide(featuredCarousel, 3500);
let gamingTimer   = startAutoSlide(gamingCarousel, 3000);

// Pause on hover / touch, resume on leave
['featured-shorts-wrapper', 'gaming-shorts-wrapper'].forEach((wrapperId, i) => {
  const el = document.getElementById(wrapperId);
  if (!el) return;
  const timer = i === 0 ? featuredTimer : gamingTimer;
  const carousel = i === 0 ? featuredCarousel : gamingCarousel;
  const ms = i === 0 ? 3500 : 3000;
  let localTimer = timer;
  el.addEventListener('mouseenter', () => { clearInterval(localTimer); });
  el.addEventListener('mouseleave', () => { localTimer = startAutoSlide(carousel, ms); });
  el.addEventListener('touchstart', () => { clearInterval(localTimer); }, { passive: true });
  el.addEventListener('touchend', () => { localTimer = startAutoSlide(carousel, ms); }, { passive: true });
});

// ─── SECTION COLLAPSE / EXPAND ───
function setupCollapseToggle(toggleId, contentId) {
  const toggle = document.getElementById(toggleId);
  const content = document.getElementById(contentId);
  
  if (!toggle || !content) return;
  
  toggle.addEventListener('click', () => {
    const isCollapsed = content.classList.contains('collapsed');
    
    if (isCollapsed) {
      content.classList.remove('collapsed');
      toggle.classList.remove('collapsed');
    } else {
      content.classList.add('collapsed');
      toggle.classList.add('collapsed');
    }
  });
}

setupCollapseToggle('toggle-work', 'content-work');
setupCollapseToggle('toggle-shorts', 'content-shorts');

// ─── IMAGE PREVIEW MODAL LIGHTBOX (MOBILE & DESKTOP) ───
const imgModal = document.getElementById('img-modal');
const imgModalPreview = document.getElementById('img-modal-preview');
const imgModalCaption = document.getElementById('img-modal-caption');
const imgModalClose = document.getElementById('img-modal-close');

function openImgModal(src, caption) {
  if (!imgModal || !imgModalPreview || !src) return;
  const safeSrc = encodeURI(src);
  imgModalPreview.src = safeSrc;
  if (imgModalCaption) {
    imgModalCaption.textContent = caption || '';
    imgModalCaption.style.display = caption ? 'block' : 'none';
  }
  imgModal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeImgModal() {
  if (!imgModal) return;
  imgModal.classList.remove('active');
  document.body.style.overflow = '';
  setTimeout(() => {
    if (imgModalPreview && !imgModal.classList.contains('active')) {
      imgModalPreview.removeAttribute('src');
    }
  }, 260);
}

if (imgModalClose) {
  imgModalClose.addEventListener('click', (e) => {
    e.stopPropagation();
    closeImgModal();
  });
}

if (imgModal) {
  imgModal.addEventListener('click', (e) => {
    if (e.target === imgModal) {
      closeImgModal();
    }
  });
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && imgModal && imgModal.classList.contains('active')) {
    closeImgModal();
  }
});

// Delegated listener for .img-preview-trigger and review cards on mobile & desktop
document.addEventListener('click', (e) => {
  // Ignore clicks on external anchor links
  if (e.target.closest('a[href]')) return;

  const trigger = e.target.closest('.img-preview-trigger');
  if (trigger) {
    e.preventDefault();
    e.stopPropagation();
    openImgModal(trigger.getAttribute('data-preview'), trigger.getAttribute('data-caption'));
    return;
  }

  // Also allow tapping anywhere on a review card that has a proof preview trigger
  const reviewCard = e.target.closest('.review-card, .fe4r-showcase-card, .horizontal-review-card');
  if (reviewCard) {
    const cardTrigger = reviewCard.querySelector('.img-preview-trigger');
    if (cardTrigger) {
      e.preventDefault();
      openImgModal(cardTrigger.getAttribute('data-preview'), cardTrigger.getAttribute('data-caption'));
    }
  }
});

// ─── PERMANENT DARK THEME & FOOTER SCROLL-TO-TOP ───
document.documentElement.setAttribute('data-theme', 'dark');

const footerScrollTop = document.getElementById('footer-scroll-top');
if (footerScrollTop) {
  footerScrollTop.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

