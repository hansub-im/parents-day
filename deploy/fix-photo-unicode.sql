-- Run once against the production SQL Server database if uploaded photo names
-- or captions are returned as broken Korean text from GET /api/photos.
--
-- The Java entity expects Unicode strings, but an existing table may still have
-- been created with VARCHAR columns. VARCHAR cannot preserve Korean characters.

ALTER TABLE photos ALTER COLUMN uploader_name NVARCHAR(100) NOT NULL;
ALTER TABLE photos ALTER COLUMN caption NVARCHAR(200) NULL;
