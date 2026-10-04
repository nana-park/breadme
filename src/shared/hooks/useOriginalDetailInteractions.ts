import { useEffect, type RefObject } from "react";
import { assetUrl, originalHref } from "@/shared/utils/originalPaths";

// WHAT: Original Projects disclosures, detail-page tabs, and bounded media integrations.
// WHY: Preserve reachable source behavior without running legacy scripts or moving JSX nodes.
function createDetailScope() {
  const cleanups: Array<() => void> = [];
  const remembered = new WeakSet<Element>();
  const timers = new Set<number>();
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
      const inert = element instanceof HTMLElement ? element.inert : undefined;
      cleanups.push(() => {
        for (const attribute of Array.from(element.attributes))
          element.removeAttribute(attribute.name);
        for (const [name, value] of attributes)
          element.setAttribute(name, value);
        if (element instanceof HTMLElement) element.inert = inert ?? false;
      });
    },
    text(element: Element) {
      const children = Array.from(element.childNodes);
      cleanups.push(() => element.replaceChildren(...children));
    },
    on(target: EventTarget, event: string, listener: EventListener) {
      target.addEventListener(event, listener);
      cleanups.push(() => target.removeEventListener(event, listener));
    },
    later(callback: () => void, delay: number) {
      const timer = window.setTimeout(() => {
        timers.delete(timer);
        callback();
      }, delay);
      timers.add(timer);
      return timer;
    },
    cancel(timer: number | undefined) {
      if (timer === undefined) return;
      window.clearTimeout(timer);
      timers.delete(timer);
    },
    dispose() {
      for (const timer of timers) window.clearTimeout(timer);
      for (const cleanup of cleanups.reverse()) cleanup();
    },
  };
}
type DetailScope = ReturnType<typeof createDetailScope>;

function bindProjectLists(
  root: HTMLElement,
  scope: DetailScope,
  reduced: boolean,
) {
  const moreButtons = root.querySelectorAll<HTMLButtonElement>(
    '[data-original-click="expandProjects(this)"]',
  );
  moreButtons.forEach((button, index) => {
    const card = button.parentElement;
    if (!card) return;
    const items = Array.from(
      card.querySelectorAll<HTMLElement>(".hidden-project"),
    );
    const label = button.querySelector("span");
    const icon = button.querySelector("svg");
    for (const element of [card, button, label, icon, ...items])
      if (element) scope.remember(element);
    if (label) scope.text(label);
    button.type = "button";
    items.forEach((item, itemIndex) => {
      item.id ||= `original-project-extra-${index}-${itemIndex}`;
      item.inert = item.classList.contains("hidden");
      item.setAttribute("aria-hidden", String(item.inert));
    });
    button.setAttribute(
      "aria-controls",
      items.map((item) => item.id).join(" "),
    );
    scope.on(button, "click", () => {
      const hidden = items.filter((item) => item.classList.contains("hidden"));
      if (hidden.length)
        hidden.slice(0, 3).forEach((item) => item.classList.remove("hidden"));
      else items.forEach((item) => item.classList.add("hidden"));
      const expanded =
        items.length > 0 &&
        items.every((item) => !item.classList.contains("hidden"));
      items.forEach((item) => {
        item.inert = item.classList.contains("hidden");
        item.setAttribute("aria-hidden", String(item.inert));
      });
      card.classList.toggle("is-expanded", expanded);
      button.setAttribute("aria-expanded", String(expanded));
      if (label)
        label.textContent = expanded
          ? "View fewer projects"
          : "View more projects";
      icon?.classList.toggle("rotate-180", expanded);
    });
  });

  root
    .querySelectorAll<HTMLButtonElement>("button[data-original-click]")
    .forEach((button, index) => {
      const more = button.querySelector<HTMLElement>(".more-text");
      const less = button.querySelector<HTMLElement>(".less-text");
      const list = button.parentElement?.parentElement;
      if (!more || !less || !list) return;
      const icon = button.querySelector("svg");
      const content = Array.from(list.children).filter(
        (child): child is HTMLElement =>
          child instanceof HTMLElement && child !== button.parentElement,
      );
      for (const element of [button, list, more, less, icon, ...content])
        if (element) scope.remember(element);
      button.type = "button";
      content.forEach((item, itemIndex) => {
        item.id ||= `original-project-group-${index}-${itemIndex}`;
      });
      button.setAttribute(
        "aria-controls",
        content.map((item) => item.id).join(" "),
      );
      const update = (expanded: boolean) => {
        list.classList.toggle("is-expanded", expanded);
        button.setAttribute("aria-expanded", String(expanded));
        more.classList.toggle("hidden", expanded);
        less.classList.toggle("hidden", !expanded);
        icon?.classList.toggle("rotate-180", expanded);
        content.forEach((item) => {
          item.inert = !expanded;
          item.setAttribute("aria-hidden", String(!expanded));
        });
      };
      update(list.classList.contains("is-expanded"));
      scope.on(button, "click", (event) => {
        event.stopPropagation();
        const expanded = !list.classList.contains("is-expanded");
        update(expanded);
        if (!expanded)
          list.scrollIntoView({
            behavior: reduced ? "auto" : "smooth",
            block: "nearest",
          });
      });
    });
}

