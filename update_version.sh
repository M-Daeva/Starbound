APP_NAME="starbound-client-testnet"
ACCOUNT_NAME="mdaeva"

read -p "Enter the new version number: " new_version

sed -i "s/VERSION=\"[0-9.]*\"/VERSION=\"$new_version\"/g" app_start.sh app_stop.sh container.sh
sed -i "s/$ACCOUNT_NAME\/$APP_NAME:[0-9.]*/$ACCOUNT_NAME\/$APP_NAME:$new_version/g" deploy.yaml

echo "Version number updated to $new_version in all files"
