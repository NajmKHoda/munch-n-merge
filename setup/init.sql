CREATE TABLE IF NOT EXISTS AppUser (
    id SERIAL PRIMARY KEY,
    username VARCHAR(20) NOT NULL UNIQUE CHECK(LENGTH(username) >= 3),
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    bio TEXT,
    profile_picture TEXT
);

CREATE TABLE IF NOT EXISTS Session (
    id SERIAL PRIMARY KEY,
    userId INTEGER NOT NULL,
    lastActive TIMESTAMP NOT NULL DEFAULT NOW(),
    FOREIGN KEY (userId) REFERENCES AppUser(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Friend (
    id1 INTEGER NOT NULL,
    id2 INTEGER NOT NULL,
    FOREIGN KEY(id1) REFERENCES AppUser(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    FOREIGN KEY(id2) REFERENCES AppUser(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS FriendRequest (
    id SERIAL PRIMARY KEY,
    fromId INTEGER NOT NULL,
    toId INTEGER NOT NULL,
    UNIQUE(fromId, toId),
    FOREIGN KEY(fromId) REFERENCES AppUser(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    FOREIGN KEY(toId) REFERENCES AppUser(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Recipe (
    id SERIAL PRIMARY KEY,
    authorId INTEGER,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    ingredients JSONB DEFAULT '{}'::JSONB,
    instructions TEXT DEFAULT '',
    createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
    difficulty TEXT,
    FOREIGN KEY (authorId) REFERENCES AppUser(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS RecipeFavorite (
    recipeId INTEGER,
    userId INTEGER,
    createdAt TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (recipeId, userId),
    FOREIGN KEY (recipeId) REFERENCES Recipe(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES AppUser(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS RecipeLike (
    recipeId INTEGER NOT NULL,
    userId INTEGER NOT NULL,
    PRIMARY KEY (recipeId, userId),
    FOREIGN KEY (recipeId) REFERENCES Recipe(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES AppUser(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS RecipeLink (
    parentId INTEGER NOT NULL,
    childId INTEGER NOT NULL,
    PRIMARY KEY (parentId, childId),
    FOREIGN KEY (parentId) REFERENCES Recipe(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    FOREIGN KEY (childId) REFERENCES Recipe(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

CREATE OR REPLACE VIEW RecipeWithLikes AS (
    SELECT r.*, COUNT(rl.userId) AS likeCount 
    FROM Recipe r 
    LEFT JOIN RecipeLike rl ON r.id = rl.recipeId 
    GROUP BY r.id
);