CREATE TABLE IF NOT EXISTS rate_limit_counters (rate_key TEXT NOT NULL,window_start INTEGER NOT NULL,hits INTEGER NOT NULL DEFAULT 0,expires_at TEXT NOT NULL,PRIMARY KEY(rate_key,window_start));
CREATE INDEX IF NOT EXISTS rate_limit_expiry_idx ON rate_limit_counters(expires_at);
