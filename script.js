const serviceItems = Array.from(document.querySelectorAll(".service-item"));
const servicePhotos = Array.from(document.querySelectorAll(".service-photo"));
const certificateImage = document.querySelector(".certificate-image");
const servicesLayout = document.querySelector(".services-layout");
const servicesSliderRoot = document.querySelector(".services-slider");
const mobileSliderMedia = window.matchMedia("(max-width: 1024px)");

let activeItem = document.querySelector(".service-item.is-active") || serviceItems[0] || null;
let activePhoto = document.querySelector(".service-photo.is-active") || servicePhotos[0] || null;
let cleanupTimer = null;
let transitionId = 0;
const PHOTO_CLEANUP_DELAY = 1050;
let servicesSlider = null;
let desktopScrollTrigger = null;
let isDesktopScrollMode = false;

function syncImageBoxSize(photo) {
  if (!certificateImage || !photo) return;

  if (photo.complete && photo.naturalWidth > 0 && photo.naturalHeight > 0) {
    if (servicesLayout) {
      servicesLayout.style.setProperty("--doc-native-width", `${photo.naturalWidth}px`);
    }
    certificateImage.style.aspectRatio = `${photo.naturalWidth} / ${photo.naturalHeight}`;
    return;
  }

  photo.addEventListener(
    "load",
    () => {
      if (photo.naturalWidth > 0 && photo.naturalHeight > 0) {
        if (servicesLayout) {
          servicesLayout.style.setProperty("--doc-native-width", `${photo.naturalWidth}px`);
        }
        certificateImage.style.aspectRatio = `${photo.naturalWidth} / ${photo.naturalHeight}`;
      }
    },
    { once: true }
  );
}

function setPhotoState(photo, state) {
  if (!photo) return;

  if (typeof gsap !== "undefined") {
    gsap.set(photo, state);
    return;
  }

  if (state.xPercent !== undefined) {
    photo.style.transform = `translateX(${state.xPercent}%)`;
  }
  if (state.opacity !== undefined) {
    photo.style.opacity = String(state.opacity);
  }
  if (state.zIndex !== undefined) {
    photo.style.zIndex = String(state.zIndex);
  }
}

function clearPhotoInlineState(photo) {
  if (!photo) return;

  if (typeof gsap !== "undefined") {
    gsap.set(photo, {
      clearProps: "transform,opacity,zIndex,clipPath,filter,willChange"
    });
    return;
  }

  photo.style.removeProperty("transform");
  photo.style.removeProperty("opacity");
  photo.style.removeProperty("z-index");
  photo.style.removeProperty("clip-path");
  photo.style.removeProperty("filter");
  photo.style.removeProperty("will-change");
}

function activateServiceItem(item) {
  if (!item) return;

  for (const current of serviceItems) {
    current.classList.toggle("is-active", current === item);
  }

  activeItem = item;
}

function switchImageWithTransition(nextPhoto) {
  if (!nextPhoto) return;

  if (activePhoto === nextPhoto) {
    nextPhoto.classList.add("is-active");
    return;
  }

  transitionId += 1;
  const currentTransition = transitionId;

  if (cleanupTimer) {
    clearTimeout(cleanupTimer);
    cleanupTimer = null;
  }

  if (activePhoto && activePhoto !== nextPhoto) {
    activePhoto.classList.remove("is-entering");
    activePhoto.classList.remove("is-active");
    activePhoto.classList.add("is-leaving");
  }

  nextPhoto.classList.remove("is-leaving");
  nextPhoto.classList.add("is-entering");

  requestAnimationFrame(() => {
    if (currentTransition !== transitionId) return;
    nextPhoto.classList.add("is-active");
  });

  cleanupTimer = setTimeout(() => {
    if (currentTransition !== transitionId) return;

    for (const photo of servicePhotos) {
      if (photo !== nextPhoto) {
        photo.classList.remove("is-active", "is-entering", "is-leaving");
      }
    }

    nextPhoto.classList.remove("is-entering", "is-leaving");
    cleanupTimer = null;
  }, PHOTO_CLEANUP_DELAY);

  activePhoto = nextPhoto;
}

