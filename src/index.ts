import server from "./app";
import os from "os";

const PORT = Number(process.env.PORT) || 4000;

server.listen(PORT, "0.0.0.0", () => {
  const interfaces = os.networkInterfaces();
  const addresses: string[] = [];

  for (const name of Object.keys(interfaces)) {
    const iface = interfaces[name];
    if (!iface) continue;

    for (const net of iface) {
      if (net.family === "IPv4") {
        addresses.push(net.address);
      }
    }
  }

  console.log("🌐 Server running at:");
  for (const ip of addresses) {
    console.log(`- http://${ip}:${PORT}`);
  }
});
