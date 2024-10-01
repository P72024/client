// server.js
import { serve } from "bun";

serve({
  port: 8010,
  fetch(req) {
    const url = new URL(req.url);

    // Serve the root index.html file
    if (url.pathname === "/") {
      return new Response(Bun.file("client/index.html"), {
        headers: { "Content-Type": "text/html" },
      });
    }

    // Serve the client.js file when accessed
    if (url.pathname === "/client.js") {
      return new Response(Bun.file("client/client.js"), {
        headers: { "Content-Type": "application/javascript" },
      });
    }

    return new Response("404 Not Found", { status: 404 });
  },
});

console.log("Server is running on http://127.0.0.1:8010");
