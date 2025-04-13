-- Add the missing file_url column to review_media table
ALTER TABLE review_media ADD COLUMN file_url VARCHAR(255) NOT NULL; 