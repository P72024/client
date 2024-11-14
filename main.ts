// server.js
import { serve } from "bun";

serve({
  port: 8010,
  fetch(req) {
    const url = new URL(req.url);

    // Serve the root index.html file
    if (url.pathname === "/testing/parl1.mp4") {
      return new Response(Bun.file("testing/parl1.mp4"), {});
    }
    if (url.pathname === "/testing/male.wav") {
      return new Response(Bun.file("testing/male.wav"), {});
    }
    if (url.pathname === "/testing/rick.mp3") {
      return new Response(Bun.file("testing/rick.mp3"), {});
    }
    if (url.pathname === "/testing/peter.wav") {
      return new Response(Bun.file("testing/peter.wav"), {});
    }
    if (url.pathname === "/testing/peter2.wav") {
      return new Response(Bun.file("testing/peter2.wav"), {});
    }
    if (url.pathname === "/testing/ozzy.wav") {
      return new Response(Bun.file("testing/ozzy.wav"), {});
    }
    if (url.pathname === "/testing/casper.wav") {
      return new Response(Bun.file("testing/casper.wav"), {});
    }
    if (url.pathname === "/testing/frederik.wav") {
      return new Response(Bun.file("testing/frederik.wav"), {});
    }
    if (url.pathname === "/testing/test1.wav") {
      return new Response(Bun.file("testing/test1.wav"), {});
    }
    if (url.pathname === "/testing/test2.wav") {
      return new Response(Bun.file("testing/test2.wav"), {});
    }
    if (url.pathname === "/testing/female.wav") {
      return new Response(Bun.file("testing/female.wav"), {});
    }
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
