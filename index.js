import App from "./src/app";

document.addEventListener("DOMContentLoaded", () => {
  // if (window.location.pathname == "/entervr"){
  //     let app = new App();
  //     const indexContainer = document.querySelector(".content");
  //     indexContainer.style.display = "none";
  //     if (app) {
  //         window.app = app;
  //     }
  // }
  let app;
  const indexContainer = document.querySelector(".content");
  switch (window.location.pathname) {
    case "/entervr":
      app = new App();
      indexContainer.style.display = "none";
      break;
    default:
      indexContainer.style.display = "";
  }
  if (app) {
    window.app = app;
  }
});
