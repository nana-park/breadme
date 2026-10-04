import { useEffect, type RefObject } from "react";

// WHAT: Lifecycle-owned behavior for source-faithful JSX during the page migration.
// WHY: The legacy scripts cannot run beside React: they leak handlers and replace HTML.
type Scope = ReturnType<typeof createScope>;

function createScope() {
  const cleanups: Array<() => void> = [];
  const remembered = new WeakSet<Element>();
  const timers = new Set<number>();
  const frames = new Set<number>();
  return {
    cleanup(callback: () => void) {
      cleanups.push(callback);
    },
    remember(element: Element) {
      if (remembered.has(element)) return;
      remembered.add(element);
      const attributes = Array.from(
        element.attributes,
        ({ name, value }) => [name, value] as const,
      );
      cleanups.push(() => {
        for (const attribute of Array.from(element.attributes))
          element.removeAttribute(attribute.name);
        for (const [name, value] of attributes)
          element.setAttribute(name, value);
      });
    },
    children(element: Element) {
      const children = Array.from(element.childNodes);
      cleanups.push(() => element.replaceChildren(...children));
    },
    on(
      target: EventTarget,
      type: string,
      callback: EventListener,
      options?: AddEventListenerOptions,
    ) {
      target.addEventListener(type, callback, options);
      cleanups.push(() => target.removeEventListener(type, callback, options));
    },
    later(callback: () => void, delay: number) {
      const id = window.setTimeout(() => {
        timers.delete(id);
        callback();
      }, delay);
      timers.add(id);
      return id;
    },
    cancel(id: number | undefined) {
      if (id !== undefined) {
        window.clearTimeout(id);
        timers.delete(id);
      }
    },
    frame(callback: () => void) {
      const id = window.requestAnimationFrame(() => {
        frames.delete(id);
        callback();
      });
      frames.add(id);
      return id;
    },
    cancelFrame(id: number | undefined) {
      if (id !== undefined) {
        window.cancelAnimationFrame(id);
        frames.delete(id);
      }
    },
    dispose() {
      for (const timer of timers) window.clearTimeout(timer);
      for (const frame of frames) window.cancelAnimationFrame(frame);
      for (const cleanup of cleanups.reverse()) cleanup();
    },
  };
}

function centerCard(
  container: HTMLElement,
  card: HTMLElement,
  reduced: boolean,
) {
  const bounds = container.getBoundingClientRect();
  const cardBounds = card.getBoundingClientRect();
  container.scrollTo({
    left:
      container.scrollLeft +
      cardBounds.left -
      bounds.left -
      bounds.width / 2 +
      cardBounds.width / 2,
    behavior: reduced ? "auto" : "smooth",
  });
}

