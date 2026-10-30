const baseUrl = (process.env.BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");

const routes = [
  { path: "/", allowNotFound: false },
  { path: "/shop", allowNotFound: false },
  { path: "/product/shadow-hoodie", allowNotFound: true },
  { path: "/ai?product=shadow-hoodie", allowNotFound: false },
  { path: "/cart", allowNotFound: false },
  { path: "/checkout", allowNotFound: false },
  { path: "/about", allowNotFound: false },
  { path: "/profile", allowNotFound: false },
  { path: "/profile?preview=1", allowNotFound: false },
];

let failed = false;
for (const { path, allowNotFound } of routes) {
  const url = `${baseUrl}${path}`;
  try {
    const response = await fetch(url, { redirect: "manual" });
    const status = response.status;
    const location = response.headers.get("location");
    const acceptable = (status >= 200 && status < 400) || (allowNotFound && status === 404);
    if (acceptable) {
      console.log(`PASS ${status} ${path}${location ? ` -> ${location}` : ""}`);
    } else {
      failed = true;
      const body = (await response.text()).replace(/\s+/g, " ").slice(0, 500);
      console.error(`FAIL ${status} ${path}${location ? ` -> ${location}` : ""} :: ${body}`);
    }
  } catch (error) {
    failed = true;
    console.error(`FAIL ${path}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

if (failed) process.exit(1);
console.log(`\nPublic & Preview Route Validation: PASS (${routes.length} routes checked against ${baseUrl})`);
