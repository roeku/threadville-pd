# Game Progress Tracking System

This document describes the complete game progress tracking system implemented for Cold Case Detective.

## Overview

The game now tracks all player activity and stores it in a Supabase database. Players are assigned anonymous profiles stored in localStorage (no sign-in required), and all gameplay statistics are tracked for analytics and completion rewards.

## Database Schema

### Tables

#### `user_profiles`
Stores anonymous user profiles with lifetime statistics.
- `id` (UUID, PK): Unique profile identifier
- `created_at`: First visit timestamp
- `last_active_at`: Last visit timestamp
- `display_name`: Optional player name
- `total_cases_completed`: Number of solved cases
- `total_play_time_seconds`: Total time spent playing

#### `case_sessions`
Tracks each playthrough of a case.
- `id` (UUID, PK): Session identifier
- `user_profile_id` (FK): References user_profiles
- `case_id`: Case identifier
- `case_title`: Case name
- `started_at`: Session start time
- `completed_at`: Session completion time (null if incomplete)
- `time_to_complete_seconds`: Duration to solve
- `solved`: Whether the case was solved
- `difficulty`: Easy/Medium/Hard

#### `session_connections`
Tracks every deduction connection made (correct and incorrect).
- `id` (UUID, PK)
- `session_id` (FK): References case_sessions
- `from_id`: Source evidence ID
- `from_label`: Source evidence name
- `to_id`: Target evidence ID
- `to_label`: Target evidence name
- `link_type`: MATCHES/CONTRADICTS/SEQUENCE
- `is_valid`: Whether connection was correct
- `is_critical`: Whether connection is required to solve
- `created_at`: When connection was made
- `removed_at`: When connection was deleted (null if active)

#### `session_documents`
Tracks all documents printed from OS apps.
- `id` (UUID, PK)
- `session_id` (FK): References case_sessions
- `document_id`: Document identifier
- `document_label`: Document name
- `document_type`: FORENSIC_REPORT, CASE_FILE, etc.
- `printed_at`: When document was printed
- `reviewed`: Whether document was opened (future feature)

#### `session_puzzles`
Tracks OS app interactions (DNA Sequencer, Fingerprint Scanner, etc.).
- `id` (UUID, PK)
- `session_id` (FK): References case_sessions
- `puzzle_type`: DNA_SEQUENCER, FINGERPRINT_SCANNER, etc.
- `evidence_id`: Evidence being analyzed
- `evidence_label`: Evidence name
- `solved`: Whether analysis was successful
- `attempts`: Number of analysis attempts
- `completed_at`: When successfully solved
- `time_spent_seconds`: Time spent on puzzle (future feature)

## Services

### `gameProgressService.ts`

Main API for tracking game progress:

#### User Management
- `getOrCreateUserProfile()`: Gets or creates anonymous user profile
  - Checks localStorage for existing profile ID
  - Creates new profile if none exists
  - Returns profile UUID

#### Session Management
- `startCaseSession(caseFile)`: Starts new case session
  - Creates session record
  - Links to user profile
  - Returns session ID

- `completeCaseSession(sessionId, solved, startTime)`: Completes session
  - Marks session as completed
  - Calculates time to complete
  - Updates user profile stats if solved

#### Activity Tracking
- `trackConnection(sessionId, link, fromLabel, toLabel, isCritical, removed)`: Tracks deduction connection
  - Records or updates connection
  - Marks as removed if deleted
  
- `trackDocumentPrint(sessionId, documentId, documentLabel, documentType)`: Tracks printed document
  - Records document generation
  
- `trackPuzzleInteraction(sessionId, puzzleType, evidenceId, evidenceLabel, solved)`: Tracks OS app usage
  - Creates or updates puzzle record
  - Increments attempt counter

#### Statistics
- `getUserStats()`: Gets user statistics
  - Returns total cases completed
  - Returns total play time
  - Returns recent sessions

- `getSessionReport(sessionId)`: Gets detailed session report
  - Returns all connections made
  - Returns all documents printed
  - Returns all puzzles solved
  - Used by completion modal