function bindCareer(root: HTMLElement, scope: Scope, reduced: boolean) {
  const panels = [
    root.querySelector<HTMLElement>("#career-page-1"),
    root.querySelector<HTMLElement>("#career-page-2"),
  ];
  const indicator = root.querySelector<HTMLElement>("#career-page-indicator");
  const title = root.querySelector<HTMLElement>("#career-role-title");
  const description = root.querySelector<HTMLElement>("#career-role-desc");
  if (!panels[0] || !panels[1]) return;
  let current = 0;
  let textTimer: number | undefined;
  const copies = [
    [
      "As an AI Product Manager,",
      "Bridging the gap between human psychology and engineering to design optimal AI experiences.",
      "The next frontier of user experience will come from integrating deep human intent.",
    ],
    [
      "As an IT Innovator,",
      "Orchestrating digital transformation and empowering people through strategic growth initiatives.",
      "Meaningful innovation is rooted in continuous learning and robust support systems.",
    ],
  ];
  for (const element of [...panels, indicator, title, description]) {
    if (!element) continue;
    scope.remember(element);
    if (element === title || element === description || element === indicator)
      scope.children(element);
  }
  const container = root.querySelector<HTMLElement>("#career-container");
  if (container) scope.remember(container);
  // WHY: The second source panel is absolute; reserve both heights when mobile text wraps.
  const fitPanels = () => {
    if (container)
      container.style.minHeight = `${Math.max(...panels.map((panel) => panel?.scrollHeight ?? 0))}px`;
  };
  fitPanels();
  if (typeof ResizeObserver !== "undefined") {
    const observer = new ResizeObserver(fitPanels);
    panels.forEach((panel) => {
      if (panel) observer.observe(panel);
    });
    scope.cleanup(() => observer.disconnect());
  }
  const update = () => {
    panels.forEach((panel, index) => {
      if (!panel) return;
      const active = index === current;
      panel.style.opacity = active ? "1" : "0";
      panel.style.transform =
        reduced || active
          ? "translateY(0)"
          : `translateY(${index === 0 ? -10 : 10}px)`;
      panel.style.pointerEvents = active ? "auto" : "none";
      panel.inert = !active;
      panel.setAttribute("aria-hidden", String(!active));
      if (reduced) panel.style.transition = "none";
    });
    if (indicator) indicator.textContent = `0${current + 1} / 02`;
    scope.cancel(textTimer);
    const changeText = () => {
      if (title) {
        title.textContent = copies[current][0];
        title.style.opacity = "1";
      }
      if (description) {
        description.replaceChildren(
          document.createTextNode(copies[current][1]),
          document.createElement("br"),
          document.createElement("br"),
          document.createTextNode(copies[current][2]),
        );
        description.style.opacity = "1";
      }
    };
    if (reduced) changeText();
    else {
      if (title) title.style.opacity = "0";
      if (description) description.style.opacity = "0";
      textTimer = scope.later(changeText, 200);
    }
    fitPanels();
  };
  panels[1].inert = true;
  panels[1].setAttribute("aria-hidden", "true");
  for (const [id, label] of [
    ["btn-career-prev", "Previous career page"],
    ["btn-career-next", "Next career page"],
  ]) {
    const button = root.querySelector<HTMLButtonElement>(`#${id}`);
    if (!button) continue;
    scope.remember(button);
    button.setAttribute("aria-label", label);
    button.type = "button";
    scope.on(button, "click", () => {
      current = current === 0 ? 1 : 0;
      update();
    });
  }
}

function bindPointerGlow(root: HTMLElement, scope: Scope, reduced: boolean) {
  if (
    reduced ||
    !window.matchMedia("(hover: hover) and (pointer: fine)").matches
  )
    return;
  for (const [containerId, glowId] of [
    ["history-dark-container", "history-glow"],
    ["cta-dark-container", "cta-glow"],
  ]) {
    const container = root.querySelector<HTMLElement>(`#${containerId}`);
    const glow = root.querySelector<HTMLElement>(`#${glowId}`);
    if (!container || !glow) continue;
    scope.remember(glow);
    let x = container.clientWidth / 2;
    let y = container.clientHeight / 2;
    let targetX = x;
    let targetY = y;
    let frame: number | undefined;
    const animate = () => {
      x += (targetX - x) * 0.05;
      y += (targetY - y) * 0.05;
      glow.style.left = `${x}px`;
      glow.style.top = `${y}px`;
      frame =
        Math.abs(targetX - x) + Math.abs(targetY - y) > 0.2
          ? scope.frame(animate)
          : undefined;
    };
    scope.on(
      container,
      "pointermove",
      (event) => {
        const pointer = event as PointerEvent;
        if (pointer.pointerType === "touch") return;
        const bounds = container.getBoundingClientRect();
        targetX = pointer.clientX - bounds.left;
        targetY = pointer.clientY - bounds.top;
        if (frame === undefined) frame = scope.frame(animate);
      },
      { passive: true },
    );
    scope.on(container, "pointerleave", () => {
      scope.cancelFrame(frame);
      frame = undefined;
    });
  }
}

