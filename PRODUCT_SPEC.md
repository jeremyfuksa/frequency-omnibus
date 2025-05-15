# Frequency Omnibus: Product Specification

## Product Vision
Frequency Omnibus is a modern, web-based radio frequency management system designed for amateur radio operators, scanner enthusiasts, and public safety professionals in the Kansas City metropolitan area. It provides a unified interface for managing, organizing, and exporting radio frequencies across multiple formats and devices.

## Target Users
1. **Primary Users:**
   - Amateur radio operators
   - Scanner enthusiasts
   - Public safety professionals
   - Radio hobbyists

2. **Secondary Users:**
   - Radio dealers and technicians
   - Emergency management personnel
   - Local government agencies

## Core Features

### 1. Frequency Management
- **Conventional Frequencies**
  - Add, edit, and delete frequencies
  - Support for multiple modes (FM, NFM, AM, DMR, P25)
  - Tone and DCS code management
  - Geographic tagging (county, state)
  - Service type classification
  - Active/inactive status tracking

- **Trunked Systems**
  - Hierarchical organization (system → site → talkgroup)
  - Protocol support (P25, DMR, NXDN)
  - System class and type classification
  - Business type and ownership tracking

### 2. Data Organization
- **Filtering & Search**
  - Full-text search across all fields
  - Mode-based filtering
  - Service type filtering
  - Geographic filtering
  - Active status filtering

- **Data Visualization**
  - Card-based frequency display
  - Hierarchical trunked system view
  - Tag-based organization
  - Status indicators

### 3. Export Capabilities
- **Supported Formats:**
  - CHIRP (Baofeng radios)
  - Uniden scanners
  - SDRTrunk
  - OpenGD77
  - SDR++

- **Export Features:**
  - Format-specific field mapping
  - Selective export by frequency
  - Batch export capabilities
  - Export profile management

### 4. User Interface
- **Design Principles:**
  - Clean, modern aesthetic
  - Responsive layout
  - Dark/light mode support
  - Intuitive navigation

- **Key Components:**
  - Sidebar navigation
  - Modal dialogs for data entry
  - Filter panels
  - Status indicators
  - Action buttons

## Technical Requirements

### 1. Frontend
- React 18 with TypeScript
- Tailwind CSS for styling
- shadcn/ui component library
- Zustand for state management
- Vite build system

### 2. Database
- SQLite (in-browser via SQL.js)
- Comprehensive schema for frequencies, trunked systems, and metadata
- Support for data import/export
- Backup and restore capabilities

### 3. Browser Support
- Chrome 110+
- Firefox 110+
- Safari 16+
- Edge 110+

## User Experience Goals

### 1. Efficiency
- Quick access to frequently used features
- Streamlined data entry
- Efficient filtering and search
- Fast export process

### 2. Accuracy
- Data validation on input
- Format-specific export validation
- Duplicate detection
- Data integrity checks

### 3. Flexibility
- Multiple export formats
- Customizable views
- Flexible filtering options
- Extensible data model

## Success Metrics
1. **User Engagement**
   - Number of frequencies managed
   - Export frequency
   - Session duration

2. **Data Quality**
   - Frequency accuracy
   - Completeness of records
   - Update frequency

3. **System Performance**
   - Load time
   - Export speed
   - Search response time

## Future Considerations
1. **Potential Enhancements**
   - Mobile app version
   - Cloud sync capabilities
   - Additional export formats
   - API integration

2. **Scalability**
   - Support for additional regions
   - Extended frequency range
   - More trunked system protocols
   - Enhanced data visualization

## Maintenance & Support
- Quarterly data review
- Regular feature updates
- User feedback integration
- Documentation maintenance

---

*This specification reflects the current implementation while providing a framework for future development. It serves as a living document that will evolve with user needs and technological advancements.* 
