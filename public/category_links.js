// 3.28.25 xo
document.addEventListener('DOMContentLoaded', function() {
    const pathParts = window.location.pathname.split('/');
    const categoryFilter = pathParts[2]; // e.g. 'bookshelf'

    if (!categoryFilter) {
        displayMessage('No category specified', true);
        return;
    }

    document.getElementById('categoryTitle').textContent = `Category: ${categoryFilter}`;

    fetch('/api/public-links', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            let links = data.links;
            links = links.filter(link =>
                link.category_name &&
                link.category_name.toLowerCase() === categoryFilter.toLowerCase()
            );
            displayCategoryLinks(links);
        } else {
            displayMessage('Failed to fetch public links: ' + data.message, true);
        }
    })
    .catch(error => {
        console.error('Error fetching public links:', error);
        displayMessage('Failed to fetch public links', true);
    });
});

function displayCategoryLinks(links) {
    const linksList = document.getElementById('categoryLinksList');
    linksList.innerHTML = '';

    if (links.length === 0) {
        linksList.innerHTML = '<p>No links found in this category.</p>';
        return;
    }

    links.forEach(link => {
        const linkElement = document.createElement('div');
        linkElement.className = 'link-item';

        let tagsDisplay = link.tags && link.tags.length ? `Tags: ${link.tags.join(', ')}` : 'No tags';
        let descriptionHtml = link.description && link.description.trim() ? `<div class="link-description">${link.description}</div>` : '';

        linkElement.innerHTML = `
            <div class="link-title"><a href="${link.url}" target="_blank">${link.title}</a></div>
            ${descriptionHtml}
            <div class="link-tags">${tagsDisplay}</div>
        `;
        linksList.appendChild(linkElement);
    });
}

function displayMessage(message, isError = false) {
    const messageDiv = document.getElementById('message');
    if (messageDiv) {
        messageDiv.textContent = message;
        messageDiv.style.color = isError ? 'red' : 'green';
    }
}