function bindFootprint(root: HTMLElement, scope: Scope, reduced: boolean) {
  const gallery = root.querySelector<HTMLElement>(
    ".footprint-gallery-container",
  );
  if (!gallery) return;
  scope.remember(gallery);
  // WHY: Native horizontal scrolling should not block vertical page gestures on touch.
  gallery.style.touchAction = "pan-x pan-y";
  let snapTimer: number | undefined;
  const cards = gallery.querySelectorAll<HTMLElement>(".group\\/card");
  for (const card of cards) {
    scope.remember(card);
    card.style.cursor = "pointer";
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute(
      "aria-label",
      `Center ${card.querySelector("h3")?.textContent?.trim() ?? "footprint"}`,
    );
    const activate = () => {
      scope.cancel(snapTimer);
      gallery.style.scrollSnapType = "none";
      centerCard(gallery, card, reduced);
      if (reduced) gallery.style.scrollSnapType = "x mandatory";
      else
        snapTimer = scope.later(() => {
          gallery.style.scrollSnapType = "x mandatory";
        }, 600);
    };
    scope.on(card, "click", activate);
    scope.on(card, "keydown", (event) => {
      const key = (event as KeyboardEvent).key;
      if (key === "Enter" || key === " ") {
        event.preventDefault();
        activate();
      }
    });
  }
}

function bindCertifications(root: HTMLElement, scope: Scope, reduced: boolean) {
  const buttons = Array.from(
    root.querySelectorAll<HTMLButtonElement>(".cert-tab-btn[data-target]"),
  );
  const panels = Array.from(root.querySelectorAll<HTMLElement>(".cert-panel"));
  const tabs = root.querySelector<HTMLElement>("#cert-tabs");
  if (!buttons.length) return;
  if (tabs) {
    scope.remember(tabs);
    tabs.setAttribute("role", "tablist");
    tabs.setAttribute("aria-label", "Certifications");
  }
  [...buttons, ...panels].forEach((element) => scope.remember(element));
  let activeId = "cert-ai";
  const choose = (id: string, animate: boolean) => {
    activeId = id;
    for (const button of buttons) {
      const active = button.dataset.target === id;
      button.className = active
        ? "cert-tab-btn active bg-zinc-900 text-white px-4 py-2 rounded transition-colors whitespace-nowrap shadow-md"
        : "cert-tab-btn text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/50 px-4 py-2 rounded transition-colors whitespace-nowrap";
      button.setAttribute("aria-selected", String(active));
      button.tabIndex = active ? 0 : -1;
    }
    for (const panel of panels) {
      const active = panel.id === id;
      panel.style.display = active ? "grid" : "none";
      panel.style.opacity = active && (!animate || reduced) ? "1" : "0";
      panel.inert = !active;
      panel.setAttribute("aria-hidden", String(!active));
      if (active && animate && !reduced)
        scope.frame(() => {
          if (activeId === id) panel.style.opacity = "1";
        });
    }
  };
  buttons.forEach((button, index) => {
    const id = button.dataset.target;
    if (!id) return;
    button.id ||= `${id}-tab`;
    button.type = "button";
    button.setAttribute("role", "tab");
    button.setAttribute("aria-controls", id);
    const panel = panels.find((candidate) => candidate.id === id);
    if (panel) {
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-labelledby", button.id);
    }
    scope.on(button, "click", () => choose(id, true));
    scope.on(button, "keydown", (event) => {
      const key = (event as KeyboardEvent).key;
      const next =
        key === "ArrowRight"
          ? (index + 1) % buttons.length
          : key === "ArrowLeft"
            ? (index - 1 + buttons.length) % buttons.length
            : key === "Home"
              ? 0
              : key === "End"
                ? buttons.length - 1
                : -1;
      if (next < 0) return;
      event.preventDefault();
      const target = buttons[next];
      if (target.dataset.target) choose(target.dataset.target, true);
      target.focus();
    });
  });
  choose(
    buttons.find((button) => button.classList.contains("active"))?.dataset
      .target ??
      buttons[0].dataset.target ??
      "cert-ai",
    false,
  );
}

