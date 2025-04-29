// lineWidthPopup.js
// Handles showing a popup for line width selection and updating DrawingTool

function showLineWidthPopup(currentWidth, onSelect) {
    // Remove any existing popup
    const existing = document.getElementById('line-width-popup');
    if (existing) existing.remove();

    // Create popup container
    const popup = document.createElement('div');
    popup.id = 'line-width-popup';
    popup.style.position = 'fixed';
    popup.style.left = '50%';
    popup.style.top = '40%';
    popup.style.transform = 'translate(-50%, -50%)';
    popup.style.background = '#fff';
    popup.style.border = '2px solid #333';
    popup.style.borderRadius = '8px';
    popup.style.padding = '24px 32px';
    popup.style.zIndex = '10000';
    popup.style.boxShadow = '0 4px 24px rgba(0,0,0,0.18)';
    popup.style.display = 'flex';
    popup.style.flexDirection = 'column';
    popup.style.alignItems = 'center';

    const title = document.createElement('div');
    title.textContent = 'Select Line Width';
    title.style.fontWeight = 'bold';
    title.style.marginBottom = '16px';
    popup.appendChild(title);

    // Three widths: thin, medium, thick
    const widths = [2, 5, 10];
    const labels = ['Thin', 'Medium', 'Thick'];
    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.gap = '32px';
    row.style.marginBottom = '16px';

    widths.forEach((w, i) => {
        const option = document.createElement('div');
        option.style.display = 'flex';
        option.style.flexDirection = 'column';
        option.style.alignItems = 'center';
        option.style.cursor = 'pointer';
        option.style.padding = '4px 8px';
        option.style.borderRadius = '6px';
        option.style.border = w === currentWidth ? '2px solid #1976d2' : '2px solid transparent';
        option.style.background = w === currentWidth ? '#e3f2fd' : 'transparent';

        // SVG line preview
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '48');
        svg.setAttribute('height', '24');
        svg.innerHTML = `<line x1='8' y1='12' x2='40' y2='12' stroke='#1976d2' stroke-width='${w}' stroke-linecap='round'/>`;
        option.appendChild(svg);

        // Label
        const label = document.createElement('span');
        label.textContent = labels[i];
        label.style.fontSize = '14px';
        label.style.marginTop = '4px';
        option.appendChild(label);

        // Click handler
        option.onclick = () => {
            document.body.removeChild(popup);
            onSelect(w);
        };

        row.appendChild(option);
    });
    popup.appendChild(row);

    // Cancel button
    const cancel = document.createElement('button');
    cancel.textContent = 'Cancel';
    cancel.style.marginTop = '8px';
    cancel.onclick = () => document.body.removeChild(popup);
    popup.appendChild(cancel);

    document.body.appendChild(popup);
}
window.showLineWidthPopup = showLineWidthPopup;