function bindProjectDisclosures(
  root: HTMLElement,
  scope: DetailScope,
  reduced: boolean,
) {
  const entries = Array.from(
    root.querySelectorAll<HTMLDetailsElement>("details"),
  ).flatMap((details, index) => {
    const summary = details.querySelector<HTMLElement>(":scope > summary");
    if (!summary) return [];
    const content = Array.from(details.children).filter(
      (child): child is HTMLElement =>
        child instanceof HTMLElement && child !== summary,
    );
    for (const element of [details, summary, ...content])
      scope.remember(element);
    content.forEach((element, contentIndex) => {
      element.id ||= `original-project-detail-${index}-${contentIndex}`;
      element.inert = !details.open;
      element.setAttribute("aria-hidden", String(!details.open));
    });
    summary.setAttribute(
      "aria-controls",
      content.map((element) => element.id).join(" "),
    );
    summary.setAttribute("aria-expanded", String(details.open));
    return [
      {
        details,
        summary,
        content,
        expanded: details.open,
        timer: undefined as number | undefined,
        originalHeight: details.style.height,
        originalOverflow: details.style.overflow,
        originalTransition: details.style.transition,
        contentStyles: content.map((element) => ({
          opacity: element.style.opacity,
          transition: element.style.transition,
        })),
      },
    ];
  });
  const update = (entry: (typeof entries)[number], expanded: boolean) => {
    const { details, summary, content } = entry;
    scope.cancel(entry.timer);
    entry.expanded = expanded;
    summary.setAttribute("aria-expanded", String(expanded));
    content.forEach((element) => {
      element.inert = !expanded;
      element.setAttribute("aria-hidden", String(!expanded));
    });
    const finish = () => {
      details.open = expanded;
      details.style.height = entry.originalHeight;
      details.style.overflow = entry.originalOverflow;
      details.style.transition = entry.originalTransition;
      content.forEach((element, index) => {
        element.style.opacity = entry.contentStyles[index].opacity;
        element.style.transition = entry.contentStyles[index].transition;
      });
      entry.timer = undefined;
    };
    if (reduced) {
      finish();
      return;
    }
    // WHY: Animate the existing details box instead of reparenting React-owned children.
    const start = details.getBoundingClientRect().height;
    const wasClosed = !details.open;
    details.open = true;
    details.style.height = entry.originalHeight;
    const fullHeight = details.getBoundingClientRect().height;
    const computed = window.getComputedStyle(details);
    const closedHeight =
      summary.getBoundingClientRect().height +
      (parseFloat(computed.borderTopWidth) || 0) +
      (parseFloat(computed.borderBottomWidth) || 0);
    details.style.height = `${start}px`;
    details.style.overflow = "hidden";
    details.style.transition = "height 0.4s ease-in-out";
    content.forEach((element) => {
      element.style.transition = "opacity 0.4s ease-in-out";
      if (wasClosed) element.style.opacity = "0";
    });
    void details.offsetHeight;
    details.style.height = `${expanded ? fullHeight : closedHeight}px`;
    content.forEach((element) => {
      element.style.opacity = expanded ? "1" : "0";
    });
    entry.timer = scope.later(finish, 400);
  };
  entries.forEach((entry) =>
    scope.on(entry.summary, "click", (event) => {
      event.preventDefault();
      const opening = !entry.expanded;
      if (opening)
        entries.forEach((other) => {
          if (other !== entry && other.expanded) update(other, false);
        });
      update(entry, opening);
    }),
  );
}

