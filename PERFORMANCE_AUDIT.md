# Performance Audit: KC Frequency Omnibus

## Overview
This document outlines performance optimization opportunities identified in the KC Frequency Omnibus codebase. These recommendations focus on improving database operations, state management, UI rendering, and data processing.

## Database Performance

### Issues Identified:
1. **No Indexes on Frequently Queried Fields**: Tables like `frequencies` lack indexes on commonly queried fields (e.g., `frequency`, `mode`, `service_type`, `county`, `state`)
2. **Sequential Operations in Batch Functions**: Methods like `batchUpdateFrequencies` and `importFrequencies` process items sequentially
3. **Remote SQL.js Loading**: SQL.js is loaded from a remote CDN
4. **Missing Prepared Statements**: Some SQL operations don't use parameter binding
5. **No Connection Pooling**: Only one database connection is available

### Recommendations:
1. **Add Database Indexes**:
   ```sql
   CREATE INDEX idx_frequencies_frequency ON frequencies(frequency);
   CREATE INDEX idx_frequencies_mode ON frequencies(mode);
   CREATE INDEX idx_frequencies_county ON frequencies(county);
   CREATE INDEX idx_frequencies_state ON frequencies(state);
   CREATE INDEX idx_frequencies_service_type ON frequencies(service_type);
   CREATE INDEX idx_frequencies_active ON frequencies(active);
   ```

2. **Optimize Batch Operations**:
   ```typescript
   public async batchUpdateFrequencies(updates: { id: number; data: Partial<Frequency> }[]): Promise<void> {
     // Use transaction for better performance
     await this.db.execute('BEGIN TRANSACTION');
     try {
       for (const update of updates) {
         await this.updateFrequency(update.id, update.data);
       }
       await this.db.execute('COMMIT');
     } catch (error) {
       await this.db.execute('ROLLBACK');
       throw error;
     }
   }
   ```

3. **Bundle SQL.js with Application**:
   ```typescript
   this.sql = await initSqlJs({
     locateFile: file => `./assets/${file}`  // Local path instead of CDN
   });
   ```

4. **Use Prepared Statements Consistently**:
   Ensure all database operations use parameter binding to improve security and performance.

## State Management

### Issues Identified:
1. **Redundant Data Fetching**: Multiple components trigger the same data fetch
2. **Store Initialization on Each Action**: Each store action creates a new service instance
3. **No State Memoization**: Computed values aren't memoized
4. **Full Refetch After Updates**: After each CRUD operation, all data is refetched

### Recommendations:
1. **Singleton Service Instances**:
   ```typescript
   // In store
   const frequencyService = new FrequencyService();
   
   export const useFrequencyStore = create<FrequencyState>((set, get) => ({
     // Use the singleton service instance for all operations
     fetchFrequencies: async (filter?: FrequencyFilter) => {
       // Use the shared instance
       const frequencies = await frequencyService.getFrequencies(filter);
       // Rest of the code
     }
   }));
   ```

2. **Optimize Updates to Avoid Full Refetches**:
   ```typescript
   updateFrequency: async (id: number, frequency: Partial<Frequency>) => {
     set({ loading: true, error: null });
     try {
       const service = new FrequencyService();
       const updatedFrequency = await service.updateFrequency(id, frequency);
       
       // Update the single item in the array instead of refetching everything
       if (updatedFrequency) {
         set(state => ({
           frequencies: state.frequencies.map(f => 
             f.id === id ? updatedFrequency : f
           ),
           loading: false
         }));
       }
     } catch (error) {
       set({ 
         error: error instanceof Error ? error.message : 'Failed to update frequency',
         loading: false 
       });
     }
   }
   ```

3. **Implement Memoization for Derived Data**:
   ```typescript
   // Add selectors to store
   selectors: {
     getFilteredFrequencies: (state) => {
       // Implement filtering logic here
       return state.frequencies.filter(/* filtering logic */);
     }
   }
   ```

## UI Rendering

### Issues Identified:
1. **No Virtualization for Large Lists**: All frequencies are rendered at once
2. **Missing React.memo**: No memoization of components
3. **Inefficient Rendering**: Components re-render unnecessarily
4. **Large Component Trees**: Pages have deeply nested component structures

### Recommendations:
1. **Implement Virtualization for Lists**:
   ```tsx
   import { useVirtualizer } from '@tanstack/react-virtual';
   
   // In FrequenciesPage.tsx
   const rowVirtualizer = useVirtualizer({
     count: frequencies.length,
     getScrollElement: () => parentRef.current,
     estimateSize: () => 100, // Estimate row height
     overscan: 5,
   });
   
   // Only render visible items
   {rowVirtualizer.getVirtualItems().map(virtualRow => (
     <div key={virtualRow.index} 
          style={{
            height: `${virtualRow.size}px`,
            transform: `translateY(${virtualRow.start}px)`,
          }}>
       {renderFrequency(frequencies[virtualRow.index])}
     </div>
   ))}
   ```

2. **Add Memoization**:
   ```tsx
   // Create memoized components
   const MemoizedFrequencyItem = React.memo(FrequencyItem);
   
   // Use the memoized component
   {frequencies.map(freq => (
     <MemoizedFrequencyItem 
       key={freq.id} 
       frequency={freq} 
       onEdit={handleEdit}
       onDelete={handleDelete} 
     />
   ))}
   ```

3. **Optimize Re-renders with useMemo and useCallback**:
   ```tsx
   // Memoize handlers
   const handleEdit = useCallback((freq) => {
     setEditFrequency(freq);
     setModalOpen(true);
   }, []);
   
   // Memoize filtered data
   const filteredFrequencies = useMemo(() => {
     return frequencies.filter(/* filtering logic */);
   }, [frequencies, filter]);
   ```

## Data Processing

