# 🎾 High School Tennis Structure Update

## Overview
The app has been updated to reflect the real structure of high school tennis, including proper team divisions, match types, and scoring systems.

## 🏫 Team Structure

### Team Levels
- **Varsity**: Top players representing the school in official matches
- **Junior Varsity (JV)**: Developing players competing against other schools
- **Freshman**: New players gaining experience in freshman-only competitions

### Team Types
- **Boys Teams**: All-male teams
- **Girls Teams**: All-female teams  
- **Mixed Teams**: Co-ed teams (less common but supported)

## 🎯 Match Types & Divisions

### High School Tennis Match Structure
Each team match consists of multiple individual matches across different divisions:

#### Boys Divisions
- **Boys Singles**: Individual boys matches (typically 6 positions: 1st-6th singles)
- **Boys Doubles**: Two boys competing as pairs (typically 3 positions: 1st-3rd doubles)

#### Girls Divisions  
- **Girls Singles**: Individual girls matches (typically 6 positions: 1st-6th singles)
- **Girls Doubles**: Two girls competing as pairs (typically 3 positions: 1st-3rd doubles)

#### Mixed Divisions
- **Mixed Doubles**: One boy and one girl teaming up (typically 1-2 positions)

## 🏆 Scoring System

### Team Scoring
- Each individual match win = 1 point for the team
- Team with most points wins the overall match
- Example: Team A wins 8 matches, Team B wins 4 matches → Team A wins 8-4

### Match Positions
- **1st Singles/Doubles**: Highest ranked players
- **2nd Singles/Doubles**: Second highest ranked players  
- **3rd Singles/Doubles**: Third highest ranked players
- And so on...

## 🗄️ Database Updates

### New Fields Added
- `teams.team_level`: 'varsity' | 'jv' | 'freshman'
- `teams.gender`: 'boys' | 'girls' | 'mixed'
- `players.gender`: 'male' | 'female'
- `matches.match_type`: 'team_match' | 'individual'
- `match_results.division`: 'boys_singles' | 'girls_singles' | 'boys_doubles' | 'girls_doubles' | 'mixed_doubles'
- `match_results.position_number`: 1, 2, 3, etc.

### New Table
- `team_match_divisions`: Manages individual matches within team matches
  - Links to main match
  - Specifies division (boys_singles, etc.)
  - Tracks position number (1st, 2nd, etc.)
  - Stores player assignments and scores

## 🚀 Implementation Steps

### 1. Database Migration
Run the updated schema in Supabase:
```sql
-- See updated-tennis-schema.sql for complete migration
```

### 2. Update Existing Data
For existing teams/players, you'll need to:
- Set team_level to 'varsity' (default)
- Set team gender based on school structure
- Set player gender for all existing players

### 3. UI Updates
- Team creation now includes level and gender selection
- Player creation includes gender field
- Match scheduling includes division management
- Lineup builder supports proper position assignments

## 🎨 User Experience

### Team Setup
1. Coach selects team level (Varsity/JV/Freshman)
2. Coach selects team gender (Boys/Girls/Mixed)
3. System generates appropriate team code

### Player Management
1. Add players with gender specification
2. Set position preferences by division
3. Track skill levels within each division

### Match Management
1. Schedule team matches against other schools
2. Create lineups by division (Boys Singles, Girls Doubles, etc.)
3. Enter scores for individual matches
4. System calculates team totals

### Tournament System
- Supports team-based tournaments
- Bracket generation for team vs team matches
- Real-time score updates across all divisions

## 🔧 Technical Benefits

1. **Accurate Representation**: Reflects real high school tennis structure
2. **Flexible Scoring**: Supports various match formats
3. **Proper Data Model**: Clean separation of team vs individual matches
4. **Scalable Design**: Easy to add new divisions or formats
5. **Real-time Updates**: Live scoring across all match divisions

## 📊 Example Match Flow

### Team Match: Cypress Ranch (Boys Varsity) vs Katy High (Boys Varsity)

**Divisions:**
- Boys Singles (6 matches)
- Boys Doubles (3 matches)
- Total: 9 individual matches

**Lineup Example:**
- 1st Boys Singles: John Smith vs Mike Johnson
- 2nd Boys Singles: David Lee vs Chris Brown
- 1st Boys Doubles: John/David vs Mike/Chris
- ...and so on

**Scoring:**
- Cypress Ranch wins 6 individual matches
- Katy High wins 3 individual matches  
- **Final Score: Cypress Ranch 6, Katy High 3**

This update makes the app a true representation of high school tennis competition! 🎾
