
document.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    
    menu.style.left = e.pageX + "px";
    menu.style.top = e.pageY + "px";
    createMenu(true);
});

document.addEventListener('click', function (e) {
    createMenu(false);
});


const menu = document.createElement('div');
menu.id = 'custom-context-menu';
menu.style.position = 'absolute';
menu.style.backgroundColor = '#fff';
menu.style.border = '1px solid #ccc';
menu.style.padding = '10px';
menu.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
function createMenu(show) {
    if (show) {
        document.body.appendChild(menu);
    } else if(document.body.contains(menu)) {
        document.body.removeChild(menu);
    }
}



document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('gesturechange', (e) => e.preventDefault());
document.addEventListener('gestureend', (e) => e.preventDefault());



let lastTouch = 0;

document.addEventListener("touchstart", function (e) {
    if (e.touches.length > 1) {
        e.preventDefault();   // 封鎖雙指縮放
    }
}, { passive: false });


document.addEventListener('contextmenu', e => e.preventDefault());
