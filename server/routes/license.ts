import { Request, Response } from "express";

const PROJECT_ID = "keysystem-d0b86-8df89";
const API_KEY = "AIzaSyD7KlxN05OoSCGHwjXhiiYyKF5bOXianLY";

function extractValue(field: any): any {
  if (!field) return null;
  if (field.stringValue !== undefined) return field.stringValue;
  if (field.integerValue !== undefined) return parseInt(field.integerValue);
  if (field.booleanValue !== undefined) return field.booleanValue;
  if (field.doubleValue !== undefined) return field.doubleValue;
  return null;
}

export async function handleActivateLicense(req: Request, res: Response) {
  const { licenseKey, userId } = req.body;

  if (!licenseKey || typeof licenseKey !== "string") {
    return res.status(400).json({
      message: "License key is required",
    });
  }

  if (!userId || typeof userId !== "string") {
    return res.status(400).json({
      message: "User ID is required",
    });
  }

  try {
    const trimmedKey = licenseKey.trim();

    // Query Firestore REST API for licenses with matching key
    const query = {
      structuredQuery: {
        from: [{ collectionId: "licenses" }],
        where: {
          fieldFilter: {
            field: { fieldPath: "key" },
            op: "EQUAL",
            value: { stringValue: trimmedKey },
          },
        },
      },
    };

    const response = await fetch(
      `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(query),
      }
    );

    if (!response.ok) {
      console.error("Firestore API error:", await response.text());
      return res.status(500).json({
        message: "Erreur serveur lors de l'activation",
      });
    }

    const results = await response.json();

    // Check if any documents were found
    const documents = results
      .filter((result: any) => result.document)
      .map((result: any) => result.document);

    if (documents.length === 0) {
      return res.status(400).json({
        message: "Clé de licence invalide",
      });
    }

    const licenseDoc = documents[0];
    const licenseData = licenseDoc.fields;

    if (!licenseData) {
      return res.status(400).json({
        message: "Clé de licence invalide",
      });
    }

    // Check if license is active
    const isActive = extractValue(licenseData.isActive);
    if (isActive === false) {
      return res.status(400).json({
        message: "Clé de licence désactivée",
      });
    }

    // Extract license plan info
    const planName = extractValue(licenseData.planName) || "Classic";
    const messageLimit = extractValue(licenseData.messageLimit) || 100;
    const licenseId = licenseDoc.name.split("/").pop();

    console.log("License activated:", { planName, messageLimit, licenseId });

    // Update user data in Firestore
    const userUpdateQuery = {
      writes: [
        {
          update: {
            name: `projects/${PROJECT_ID}/databases/(default)/documents/users/${userId}`,
            fields: {
              messagesUsed: { integerValue: "0" },
              messagesLimit: { integerValue: messageLimit.toString() },
              plan: { stringValue: planName },
              licenseKey: { stringValue: trimmedKey },
            },
          },
        },
      ],
    };

    const userUpdateResponse = await fetch(
      `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:batchWrite?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userUpdateQuery),
      }
    );

    if (!userUpdateResponse.ok) {
      console.error("Error updating user data:", await userUpdateResponse.text());
    }

    // Deactivate the license key
    const deactivateQuery = {
      writes: [
        {
          update: {
            name: `projects/${PROJECT_ID}/databases/(default)/documents/licenses/${licenseId}`,
            fields: {
              isActive: { booleanValue: false },
              usedBy: { stringValue: userId },
              usedAt: { timestampValue: new Date().toISOString() },
            },
          },
        },
      ],
    };

    const deactivateResponse = await fetch(
      `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:batchWrite?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(deactivateQuery),
      }
    );

    if (!deactivateResponse.ok) {
      console.error("Error deactivating license:", await deactivateResponse.text());
    }

    return res.status(200).json({
      message: "Licence activée avec succès",
      licenseId,
      plan: planName,
      messageLimit,
      messagesUsed: 0,
    });
  } catch (error) {
    console.error("Error activating license:", error);
    return res.status(500).json({
      message: "Erreur serveur lors de l'activation",
    });
  }
}