## Components

### `CaseCompletionModal.tsx`

Shows when case is solved with detailed statistics:
- Time to complete
- Valid connections count
- Critical connections count
- Puzzles solved
- All documents printed
- Incorrect connections (mistakes)
- Correct connections (with critical marked)
- Actions: Next Case, Replay Case, Main Menu

## Integration Points

### App.tsx
- Starts session when case begins
- Completes session when case solved
- Shows completion modal after 2-second victory delay
- Handles next case/replay/main menu actions

### InvestigationBoard.tsx
- Tracks all connections when verify is clicked
- Marks critical connections based on deduction rules

### DnaSequencer.tsx & FingerprintScanner.tsx
- Track puzzle interactions when analysis is performed
- Track document prints when reports are generated

### Game Store
Added session tracking state:
- `sessionId`: Current session UUID
- `sessionStartTime`: Session start timestamp
- `showCompletionModal`: Whether to show completion screen

## User Flow

1. **First Visit**
   - Anonymous profile created
   - UUID stored in localStorage (`cold-case-user-profile-id`)

2. **Case Start**
   - Session record created
   - Session ID stored in game state
   - Start time recorded

3. **Gameplay**
   - All forensic analyses tracked (DNA, fingerprints)
   - All printed reports tracked
   - All deduction connections tracked when verified

4. **Case Completion**
   - Session marked complete
   - Time to complete calculated
   - User profile stats updated
   - Completion modal shown after victory animation

5. **Post-Completion**
   - Player can view detailed session report
   - Choose to replay case, try next case, or return to menu

## localStorage Keys

- `cold-case-user-profile-id`: UUID of anonymous user profile

## Future Enhancements

Potential additions to the tracking system:
- Document review tracking (track when documents are opened)
- Puzzle time tracking (track time spent in each OS app)
- Clue discovery tracking (track which clues were uncovered)
- Item inspection tracking (track which evidence was examined)
- View statistics in main menu (leaderboard, personal stats)
- Achievement system (solve without mistakes, speed runs, etc.)
- Session replay system (recreate investigation timeline)

## Database Policies

All tables have Row Level Security (RLS) enabled with permissive policies allowing all operations. This is safe because:
1. Users are anonymous (no sensitive data)
2. Profile IDs are randomly generated UUIDs
3. Data is used for analytics only
4. Future: Could restrict based on profile ID in request

## Querying Examples

### Get player's best time for a case
```sql
SELECT 
  case_title,
  MIN(time_to_complete_seconds) as best_time
FROM case_sessions
WHERE user_profile_id = 'user-uuid' 
  AND solved = true
GROUP BY case_title;
```

### Get most common mistakes
```sql
SELECT 
  from_label,
  to_label,
  COUNT(*) as mistake_count
FROM session_connections
WHERE is_valid = false 
  AND removed_at IS NULL
GROUP BY from_label, to_label
ORDER BY mistake_count DESC
LIMIT 10;
```

### Get average solve time by difficulty
```sql
SELECT 
  difficulty,
  AVG(time_to_complete_seconds) as avg_time,
  COUNT(*) as solve_count
FROM case_sessions
WHERE solved = true
GROUP BY difficulty;
```

## Testing

To test the progress system:
1. Start a new case
2. Check browser console for "📊 Session started: [uuid]"
3. Perform forensic analyses (DNA/fingerprint)
4. Print reports
5. Make deduction connections
6. Click verify switch
7. Solve the case
8. Check completion modal for detailed stats
9. Check Supabase dashboard to verify data persistence

## Troubleshooting

**Problem**: Session not starting
- Check Supabase connection (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY)
- Check browser console for errors
- Verify migration was applied successfully

**Problem**: Completion modal not showing
- Verify case is actually solved (check console logs)
- Check that sessionId and sessionStartTime are set
- Check React dev tools for showCompletionModal state

**Problem**: Data not persisting
- Check RLS policies in Supabase
- Verify tables were created correctly
- Check network tab for failed API calls
