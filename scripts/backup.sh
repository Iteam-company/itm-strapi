#!/bin/bash
set -e

DATE=$(date +%F-%H-%M)

echo "Creating Strapi backup..."
mkdir -p backups

npx strapi export --no-encrypt --exclude files --file backups/backup-$DATE

echo "Downloading rclone..."
curl -O https://downloads.rclone.org/rclone-current-linux-amd64.zip
unzip -o rclone-current-linux-amd64.zip
cp rclone-*-linux-amd64/rclone ./rclone
chmod +x ./rclone

mkdir -p ~/.config/rclone
cat > ~/.config/rclone/rclone.conf <<EOF
$RCLONE_CONFIG_CONTENT
EOF

echo "Uploading backup to Google Drive..."
./rclone copy "backups/backup-$DATE.tar.gz" gdrive:strapi-backups

echo "Backup uploaded successfully!"