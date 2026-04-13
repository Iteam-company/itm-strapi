#!/bin/bash

DATE=$(date +%F-%H-%M)

echo "Creating Strapi backup..."

mkdir -p backups

npx strapi export --no-encrypt --file backups/backup-$DATE

echo "Installing rclone..."
curl https://rclone.org/install.sh | bash

mkdir -p ~/.config/rclone
echo "$RCLONE_CONFIG" > ~/.config/rclone/rclone.conf

echo "Uploading backup..."

rclone copy backups gdrive:strapi-backups

echo "Backup uploaded successfully"