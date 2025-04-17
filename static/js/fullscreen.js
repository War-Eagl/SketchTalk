// Full-screen functionality
function toggleFullscreen() {
    const body = document.body;
    const fullscreenButton = document.getElementById('fullscreen-btn');
    
    if (!document.fullscreenElement) {
        // Request full-screen
        if (body.requestFullscreen) {
            body.requestFullscreen();
        } else if (body.webkitRequestFullscreen) { // Safari
            body.webkitRequestFullscreen();
        } else if (body.msRequestFullscreen) { // IE11
            body.msRequestFullscreen();
        }
        body.classList.add('fullscreen');
        fullscreenButton.textContent = 'Exit Full-screen';
    } else {
        // Exit full-screen
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) { // Safari
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) { // IE11
            document.msExitFullscreen();
        }
        body.classList.remove('fullscreen');
        fullscreenButton.textContent = 'Full-screen';
    }
}

// Add event listener for full-screen changes
document.addEventListener('fullscreenchange', () => {
    const body = document.body;
    const fullscreenButton = document.getElementById('fullscreen-btn');
    
    if (!document.fullscreenElement) {
        body.classList.remove('fullscreen');
        fullscreenButton.textContent = 'Full-screen';
    } else {
        body.classList.add('fullscreen');
        fullscreenButton.textContent = 'Exit Full-screen';
    }
});

// Add event listener for Safari's full-screen changes
document.addEventListener('webkitfullscreenchange', () => {
    const body = document.body;
    const fullscreenButton = document.getElementById('fullscreen-btn');
    
    if (!document.webkitFullscreenElement) {
        body.classList.remove('fullscreen');
        fullscreenButton.textContent = 'Full-screen';
    } else {
        body.classList.add('fullscreen');
        fullscreenButton.textContent = 'Exit Full-screen';
    }
});
