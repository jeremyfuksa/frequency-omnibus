# KC Frequency Omnibus - Product Specification

## Overview
KC Frequency Omnibus is a comprehensive frequency management system designed for amateur radio operators and scanner enthusiasts in the Kansas City metropolitan area. The application provides a centralized database for managing conventional frequencies, trunked systems, and export profiles for various radio models.

## Core Features

### 1. Database Management
- SQLite-based local database for persistent storage
- Automatic schema initialization
- Database backup and restore functionality
- Settings persistence across sessions
- Specialized database views for common queries
- Type-safe database operations

### 2. Frequency Management
- Store and manage conventional frequencies with detailed metadata:
  - Frequency and transmit frequency
  - Name and description
  - Alpha tag and mode
  - Tone mode and frequency
  - Location data (county, state)
  - Agency and callsign information
  - Service type and tags
  - Duplex and offset settings
  - Verification status and notes
  - Geographic coordinates
  - Export flags for different radio models
- Advanced filtering and search capabilities
- Batch operations support
- Frequency range validation
- Mode compatibility checking

### 3. Trunked System Management
- Comprehensive trunked system tracking:
  - System identification and classification
  - Business type and ownership
  - Protocol and WACN information
  - Site management with location data
  - Talkgroup organization
  - Active/inactive status tracking
- Hierarchical system visualization
- Site coverage mapping
- Talkgroup categorization
- System protocol validation

### 4. Export Capabilities
- Support for multiple radio formats:
  - CHIRP
  - Uniden
  - SDRTrunk
  - SDRPlus
  - OpenGD77
- Export profile management
- Radio model compatibility checking
- Frequency range validation
- Mode support verification
- Custom export filters
- Format-specific validation

### 5. User Interface
- Modern, responsive design
- Dark mode support
- Persistent UI state
- Tab-based navigation:
  - Conventional Frequencies
  - Trunked Systems
  - Export Profiles
  - Settings
- Collapsible sidebar
- Modal dialogs for data entry
- Advanced filtering interface
- Batch operation tools
- Status indicators
- Toast notifications

### 6. Data Import/Export
- CSV import support for:
  - Conventional frequencies
  - Trunked systems
  - Talkgroups
- RadioReference JSON format support
- Database backup/restore functionality
- Format validation
- Error handling and reporting
- Import conflict resolution

### 7. Settings Management
- Persistent application settings:
  - UI preferences (dark mode, sidebar state)
  - Active tab selection
  - Modal states
  - Default region selection
- Settings stored in SQLite database
- Type-safe settings management
- Settings migration support
- Default value handling

### 8. Integration Features
- Basic Ham Dash integration for frequency data sharing
- Simple file-based data exchange
- Basic status monitoring

## Technical Requirements

### Database Schema
- SQLite database with the following tables:
  - frequencies
  - trunked_systems
  - trunked_sites
  - talkgroups
  - counties
  - radios
  - export_profiles
  - app_settings
- Specialized views for common queries
- Foreign key constraints
- Indexes for performance
- Type-safe query interface

### State Management
- Zustand for state management
- Persistent state storage in SQLite
- Type-safe state handling
- Async state operations
- State persistence
- State migration support
- Error state handling

### UI Framework
- React with TypeScript
- Tailwind CSS for styling
- Responsive design
- Dark mode support
- Component library integration
- Form validation
- Error boundaries
- Loading states

### Data Validation
- Frequency range validation
- Mode compatibility checking
- Required field validation
- Type safety throughout
- Cross-field validation
- Format-specific validation
- Import data validation

## Future Considerations

### Phase 1: Core Features (Current)
- Basic frequency management
- Simple trunked system support
- Essential export formats
- Core UI functionality
- Basic settings management

### Phase 2: Enhanced Integration
- Advanced Ham Dash integration:
  - File-based exchange mechanisms
  - Event system for real-time communication
  - Radio display configuration
  - Frequency activity feed
  - Configuration export capabilities
- Real-time monitoring capabilities
- Advanced status tracking
- Priority frequency management

### Phase 3: Advanced Features
- Real-time frequency monitoring
- Integration with additional radio models
- Advanced filtering and search capabilities
- User authentication and cloud sync
- Mobile application support
- API for third-party integration

## Development Guidelines
- TypeScript for type safety
- React for UI components
- Zustand for state management
- SQLite for data persistence
- Tailwind CSS for styling
- Modular service architecture
- Comprehensive error handling
- Async/await for all database operations
- Component-driven development
- Test-driven development
- Documentation requirements
- Code review process 