function bindTestimonials(root: HTMLElement, scope: Scope, reduced: boolean) {
  const container = root.querySelector<HTMLElement>("#testimonialsContainer");
  if (!container) return;
  const cards = Array.from(
    container.querySelectorAll<HTMLElement>(".testimonial-card"),
  );
  if (!cards.length) return;
  [container, ...cards].forEach((element) => scope.remember(element));
  let current = Math.min(1, cards.length - 1);
  let snapTimer: number | undefined;
  let scrollTimer: number | undefined;
  let initialized = false;
  const highlight = (index: number) => {
    current = index;
    cards.forEach((card, candidate) => {
      card.classList.toggle("active", candidate === index);
      card.setAttribute("aria-pressed", String(candidate === index));
    });
  };
  const go = (index: number, immediate = false) => {
    index = Math.max(0, Math.min(cards.length - 1, index));
    scope.cancel(snapTimer);
    container.style.scrollSnapType = "none";
    centerCard(container, cards[index], reduced || immediate);
    highlight(index);
    snapTimer = scope.later(
      () => {
        container.style.scrollSnapType = "x mandatory";
      },
      reduced || immediate ? 0 : 600,
    );
  };
  const initialize = () => {
    if (initialized || !container.clientWidth) return;
    initialized = true;
    go(current, true);
  };
  cards.forEach((card, index) => {
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute(
      "aria-label",
      `Focus testimonial ${index + 1} of ${cards.length}`,
    );
    const activate = () => go(current === index ? index + 1 : index);
    scope.on(card, "click", activate);
    scope.on(card, "keydown", (event) => {
      const key = (event as KeyboardEvent).key;
      if (key === "Enter" || key === " ") {
        event.preventDefault();
        activate();
      } else if (key === "ArrowLeft" || key === "ArrowRight") {
        event.preventDefault();
        go(current + (key === "ArrowLeft" ? -1 : 1));
      }
    });
  });
  for (const [id, direction] of [
    ["prevTestimonial", -1],
    ["nextTestimonial", 1],
  ] as const) {
    const button = root.querySelector<HTMLElement>(`#${id}`);
    if (button) scope.on(button, "click", () => go(current + direction));
  }
  scope.on(
    container,
    "scroll",
    () => {
      scope.cancel(scrollTimer);
      scrollTimer = scope.later(() => {
        const bounds = container.getBoundingClientRect();
        const middle = bounds.left + bounds.width / 2;
        let nearest = 0;
        let distance = Infinity;
        cards.forEach((card, index) => {
          const rect = card.getBoundingClientRect();
          const delta = Math.abs(rect.left + rect.width / 2 - middle);
          if (delta < distance) {
            distance = delta;
            nearest = index;
          }
        });
        highlight(nearest);
      }, 50);
    },
    { passive: true },
  );
  highlight(current);
  if (typeof IntersectionObserver !== "undefined") {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) initialize();
      },
      { threshold: 0.1 },
    );
    observer.observe(container);
    scope.cleanup(() => observer.disconnect());
  }
  scope.frame(initialize);
}

