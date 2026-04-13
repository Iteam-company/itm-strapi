#!/bin/bash
set -e

DATE=$(date +%F-%H-%M)

echo "Creating Strapi backup..."

mkdir -p backups

npx strapi export --no-encrypt --exclude files --file backups/backup-$DATE

echo "Downloading rclone..."

curl -O https://downloads.rclone.org/rclone-current-linux-amd64.zip
unzip rclone-current-linux-amd64.zip
cp rclone-*-linux-amd64/rclone ./rclone
chmod +x ./rclone

mkdir -p ~/.config/rclone
echo "$RCLONE_CONFIG" > ~/.config/rclone/rclone.conf

echo "Uploading backup to Google Drive..."

./rclone copy backups gdrive:strapi-backups

echo "Backup uploaded successfully!"