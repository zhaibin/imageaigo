-- Images table
CREATE TABLE IF NOT EXISTS images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    image_url TEXT NOT NULL,
    image_hash TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    width INTEGER,
    height INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    analyzed_at TIMESTAMP
);

-- Tags table (hierarchical structure)
CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    level INTEGER NOT NULL, -- 1: primary, 2: secondary, 3: attribute
    parent_id INTEGER,
    FOREIGN KEY (parent_id) REFERENCES tags(id),
    UNIQUE(name, level)
);

-- Image-Tag relationships with weights
CREATE TABLE IF NOT EXISTS image_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    image_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    weight REAL DEFAULT 1.0,
    level INTEGER NOT NULL, -- 1, 2, or 3
    FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id),
    UNIQUE(image_id, tag_id)
);

-- Likes table for image likes
CREATE TABLE IF NOT EXISTS likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    image_id INTEGER NOT NULL,
    user_identifier TEXT NOT NULL, -- IP or user ID
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE CASCADE,
    UNIQUE(image_id, user_identifier)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_images_hash ON images(image_hash);
CREATE INDEX IF NOT EXISTS idx_tags_level ON tags(level);
CREATE INDEX IF NOT EXISTS idx_image_tags_image ON image_tags(image_id);
CREATE INDEX IF NOT EXISTS idx_image_tags_tag ON image_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_image_tags_level ON image_tags(level);
CREATE INDEX IF NOT EXISTS idx_likes_image ON likes(image_id);
CREATE INDEX IF NOT EXISTS idx_likes_user ON likes(user_identifier);

