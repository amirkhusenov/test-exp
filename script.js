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

function setActiveService(targetItem) {
  if (!targetItem) return;

  const targetKey = targetItem.dataset.service;
  if (!targetKey) return;
  if (activeItem === targetItem) return;
  transitionId += 1;
  const currentTransition = transitionId;

  if (cleanupTimer) {
    clearTimeout(cleanupTimer);
    cleanupTimer = null;
  }

  for (const item of serviceItems) {
    item.classList.toggle("is-active", item === targetItem);
  }

  const nextPhoto = servicePhotos.find((photo) => photo.dataset.servicePhoto === targetKey);
  if (!nextPhoto) {
    activeItem = targetItem;
    return;
  }
  syncImageBoxSize(nextPhoto);

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
        photo.classList.remove("is-active");
        photo.classList.remove("is-entering");
        photo.classList.remove("is-leaving");
      }
    }
    nextPhoto.classList.remove("is-entering");
    nextPhoto.classList.remove("is-leaving");
    cleanupTimer = null;
  }, PHOTO_CLEANUP_DELAY);

  activeItem = targetItem;
  activePhoto = nextPhoto;
}

function initState() {
  if (!activeItem && serviceItems.length) {
    activeItem = serviceItems[0];
  }

  if (activeItem) {
    activeItem.classList.add("is-active");
  }

  if (!activePhoto && servicePhotos.length) {
    activePhoto = servicePhotos[0];
  }

  if (activePhoto) {
    activePhoto.classList.add("is-active");
    syncImageBoxSize(activePhoto);
  }

  for (const photo of servicePhotos) {
    if (photo !== activePhoto) {
      photo.classList.remove("is-active");
      photo.classList.remove("is-entering");
      photo.classList.remove("is-leaving");
    }
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

for (const item of serviceItems) {
  item.addEventListener("mouseenter", () => setActiveService(item));
  item.addEventListener("focusin", () => setActiveService(item));
  item.addEventListener("click", () => setActiveService(item));
}

initState();
mountServicesSlider();

if (mobileSliderMedia.addEventListener) {
  mobileSliderMedia.addEventListener("change", mountServicesSlider);
} else if (mobileSliderMedia.addListener) {
  mobileSliderMedia.addListener(mountServicesSlider);
}
