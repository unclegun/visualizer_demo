import { qsa } from "./dom.js";

export function initializeNavigation() {
  const current = window.location.pathname.split("/").pop() || "index.html";
  const section = document.body.dataset.navSection || "";
  const links = qsa("[data-nav]");

  links.forEach((link) => {
    const href = link.getAttribute("href") || "";
    const grouped = link.dataset.navSection && section && link.dataset.navSection === section;
    const isActive = grouped || href.endsWith(current) || (current === "index.html" && href === "../index.html") || href === "index.html";
    link.classList.toggle("active", isActive);
  });

  const active = document.querySelector(".site-navbar .nav-link.active");
  const navList = document.querySelector(".site-navbar .navbar-nav");
  const nav = document.querySelector(".site-navbar");
  if (!active || !navList || !nav || !nav.hasAttribute("data-nav-rail") || window.innerWidth < 992) {
    return;
  }

  let rail = document.querySelector(".site-navbar .nav-link-rail");
  if (!rail) {
    rail = document.createElement("span");
    rail.className = "nav-link-rail";
    navList.parentElement?.appendChild(rail);
  }

  const hostRect = navList.parentElement?.getBoundingClientRect();
  const activeRect = active.getBoundingClientRect();
  if (!hostRect) {
    return;
  }

  rail.style.transform = `translateX(${activeRect.left - hostRect.left}px)`;
  rail.style.width = `${activeRect.width}px`;
  nav.classList.add("show-rail");
}
