import * as sqlite3 from "sqlite3";
import * as path from "path";
import * as fs from "fs"; // Keep fs for directory creation

interface UserConfig {
  privateChannelId?: string;
  waitingForChannelId?: boolean;
}

const DB_FILE_PATH = path.resolve(__dirname, "../../data/userConfigs.db");

// Ensure the data directory exists
const dataDir = path.dirname(DB_FILE_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new sqlite3.Database(DB_FILE_PATH, (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
  } else {
    console.log("Connected to the SQLite database.");
    db.run(
      `CREATE TABLE IF NOT EXISTS user_configs (
      userId TEXT PRIMARY KEY,
      privateChannelId TEXT,
      waitingForChannelId INTEGER
    )`,
      (createErr) => {
        if (createErr) {
          console.error(
            "Error creating user_configs table:",
            createErr.message
          );
        } else {
          console.log("user_configs table ensured.");
        }
      }
    );
  }
});

interface UserConfigRow {
  privateChannelId?: string;
  waitingForChannelId?: number; // SQLite stores booleans as 0 or 1
}

export async function getUserConfig(userId: string): Promise<UserConfig> {
  return new Promise((resolve, reject) => {
    console.log(`[DB] Getting config for user ${userId}`);

    db.get(
      "SELECT privateChannelId, waitingForChannelId FROM user_configs WHERE userId = ?",
      [userId],
      (err, row: unknown) => {
        if (err) {
          console.error("[DB] Error getting user config:", err.message);
          reject(err);
        } else {
          console.log(`[DB] Database query result for user ${userId}:`, row);

          if (row) {
            const userConfigRow = row as UserConfigRow;
            const config = {
              privateChannelId: userConfigRow.privateChannelId,
              waitingForChannelId: Boolean(userConfigRow.waitingForChannelId),
            };
            console.log(`[DB] Resolved config for user ${userId}:`, config);
            resolve(config);
          } else {
            console.log(
              `[DB] No config found for user ${userId}, returning empty config`
            );
            resolve({}); // Return empty config if user not found
          }
        }
      }
    );
  });
}

export async function setUserConfig(
  userId: string,
  config: Partial<UserConfig>
): Promise<void> {
  return new Promise((resolve, reject) => {
    const waitingForChannelId = config.waitingForChannelId ? 1 : 0;
    console.log(`[DB] Setting config for user ${userId}:`, {
      privateChannelId: config.privateChannelId || null,
      waitingForChannelId,
    });

    db.run(
      `INSERT OR REPLACE INTO user_configs (userId, privateChannelId, waitingForChannelId) VALUES (?, ?, ?)`,
      [userId, config.privateChannelId || null, waitingForChannelId],
      function (err) {
        if (err) {
          console.error("[DB] Error setting user config:", err.message);
          reject(err);
        } else {
          console.log(
            `[DB] Successfully saved config for user ${userId}, changes: ${this.changes}`
          );
          resolve();
        }
      }
    );
  });
}

export async function setUserPrivateChannelId(
  userId: string,
  channelId: string
): Promise<void> {
  await setUserConfig(userId, {
    privateChannelId: channelId,
    waitingForChannelId: false,
  });
}

export async function setWaitingForChannelId(
  userId: string,
  waiting: boolean
): Promise<void> {
  // Get existing config to preserve privateChannelId
  const existingConfig = await getUserConfig(userId);
  console.log(`[DB] Preserving existing config:`, existingConfig);

  await setUserConfig(userId, {
    waitingForChannelId: waiting,
    privateChannelId: existingConfig.privateChannelId, // Preserve existing channel ID
  });
}
