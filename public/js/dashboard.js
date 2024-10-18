const menuToggle = document.querySelector('.menu-toggle');
const menuClose = document.querySelector('.menu-close');
const sideMenu = document.querySelector('.side-menu');
const menuItems = document.querySelectorAll('.menu-item');
const generateSection = document.getElementById('generate-section');
const showSection = document.getElementById('show-section');
const qrType = document.getElementById('qr-type');
const inputFields = document.getElementById('input-fields');

menuToggle.addEventListener('click', () => {
    sideMenu.classList.add('active');
});

menuClose.addEventListener('click', () => {
    sideMenu.classList.remove('active');
});

menuItems.forEach(item => {
    item.addEventListener('click', () => {
        menuItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        if (item.dataset.section === 'generate') {
            generateSection.style.display = 'block';
            showSection.style.display = 'none';
        } else {
            generateSection.style.display = 'none';
            showSection.style.display = 'block';
        }
        if (window.innerWidth <= 768) {
            sideMenu.classList.remove('active');
        }
    });
});

qrType.addEventListener('change', updateInputFields);

function updateInputFields() {
    inputFields.innerHTML = '';
    let input;

    switch (qrType.value) {
        case 'media':
            input = createInput('file', 'media-file', 'Select Media File');
            break;
        case 'text':
            input = createInput('file', 'text-file', 'Select Text File');
            break;
        case 'url':
            input = createInput('text', 'url', 'Enter URL');
            break;
    }

    inputFields.appendChild(input);
    inputFields.classList.add('fade-in');
}

function createInput(type, id, labelText) {
    const div = document.createElement('div');
    div.className = 'input-group';

    const label = document.createElement('label');
    label.htmlFor = id;
    label.textContent = labelText;

    const input = document.createElement('input');
    input.type = type;
    input.id = id;

    div.appendChild(label);
    div.appendChild(input);

    return div;
}

updateInputFields();
