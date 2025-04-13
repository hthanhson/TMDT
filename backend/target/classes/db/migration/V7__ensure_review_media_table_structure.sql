-- Create review_media table if it doesn't exist
CREATE TABLE IF NOT EXISTS review_media (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    review_id BIGINT NOT NULL,
    file_url VARCHAR(255),
    media_type VARCHAR(20) NOT NULL,
    created_at DATETIME,
    FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE
);

-- Add file_url column if it doesn't exist
-- MySQL syntax to check if column exists before adding
SET @exist := (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'review_media'
    AND COLUMN_NAME = 'file_url'
);

SET @query = IF(
    @exist = 0,
    'ALTER TABLE review_media ADD COLUMN file_url VARCHAR(255)',
    'SELECT "Column file_url already exists"'
);

PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Make sure media_type column exists
SET @exist := (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'review_media'
    AND COLUMN_NAME = 'media_type'
);

SET @query = IF(
    @exist = 0,
    'ALTER TABLE review_media ADD COLUMN media_type VARCHAR(20) NOT NULL DEFAULT "IMAGE"',
    'SELECT "Column media_type already exists"'
);

PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt; 