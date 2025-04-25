
const playground = document.getElementById("playground");
const propertiesForm = document.getElementById("propertiesForm");
const savePlaygroundButton = document.getElementById("savePlayground");
const loadPlaygroundButton = document.getElementById("loadPlayground");
let selectedElement = null;
let currentZIndex = 1;

document.querySelectorAll(".sidebar div").forEach((item) => {
  item.addEventListener("dragstart", (e) => {
    e.dataTransfer.setData("type", e.target.dataset.type);
  });
});

playground.addEventListener("dragover", (e) => {
  e.preventDefault();
});

playground.addEventListener("drop", (e) => {
  e.preventDefault();
  const type = e.dataTransfer.getData("type");
  const element = createElement(type, e.offsetX, e.offsetY);
  playground.appendChild(element);
});

savePlaygroundButton.addEventListener("click", savePlayground);
loadPlaygroundButton.addEventListener("click", loadPlayground);

function createElement(type, x, y) {
  const el = document.createElement("div");
  el.className = "draggable";
  el.dataset.type = type;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.style.width = "100px";

  if (type === "text") {
    el.textContent = "Editable Text";
    el.style.height = `${el.scrollHeight}px`;
  } else if (type === "image") {
    const img = document.createElement("img");
    img.src = "https://e7.pngegg.com/pngimages/780/934/png-clipart-html-logo-html5-logo-icons-logos-emojis-tech-companies-thumbnail.png";
    img.style.width = "100%";
    img.style.height = "100%";
    el.appendChild(img);
  } else if (type === "shape") {
    el.innerHTML = '<svg width="100%" height="100%"><path d="M10 10 H 90 V 90 H 10 Z" fill="blue" /></svg>';
  }

  el.addEventListener("click", () => {
    currentZIndex++;
    el.style.zIndex = currentZIndex;
    showProperties(el);
  });

  enableManualDragging(el);
  return el;
}

function showProperties(el) {
  selectedElement = el;
  const type = el.dataset.type;
  let html = `
    <label>Width:<input type="text" name="width" value="${el.style.width}"></label>
    <label>Height:<input type="text" name="height" value="${el.style.height}"></label>
  `;

  if (type === "text") {
    html += `
      <label>Font Family:<input type="text" name="fontFamily"></label>
      <label>Font Size:<input type="text" name="fontSize"></label>
      <label><input type="checkbox" name="bold"> Bold</label>
      <label><input type="checkbox" name="italic"> Italic</label>
      <label><input type="checkbox" name="underline"> Underline</label>
    `;
  } else if (type === "image") {
    html += `<label>Source:<input type="text" name="src" value="${el.querySelector("img")?.src || ""}"></label>`;
  } else if (type === "shape") {
    html += `<label>SVG Path:<input type="text" name="path" value="${el.querySelector("path")?.getAttribute("d") || ""}"></label>`;
  }

  propertiesForm.innerHTML = html;
  propertiesForm.oninput = updateProperties;
}

function updateProperties(e) {
  updateElementProperties(selectedElement, propertiesForm);
}

function updateElementProperties(el, form) {
  const formData = new FormData(form);

  if (el.dataset.type === "text") {
    el.style.fontFamily = formData.get("fontFamily");
    el.style.fontSize = formData.get("fontSize").includes("px") ? formData.get("fontSize") : formData.get("fontSize") + "px";
    el.style.fontWeight = formData.get("bold") ? "bold" : "normal";
    el.style.fontStyle = formData.get("italic") ? "italic" : "normal";
    el.style.textDecoration = formData.get("underline") ? "underline" : "none";
  } else if (el.dataset.type === "image") {
    const img = el.querySelector("img");
    if (img) img.src = formData.get("src");
  } else if (el.dataset.type === "shape") {
    const path = el.querySelector("path");
    if (path) path.setAttribute("d", formData.get("path"));
  }
}

function savePlayground() {
  const elements = Array.from(playground.querySelectorAll(".draggable")).map(getElementData);
  const json = JSON.stringify(elements, null, 2);
  localStorage.setItem("playgroundState", json);
  alert("Playground saved!");
}

function loadPlayground() {
  const data = localStorage.getItem("playgroundState");
  if (!data) return alert("No saved state found!");

  playground.innerHTML = "";
  const elements = JSON.parse(data);
  elements.forEach((el) => {
    const newEl = createElementFromData(el);
    playground.appendChild(newEl);
  });

  alert("Playground loaded!");
}

function getElementData(el) {
  const type = el.dataset.type;
  const obj = {
    type,
    x: parseFloat(el.style.left),
    y: parseFloat(el.style.top),
    width: el.style.width,
    height: el.style.height,
    zIndex: el.style.zIndex || "1",
  };

  if (type === "text") {
    obj.text = el.textContent;
    obj.fontFamily = el.style.fontFamily || "";
    obj.fontSize = el.style.fontSize || "";
    obj.fontWeight = el.style.fontWeight || "normal";
    obj.fontStyle = el.style.fontStyle || "normal";
    obj.textDecoration = el.style.textDecoration || "none";
  } else if (type === "image") {
    const img = el.querySelector("img");
    if (img) obj.src = img.src;
  } else if (type === "shape") {
    const path = el.querySelector("path");
    if (path) obj.path = path.getAttribute("d");
  }

  return obj;
}

function createElementFromData(data) {
  const newEl = createElement(data.type, data.x, data.y);
  newEl.style.width = data.width;
  newEl.style.height = data.height;
  newEl.style.zIndex = data.zIndex || "1";

  if (data.type === "text") {
    newEl.textContent = data.text;
    newEl.style.fontFamily = data.fontFamily;
    newEl.style.fontSize = data.fontSize;
    newEl.style.fontWeight = data.fontWeight;
    newEl.style.fontStyle = data.fontStyle;
    newEl.style.textDecoration = data.textDecoration;
  } else if (data.type === "image") {
    const img = newEl.querySelector("img");
    if (img) img.src = data.src;
  } else if (data.type === "shape") {
    const path = newEl.querySelector("path");
    if (path) path.setAttribute("d", data.path);
  }

  return newEl;
}

function enableManualDragging(el) {
  let isDragging = false;
  let startX, startY, origLeft, origTop;

  el.addEventListener("mousedown", (e) => {
    e.preventDefault();
    isDragging = true;
    selectedElement = el;

    startX = e.clientX;
    startY = e.clientY;
    origLeft = parseFloat(el.style.left);
    origTop = parseFloat(el.style.top);

    currentZIndex++;
    el.style.zIndex = currentZIndex;

    function onMouseMove(e) {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      el.style.left = origLeft + dx + "px";
      el.style.top = origTop + dy + "px";
    }

    function onMouseUp() {
      isDragging = false;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    }

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  });
}

