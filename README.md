# Munch-n-Merge
## Project Overview
Munch-n-Merge is a  recipe social media platform that allows users to create their own recipes, discover recipes from friends within their social network, and use AI to merge recipes together to create new recipe.

## Technologies Used

- **Frontend**:
  - Next.js 15 with App Router
  - React 19
  - TypeScript
  - Tailwind CSS for styling
  - Server/Client Component architecture

- **Backend**:
  - Next.js API Routes
  - Server Actions for data mutation
  - Neon PostgreSQL database with prepared statements

- **Authentication**:
  - Session-based authentication
  - Secure password storage using `bcrypt`
  - Session token encryption with **JSON Web Tokens**

- **Features**:
  - AI-powered recipe merging
  - Social networking capabilities
  - Recipe feed with pagination
  - Like and favorite system

## Features in Detail

### Recipe Management
- Create recipes with name, description, ingredients, and instructions
- Edit existing recipes
- Delete recipes
- View detailed recipe information

### Social Features
- Add friends to build your cooking network
- See recipes from friends in your feed
- Like recipes to show appreciation
- Favorite recipes to save them for later

### AI Recipe Merging
- Select multiple recipes to combine
- Adjust AI creativity level with temperature control
- Get AI-generated merged recipes with combined ingredients and instructions
- Save merged recipes to your collection

### User Experience
- Responsive design works on desktop and mobile
- Clear navigation with intuitive UI
- Real-time feedback for actions

## Development and Deployment

### Local Development Setup

1. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

