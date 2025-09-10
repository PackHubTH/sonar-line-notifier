import dotenv from "dotenv";
import express from "express";
import fetch from "node-fetch";
import pino from "pino";

dotenv.config();

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3000;
const LINE_TOKEN = process.env.LINE_TOKEN;
const LINE_USER_ID = process.env.LINE_USER_ID;

const logger = pino();

// Webhook endpoint
app.post("/sonar-line", async (req, res) => {
  try {
    const data = req.rawBody ? JSON.parse(req.rawBody) : req.body;

    // Prepare metrics section with icons
    const metrics = (data.qualityGate?.conditions || [])
      .map((c) => {
        let icon = "⚪"; // default NO_VALUE
        if (c.status === "OK") icon = "✅";
        else if (c.status === "ERROR") icon = "❌";
        return (
          icon +
          " " +
          c.metric +
          ": " +
          c.status +
          (c.value ? " (" + c.value + ")" : "")
        );
      })
      .join("\n");

    // LINE message payload
    const lineMessage = {
      to: LINE_USER_ID,
      messages: [
        {
          type: "text",
          text:
            `🚀 *SonarQube Analysis Result*\n\n` +
            `📁 Project: ${data.project?.name || "Unknown"}\n` +
            `🌿 Branch: ${data.branch?.name || "Unknown"}\n` +
            `${data.status === "SUCCESS" ? "✅" : "❌"} Analysis Status: ${data.status
            }\n` +
            `${data.qualityGate?.status === "OK" ? "🟢" : "🔴"} Quality Gate: ${data.qualityGate?.status
            }\n\n` +
            `📊 Metrics:\n${metrics}\n\n` +
            `🔗 Dashboard: ${process.env.SONARQUBE_URL || "N/A"}/dashboard?id=${data.project?.key || ""
            }`,
        },
      ],
    };

    const success = await sendLineMessage(lineMessage);
    logger.info(
      { project: data.project?.name, branch: data.branch?.name, success },
      "Webhook processed"
    );

    res.status(success ? 200 : 500).send(success ? "OK" : "Failed");
  } catch (err) {
    logger.error({ err }, "Internal server error in /sonar-line");
    res.status(500).send("Internal Server Error");
  }
});

app.get("/", (req, res) => {
  res.send("SonarQube → LINE relay is running.");
});

app.listen(PORT, () => {
  logger.info(`SonarQube → LINE relay running on port ${PORT}`);
});

// Helper: send message with retry
async function sendLineMessage(payload, retries = 3, delay = 2000) {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch("https://api.line.me/v2/bot/message/push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${LINE_TOKEN}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`LINE API error: ${res.status} ${text}`);
      }

      logger.info("LINE message sent successfully");
      return true;
    } catch (err) {
      logger.error({ attempt: i + 1, err: err.message }, "LINE send failed");
      if (i < retries) {
        logger.warn(`Retrying in ${delay}ms...`);
        await new Promise((r) => setTimeout(r, delay));
      } else {
        logger.error("All retries failed.");
        return false;
      }
    }
  }
}