function pauseEmbeddedVideo(iframe: HTMLIFrameElement) {
  const url = new URL(iframe.src, window.location.href);
  if (
    !["www.youtube.com", "www.youtube-nocookie.com", "youtube.com"].includes(
      url.hostname,
    )
  )
    return;
  iframe.contentWindow?.postMessage(
    JSON.stringify({ event: "command", func: "pauseVideo", args: [] }),
    url.origin,
  );
}

function bindDetailTabs(
  root: HTMLElement,
  scope: DetailScope,
  reduced: boolean,
) {
  for (const prefix of ["aicall", "hopzie", "mentoring"]) {
    const buttons = Array.from(
      root.querySelectorAll<HTMLButtonElement>(`.${prefix}-tab-btn`),
    );
    const panels = Array.from(
      root.querySelectorAll<HTMLElement>(`.${prefix}-tab-content`),
    );
    if (!buttons.length) continue;
    const tabList = root.querySelector<HTMLElement>(`#${prefix}-tabs`);
    if (tabList) {
      scope.remember(tabList);
      tabList.setAttribute("role", "tablist");
      tabList.setAttribute("aria-label", "Project features");
    }
    buttons.forEach((button, index) => {
      scope.remember(button);
      button.type = "button";
      button.id ||= `original-${prefix}-tab-${index}`;
      button.setAttribute("role", "tab");
      button.setAttribute("aria-controls", button.dataset.target ?? "");
    });
    panels.forEach((panel) => {
      scope.remember(panel);
      panel.setAttribute("role", "tabpanel");
      const button = buttons.find(
        (candidate) => candidate.dataset.target === panel.id,
      );
      if (button) panel.setAttribute("aria-labelledby", button.id);
      panel.querySelectorAll<HTMLIFrameElement>("iframe").forEach((iframe) => {
        scope.on(iframe, "load", () => {
          if (panel.hidden) pauseEmbeddedVideo(iframe);
        });
        scope.cleanup(() => pauseEmbeddedVideo(iframe));
      });
    });
    let selected = Math.max(
      0,
      buttons.findIndex((button) => button.classList.contains("active")),
    );
    const select = (index: number, animate = true) => {
      const target = buttons[index].dataset.target;
      if (!panels.some((panel) => panel.id === target)) return;
      selected = index;
      buttons.forEach((button, buttonIndex) => {
        const active = buttonIndex === index;
        for (const name of ["bg-black", "text-white", "active"])
          button.classList.toggle(name, active);
        for (const name of [
          "text-zinc-500",
          "hover:bg-gray-100",
          "hover:text-zinc-900",
        ])
          button.classList.toggle(name, !active);
        button.setAttribute("aria-selected", String(active));
        button.tabIndex = active ? 0 : -1;
      });
      panels.forEach((panel) => {
        const active = panel.id === target;
        panel.classList.remove("tab-animate-in");
        panel.classList.toggle("hidden", !active);
        panel.classList.toggle("block", active);
        panel.hidden = !active;
        panel.inert = !active;
        panel.setAttribute("aria-hidden", String(!active));
        if (!active)
          panel
            .querySelectorAll<HTMLIFrameElement>("iframe")
            .forEach(pauseEmbeddedVideo);
        if (active && animate && !reduced) {
          void panel.offsetWidth;
          panel.classList.add("tab-animate-in");
        }
      });
    };
    buttons.forEach((button, index) => {
      scope.on(button, "click", () => select(index));
      scope.on(button, "keydown", (event) => {
        const key = (event as KeyboardEvent).key;
        let next: number;
        if (key === "ArrowRight") next = (selected + 1) % buttons.length;
        else if (key === "ArrowLeft")
          next = (selected - 1 + buttons.length) % buttons.length;
        else if (key === "Home") next = 0;
        else if (key === "End") next = buttons.length - 1;
        else return;
        event.preventDefault();
        select(next);
        buttons[next].focus();
      });
    });
    select(selected, false);
  }
}