function setActiveService(targetItem, options = {}) {
  if (!targetItem || isDesktopScrollMode) return;

  const targetKey = targetItem.dataset.service;
  if (!targetKey) return;

  const force = options.force === true;
  if (!force && activeItem === targetItem) return;

  activateServiceItem(targetItem);

  const nextPhoto = servicePhotos.find((photo) => photo.dataset.servicePhoto === targetKey);
  if (!nextPhoto) return;

  syncImageBoxSize(nextPhoto);
  switchImageWithTransition(nextPhoto);
}

function applyDesktopScrollProgress(progress) {
  if (!serviceItems.length || !servicePhotos.length) return;

  const normalized = Math.max(0, Math.min(1, progress));
  const steps = serviceItems.length - 1;

  if (steps <= 0) {
    activateServiceItem(serviceItems[0]);
    for (let i = 0; i < servicePhotos.length; i += 1) {
      const photo = servicePhotos[i];
      photo.classList.remove("is-entering", "is-leaving");
      photo.classList.toggle("is-active", i === 0);
      setPhotoState(photo, {
        xPercent: 0,
        opacity: i === 0 ? 1 : 0,
        zIndex: i === 0 ? 3 : 1,
        clipPath: "inset(0 0 0 0)",
        filter: "none"
      });
    }
    activePhoto = servicePhotos[0];
    syncImageBoxSize(activePhoto);
    return;
  }

  const segment = normalized * steps;
  const currentIndex = Math.min(steps, Math.floor(segment));
  const localProgress = Math.max(0, Math.min(1, segment - currentIndex));
  const nextIndex = Math.min(servicePhotos.length - 1, currentIndex + 1);

  for (let i = 0; i < servicePhotos.length; i += 1) {
    const photo = servicePhotos[i];
    photo.classList.remove("is-entering", "is-leaving", "is-active");

    if (i === currentIndex) {
      photo.classList.add("is-active");
      setPhotoState(photo, {
        xPercent: currentIndex === nextIndex ? 0 : -100 * localProgress,
        opacity: 1,
        zIndex: 3,
        clipPath: "inset(0 0 0 0)",
        filter: "none"
      });
      continue;
    }

    if (i === nextIndex && nextIndex !== currentIndex) {
      photo.classList.add("is-active");
      setPhotoState(photo, {
        xPercent: 0,
        opacity: 1,
        zIndex: 2,
        clipPath: "inset(0 0 0 0)",
        filter: "none"
      });
      continue;
    }

    setPhotoState(photo, {
      xPercent: 0,
      opacity: 0,
      zIndex: 1,
      clipPath: "inset(0 0 0 0)",
      filter: "none"
    });
  }

  const textIndex = localProgress < 0.5 ? currentIndex : nextIndex;
  const textItem = serviceItems[textIndex] || serviceItems[currentIndex];
  activateServiceItem(textItem);

  activePhoto = servicePhotos[textIndex] || servicePhotos[currentIndex];
  syncImageBoxSize(activePhoto);
}

function resetDesktopScrollImageState() {
  for (const photo of servicePhotos) {
    photo.classList.remove("is-entering", "is-leaving");
    clearPhotoInlineState(photo);
  }
}

function initState() {
  if (!activeItem && serviceItems.length) {
    activeItem = serviceItems[0];
  }

  if (!activePhoto && servicePhotos.length) {
    activePhoto = servicePhotos[0];
  }

  if (activeItem) {
    activateServiceItem(activeItem);
  }

  for (const photo of servicePhotos) {
    const isActive = photo === activePhoto;
    photo.classList.toggle("is-active", isActive);
    photo.classList.remove("is-entering", "is-leaving");
  }

  if (activePhoto) {
    syncImageBoxSize(activePhoto);
  }
}

