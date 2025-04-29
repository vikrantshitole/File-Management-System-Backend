# File Management System Backend

A Node.js backend system for managing files and folders with authentication and database integration.

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment:
   ```env
   PORT=3000
   DB_HOST=localhost
   DB_PORT=your_db_port
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_NAME=file_management
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRES_IN=7d
   API_KEY=your_api_key
   FRONTEND_URL=your_frontend_url
   
   ```

3. Setup database:
   ```bash
   npm run migrate
   ```

4. Start server:
   ```bash
   npm run dev
   ```

## Core Features

- File upload and management
- Folder hierarchy
- JWT authentication
- MySQL database
- Request logging

## API Endpoints

### Authentication
- `POST /api/auth/token` - Get JWT token
- `GET /api/auth/validate` - Validate token

### Files
- `POST /api/files/upload` - Upload file
- `DELETE /api/files/:id` - Delete file
- `GET /api//progress/:uploadId` - Get Upload Progress

### Folders
- `POST /api/folders` - Create folder
- `GET /api/folders` - Get folder
- `PUT /api/folders/update/:id` - Update folder
- `DELETE /api/folders/:id` - Delete folder

## Project Structure

```
src/
├── config/      # Configuration
├── controllers/ # Route handlers
├── models/      # Database models
├── routes/      # API routes
├── services/    # Business logic
└── utils/       # Utilities
```

## Development

```bash
# Format code
npm run format

# Run tests
npm test

# Create migration
npm run migrate:make <name>

# Run migration
npm run migrate
```

## License

MIT 