function bindDetailControls(root: HTMLElement, scope: DetailScope) {
  root
    .querySelectorAll<HTMLElement>("[data-original-href]")
    .forEach((element) => {
      if (element.dataset.originalHref?.startsWith("javascript:"))
        scope.on(element, "click", (event) => event.preventDefault());
    });
  root
    .querySelectorAll<HTMLElement>("[data-original-click]")
    .forEach((element) => {
      const source = element.dataset.originalClick ?? "";
      if (source === "window.location.href='../projects.html'")
        scope.on(element, "click", () =>
          window.location.assign(originalHref("projects.html")),
        );
      if (source.includes("storefront-overlay")) {
        const overlay = root.querySelector<HTMLElement>("#storefront-overlay");
        if (!overlay) return;
        scope.remember(overlay);
        scope.remember(element);
        element.setAttribute("aria-controls", overlay.id);
        element.setAttribute(
          "aria-pressed",
          String(overlay.style.opacity === "0"),
        );
        scope.on(element, "click", () => {
          const generated = overlay.style.opacity !== "0";
          overlay.style.opacity = generated ? "0" : "1";
          overlay.setAttribute("aria-hidden", String(generated));
          overlay.inert = generated;
          element.setAttribute("aria-pressed", String(generated));
        });
      }
      if (
        source.includes(".hopzie-tab-btn") &&
        source.includes("tab-storefront")
      ) {
        scope.on(element, "click", (event) => {
          event.preventDefault();
          root
            .querySelector<HTMLButtonElement>(
              '.hopzie-tab-btn[data-target="tab-storefront"]',
            )
            ?.click();
        });
      }
    });
  // WHAT: Preserve only the source's five explicit creator-avatar fallbacks, once each.
  const initials: Record<string, string> = {
    Haeyong: "H",
    LimBbeum: "L",
    JungWon: "J",
    Dashu: "D",
    Gomikong: "G",
  };
  root
    .querySelectorAll<HTMLImageElement>(
      "img.creator-avatar[data-original-error]",
    )
    .forEach((img) => {
      const initial = initials[img.alt];
      if (!initial) return;
      scope.remember(img);
      let attempted = false;
      const fallback = () => {
        if (attempted) return;
        attempted = true;
        img.src = assetUrl(
          `https://ui-avatars.com/api/?name=${initial}&background=050505&color=fff`,
        );
      };
      scope.on(img, "error", fallback);
      if (img.complete && img.naturalWidth === 0) fallback();
    });
}

