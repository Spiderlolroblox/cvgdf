import { RequestHandler } from "express";

export const handleGetIP: RequestHandler = (req, res) => {
  const ipAddress =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim() ||
    (req.headers["x-real-ip"] as string) ||
    req.socket.remoteAddress ||
    "unknown";

  res.json({
    ip: ipAddress,
  });
};

export const handleCheckVPN: RequestHandler = async (req, res) => {
  try {
    const { ipAddress } = req.body;

    if (!ipAddress) {
      res.status(400).json({ error: "IP address required" });
      return;
    }

    const response = await fetch("https://api.abuseipdb.com/api/v2/check", {
      method: "POST",
      headers: {
        Key: process.env.ABUSEIPDB_API_KEY || "",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        ipAddress,
        maxAgeInDays: "90",
      }),
    });

    if (!response.ok) {
      res.json({ isVPN: false });
      return;
    }

    const data = (await response.json()) as {
      data?: {
        usageType?: string;
        totalReports?: number;
      };
    };

    const isVPN =
      data.data?.usageType === "Data Center" ||
      (data.data?.totalReports || 0) > 5;

    res.json({
      isVPN,
      provider: data.data?.usageType || undefined,
    });
  } catch (error) {
    console.error("Error checking VPN:", error);
    res.json({ isVPN: false });
  }
};
