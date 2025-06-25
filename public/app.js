document.addEventListener('DOMContentLoaded', function() {
    // added this next line of code on 3.24.25 this see if category filtering is working
    console.log("Current path is:", window.location.pathname);

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
        //6.3.25 Hide login and registration containers after successful login
        //update to fix issue where login & signup reamin visible after login. code added
        //to hide auth section after login 
        document.querySelector('.auth-section').classList.add('hidden');
        document.getElementById('linkSubmissionContainer').classList.remove('hidden');
        document.getElementById('linksDisplayContainer').classList.remove('hidden');
        fetchLinks(); // Fetch links after successful login
    })
    .catch(error => {
        displayMessage(error.message, true);
    });
}

function submitLink() {
    const url = document.getElementById('url').value;
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const category_id = document.getElementById('category_id').value; // Ensure this element exists and captures the correct ID
    const isPublic = document.getElementById('isPublic').checked;  /// Get the status of the checkbox in public
    const tags = document.getElementById('tags').value.split(',').map(tag => tag.trim());


    fetch('/api/submit-link', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ url, title, description, tags, category_id, isPublic }) /// Include isPublic in the request body and category 8.5.24
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

// Toggle submit form visibility
function toggleSubmitForm() {
    const content = document.getElementById('submitFormContent');
    const icon = document.getElementById('toggleIcon');
    
    if (content.classList.contains('expanded')) {
        content.classList.remove('expanded');
        icon.textContent = '▼';
    } else {
        content.classList.add('expanded');
        icon.textContent = '▲';
    }
}

function displayLinks(links) {
    const linksList = document.getElementById('linksList');
    linksList.innerHTML = '';

    if (links.length === 0) {
        linksList.innerHTML = '<li style="text-align: center; color: #4a5568; padding: 2rem;">No links saved yet. Submit your first link above! 🌱</li>';
        return;
    }

    // Group links by category
    const groupedLinks = {};
    links.forEach(link => {
        const category = link.category_name || 'Uncategorized';
        if (!groupedLinks[category]) {
            groupedLinks[category] = [];
        }
        groupedLinks[category].push(link);
    });

    // Sort categories alphabetically
    const sortedCategories = Object.keys(groupedLinks).sort();

    sortedCategories.forEach(category => {
        const categoryLinks = groupedLinks[category];
        
        // Create category section
        const categorySection = document.createElement('div');
        categorySection.className = 'category-section';
        
        // Category header
        const categoryHeader = document.createElement('div');
        categoryHeader.className = 'category-header';
        categoryHeader.style.cursor = 'pointer';
        categoryHeader.innerHTML = `
            <span class="category-icon">🍃</span>
            <h4>${category}</h4>
            <span class="category-count">${categoryLinks.length}</span>
            <span class="tap-here">tap</span>
        `;
        
        // Category links container
        const categoryLinksContainer = document.createElement('div');
        categoryLinksContainer.className = 'category-links category-content';
        
        // Add click handler for collapsible behavior
        categoryHeader.addEventListener('click', function() {
            const isExpanded = categoryLinksContainer.classList.contains('expanded');
            if (isExpanded) {
                categoryLinksContainer.classList.remove('expanded');
            } else {
                categoryLinksContainer.classList.add('expanded');
            }
        });

        categoryLinks.forEach(link => {
            const linkItem = document.createElement('div');
            linkItem.className = 'link-item';
            
            const description = link.description && link.description.trim() 
                ? (link.description.length > 150 
                    ? link.description.substring(0, 150) + '...' 
                    : link.description)
                : '';
            
            const tags = link.tags && link.tags.length > 0 
                ? `Tags: ${link.tags.join(', ')}` 
                : '';
            
            linkItem.innerHTML = `
                <a href="${link.url}" target="_blank" class="link-title">${link.title}</a>
                <div class="link-url">${link.url}</div>
                ${description ? `<div class="link-description">${description}</div>` : ''}
                <div class="link-meta">
                    <span class="link-category">${category}</span>
                    ${tags ? `<span class="link-tags">${tags}</span>` : ''}
                    ${link.is_public ? '<span style="color: #68d391;">🌍 Public</span>' : '<span style="color: #4a5568;">🔒 Private</span>'}
                </div>
            `;
            
            categoryLinksContainer.appendChild(linkItem);
        });
        
        categorySection.appendChild(categoryHeader);
        categorySection.appendChild(categoryLinksContainer);
        linksList.appendChild(categorySection);
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
            displayLinks(data.links);
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