function mountServicesSlider() {
  if (!servicesSliderRoot || typeof Splide === "undefined") return;

  if (mobileSliderMedia.matches) {
    if (servicesSlider) return;

    servicesSlider = new Splide(servicesSliderRoot, {
      type: "slide",
      perPage: 1,
      perMove: 1,
      gap: 0,
      autoHeight: true,
      arrows: true,
      pagination: true,
      drag: true,
      speed: 620,
      easing: "cubic-bezier(0.16, 1, 0.3, 1)",
      rewind: true,
      updateOnMove: true
    });

    const updateSliderHeight = () => {
      if (!servicesSliderRoot) return;
      const track = servicesSliderRoot.querySelector(".splide__track");
      const activeSlide =
        servicesSliderRoot.querySelector(".splide__slide.is-active:not(.is-clone)") ||
        servicesSliderRoot.querySelector(".splide__slide.is-active");

      if (!track || !activeSlide) return;
      track.style.height = `${activeSlide.offsetHeight}px`;
    };

    servicesSlider.on("mounted moved resized updated refresh", () => {
      requestAnimationFrame(updateSliderHeight);
    });

    const mobileImages = servicesSliderRoot.querySelectorAll(".mobile-service-photo");
    for (const image of mobileImages) {
      if (!image.complete) {
        image.addEventListener("load", updateSliderHeight, { once: true });
      }
    }

    servicesSlider.mount();
    return;
  }

  if (servicesSlider) {
    servicesSlider.destroy(true);
    servicesSlider = null;
  }
}

function mountDesktopScrollCards() {
  const canUseScrollMode =
    !mobileSliderMedia.matches &&
    !!servicesLayout &&
    serviceItems.length > 1 &&
    typeof gsap !== "undefined" &&
    typeof ScrollTrigger !== "undefined";

  if (!canUseScrollMode) {
    if (desktopScrollTrigger) {
      desktopScrollTrigger.kill();
      desktopScrollTrigger = null;
    }

    if (isDesktopScrollMode) {
      resetDesktopScrollImageState();
      if (servicesLayout) {
        servicesLayout.classList.remove("is-scroll-mode");
      }
      isDesktopScrollMode = false;

      if (serviceItems.length) {
        activeItem = null;
        activePhoto = null;
        setActiveService(serviceItems[0], { force: true });
      }
    }

    return;
  }

  if (desktopScrollTrigger) {
    ScrollTrigger.refresh();
    return;
  }

  if (cleanupTimer) {
    clearTimeout(cleanupTimer);
    cleanupTimer = null;
  }

  gsap.registerPlugin(ScrollTrigger);
  isDesktopScrollMode = true;
  servicesLayout.classList.add("is-scroll-mode");
  applyDesktopScrollProgress(0);

  const steps = serviceItems.length - 1;

  desktopScrollTrigger = ScrollTrigger.create({
    trigger: servicesLayout,
    start: "top top",
    end: () => `+=${steps * window.innerHeight}`,
    pin: true,
    scrub: 0.35,
    anticipatePin: 1,
    invalidateOnRefresh: true,
    onUpdate: (self) => {
      applyDesktopScrollProgress(self.progress);
    },
    onLeaveBack: () => {
      applyDesktopScrollProgress(0);
    },
    onLeave: () => {
      applyDesktopScrollProgress(1);
    }
  });

  ScrollTrigger.refresh();
}

function syncResponsiveModes() {
  mountServicesSlider();
  mountDesktopScrollCards();
}

for (const item of serviceItems) {
  item.addEventListener("mouseenter", () => {
    if (isDesktopScrollMode) return;
    setActiveService(item);
  });

  item.addEventListener("focusin", () => {
    if (isDesktopScrollMode) return;
    setActiveService(item);
  });

  item.addEventListener("click", () => {
    if (!isDesktopScrollMode || !desktopScrollTrigger || serviceItems.length < 2) {
      setActiveService(item);
      return;
    }

    const index = serviceItems.indexOf(item);
    const progress = index / (serviceItems.length - 1);
    const targetY = desktopScrollTrigger.start + (desktopScrollTrigger.end - desktopScrollTrigger.start) * progress;
    window.scrollTo({ top: targetY, behavior: "smooth" });
  });
}

initState();
syncResponsiveModes();

if (mobileSliderMedia.addEventListener) {
  mobileSliderMedia.addEventListener("change", syncResponsiveModes);
} else if (mobileSliderMedia.addListener) {
  mobileSliderMedia.addListener(syncResponsiveModes);
}

window.addEventListener("resize", () => {
  if (!isDesktopScrollMode || typeof ScrollTrigger === "undefined") return;
  ScrollTrigger.refresh();
});
