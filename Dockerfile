# Use an official Node.js runtime as a parent image
FROM node:18 AS build

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install production and build dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Build the TypeScript files
RUN npm run build

# --------- Production Stage ---------
# Use a lighter version of Node.js for production
FROM node:18-slim

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy only the necessary files from the build stage
COPY --from=build /usr/src/app/package*.json ./
COPY --from=build /usr/src/app/dist ./dist

# Install only production dependencies
RUN npm install --only=production

# Expose the application port
EXPOSE 3000

# Command to run the application
CMD ["node", "dist/index.js"]