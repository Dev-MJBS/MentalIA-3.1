// Debug helper for MentalIA
console.log('🔧 [DEBUG] Script de debug carregado');

// Override console methods to capture all logs
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;

const debugLogs = [];

function captureLog(type, args) {
    const timestamp = new Date().toISOString();
    const message = Array.from(args).map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ');
    
    debugLogs.push({
        type,
        timestamp,
        message
    });
    
    // Keep only last 100 logs
    if (debugLogs.length > 100) {
        debugLogs.shift();
    }
}

console.log = function(...args) {
    captureLog('log', args);
    originalLog.apply(console, args);
};

console.error = function(...args) {
    captureLog('error', args);
    originalError.apply(console, args);
};

console.warn = function(...args) {
    captureLog('warn', args);
    originalWarn.apply(console, args);
};

// Global debug functions
window.getDebugLogs = function() {
    return debugLogs;
};

window.clearDebugLogs = function() {
    debugLogs.length = 0;
    console.log('🔧 [DEBUG] Logs limpos');
};

window.exportDebugLogs = function() {
    const logsText = debugLogs.map(log => 
        `[${log.timestamp}] ${log.type.toUpperCase()}: ${log.message}`
    ).join('\n');
    
    const blob = new Blob([logsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mentalIA-debug-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('🔧 [DEBUG] Logs exportados');
};

// Check if critical objects exist
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        console.log('🔧 [DEBUG] Verificando objetos críticos...');
        console.log('🔧 [DEBUG] window.mentalStorage:', !!window.mentalStorage);
        console.log('🔧 [DEBUG] window.aiAnalysis:', !!window.aiAnalysis);
        console.log('🔧 [DEBUG] window.googleDriveBackup:', !!window.googleDriveBackup);
        console.log('🔧 [DEBUG] window.mentalIA:', !!window.mentalIA);
        console.log('🔧 [DEBUG] gapi:', typeof gapi !== 'undefined');
        console.log('🔧 [DEBUG] google:', typeof google !== 'undefined');
        
        // Test storage
        if (window.mentalStorage) {
            window.mentalStorage.getAllMoodEntries().then(entries => {
                console.log('🔧 [DEBUG] Entradas no storage:', entries ? entries.length : 0);
            }).catch(err => {
                console.error('🔧 [DEBUG] Erro ao acessar storage:', err);
            });
        }
    }, 2000);
});

// Error handler global
window.addEventListener('error', (event) => {
    if (event.error && event.error.message) {
        console.error('🔧 [DEBUG] Erro global capturado:', event.error.message);
        captureLog('global-error', [event.error.message, event.error.stack || 'Stack não disponível']);
    } else if (event.filename && event.lineno) {
        console.error('🔧 [DEBUG] Erro em script:', `${event.filename}:${event.lineno}:${event.colno || 0}`);
        captureLog('global-error', [`Erro em ${event.filename}:${event.lineno}:${event.colno || 0}`]);
    } else {
        // Ignore null/undefined errors without context
        console.log('🔧 [DEBUG] Erro ignorado (sem contexto útil)');
    }
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('🔧 [DEBUG] Promise rejeitada:', event.reason);
    captureLog('unhandled-rejection', [event.reason]);
});

console.log('🔧 [DEBUG] Sistema de debug inicializado');