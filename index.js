import App from "./src/app";

document.addEventListener("DOMContentLoaded", () => {
  if (window.location.pathname == "/entervr") {
    let app = new App();
    const indexContainer = document.querySelector(".content");
    indexContainer.style.display = "none";
    if (app) {
      window.app = app;
    }
  }
});
