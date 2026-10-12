/* Site-wide settings */
const SITE = {
  name: "Lbern",
  email: "azohan@yahoo.com",
};

const NAV_LEFT = [
  { href: "index.html", label: "Home" },
  { href: "collection.html", label: "Collection" },
];
const NAV_RIGHT = [
  { href: "about.html", label: "About" },
  { href: "contact.html", label: "Contact" },
];

const page = location.pathname.split("/").pop() || "index.html";
const imgSrc = (p) => "images/" + p.file;

function navList(items) {
  return items
    .map((i) => `<li class="${i.href === page ? "active" : ""}"><a href="${i.href}">${i.label}</a></li>`)
    .join("");
}

function renderHeader() {
  const el = document.getElementById("header");
  if (!el) return;
  el.innerHTML = `
    <div class="header-inner">
      <nav class="nav nav-left"><ul>${navList(NAV_LEFT)}</ul></nav>
      <a class="site-title" href="index.html">${SITE.name}</a>
      <nav class="nav nav-right"><ul>${navList(NAV_RIGHT)}</ul></nav>
      <button class="menu-toggle" aria-expanded="false" aria-controls="mobile-nav">Menu</button>
    </div>
    <nav id="mobile-nav" class="mobile-nav" hidden><ul>${navList([...NAV_LEFT, ...NAV_RIGHT])}</ul></nav>`;

  const toggle = el.querySelector(".menu-toggle");
  const mobile = el.querySelector(".mobile-nav");
  toggle.addEventListener("click", () => {
    const open = mobile.hidden;
    mobile.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
  });
}

function renderFooter() {
  const el = document.getElementById("footer");
  if (!el) return;
  el.innerHTML = `
    <div class="footer-inner">
      <ul class="footer-links">
        <li><a href="collection.html">Collection</a></li>
        <li><a href="contact.html">Contact</a></li>
        <li><a href="#top">Back to Top</a></li>
      </ul>
      <p>Contact email : <a href="mailto:${SITE.email}">${SITE.email}</a></p>
      <p class="copyright">&copy; ${new Date().getFullYear()} ${SITE.name}</p>
    </div>`;
}

/* Homepage slideshow: photos marked featured: true */
function renderSlideshow() {
  const el = document.getElementById("slideshow");
  if (!el) return;
  let slides = PHOTOS.filter((p) => p.featured);
  if (!slides.length) slides = PHOTOS.slice(0, 5);

  el.innerHTML = `
    <div class="slides">
      ${slides.map((p, i) => `<img src="${imgSrc(p)}" alt="${SITE.name} ${p.category}" class="${i === 0 ? "active" : ""}">`).join("")}
    </div>
    <div class="gallery-controls">
      <button class="gallery-prev">Prev</button>
      <span class="gallery-divider">/</span>
      <button class="gallery-next">Next</button>
    </div>`;

  const imgs = el.querySelectorAll(".slides img");
  let current = 0;
  let timer;
  const show = (n) => {
    imgs[current].classList.remove("active");
    current = (n + imgs.length) % imgs.length;
    imgs[current].classList.add("active");
  };
  const restart = () => {
    clearInterval(timer);
    timer = setInterval(() => show(current + 1), 5000);
  };
  el.querySelector(".gallery-prev").addEventListener("click", () => { show(current - 1); restart(); });
  el.querySelector(".gallery-next").addEventListener("click", () => { show(current + 1); restart(); });
  el.querySelector(".slides").addEventListener("click", () => { show(current + 1); restart(); });
  restart();
}

/* Collection page: category filter + photo grid + lightbox */
function renderCollection() {
  const grid = document.getElementById("grid");
  if (!grid) return;
  const catNav = document.getElementById("category-nav");
  const categories = [...new Set(PHOTOS.map((p) => p.category).filter(Boolean))];
  let visible = PHOTOS;

  const draw = (cat) => {
    visible = cat ? PHOTOS.filter((p) => p.category === cat) : PHOTOS;
    grid.innerHTML = visible
      .map((p, i) => `<button class="grid-item" data-i="${i}"><img src="${imgSrc(p)}" alt="${SITE.name} ${p.category}" loading="lazy"></button>`)
      .join("");
    catNav.querySelectorAll("a").forEach((a) => a.classList.toggle("active", a.dataset.cat === (cat || "")));
  };

  catNav.innerHTML = `<ul>
    <li><a href="#" data-cat="">All</a></li>
    ${categories.map((c) => `<li><a href="#${encodeURIComponent(c)}" data-cat="${c}">${c}</a></li>`).join("")}
  </ul>`;
  catNav.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a) return;
    e.preventDefault();
    history.replaceState(null, "", a.dataset.cat ? "#" + encodeURIComponent(a.dataset.cat) : location.pathname);
    draw(a.dataset.cat);
  });

  // Lightbox
  const box = document.getElementById("lightbox");
  const boxImg = box.querySelector("img");
  let idx = 0;
  const open = (i) => {
    idx = (i + visible.length) % visible.length;
    boxImg.src = imgSrc(visible[idx]);
    box.hidden = false;
    document.body.classList.add("no-scroll");
  };
  const close = () => {
    box.hidden = true;
    document.body.classList.remove("no-scroll");
  };
  grid.addEventListener("click", (e) => {
    const item = e.target.closest(".grid-item");
    if (item) open(Number(item.dataset.i));
  });
  box.querySelector(".lb-close").addEventListener("click", close);
  box.querySelector(".lb-prev").addEventListener("click", () => open(idx - 1));
  box.querySelector(".lb-next").addEventListener("click", () => open(idx + 1));
  box.addEventListener("click", (e) => { if (e.target === box) close(); });
  document.addEventListener("keydown", (e) => {
    if (box.hidden) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") open(idx - 1);
    if (e.key === "ArrowRight") open(idx + 1);
  });

  const initial = decodeURIComponent(location.hash.slice(1));
  draw(categories.includes(initial) ? initial : "");
}

function fillEmail() {
  document.querySelectorAll("[data-email]").forEach((a) => {
    a.href = "mailto:" + SITE.email;
    a.textContent = SITE.email;
  });
}

renderHeader();
renderFooter();
renderSlideshow();
renderCollection();
fillEmail();
