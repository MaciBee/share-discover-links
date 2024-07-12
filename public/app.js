document.addEventListener('DOMContentLoaded', function() {
    // Grab references to each form and the display container
    const registerForm = document.getElementById('registerForm');
    const loginForm = document.getElementById('loginForm');
    const submitLinkForm = document.getElementById('submitLinkForm');
    const linksDisplayContainer = document.getElementById('linksDisplayContainer');

    // Attach event listeners to each form to handle submissions
    if (registerForm) {
        registerForm.addEventListener('submit', function(event) {
            event.preventDefault();
            register();
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            event.preventDefault();
            login();
        });
    }

    if (submitLinkForm) {
        submitLinkForm.addEventListener('submit', function(event) {
            event.preventDefault();
            submitLink();
        });
    }
});

function register() {
    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;

    fetch('/api/register', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ username, password })
    })
    .then(response => {
        if (!response.ok) throw new Error('Registration failed');
        return response.json();
    })
    .then(data => {
        displayMessage(data.message);
        // Clear the input fields after successful registration
        document.getElementById('registerUsername').value = '';
        document.getElementById('registerPassword').value = '';
    })
    .catch(error => {
        displayMessage(error.message, true);
    });
}
////changed  for clear inpu 
function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    fetch('/api/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ username, password })
    })
    .then(response => {
        if (!response.ok) throw new Error('Login failed');
        return response.json();
    })
    .then(data => {
        displayMessage(data.message);
        document.getElementById('loginForm').reset(); // Reset login form
        document.getElementById('linkSubmissionContainer').style.display = 'block';
        document.getElementById('linksDisplayContainer').style.display = 'block';
        fetchLinks(); // Fetch links after successful login
    })
    .catch(error => {
        displayMessage(error.message, true);
    });
}
///
function submitLink() {
    const url = document.getElementById('url').value;
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const tags = document.getElementById('tags').value.split(',').map(tag => tag.trim());

    fetch('/api/submit-link', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ url, title, description, tags })
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to submit link');
        return response.json();
    })
    .then(data => {
        displayMessage(data.message);
        document.getElementById('submitLinkForm').reset(); // Clear the link submission form
        fetchLinks(); // Refresh links list after successful submission
    })
    .catch(error => {
        displayMessage(error.message, true);
    });
}

function fetchLinks() {
    fetch('/api/my-links', {
        method: 'GET',
        headers: {'Content-Type': 'application/json'}
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const linksList = document.getElementById('linksList');
            linksList.innerHTML = '';
            data.links.forEach(link => {
                const li = document.createElement('li');
                li.textContent = `${link.title} - ${link.url} (Tags: ${link.tags})`;
                linksList.appendChild(li);
            });
        } else {
            displayMessage('Failed to fetch links', true);
        }
    })
    .catch(error => displayMessage('Failed to fetch links', true));
}

function displayMessage(message, isError = false) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = message;
    messageDiv.style.color = isError ? 'red' : 'green';
}
