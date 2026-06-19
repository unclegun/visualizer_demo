function updateDemoOutput(control) {
  const output = document.querySelector(`[data-demo-output][for="${control.id}"]`);
  if (!output) {
    return;
  }

  if (control.type === "range") {
    if (control.id === "pftGlowRange") {
      output.textContent = `${control.value}%`;
      return;
    }

    if (control.id === "pftRadiusRange") {
      output.textContent = `${control.value}px`;
      return;
    }

    if (control.id === "pftDepthRange") {
      output.textContent = `${(Number(control.value) / 100).toFixed(2)}x`;
      return;
    }

    output.textContent = control.value;
    return;
  }

  if (control.type === "color") {
    output.textContent = control.value;
    return;
  }

  if (control instanceof HTMLSelectElement) {
    output.textContent = control.options[control.selectedIndex]?.textContent ?? control.value;
  }
}

function initializeControlOutputs(root) {
  const controls = root.querySelectorAll("input[type='range'], input[type='color'], select");

  controls.forEach((control) => {
    updateDemoOutput(control);
    control.addEventListener("input", () => updateDemoOutput(control));
    control.addEventListener("change", () => updateDemoOutput(control));
  });
}

function initializeThemeLab(root) {
  const lab = root.querySelector("[data-pft-theme-lab]");
  if (!lab) {
    return;
  }

  const hue = root.querySelector("#pftHueRange");
  const glow = root.querySelector("#pftGlowRange");
  const radius = root.querySelector("#pftRadiusRange");
  const depth = root.querySelector("#pftDepthRange");
  const density = root.querySelector("#pftDensitySelect");
  const accent = root.querySelector("#pftAccentColor");

  if (!(hue && glow && radius && depth && density && accent)) {
    return;
  }

  const applyThemeVariables = () => {
    lab.style.setProperty("--pft-hue", hue.value);
    lab.style.setProperty("--pft-glow", (Number(glow.value) / 100).toFixed(2));
    lab.style.setProperty("--pft-radius", `${radius.value}px`);
    lab.style.setProperty("--pft-depth", (Number(depth.value) / 100).toFixed(2));
    lab.style.setProperty("--pft-density", (1 + (density.selectedIndex * 0.12)).toFixed(2));
    lab.style.setProperty("--pft-manual-accent", accent.value);
  };

  [hue, glow, radius, depth, density, accent].forEach((control) => {
    control.addEventListener("input", applyThemeVariables);
    control.addEventListener("change", applyThemeVariables);
  });

  applyThemeVariables();
}

document.addEventListener("DOMContentLoaded", () => {
  const root = document.querySelector(".runtime-css-page");
  if (!root) {
    return;
  }

  initializeControlOutputs(root);
  initializeThemeLab(root);
});