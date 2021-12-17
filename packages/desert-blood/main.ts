import * as h from "@rupertofly/h";
const app = document.querySelector<HTMLDivElement>("#app")!;

app.innerHTML = `
<h1>${JSON.stringify(h)}</h1>
<a href="https://vitejs.dev/guide/features.html" target="_blank">Documentation</a>
`;
console.log(h);