### Issues Identified:
1. **Client-side CSV Processing**: Large CSV files are processed in-memory
2. **Inefficient Import Algorithm**: Imports process one record at a time
3. **No Chunking for Large Datasets**: Large datasets cause UI freezes
4. **Synchronous Data Transformation**: Data transformations block the main thread

### Recommendations:
1. **Implement Chunked Processing**:
   ```typescript
   public async importFrequencies(frequencies: Omit<Frequency, 'id' | 'created_at' | 'updated_at'>[]): Promise<void> {
     const chunkSize = 100;
     await this.db.execute('BEGIN TRANSACTION');
     
     try {
       // Process in chunks
       for (let i = 0; i < frequencies.length; i += chunkSize) {
         const chunk = frequencies.slice(i, i + chunkSize);
         await this.processFrequencyChunk(chunk);
         
         // Allow UI updates between chunks
         await new Promise(resolve => setTimeout(resolve, 0));
       }
       
       await this.db.execute('COMMIT');
     } catch (error) {
       await this.db.execute('ROLLBACK');
       throw error;
     }
   }
   
   private async processFrequencyChunk(chunk: Omit<Frequency, 'id' | 'created_at' | 'updated_at'>[]): Promise<void> {
     // Batch insert logic here
     const placeholders = chunk.map(() => '(?,?,?,?,...)').join(',');
     const values = chunk.flatMap(f => Object.values(f));
     
     const sql = `INSERT INTO frequencies (field1, field2, ...) VALUES ${placeholders}`;
     await this.db.execute(sql, values);
   }
   ```

2. **Use Web Workers for Heavy Processing**:
   ```typescript
   // In a service method
   async processLargeDataset(data) {
     return new Promise((resolve, reject) => {
       const worker = new Worker('/workers/data-processor.js');
       
       worker.onmessage = (e) => {
         resolve(e.data);
         worker.terminate();
       };
       
       worker.onerror = (e) => {
         reject(e);
         worker.terminate();
       };
       
       worker.postMessage(data);
     });
   }
   ```

## Memory Management

### Issues Identified:
1. **Retained References**: Some objects may not be properly garbage collected
2. **Large Dataset Retention**: Entire datasets stay in memory
3. **No Resource Cleanup**: Some resources aren't properly disposed

### Recommendations:
1. **Implement Proper Cleanup in useEffect**:
   ```tsx
   useEffect(() => {
     // Effect logic here
     
     return () => {
       // Cleanup logic
       // Clear large objects
       // Unsubscribe from events
     };
   }, [dependencies]);
   ```

2. **Paginate Large Datasets**:
   ```typescript
   public async getFrequencies(filter?: FrequencyFilter, page = 1, pageSize = 100): Promise<{ data: Frequency[], total: number }> {
     let sql = 'SELECT * FROM frequencies WHERE 1=1';
     const countSql = 'SELECT COUNT(*) as total FROM frequencies WHERE 1=1';
     const params: any[] = [];
     
     // Apply filters to both queries
     // ...
     
     // Add pagination
     sql += ' ORDER BY frequency ASC LIMIT ? OFFSET ?';
     params.push(pageSize, (page - 1) * pageSize);
     
     const data = await this.db.query<Frequency>(sql, params);
     const countResult = await this.db.query<{total: number}>(countSql, params.slice(0, -2));
     
     return {
       data,
       total: countResult[0]?.total || 0
     };
   }
   ```

## Application Initialization

### Issues Identified:
1. **Sequential Initialization**: Resources are loaded and initialized sequentially
2. **No Lazy Loading**: All components are loaded eagerly
3. **Large Initial Payload**: All code is loaded on startup

### Recommendations:
1. **Parallel Resource Loading**:
   ```typescript
   useEffect(() => {
     async function initDatabase() {
       try {
         setLoading(true);
         
         // Load resources in parallel
         const [SQL, csvResponse] = await Promise.all([
           initSqlJs(),
           fetch('/data/trunked-systems.csv')
         ]);
         
         const db = new SQL.Database();
         setDb(db);
         
         // Initialize schema
         const dbService = new DatabaseService(db);
         await dbService.initSchema();
         
         const csvText = await csvResponse.text();
         await dbService.importTrunkedSystems(csvText);
         
         // Initialize UI
         await initializeUI();
         
         setLoading(false);
       } catch (error) {
         setError(error instanceof Error ? error.message : 'Failed to initialize database');
         setLoading(false);
       }
     }
     
     initDatabase();
   }, [setDb, setLoading, setError, initializeUI]);
   ```

2. **Implement Code Splitting and Lazy Loading**:
   ```tsx
   // In App.tsx
   import { lazy, Suspense } from 'react';
   
   const FrequenciesPage = lazy(() => import('./pages/FrequenciesPage'));
   const TrunkedSystemsPage = lazy(() => import('./pages/TrunkedSystemsPage'));
   const ExportProfilesPage = lazy(() => import('./pages/ExportProfilesPage'));
   const SettingsPage = lazy(() => import('./pages/SettingsPage'));
   
   // In render method
   <Suspense fallback={<div>Loading...</div>}>
     {renderContent()}
   </Suspense>
   ```

## Conclusion

Implementing these recommendations will significantly improve the performance of the KC Frequency Omnibus application. The optimizations focus on:

1. **Database Performance**: Adding indexes and optimizing query patterns
2. **State Management**: Reducing redundant fetches and optimizing updates
3. **UI Rendering**: Implementing virtualization and memoization
4. **Data Processing**: Adding chunking and web workers for heavy processing
5. **Memory Management**: Proper cleanup and pagination
6. **Application Initialization**: Parallel loading and code splitting

These changes should result in faster load times, smoother user interactions, reduced memory usage, and better overall performance, especially when dealing with large datasets. 
