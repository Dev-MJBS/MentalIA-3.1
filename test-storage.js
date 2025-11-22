// Test script for MentalIA storage
// Run this in browser console to test storage functionality

async function testStorage() {
    console.log('🧪 Testing MentalIA Storage...');

    try {
        // Check if storage is available
        if (!window.mentalStorage) {
            console.error('❌ window.mentalStorage not found');
            return;
        }

        console.log('✅ Storage object found');

        // Test initialization
        await window.mentalStorage.ensureInitialized();
        console.log('✅ Storage initialized');

        // Test saving a mood entry
        const testEntry = {
            id: Date.now(),
            mood: 3.5,
            feelings: [{ value: 'happy', category: 'positive', emoji: '😊', label: 'Feliz' }],
            diary: 'Test entry for debugging',
            timestamp: new Date().toISOString(),
            date: new Date().toDateString(),
            version: '3.1'
        };

        console.log('💾 Saving test entry:', testEntry);
        const saveResult = await window.mentalStorage.saveMoodEntry(testEntry);
        console.log('✅ Save result:', saveResult);

        // Test loading all entries
        console.log('📊 Loading all entries...');
        const entries = await window.mentalStorage.getAllMoodEntries();
        console.log('✅ Loaded entries:', entries.length, entries);

        // Test getting stats
        console.log('📈 Getting stats...');
        const stats = await window.mentalStorage.getStats();
        console.log('✅ Stats:', stats);

        console.log('🎉 All storage tests passed!');

    } catch (error) {
        console.error('❌ Storage test failed:', error);
        console.error('Stack trace:', error.stack);
    }
}

// Auto-run test
testStorage();