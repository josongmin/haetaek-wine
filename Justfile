set shell := ["bash", "-eu", "-o", "pipefail", "-c"]

# Print available recipes
@default:
    @just --list

# Install all workspace dependencies
install:
    npm install

# Run both server and client (server via npm workspace)
dev:
    npm run dev

# Launch only the server workspace
server:
    npm run start:server

# Launch only the client workspace
client:
    npm run start:client

# Build the client bundle
build:
    npm run build:client

# Run the production deployment script
deploy:
    npm run deploy


