export function qs(selector, root = document) {
  return root.querySelector(selector);
}

export function qsa(selector, root = document) {
  return Array.from(root.querySelectorAll(selector));
}

export function setRootVariable(name, value) {
  document.documentElement.style.setProperty(name, value);
}

export function getSiteRoot() {
  return document.body.dataset.siteRoot || ".";
}

export function joinSitePath(...parts) {
  return parts
    .filter(Boolean)
    .map((part) => part.replace(/^\/+|\/+$/g, ""))
    .join("/");
}
