import { VercelRequest, VercelResponse } from "@vercel/node";

export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    const ip =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim() ||
      req.socket.remoteAddress ||
      "unknown";

    const response = await fetch("http://ip-api.com/json/" + ip);
    const data = await response.json();

    return res.json({
      ip,
      ...data,
    });
  } catch (error) {
    console.error("IP detection error:", error);
    return res.status(500).json({
      error: "Failed to detect IP",
    });
  }
};