function bindLifeGallery(root: HTMLElement, scope: Scope, reduced: boolean) {
  const tabs = Array.from(
    root.querySelectorAll<HTMLButtonElement>(".life-filter-btn[data-target]"),
  );
  if (!tabs.length) return;
  const left = Array.from(root.querySelectorAll<HTMLElement>(".left-col"));
  const galleries = Array.from(
    root.querySelectorAll<HTMLElement>(".right-gallery"),
  );
  [...tabs, ...left, ...galleries].forEach((element) =>
    scope.remember(element),
  );
  let current = "col-culinary";
  const animate = (element: HTMLElement) => {
    if (reduced) {
      element.style.opacity = "1";
      element.style.transform = "none";
      return;
    }
    element.style.transition = "none";
    element.style.opacity = "0";
    element.style.transform = "translateY(16px)";
    scope.frame(() =>
      scope.frame(() => {
        element.style.transition =
          "opacity 500ms ease-out, transform 500ms ease-out";
        element.style.opacity = "1";
        element.style.transform = "translateY(0)";
      }),
    );
  };
  const choose = (id: string, shouldAnimate: boolean) => {
    if (!tabs.some((tab) => tab.dataset.target === id)) return;
    current = id;
    for (const tab of tabs) {
      const active = tab.dataset.target === id;
      tab.classList.toggle("bg-slate-100", active);
      tab.classList.toggle("border-slate-100", active);
      tab.classList.toggle("bg-white", !active);
      tab.classList.toggle("border-gray-200", !active);
      tab.setAttribute("aria-pressed", String(active));
      tab.setAttribute("aria-controls", `gallery-${tab.dataset.target}`);
    }
    for (const column of left)
      column.style.display = column.id === id ? "block" : "none";
    for (const gallery of galleries) {
      const active = gallery.id === `gallery-${id}`;
      gallery.classList.toggle("hidden", !active);
      gallery.classList.toggle("grid", active);
      gallery.style.display = active ? "grid" : "none";
      gallery.inert = !active;
      gallery.setAttribute("aria-hidden", String(!active));
      if (active && shouldAnimate) animate(gallery);
    }
    try {
      window.sessionStorage.setItem("activeLifeTab", id);
    } catch {
      /* Storage may be unavailable in private previews. */
    }
  };
  let saved: string | null = null;
  try {
    saved = window.sessionStorage.getItem("activeLifeTab");
  } catch {
    /* Use the source default. */
  }
  choose(
    saved && tabs.some((tab) => tab.dataset.target === saved) ? saved : current,
    false,
  );
  tabs.forEach((tab) =>
    scope.on(tab, "click", () => {
      if (tab.dataset.target) choose(tab.dataset.target, true);
    }),
  );

  const travel = root.querySelector<HTMLElement>("#gallery-col-travel");
  if (!travel) return;
  const destinationButtons = Array.from(
    root.querySelectorAll<HTMLElement>(".travel-dest-btn[data-filter]"),
  );
  const columns = Array.from(travel.children).filter(
    (element): element is HTMLElement => element instanceof HTMLElement,
  );
  const images = Array.from(
    travel.querySelectorAll<HTMLElement>("[data-dest]"),
  );
  [...destinationButtons, ...columns, ...images].forEach((element) =>
    scope.remember(element),
  );
  destinationButtons.forEach((button) => {
    const dot = button.querySelector<HTMLElement>(".indicator-dot");
    if (dot) scope.remember(dot);
    scope.on(button, "click", (event) => {
      event.preventDefault();
      const filter = button.dataset.filter;
      if (!filter) return;
      for (const destination of destinationButtons) {
        const active = destination === button;
        destination.classList.toggle("text-black", active);
        destination.classList.toggle("text-zinc-400", !active);
        destination.classList.toggle(
          "before:bg-zinc-200",
          active && filter !== "All Destinations",
        );
        destination.classList.toggle(
          "before:bg-transparent",
          !active || filter === "All Destinations",
        );
        destination.setAttribute("aria-current", active ? "true" : "false");
        const indicator =
          destination.querySelector<HTMLElement>(".indicator-dot");
        if (indicator)
          indicator.style.display = active ? "inline-block" : "none";
      }
      const ordered = [...images];
      if (filter === "All Destinations") {
        for (let index = ordered.length - 1; index > 0; index--) {
          const other = Math.floor(Math.random() * (index + 1));
          [ordered[index], ordered[other]] = [ordered[other], ordered[index]];
        }
      }
      // WHY: display:contents lets CSS redistribute items without reparenting React-owned nodes.
      columns.forEach((column) => {
        column.style.display = "contents";
      });
      ordered.forEach((item, index) => {
        const visible =
          filter === "All Destinations" || item.dataset.dest === filter;
        item.classList.toggle("hidden", !visible);
        item.style.display = visible ? "block" : "none";
        item.style.order = String(index);
        if (visible) animate(item);
      });
    });
  });
}