function bindMentoringMockup(root: HTMLElement, scope: DetailScope) {
  root
    .querySelectorAll<HTMLElement>(".original-mentoring-mockup-frame")
    .forEach((frame) => {
      const mockup = frame.querySelector<HTMLElement>(
        ".original-mentoring-mockup",
      );
      if (!mockup) return;
      scope.remember(frame);
      scope.remember(mockup);
      // WHY: The original document zoom used iframe width, never the outer browser width.
      frame.style.overflow = "hidden";
      const resize = () => {
        const width = frame.clientWidth || frame.getBoundingClientRect().width;
        if (width > 0) mockup.style.zoom = String(width / 850);
        if (frame.clientHeight > 0)
          mockup.style.minHeight = `${frame.clientHeight}px`;
      };
      resize();
      if (typeof ResizeObserver !== "undefined") {
        const observer = new ResizeObserver(resize);
        observer.observe(frame);
        scope.cleanup(() => observer.disconnect());
      } else scope.on(window, "resize", resize);
      const toggle = mockup.querySelector<HTMLInputElement>("#auto-toggle");
      const config = mockup.querySelector<HTMLElement>("#auto-config");
      if (!toggle || !config) return;
      scope.remember(toggle);
      scope.remember(config);
      const checked = toggle.checked;
      scope.cleanup(() => {
        toggle.checked = checked;
      });
      toggle.setAttribute("aria-label", "Scheduled automation demonstration");
      toggle.setAttribute("aria-controls", config.id);
      const update = () => {
        config.style.display = toggle.checked ? "flex" : "none";
        config.inert = !toggle.checked;
        config.setAttribute("aria-hidden", String(!toggle.checked));
        toggle.setAttribute("aria-expanded", String(toggle.checked));
      };
      scope.on(toggle, "change", update);
      update();
    });
}

type YouTubePlayer = {
  mute(): void;
  seekTo(seconds: number, allowSeekAhead?: boolean): void;
  playVideo(): void;
  pauseVideo(): void;
  getCurrentTime(): number;
  destroy(): void;
};
type YouTubeApi = {
  Player: new (
    element: HTMLElement,
    options: { events: { onReady(event: { target: YouTubePlayer }): void } },
  ) => YouTubePlayer;
};
type YouTubeWindow = Window & {
  YT?: YouTubeApi;
  onYouTubeIframeAPIReady?: () => void;
};
type YouTubeRequest = {
  promise: Promise<YouTubeApi>;
  consumers: number;
  cancel(): void;
};
let youtubeRequest: YouTubeRequest | undefined;

// WHAT: One ref-counted YouTube API request, shared across mounts and StrictMode retries.
// WHY: A pending page must not leave a global callback or timer behind after navigation.
function acquireYouTubeApi() {
  const target = window as YouTubeWindow;
  if (target.YT?.Player)
    return { promise: Promise.resolve(target.YT), release() {} };
  if (!youtubeRequest) {
    let cancel = () => {};
    const promise = new Promise<YouTubeApi>((resolve, reject) => {
      const previous = target.onYouTubeIframeAPIReady;
      let settled = false;
      const existing = document.querySelector<HTMLScriptElement>(
        'script[src="https://www.youtube.com/iframe_api"]',
      );
      const script = existing ?? document.createElement("script");
      const restore = () => {
        window.clearTimeout(timeout);
        script.removeEventListener("error", failed);
        if (target.onYouTubeIframeAPIReady === ready) {
          if (previous) target.onYouTubeIframeAPIReady = previous;
          else delete target.onYouTubeIframeAPIReady;
        }
      };
      const complete = (api?: YouTubeApi) => {
        if (settled) return;
        settled = true;
        restore();
        youtubeRequest = undefined;
        if (api) resolve(api);
        else {
          if (!existing) script.remove();
          reject(new Error("YouTube API unavailable"));
        }
      };
      const ready = () => {
        try {
          previous?.();
        } finally {
          complete(target.YT?.Player ? target.YT : undefined);
        }
      };
      const failed = () => complete();
      const timeout = window.setTimeout(failed, 15000);
      target.onYouTubeIframeAPIReady = ready;
      script.addEventListener("error", failed);
      cancel = failed;
      if (!existing) {
        script.src = "https://www.youtube.com/iframe_api";
        script.async = true;
        document.head.append(script);
      }
    });
    youtubeRequest = { promise, consumers: 0, cancel: () => cancel() };
  }
  const request = youtubeRequest;
  request.consumers += 1;
  return {
    promise: request.promise,
    release() {
      request.consumers -= 1;
      if (request.consumers === 0 && youtubeRequest === request)
        request.cancel();
    },
  };
}

