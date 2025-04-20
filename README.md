# File Management System Backend

A robust backend system for managing files and folders with hierarchical structure, built with Node.js, Express, and MySQL.

## Features

- Hierarchical folder structure with unlimited nesting
- File upload and management
- Pagination and filtering for folder/file listings
- Search functionality across folders and files
- RESTful API endpoints

## Prerequisites

- Node.js (v14 or higher)
- MySQL (v8 or higher)
- npm or yarn

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/vikrantshitole/File-Management-System-Backend.git
   cd file-management-system-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=3000
   DB_HOST=localhost
   DB_USER=your_mysql_username
   DB_PASSWORD=your_mysql_password
   DB_NAME=file_management_db
   DB_PORT=your_mysql_port
   ```

4. Create the database:
   ```bash
   mysql -u your_mysql_username -p
   CREATE DATABASE file_management_db;
   ```

5. Run database migrations:
   ```bash
   npm run migrate
   ```

6. (Optional) Seed the database with sample data:
   ```bash
   npm run seed
   ```

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

## API Endpoints

### Folders

- `GET /api/folders` - Get all folders with pagination
- `GET /api/folders/:id` - Get a specific folder by ID
- `POST /api/folders` - Create a new folder
- `PUT /api/folders/:id` - Update a folder
- `DELETE /api/folders/:id` - Delete a folder and its contents

### Files

- `GET /api/files` - Get all files with pagination
- `GET /api/files/:id` - Get a specific file by ID
- `POST /api/files` - Upload a new file
- `PUT /api/files/:id` - Update a file
- `DELETE /api/files/:id` - Delete a file

### Content

- `GET /api/content/hierarchy` - Get folder hierarchy with files
- `GET /api/content/search` - Search across folders and files

## Code Formatting

The project uses Prettier for code formatting. To format all files:

```bash
npm run format
```

To check if files are properly formatted:

```bash
npm run format:check
```

## Database Migrations

Create a new migration:
```bash
npm run migrate:make <migration-name>
```

Run migrations:
```bash
npm run migrate
```

Rollback migrations:
```bash
npm run migrate:rollback
```

## Database Seeding

Create a new seed:
```bash
npm run seed:make <seed-name>
```

Run seeds:
```bash
npm run seed
```

## Project Structure

```
src/
├── config/         # Configuration files
├── controllers/    # Route controllers
├── database/       # Database migrations and seeds
├── middleware/     # Custom middleware
├── models/         # Data models
├── routes/         # API routes
├── services/       # Business logic
├── utils/          # Utility functions
└── app.js          # Application entry point
```

## Error Handling

The application includes comprehensive error handling for:
- Invalid input data
- Database errors
- File system errors
- Authentication errors
- Not found resources

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License. 