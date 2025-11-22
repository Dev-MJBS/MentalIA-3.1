// Simple test for auto backup toggle
setTimeout(() => {
    const toggle = document.getElementById('auto-backup-toggle');
    const lastBackupText = document.getElementById('last-backup-text');
    const nextBackupText = document.getElementById('next-backup-text');

    if (toggle && lastBackupText && nextBackupText) {
        alert('✅ Auto backup UI components found!\n\nThe system appears to be working. Try clicking the toggle to enable/disable automatic backups.');
    } else {
        alert('❌ Some auto backup UI components are missing:\n\nToggle: ' + (toggle ? '✅' : '❌') +
              '\nLast backup: ' + (lastBackupText ? '✅' : '❌') +
              '\nNext backup: ' + (nextBackupText ? '✅' : '❌'));
    }
}, 1000);