function bindAboutMedia(
  root: HTMLElement,
  scope: DetailScope,
  reduced: boolean,
) {
  root.querySelectorAll<HTMLVideoElement>("video").forEach((video) => {
    const autoplay = video.autoplay;
    const muted = video.muted;
    video.muted = true;
    if (reduced) {
      video.autoplay = false;
      video.pause();
    } else if (video.autoplay) void video.play()?.catch(() => {});
    scope.cleanup(() => {
      video.pause();
      video.autoplay = autoplay;
      video.muted = muted;
    });
  });
  const host = root.querySelector<HTMLElement>("#ebs-yt-player");
  if (!host) return;
  // WHY: A real, controllable embed remains usable even when the optional API cannot load.
  const iframe = document.createElement("iframe");
  const url = new URL("https://www.youtube.com/embed/BQGPG91YsLo");
  url.search = new URLSearchParams({
    start: "2230",
    autoplay: reduced ? "0" : "1",
    mute: "1",
    controls: "1",
    rel: "0",
    playsinline: "1",
    enablejsapi: "1",
    origin: window.location.origin,
  }).toString();
  iframe.src = url.href;
  iframe.title = "Building Warm Conversation — EBS interview";
  iframe.width = "100%";
  iframe.height = "100%";
  iframe.style.border = "0";
  iframe.allow = "autoplay; encrypted-media; picture-in-picture";
  iframe.allowFullscreen = true;
  host.append(iframe);
  const request = acquireYouTubeApi();
  let player: YouTubePlayer | undefined;
  let interval: number | undefined;
  let disposed = false;
  const clips = [
    { start: 2230, end: 2257 },
    { start: 2295, end: 2310 },
  ];
  let clip = 0;
  void request.promise
    .then((api) => {
      if (disposed) return;
      player = new api.Player(iframe, {
        events: {
          onReady({ target }) {
            if (disposed) return;
            target.mute();
            target.seekTo(clips[0].start, true);
            if (!reduced) target.playVideo();
            if (interval !== undefined) window.clearInterval(interval);
            interval = window.setInterval(() => {
              if (disposed || document.visibilityState === "hidden") return;
              if (target.getCurrentTime() >= clips[clip].end) {
                clip = (clip + 1) % clips.length;
                target.seekTo(clips[clip].start, true);
              }
            }, 250);
          },
        },
      });
    })
    .catch(() => {
      /* The native iframe and original full-interview link remain available. */
    });
  scope.cleanup(() => {
    disposed = true;
    request.release();
    if (interval !== undefined) window.clearInterval(interval);
    player?.destroy();
    iframe.remove();
  });
}

/** Attach only current-page behavior; every listener, transition, and player is disposable. */
export function useOriginalDetailInteractions(
  pageId: string,
  rootRef?: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    const root =
      rootRef?.current ?? document.querySelector<HTMLElement>("main");
    if (!root) return;
    const scope = createDetailScope();
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (pageId === "projects") {
      bindProjectLists(root, scope, reduced);
      bindProjectDisclosures(root, scope, reduced);
    }
    if (
      [
        "llm-based-voice-ivr",
        "hopzie-oneclickbuilder",
        "ai-mentoring-agent-detail",
      ].includes(pageId)
    ) {
      bindDetailTabs(root, scope, reduced);
      bindDetailControls(root, scope);
      bindMentoringMockup(root, scope);
    }
    if (pageId === "about") bindAboutMedia(root, scope, reduced);
    return () => scope.dispose();
  }, [pageId, rootRef]);
}
