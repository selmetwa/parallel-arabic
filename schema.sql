CREATE TABLE if not exists user (
    id VARCHAR(15) PRIMARY KEY,
    email VARCHAR(31) NOT NULL UNIQUE,
    email_verified INTEGER NOT NULL,
    is_subscriber BOOLEAN NOT NULL
);
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
)