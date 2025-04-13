-- Drop the review_media table since it's no longer needed
-- First check if the table exists before attempting to drop
SET @exist := (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'review_media'
);

SET @query = IF(
    @exist > 0,
    'DROP TABLE review_media',
    'SELECT "Table review_media does not exist"'
);

PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt; 