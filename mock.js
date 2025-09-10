import fetch from "node-fetch";

// Relay endpoint
const RELAY_URL = "http://localhost:3000/sonar-line";

// Mock SonarQube payload
const mockPayload = {
  "serverUrl": "http://localhost:9000",
  "taskId": "c6575020-3deb-4b9a-b245-e36d5c9312fe",
  "status": "SUCCESS",
  "analysedAt": "2025-09-09T12:41:05+0000",
  "revision": "3b54a62aa238ee1d376572937e18b4f50a3bad64",
  "changedAt": "2025-09-09T12:41:05+0000",
  "project": {
    "key": "elv-fe",
    "name": "elv-fe",
    "url": "http://localhost:9000/dashboard?id=elv-fe"
  },
  "branch": {
    "name": "main",
    "type": "BRANCH",
    "isMain": true,
    "url": "http://localhost:9000/dashboard?id=elv-fe"
  },
  "qualityGate": {
    "name": "Sonar way",
    "status": "OK",
    "conditions": [
      {
        "metric": "new_coverage",
        "operator": "LESS_THAN",
        "status": "NO_VALUE",
        "errorThreshold": "80"
      },
      {
        "metric": "new_duplicated_lines_density",
        "operator": "GREATER_THAN",
        "status": "NO_VALUE",
        "errorThreshold": "3"
      },
      {
        "metric": "new_security_hotspots_reviewed",
        "operator": "LESS_THAN",
        "status": "NO_VALUE",
        "errorThreshold": "100"
      },
      {
        "metric": "new_violations",
        "operator": "GREATER_THAN",
        "value": "0",
        "status": "OK",
        "errorThreshold": "0"
      }
    ]
  },
  "properties": {
    "sonar.analysis.detectedscm": "git",
    "sonar.analysis.detectedci": "undetected"
  }
}

// Send mock payload to relay
async function testRelay() {
  try {
    const res = await fetch(RELAY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mockPayload)
    });
    const text = await res.text();
    console.log("Relay response:", res.status, text);
  } catch (err) {
    console.error("Error sending mock payload:", err);
  }
}

testRelay();
