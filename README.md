# AI Code Review Bot

A tool that scans your GitHub repository for best practices, performance enhancements, and security optimizations. By leveraging OpenAI's capabilities, it provides detailed suggestions and insights to improve your codebase.

## Overview

The AI Code Review Bot consists of a frontend and backend that work together to analyze GitHub repositories. Here's an overview of the architecture and technologies used in the project:

### Architecture and Technologies

1. **Frontend**:
    - **ReactJS**: For building a responsive user interface.
    - **Vite**: For fast and efficient frontend build tooling.
    - **shadcn-ui**: Component library integrated with Tailwind CSS for styling.
    - **React Router**: For client-side routing.
    - **Axios**: For making HTTP requests to the backend.
    - **State Management**: Context API and custom hooks.
  
2. **Backend**:
    - **Express**: To implement REST API endpoints.
    - **Mongoose**: ODM for MongoDB.
    - **OAuth2**: For secure API credential handling.
    - **NodeJS**: Backend code execution environment.
    - **OpenAI**: For analyzing code and generating improvement suggestions.
    - **GitHub API**: Access repositories and get metadata.

### Project Structure

```
|-- client/
|   |-- src/
|   |   |-- api/
|   |   |-- components/
|   |   |-- contexts/
|   |   |-- hooks/
|   |   |-- pages/
|   |
|   |-- package.json
|   |-- vite.config.ts
|
|-- server/
|   |-- config/
|   |-- models/
|   |-- routes/
|   |-- services/
|   |-- utils/
|   |
|   |-- package.json
|   |-- server.js
|
|-- package.json
```

## Features

- **User Authentication**: Allows users to securely register and log in using email and password.
- **Repository Analysis**:
  - **Best Practices Analysis**: Get recommendations for code organization and maintainability.
  - **Performance Insights**: Identify bottlenecks and optimization opportunities.
  - **Security Scanning**: Detect potential vulnerabilities and security issues.
- **Settings**: Users can save and retrieve their GitHub and OpenAI API keys securely.
- **Progress Tracking**: Progress bar for the ongoing analysis and status updates.
- **Results Display**: Final analysis results are shown in a detailed and structured format.

## Getting started

### Requirements

To run this project, you will need:

- **Node.js**: Version 12 or higher
- **npm**: Version 6 or higher
- **MongoDB**: A running MongoDB server
- **Git**: For repository cloning

### Quickstart

1. **Clone the repository**:
   ```sh
   git clone https://github.com/yourusername/ai-code-review-bot.git
   cd ai-code-review-bot
   ```

2. **Setup the Backend**:
    - Navigate to the `server` directory and create an `.env` file with the following content:
      ```env
      DATABASE_URL=mongodb://localhost:27017/aicodebot
      OPENAI_API_KEY=your_openai_api_key
      SESSION_SECRET=your_session_secret
      ```
    - Install dependencies and start the server:
      ```sh
      cd server
      npm install
      npm start
      ```

3. **Setup the Frontend**:
    - Navigate to the `client` directory and install dependencies:
      ```sh
      cd ../client
      npm install
      npm start
      ```
    - The frontend will be running at `http://localhost:5173`

4. **Access the Application**:
    - Open your browser and navigate to `http://localhost:5173`
    - Register and log in to start analyzing GitHub repositories

### License

The project is proprietary (not open source).

```
Copyright (c) 2024.
```