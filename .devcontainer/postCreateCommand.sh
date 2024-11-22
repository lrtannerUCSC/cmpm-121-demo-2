#!/bin/bash

set -e

install_gitleaks() {
    local ARCH=$(uname -m)
    local GITLEAKS_VERSION=8.19.1
    local GITLEAKS_ARM64_URL=https://github.com/gitleaks/gitleaks/releases/download/v${GITLEAKS_VERSION}/gitleaks_${GITLEAKS_VERSION}_linux_arm64.tar.gz
    local GITLEAKS_AMD64_URL=https://github.com/gitleaks/gitleaks/releases/download/v${GITLEAKS_VERSION}/gitleaks_${GITLEAKS_VERSION}_linux_amd64.tar.gz
    local DOWNLOAD_URL

    if [ "$ARCH" = "aarch64" ]; then
        echo "Detected ARM64 architecture. Downloading ARM64 version of gitleaks."
        DOWNLOAD_URL=$GITLEAKS_ARM64_URL
    elif [ "$ARCH" = "x86_64" ]; then
        echo "Detected AMD64 architecture. Downloading AMD64 version of gitleaks."
        DOWNLOAD_URL=$GITLEAKS_AMD64_URL
    else
        echo "Unsupported architecture: $ARCH"
        return 1
    fi

    curl -L -o /tmp/gitleaks.tar.gz $DOWNLOAD_URL > /dev/null 2>&1
    sudo tar -xzf /tmp/gitleaks.tar.gz -C /usr/local/bin
    rm /tmp/gitleaks.tar.gz
}

timezone_setup() {
    local TZ=${TZ:-"America/Los_Angeles"}
    echo "==> Setting timezone to: $TZ"
    sudo ln -snf /usr/share/zoneinfo/$TZ /etc/localtime
    sudo dpkg-reconfigure -f noninteractive tzdata
}

echo "==> Working directory: $(pwd)"

# Load environment variables from .env file
#
echo "==> Load environment variables from .env file"
if [ -f ".env" ]; then
    set -o allexport
    source .env
    set +o allexport
fi

echo "==> Customize git user configuration"
git config --global core.eol lf
git config --global core.autocrlf false
git config --global http.sslVerify false
git config --global core.editor "code --wait"
git config --global --add safe.directory /workspaces/cmpm-121-demo-2

# Set git user.email
#
echo "==> Setting git user.email: '${GIT_USER_EMAIL}'"
git config --global user.email "${GIT_USER_EMAIL}"

# Set git user.name
#
echo "==> Setting git user.name: '${GIT_USER_NAME}'"
git config --global user.name "${GIT_USER_NAME}"

# Timezone setup
#
timezone_setup