2. **Database Setup (Neon PostgreSQL)**
   
   Follow these steps to set up your database:
   
   a. **Create a Neon Account and Project**
      - Go to [https://neon.tech](https://neon.tech) and sign up or log in
      - Click "New Project" in your dashboard
      - Fill in requested details (project/database name, server region, etc.)
      - Click "Create Project"
   
   b. **Obtain Your Database Connection String**
      - Once your project is created, you'll be taken to the project dashboard
      - Click the "Connect" button and select the .env tab to view the connection URL.
      - It should look like: `postgresql://username:password@hostname/database?sslmode=require`
   
   c. **Set Up Environment Variables**
      Create a `.env` file in the root directory with the following variables:
      ```
      # Database Connection (REQUIRED)
      # Replace with your actual Neon PostgreSQL connection string
      NEON_DATABASE_URL="postgresql://username:password@hostname/database?sslmode=require"
      
      # Authentication (REQUIRED)
      # Generate a secure random string for JWT token signing
      SESSION_SECRET="your-secure-random-string"
      
      # Google Gemini API (REQUIRED for recipe merging)
      # Get this from Google Cloud Console with Gemini API enabled (next step)
      GOOGLE_GENAI_API_KEY="your-google-gemini-api-key"
      ```
   
   d. **Initialize the Database Schema**
      Run the database initialization script to create all required tables:
      ```bash
      npm run db:init
      ```
      
      This script will:
      - Connect to your Neon database using the connection string
      - Create all necessary tables (AppUser, Recipe, Friend, Session, etc.)
      - Set up proper relationships and constraints
      - Display success confirmation when complete
      
      **Note**: Make sure your `NEON_DATABASE_URL` is correctly set in the `.env` file before running this command.

3. **Google Gemini API Setup**
   
   Follow these steps to obtain your Google Gemini API key for recipe merging:
   
   a. **Create a Google Cloud Project**
      - Go to [Google Cloud Console](https://console.cloud.google.com/)
      - Sign in with your Google account
      - Click "Select a project" dropdown and then "New Project"
      - Enter a project name and click "Create"
   
   b. **Enable the Gemini API**
      - In your Google Cloud Console, navigate to "APIs & Services" > "Library"
      - Search for "Generative Language API" (this is the API for Gemini)
      - Click on it and then click "Enable"
   
   c. **Create API Credentials**
      - Go to "APIs & Services" > "Credentials"
      - Click "Create Credentials" > "API Key"
      - Copy the generated API key
      - (Optional but recommended) Click "Restrict Key" to limit usage to the Generative Language API
   
   d. **Add to Environment Variables**
      - Add your API key to the `.env` file:
        ```
        GOOGLE_GENAI_API_KEY="your-copied-api-key-here"
        ```
   
   **Note**: Keep your API key secure and never commit it to version control. The recipe merging feature will not work without this key.

4. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open your browser** and navigate to `http://localhost:3000`

## Technology Stack Details

### Database
We use **Neon PostgreSQL**, a serverless Postgres service, for our database. The connection is established through the `@neondatabase/serverless` package, which allows for efficient connection pooling and low-latency queries.

### Authentication System
Our authentication system uses:

- **bcrypt** for secure password hashing, which performs one-way salted hashing of user passwords
- **jose** for JWT (JSON Web Token) handling, used to securely store session information in cookies
- **Next.js cookies API** for managing secure HTTP-only cookies
- Session-based authentication with database validation to ensure tokens remain valid

The authentication flow works as follows:
1. User registers with username, email, and password
2. Password is hashed using bcrypt with a cost factor of 10
3. Upon login, a JWT token containing a session ID is created
4. Session is stored in the database and linked to the user
5. JWT token is stored in an HTTP-only cookie
6. Server validates the token and session on each protected request

### AI Recipe Merging
The recipe merging feature is powered by **Google's Gemini API** (gemini-2.0-flash model). We use the `@google/genai` SDK to:

1. Format and serialize recipes for AI processing
2. Send them to the Gemini model with custom prompts
3. Control creativity with temperature settings (0.0 to 2.0)
4. Process and structure the AI response into a new recipe
5. Validate and clean the results before storing in the database


## Project Architecture

### Directory Structure
```
munch-n-merge/
├── public/            # Static assets
│   └── images/        # Images used in the application
├── src/               # Source code
│   ├── app/           # Next.js App Router pages
│   │   ├── feed/      # Recipe feed page
│   │   ├── friends/   # Friend management
│   │   ├── merge-recipes/ # Recipe merging feature
│   │   ├── my-recipes/   # User's recipes management
│   │   ├── search/    # Search functionality
│   │   ├── settings/  # User settings
│   │   └── favorites/ # User's favorite recipes
│   ├── components/    # Shared React components
│   │   └── Navbar.tsx # Navigation component
│   └── lib/           # Utility functions and backend logic
│       ├── actions/   # Server Actions for data mutation
│       │   ├── auth.ts      # Authentication functions
│       │   ├── feed.ts      # Feed management
│       │   ├── recipe.ts    # Recipe CRUD operations
│       │   ├── friend.ts    # Friend management
│       │   ├── favorite.ts  # Favorites management
│       │   └── types.ts     # Shared TypeScript interfaces
│       ├── contexts/   # React context providers
│       ├── genai.ts     # Google Gemini AI integration
│       └── sql.ts        # SQL server initilization
├── package.json       # Project dependencies
└── README.md          # Project documentation
```
#### Database Layer (`/lib/sql.ts`)
- Establishes a connection to our Neon PostgreSQL database using the `@neondatabase/serverless` package
- Exports a `sql` tagged template function for secure parameterized SQL queries
- Handles connection pooling and serverless optimization

#### Server Actions Layer (`/lib/actions/`)
Server actions are organized by domain/entity for better maintainability:

- **`auth.ts`**: Handles all authentication-related operations
  - User registration with bcrypt password hashing
  - Login with JWT token generation
  - Session management
  - User validation

- **`user.ts`**: Manages user profile operations
  - Username updates
  - Email changes
  - Password changes with security validation

- **`recipe.ts`**: Contains all recipe CRUD operations
  - Creating recipes
  - Reading recipe details
  - Updating recipe information
  - Deleting recipes
  - Recipe search functionality
  - Recipe merging functionality (coordinates with AI)

- **`feed.ts`**: Manages social feed functionality
  - Gets recipes from user's social network
  - Implements multi-level friendship traversal (up to 5 degrees)
  - Handles pagination and sorting

- **`friend.ts`**: Manages social connections
  - Friend request creation
  - Request acceptance/rejection
  - Friend removal
  - Friend list retrieval

- **`favorite.ts`**: Handles recipe favoriting system
  - Adding recipes to favorites
  - Removing favorites
  - Retrieving user's favorite recipes

- **`like.ts`**: Manages the recipe like system
  - Adding likes to recipes
  - Removing likes
  - Retrieving user's liked recipes

- **`types.ts`**: Provides shared TypeScript interfaces used across actions

#### AI Integration (`/lib/genai.ts`)
- Connects to Google's Gemini AI using the `@google/genai` SDK
- Implements the recipe merging algorithm
- Handles data preprocessing for AI input
- Processes AI responses into structured recipe objects
- Includes error handling and retry mechanisms

#### Context Providers (`/lib/context/`)
- Implements React Context providers for state management
- User context for authentication state
- Theme context for UI preferences
- Other application-wide states

### Data Flow

1. **Client-side**: User interacts with React components in the `/app` directory
2. **Server Actions**: Components call server actions from `/lib/actions/`
3. **Database Operations**: Server actions use the SQL utility from `/lib/sql.ts` to interact with the database
4. **AI Processing**: For recipe merging, the server actions coordinate with `/lib/genai.ts`
5. **Response**: Data is returned to the client for rendering through the server actions

This architecture allows us to have clear separation of elements, type safety throughout the applicationl, secure database operations with parameterized queries, scalable codebase organization, maintainable and testable code components.

## User Guide

### Creating a Recipe
1. Navigate to "My Recipes"
2. Click "Create New Recipe"
3. Fill in the recipe details:
   - Name (required)
   - Description (optional)
   - Ingredients (optional)
   - Instructions (optional)
4. Click "Create Recipe"

### Merging Recipes
1. Navigate to "Merge Recipes"
2. Select at least 2 recipes you want to merge
3. Adjust the "AI Creativity Level" slider:
   - Lower values (0-0.5): More predictable combinations
   - Mid values (0.6-1.2): Balanced creativity
   - Higher values (1.3-2.0): More innovative results
4. Click "Merge Selected Recipes"
5. The merged recipe will appear in your "My Recipes" collection

### Managing Friends
1. Navigate to "Friends"
2. Search for users by username
3. Send friend requests
4. Accept or decline incoming friend requests
5. View and manage your current friends

## API Documentation

The application uses Next.js Server Actions for data operations. Key endpoints include:

- **Recipe Operations**:
  - `createRecipe`: Create a new recipe
  - `getRecipe`: Fetch a single recipe
  - `getUserRecipes`: Get all recipes created by the user
  - `updateRecipe`: Update an existing recipe
  - `deleteRecipe`: Remove a recipe
  - `mergeWithExternalRecipes`: Merge multiple recipes

- **Social Operations**:
  - `requestFriend`: Send a friend request
  - `acceptFriendRequest`: Accept an incoming request
  - `deleteFriendRequest`: Decline or cancel a request
  - `removeFriend`: Remove an existing friend

- **Feed Operations**:
  - `getRecipeFeed`: Get recipes from user's network
  - `likeRecipe`: Like a recipe
  - `unlikeRecipe`: Remove a like
  - `addFavorite`: Favorite a recipe
  - `removeFavorite`: Remove from favorites

## Troubleshooting

### Common Issues

1. **Database Connection Errors**:
   - **Issue**: `NEON_DATABASE_URL environment variable is not set`
     - **Solution**: Ensure you have a `.env` file in the root directory with the correct `NEON_DATABASE_URL`
   - **Issue**: `Connection failed` or `Invalid connection string`
     - **Solution**: Double-check your Neon connection string format and credentials
     - Ensure your Neon project is active (not suspended due to inactivity)
   - **Issue**: `Database initialization failed`
     - **Solution**: Run `npm run db:init` to set up the database schema
     - Check that your database user has sufficient permissions to create tables

2. **Database Setup Issues**:
   - **Issue**: `npm run db:init` fails
     - **Solution**: 
       - Verify your `NEON_DATABASE_URL` is correct in the `.env` file
       - Ensure your Neon database is accessible and not suspended
       - Check your internet connection
   - **Issue**: Tables already exist errors
     - **Solution**: The init script uses `CREATE TABLE IF NOT EXISTS`, so this shouldn't occur. If it does, you may need to drop existing tables first
   - **Issue**: Permission denied errors
     - **Solution**: Ensure your Neon database user has CREATE privileges

3. **Authentication Issues**:
   - Clear browser cookies and try logging in again
   - Verify JWT_SECRET in environment variables

3. **Recipe Merge Failures**:
   - Check your Gemini API key is valid
   - Ensure at least 2 recipes are selected

## Contributors
- Ahmad Wajid
- Najm Hoda
- Omar Lejmi
- Adam Omarbasha
- Abdulrahman Albedawy