USER ROLES AND PERMISSIONS – CodeSync

This section defines what actions are allowed for each type of user
inside the CodeSync platform.

--------------------------------------------------

1. NON-LOGGED-IN USER (GUEST)

Description:
User who has not logged in or authenticated.

Allowed Actions:
- View landing page
- View project features and description
- View public documentation
- See login and sign-up options

Restricted Actions:
- Cannot create a room
- Can join a room
- Cannot view or edit any code
- Cannot access chat
- Cannot run code
- Cannot download files
- Cannot connect GitHub
- Create temp room

--------------------------------------------------

2. LOGGED-IN USER (REGISTERED USER)

Description:
User who is authenticated but does not own the room.

Allowed Actions:
- Create a new room (becomes owner of that room)
- Join an existing room using room ID or invite link
- View file and folder structure
- Edit files in real time
- Create new files and folders (if permitted by owner)
- Delete or rename files (if permitted by owner)
- Run supported code on server
- View terminal output
- Download project as ZIP
- Participate in room chat
- See online users and live cursors

Restricted Actions:
- Cannot clone a GitHub repository in an existing room
- Cannot change repository source
- Cannot push code to GitHub
- Cannot delete the room (unless owner)
- Cannot change room settings (unless owner)

--------------------------------------------------

3. ROOM OWNER (CREATOR OF ROOM)

Description:
First user who creates the room.
Has full control over the room and GitHub integration.

Allowed Actions:
- Choose project type at room creation:
  - Create new project
  - Clone GitHub repository
- Authenticate with GitHub
- Clone one GitHub repository (only once per room)
- Lock repository source after clone
- Full file and folder access
- Edit all files
- Run code on server
- Download project locally
- Push changes back to the same GitHub repository
- Enable or disable:
  - Offline editing by collaborators
  - Auto-push before room deletion
- Delete room manually
- Manage room members (add/remove users)
- Change user roles (editor/viewer)
- View full activity and version history

Restricted Actions:
- Cannot clone a second GitHub repository
- Cannot push to a different repository
- Cannot bypass inactivity cleanup rules

--------------------------------------------------

4. ROOM EDITOR (COLLABORATOR)

Description:
User invited or joined into a room with edit permission.

Allowed Actions:
- View file and folder structure
- Edit code in real time
- Create files and folders (if allowed)
- Rename and delete files (if allowed)
- Run supported code on server
- View terminal output
- Download project as ZIP
- Use chat
- See live cursors and online users
- Continue editing when owner is offline (if enabled)

Restricted Actions:
- Cannot clone GitHub repository
- Cannot push code to GitHub
- Cannot change room settings
- Cannot delete room
- Cannot manage user roles

--------------------------------------------------

5. ROOM VIEWER (READ-ONLY USER)

Description:
User with read-only access.

Allowed Actions:
- View files and folders
- View code in real time
- View terminal output
- View chat messages
- See online users and cursors

Restricted Actions:
- Cannot edit files
- Cannot create, rename, or delete files
- Cannot run code
- Cannot download project
- Cannot push to GitHub
- Cannot manage room or users

--------------------------------------------------

6. SYSTEM AUTOMATION (BACKGROUND PROCESS)

Description:
Automated system tasks.

Allowed Actions:
- Track room last activity time
- Delete rooms after inactivity period
- Push latest code to GitHub before deletion (if enabled)
- Clean up server workspace
- Remove database records
- Enforce permission rules

--------------------------------------------------

END OF USER ROLES AND PERMISSIONS
