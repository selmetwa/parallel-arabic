CREATE TABLE if not exists user (
    id VARCHAR(15) PRIMARY KEY,
    email VARCHAR(31) NOT NULL UNIQUE,
    email_verified INTEGER NOT NULL,
    is_subscriber BOOLEAN NOT NULL,
    subscriber_id VARCHAR(255),
    subscription_end_date BIGINT,
    sentences_viewed INTEGER,
    verb_conjugation_tenses_viewed INTEGER,
    google_id VARCHAR(255),
    auth_provider VARCHAR(255),
    name VARCHAR(255),
    picture VARCHAR(255)
);

CREATE TABLE if not exists generated_story (
    id VARCHAR(15) PRIMARY KEY,
    user_id VARCHAR(15) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    difficulty INTEGER NOT NULL,
    story_body JSON NOT NULL,
    dialect VARCHAR(50) NOT NULL DEFAULT 'egyptian-arabic',
    created_at BIGINT NOT NULL
);

-- Indexes for better query performance
-- CREATE INDEX IF NOT EXISTS idx_generated_story_user_id ON generated_story(user_id);
-- CREATE INDEX IF NOT EXISTS idx_generated_story_created_at ON generated_story(created_at);
-- CREATE INDEX IF NOT EXISTS idx_generated_story_dialect ON generated_story(dialect);
-- CREATE INDEX IF NOT EXISTS idx_generated_story_user_dialect ON generated_story(user_id, dialect);

CREATE TABLE if not exists user_key (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(15) NOT NULL,
    hashed_password VARCHAR(255),
    FOREIGN KEY (user_id) REFERENCES user(id)
);
CREATE TABLE if not exists user_session (
    id VARCHAR(127) PRIMARY KEY,
    user_id VARCHAR(15) NOT NULL,
    active_expires BIGINT NOT NULL,
    idle_expires BIGINT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user(id)
);
CREATE TABLE if not exists email_verification_token (
    id VARCHAR(63) PRIMARY KEY,
    user_id VARCHAR(15) NOT NULL,
    expires BIGINT NOT NULL
);
CREATE TABLE if not exists password_reset_token (
    id VARCHAR(63) PRIMARY KEY,
    user_id VARCHAR(15) NOT NULL,
    expires BIGINT NOT NULL
);

CREATE TABLE if not exists stories (
    id VARCHAR(15) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    key VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    difficulty INTEGER NOT NULL,
    created_at BIGINT NOT NULL
);

CREATE TABLE if not exists saved_word (
    id VARCHAR(15) PRIMARY KEY,
    user_id VARCHAR(15) NOT NULL,
    arabic_word VARCHAR(255) NOT NULL,
    english_word VARCHAR(255) NOT NULL,
    transliterated_word VARCHAR(255) NOT NULL,
    created_at BIGINT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user(id)
);

CREATE TABLE if not exists video (
    id VARCHAR(15) PRIMARY KEY,
    user_id VARCHAR(15) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    url VARCHAR(255) NOT NULL,
    thumbnail_url VARCHAR(255) NOT NULL,
    dialect VARCHAR(50) NOT NULL,
    created_at BIGINT NOT NULL,
    video_body JSON NOT NULL
);