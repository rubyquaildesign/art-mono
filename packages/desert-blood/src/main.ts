import "./style.css";
import * as h from "@rupertofly/h";

const app = document.querySelector<HTMLDivElement>("#app")!;

app.innerHTML = `
  <h1>${JSON.stringify(Object.getOwnPropertyNames(h), null, 1)}</h1>
  <a href="https://vitejs.dev/guide/features.html" target="_blank">Documentation</a>
`;
