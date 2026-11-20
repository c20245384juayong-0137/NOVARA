import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

gsap.registerPlugin(ScrollTrigger);

let motionContext: gsap.MatchMedia | undefined;

function initializeMotion() {
  if (motionContext) return;

  motionContext = gsap.matchMedia();
  motionContext.add("(prefers-reduced-motion: no-preference)", () => {
    const cleanupHandlers: Array<() => void> = [];
    const lenis = new Lenis({ autoRaf: false, lerp: 0.09, smoothWheel: true });
    const syncScroll = () => ScrollTrigger.update();
    const tick = (time: number) => lenis.raf(time * 1000);
    const refresh = () => ScrollTrigger.refresh();
    const refreshFrame = window.requestAnimationFrame(refresh);
    const desktop = gsap.matchMedia();

    document.documentElement.classList.add("has-motion");
    lenis.on("scroll", syncScroll);
    gsap.ticker.add(tick);

    const splitWords = (heading: HTMLElement) => {
      const originalMarkup = heading.innerHTML;
      const originalLabel = heading.getAttribute("aria-label");
      cleanupHandlers.push(() => {
        heading.innerHTML = originalMarkup;
        if (originalLabel === null) heading.removeAttribute("aria-label");
        else heading.setAttribute("aria-label", originalLabel);
      });

      const accessibleCopy = heading.cloneNode(true) as HTMLElement;
      accessibleCopy.querySelectorAll("br").forEach((lineBreak) => lineBreak.replaceWith(" "));
      heading.setAttribute("aria-label", accessibleCopy.textContent?.replace(/\s+/g, " ").trim() ?? "");

      const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
      const textNodes: Text[] = [];
      while (walker.nextNode()) {
        if (walker.currentNode.textContent?.trim()) textNodes.push(walker.currentNode as Text);
      }

      const words: HTMLElement[] = [];
      textNodes.forEach((textNode) => {
        const fragment = document.createDocumentFragment();
        (textNode.textContent ?? "").split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) {
            fragment.append(document.createTextNode(part));
            return;
          }

          const word = document.createElement("span");
          word.className = "word-split";
          word.setAttribute("aria-hidden", "true");
          word.textContent = part;
          words.push(word);
          fragment.append(word);
        });
        textNode.replaceWith(fragment);
      });

      return words;
    };

    gsap.utils.toArray<HTMLElement>("[data-text-reveal]").forEach((heading) => {
      const words = splitWords(heading);
      if (!words.length) return;

      gsap.fromTo(words, {
        yPercent: 115,
        autoAlpha: 0,
        filter: "blur(8px)",
      }, {
        yPercent: 0,
        autoAlpha: 1,
        filter: "blur(0px)",
        duration: 0.9,
        stagger: 0.055,
        ease: "power4.out",
        scrollTrigger: {
          trigger: heading,
          start: "top 88%",
          once: true,
        },
      });
    });

    gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((element) => {
      const isScaleReveal = element.dataset.reveal === "scale";
      gsap.fromTo(element, {
        autoAlpha: 0,
        y: isScaleReveal ? 16 : 34,
        scale: isScaleReveal ? 0.94 : 1,
      }, {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        duration: 0.85,
        ease: "power3.out",
        scrollTrigger: {
          trigger: element,
          start: "top 88%",
          once: true,
        },
      });
    });

    gsap.utils.toArray<HTMLElement>("[data-stagger]").forEach((group) => {
      const items = Array.from(group.children).filter((child): child is HTMLElement => child instanceof HTMLElement);
      if (!items.length) return;

      gsap.fromTo(items, {
        autoAlpha: 0,
        y: 28,
      }, {
        autoAlpha: 1,
        y: 0,
        duration: 0.75,
        stagger: 0.12,
        ease: "power3.out",
        scrollTrigger: {
          trigger: group,
          start: "top 86%",
          once: true,
        },
      });
    });

    gsap.utils.toArray<HTMLElement>("[data-image-reveal]").forEach((frame) => {
      const image = frame.querySelector("img");
      if (!image) return;

      const trigger = {
        trigger: frame,
        start: "top 90%",
        once: true,
      };

      gsap.fromTo(frame, {
        clipPath: "inset(0 100% 0 0)",
      }, {
        clipPath: "inset(0 0% 0 0)",
        duration: 1.2,
        ease: "power3.inOut",
        scrollTrigger: trigger,
      });

      gsap.fromTo(image, {
        scale: 1.12,
      }, {
        scale: 1,
        duration: 1.4,
        ease: "power3.out",
        scrollTrigger: trigger,
      });
    });

    gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((element) => {
      const section = element.closest("section") ?? element;
      gsap.fromTo(element, {
        yPercent: -9,
        scale: 1.08,
      }, {
        yPercent: 9,
        scale: 1.12,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });
    });

    gsap.utils.toArray<HTMLElement>("[data-scrub]").forEach((element) => {
      const direction = element.dataset.scrub === "reverse" ? 1 : -1;
      gsap.fromTo(element, {
        y: direction * 38,
        rotation: direction * -3,
        scale: 0.96,
      }, {
        y: direction * -38,
        rotation: direction * 3,
        scale: 1.04,
        ease: "none",
        scrollTrigger: {
          trigger: element.closest("section") ?? element,
          start: "top bottom",
          end: "bottom top",
          scrub: 1,
        },
      });
    });

    const horizontalMedia = gsap.matchMedia();
    horizontalMedia.add("(min-width: 768px)", () => {
      gsap.utils.toArray<HTMLElement>("[data-horizontal-section]").forEach((section) => {
        const viewport = section.querySelector<HTMLElement>("[data-horizontal-viewport]");
        const track = section.querySelector<HTMLElement>("[data-horizontal-track]");
        if (!viewport || !track || track.scrollWidth <= viewport.clientWidth) return;

        gsap.to(track, {
          x: () => -(track.scrollWidth - viewport.clientWidth),
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top+=76",
            end: () => `+=${track.scrollWidth - viewport.clientWidth}`,
            pin: true,
            pinSpacing: true,
            scrub: 1,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });
      });
    });

    desktop.add("(min-width: 768px)", () => {
      gsap.utils.toArray<HTMLElement>("[data-pin-section]").forEach((section) => {
        const panel = section.querySelector<HTMLElement>("[data-pin]");
        if (!panel) return;

        ScrollTrigger.create({
          trigger: section,
          pin: panel,
          start: "top top+=110",
          end: "bottom top",
          pinSpacing: false,
          anticipatePin: 1,
        });
      });
    });

    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      gsap.utils.toArray<HTMLElement>("[data-tilt]").forEach((element) => {
        const move = (event: PointerEvent) => {
          const bounds = element.getBoundingClientRect();
          const x = (event.clientX - bounds.left) / bounds.width - 0.5;
          const y = (event.clientY - bounds.top) / bounds.height - 0.5;
          gsap.to(element, {
            rotationX: -y * 8,
            rotationY: x * 8,
            transformPerspective: 900,
            duration: 0.35,
            ease: "power2.out",
            overwrite: true,
          });
        };
        const reset = () => gsap.to(element, {
          rotationX: 0,
          rotationY: 0,
          duration: 0.5,
          ease: "power3.out",
        });

        element.addEventListener("pointermove", move);
        element.addEventListener("pointerleave", reset);
        cleanupHandlers.push(() => {
          element.removeEventListener("pointermove", move);
          element.removeEventListener("pointerleave", reset);
        });
      });

      gsap.utils.toArray<HTMLElement>("[data-magnetic]").forEach((element) => {
        const move = (event: PointerEvent) => {
          const bounds = element.getBoundingClientRect();
          const x = (event.clientX - bounds.left - bounds.width / 2) * 0.16;
          const y = (event.clientY - bounds.top - bounds.height / 2) * 0.16;
          gsap.to(element, { x, y, duration: 0.35, ease: "power3.out", overwrite: true });
        };
        const reset = () => gsap.to(element, { x: 0, y: 0, duration: 0.55, ease: "elastic.out(1, 0.45)" });

        element.addEventListener("pointermove", move);
        element.addEventListener("pointerleave", reset);
        cleanupHandlers.push(() => {
          element.removeEventListener("pointermove", move);
          element.removeEventListener("pointerleave", reset);
        });
      });
    }

    window.addEventListener("load", refresh, { once: true });

    return () => {
      cleanupHandlers.forEach((cleanup) => cleanup());
      window.removeEventListener("load", refresh);
      window.cancelAnimationFrame(refreshFrame);
      horizontalMedia.revert();
      desktop.revert();
      lenis.off("scroll", syncScroll);
      gsap.ticker.remove(tick);
      lenis.destroy();
      document.documentElement.classList.remove("has-motion");
    };
  });
}

function disposeMotion() {
  motionContext?.revert();
  motionContext = undefined;
}

initializeMotion();
window.addEventListener("pagehide", disposeMotion);
window.addEventListener("pageshow", (event) => {
  if (event.persisted) initializeMotion();
});