function bindLectures(root: HTMLElement, scope: Scope, reduced: boolean) {
  const carousels = root.querySelectorAll<HTMLElement>(
    "[data-lecture-carousel]",
  );
  carousels.forEach((carousel, carouselIndex) => {
    const track = carousel.querySelector<HTMLElement>(".lecture-slides");
    if (!track) return;
    const slides = Array.from(track.querySelectorAll<HTMLImageElement>("img"));
    if (slides.length <= 1) return;
    const previous =
      carousel.querySelector<HTMLButtonElement>("[data-prev-btn]");
    const next = carousel.querySelector<HTMLButtonElement>("[data-next-btn]");
    const indicators = carousel.querySelector<HTMLElement>(
      ".lecture-indicators",
    );
    [carousel, track, ...slides, previous, next, indicators].forEach(
      (element) => {
        if (element) scope.remember(element);
      },
    );
    carousel.setAttribute("role", "region");
    carousel.setAttribute("aria-roledescription", "carousel");
    carousel.setAttribute("aria-label", `Lecture ${carouselIndex + 1} photos`);
    carousel.tabIndex = 0;
    carousel.style.touchAction = "pan-y";
    if (reduced) track.style.transition = "none";
    let index = 0;
    const dots: HTMLButtonElement[] = [];
    const update = (target: number) => {
      index = (target + slides.length) % slides.length;
      track.dataset.currentIndex = String(index);
      track.style.transform = `translateX(-${index * 100}%)`;
      slides.forEach((slide, candidate) =>
        slide.setAttribute("aria-hidden", String(candidate !== index)),
      );
      dots.forEach((dot, candidate) => {
        dot.className =
          candidate === index
            ? "w-3 h-1.5 rounded-full bg-white transition-all focus:outline-none"
            : "w-1.5 h-1.5 rounded-full bg-white/40 transition-all hover:bg-white/70 focus:outline-none";
        dot.setAttribute("aria-current", String(candidate === index));
      });
    };
    for (const [button, direction, label] of [
      [previous, -1, "Previous photo"],
      [next, 1, "Next photo"],
    ] as const) {
      if (!button) continue;
      button.classList.remove("hidden");
      button.type = "button";
      button.setAttribute("aria-label", label);
      scope.on(button, "click", (event) => {
        event.stopPropagation();
        update(index + direction);
      });
    }
    if (indicators) {
      indicators.classList.remove("hidden");
      slides.forEach((_, candidate) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.setAttribute(
          "aria-label",
          `Show photo ${candidate + 1} of ${slides.length}`,
        );
        scope.on(dot, "click", (event) => {
          event.stopPropagation();
          update(candidate);
        });
        indicators.append(dot);
        dots.push(dot);
        scope.cleanup(() => dot.remove());
      });
    }
    const touch = window.matchMedia("(hover: none), (pointer: coarse)");
    const showTouchControls = () => {
      for (const element of [previous, next, indicators]) {
        if (!element) continue;
        if (touch.matches) element.style.opacity = "1";
        else element.style.removeProperty("opacity");
      }
    };
    showTouchControls();
    scope.on(touch, "change", showTouchControls);
    scope.on(carousel, "keydown", (event) => {
      const key = (event as KeyboardEvent).key;
      if (key === "ArrowLeft" || key === "ArrowRight") {
        event.preventDefault();
        event.stopPropagation();
        update(index + (key === "ArrowLeft" ? -1 : 1));
      }
    });
    let start: { x: number; y: number } | null = null;
    scope.on(
      carousel,
      "pointerdown",
      (event) => {
        const pointer = event as PointerEvent;
        if (pointer.pointerType === "touch")
          start = { x: pointer.clientX, y: pointer.clientY };
      },
      { passive: true },
    );
    scope.on(
      carousel,
      "pointerup",
      (event) => {
        const pointer = event as PointerEvent;
        if (!start) return;
        const dx = pointer.clientX - start.x;
        const dy = pointer.clientY - start.y;
        start = null;
        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy))
          update(index + (dx < 0 ? 1 : -1));
      },
      { passive: true },
    );
    scope.on(carousel, "pointercancel", () => {
      start = null;
    });
    update(0);
  });
}

/** Bind only the current JSX page; do not load any original script bundle. */
export function useOriginalPageInteractions(
  pageId: string,
  rootRef?: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    const root =
      rootRef?.current ?? document.querySelector<HTMLElement>("main");
    if (!root) return;
    const scope = createScope();
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (pageId === "home" || pageId === "career") {
      bindCareer(root, scope, reduced);
      bindPointerGlow(root, scope, reduced);
      bindFootprint(root, scope, reduced);
      bindTestimonials(root, scope, reduced);
    }
    if (pageId === "qualified") bindCertifications(root, scope, reduced);
    if (pageId === "enjoy") bindLifeGallery(root, scope, reduced);
    if (pageId === "lectures") bindLectures(root, scope, reduced);
    return () => scope.dispose();
  }, [pageId, rootRef]);
}
