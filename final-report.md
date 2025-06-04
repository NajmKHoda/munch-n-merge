# Munch-n-Merge Final Report

## 1. App Purpose

### What problem does your app solve?
Munch-n-Merge addresses the challenge of recipe discovery and creativity in cooking. It solves the problem of recipe stagnation by allowing users to not only discover new recipes from their social network but also merge existing recipes using AI to create innovative cooking ideas.

### Who is it for?
The app targets cooking enthusiasts, home chefs, and food explorers who:
- Want to share their culinary creations with others
- Are looking for new recipe ideas from people they trust
- Enjoy experimenting with food combinations
- Value a social component to their cooking experience

### What is the user supposed to do with it?
Users can:
- Create and store their own recipes
- Build a network of friends with similar culinary interests
- Discover recipes from friends in their extended social network
- Use AI to merge multiple recipes into new creative dishes
- Like and favorite recipes they enjoy
- Search for specific recipes by keywords

## 2. Architecture and Technologies Used

### Application Architecture
Munch-n-Merge follows a modern full-stack architecture leveraging Next.js 13/14's App Router with a mixture of server and client components:

- **Frontend**: Next.js React components with a mixture of server-side rendering and client-side interactivity
- **Backend**: Next.js Server Actions (replacing traditional API routes)
- **Database**: PostgreSQL hosted on Neon (serverless Postgres)
- **Authentication**: Custom JWT-based authentication with secure HTTP-only cookies
- **AI**: Integration with Google's Gemini AI for recipe merging capabilities

### Technologies Used

#### Frontend
- Next.js 13/14 with App Router
- React 18 with functional components and hooks
- TypeScript for type safety
- Tailwind CSS for responsive styling
- Client-side state management with React Context

#### Backend
- Next.js Server Actions for data mutations
- Edge-compatible serverless functions
- SQL queries with prepared statements for security
- JWT token authentication (jose library)

#### Database
- Neon PostgreSQL (serverless)
- Connection pooling via @neondatabase/serverless
- Relational data model with tables for users, recipes, friends, etc.

#### Other Technologies
- Google Gemini AI API for recipe merging
- bcrypt for password hashing
- Custom session management
- Custom social network graph traversal for feed generation

## 3. Features Supported by the App

### Core Features
1. **User Authentication**
   - Secure signup/login with username, email, and password
   - Password hashing with bcrypt
   - JWT session management with HTTP-only cookies
   - User profile management (username, email, password updates)

2. **Recipe Management**
   - Create recipes with name, description, ingredients, and instructions
   - Edit and delete existing recipes
   - Detailed recipe viewing with structured ingredient lists and instructions
   - Difficulty indicators for recipes

3. **Social Networking**
   - Friend request system (send, accept, decline)
   - Multi-level social feed (showing recipes from friends up to 5 degrees of separation)
   - User search functionality to find and add friends
   - Friend management interface

### Additional Notable Features

4. **AI-Powered Recipe Merging**
   - Select multiple recipes to merge using Google's Gemini AI
   - Adjustable creativity levels via temperature control
   - AI generates a cohesive new recipe combining ingredients and instructions
   - Merged recipes saved to user's collection with proper attribution

5. **Social Engagement System**
   - Recipe liking capability
   - Favorites system to bookmark recipes
   - Like and favorite counts displayed on recipes
   - Feed sorting by popularity (likes)

6. **Advanced Recipe Feed**
   - Multi-level social graph traversal (up to 5 degrees)
   - Customizable depth for feed content
   - Pagination support
   - Feed filtering by date

7. **Search Functionality**
   - Search recipes by name, ingredients, or description
   - Real-time search results display
   - Interactive search interface with like/favorite capabilities
   - User search for friend discovery

## 4. My Individual Contribution

As Ahmad Wajid, I was responsible for several key components of the Munch-n-Merge platform:

### Frontend Development
- **Recipe Management Interface**: Built the complete "My Recipes" page with create, edit, and delete functionality
- **Recipe Merge UI**: Implemented the interface for selecting and merging recipes with AI
- **Navigation System**: Created the website NavBar with responsive design and dropdown functionality
- **Authentication UI**: Developed the Login and Signup pages with form validation
- **Individual Recipe View**: Created the detailed recipe page showing ingredients and instructions

### Backend Implementation
- **Recipe Merge Logic**: Coordinated with NajmKHoda to connect the frontend merger interface with the backend AI processing
- **Feed Page**: Implemented the recipe feed display and integration with the backend feed API
- **Authentication Flow**: Connected the login/signup UI with the server actions

### Design & User Experience
- **Navbar Design**: Created an intuitive navigation system with dropdown menus
- **Recipe Cards**: Designed responsive recipe cards for various views (feed, search, etc.)
- **Responsive Design**: Ensured the application works well on both mobile and desktop devices

### Cross-functional Work
- **Feed Integration**: Fixed integration issues between the backend feed API and frontend display
- **Navbar Menu**: Improved and fixed menu responsiveness issues
- **README Documentation**: Created comprehensive documentation outlining the project architecture and features

## 5. Difficulties I Faced

### Challenge 1: Recipe Format Standardization
One of the main challenges I faced was standardizing recipe data between different app views and the AI merging functionality. Recipes needed to be displayed consistently in the feed, detailed view, and merging interface, yet required different formats for AI processing.

**Solution:** I implemented a set of helper functions to transform recipe data between formats as needed. This included converting between array and object structures for ingredients and standardizing JSON serialization/deserialization.

### Challenge 2: User Authentication State Management
Managing logged-in user state across the application was difficult due to Next.js's hybrid rendering approach with both server and client components.

**Solution:** I implemented a UserContext provider that combined server-side authentication checks with client-side state management. This allowed components to access user information consistently regardless of whether they were server or client rendered.

### Challenge 3: Merging UI/UX Flow
Creating an intuitive interface for recipe merging that would clearly indicate selected recipes and provide appropriate feedback during the AI generation process was challenging.

**Solution:** I designed a card-based selection interface with visual indicators for selected recipes and implemented a temperature slider for AI creativity control. I also added loading states and success/error feedback to guide users through the process.

### Challenge 4: SQL Type Mismatch in Recipe Merging
When implementing the `mergeWithExternalRecipes` functionality, I encountered issues with the SQL implementation. The JSON data from the frontend was causing type mismatches when calling the PostgreSQL database, causing the merge function to fail.

**Solution:** I had to reimplement how the SQL function was called, ensuring proper type handling and data transformation between the frontend JSON format and the database's expected input format. This required modifying the data processing pipeline to correctly parse and format the recipe data before submitting it to the database queries.

## 6. Improvements or Additional Features (if time allowed)

### Feature Improvements
1. **Recipe Categories and Tags**
   - Implement a tagging system to categorize recipes by cuisine, dietary preferences, etc.
   - Add filtering options in search and feed based on these tags

2. **Enhanced AI Merging Options**
   - Provide more control parameters beyond temperature setting
   - Allow users to specify dietary restrictions or preferences for merged recipes
   - Implement recipe image generation using AI

3. **Mobile App Version**
   - Develop a native mobile application for iOS and Android
   - Implement push notifications for social interactions

### Technical Improvements
1. **Testing Infrastructure**
   - Implement comprehensive unit and integration tests
   - Add end-to-end testing with Cypress or similar tools

2. **Performance Optimizations**
   - Implement more efficient pagination for the feed
   - Add caching layers for commonly accessed data
   - Optimize database queries, especially for the multi-level friend feed

3. **Enhanced Security**
   - Implement rate limiting for login attempts
   - Add two-factor authentication options
   - Enhance input validation across all forms
