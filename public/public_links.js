// v0.6 fixed category grouping and it shows tags now. xo H  3.17.25
//old code can be found in google docs byye
// 3.28.25 8:51pm: collapable categories, uncatorized comes last and view new new browser  option added xo 
// When page is loaded, fetch and display links
document.addEventListener('DOMContentLoaded', function() {
    fetchPublicLinks();
});

function fetchPublicLinks() {
    fetch('/api/public-links', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            displayPublicLinks(data.links);
        } else {
            displayMessage('Failed to fetch public links: ' + data.message, true);
        }
    })
    .catch(error => {
        console.error('Error fetching public links:', error);
        displayMessage('Failed to fetch public links', true);
    });
}

function displayPublicLinks(links) {
    console.log('Fetched public links:', links); // Debug log
    const linksList = document.getElementById('publicLinksList');
    if (!linksList) {
        console.error('publicLinksList element not found');
        return;
    }

    linksList.innerHTML = ''; // Clear existing links

    // Group links by category
    const groupedLinks = links.reduce((acc, link) => {
        const category = link.category_name || 'Uncategorized';
        if (!acc[category]) acc[category] = [];
        acc[category].push(link);
        return acc;
    }, {});

    let categoryNames = Object.keys(groupedLinks);

    // Move 'Uncategorized' to the end
    if (categoryNames.includes('Uncategorized')) {
        categoryNames = categoryNames.filter(c => c !== 'Uncategorized');
        categoryNames.push('Uncategorized');
    }

    // Display categories and their links
    categoryNames.forEach(category => {
        // Create category header
        const categoryHeader = document.createElement('h3');
        categoryHeader.textContent = category;
        categoryHeader.style.cursor = 'pointer';
        categoryHeader.className = 'collapsible-header';

        // Optional small category link
        const viewLink = document.createElement('small');
	viewLink.innerHTML = ` (<a href="/category/${category.toLowerCase()}">View only ${category}</a>)`;
        viewLink.style.marginLeft = '8px';
        categoryHeader.appendChild(viewLink);

        // Add header to list
        linksList.appendChild(categoryHeader);

        // Create collapsible container
        const linksContainer = document.createElement('div');
        linksContainer.className = 'category-container';
        linksContainer.style.display = 'none';

        // Toggle collapse
        categoryHeader.addEventListener('click', (e) => {
            if (e.target.tagName === 'A') return; // Don't toggle if clicking view link
            const isVisible = linksContainer.style.display === 'block';
            linksContainer.style.display = isVisible ? 'none' : 'block';
        });

        // Render links
        groupedLinks[category].forEach(link => {
            const linkElement = document.createElement('div');
            linkElement.className = 'link-item';

            let tagsDisplay = link.tags && link.tags.length ? `Tags: ${link.tags.join(', ')}` : 'No tags';
            let descriptionHtml = link.description && link.description.trim() ? `<div class="link-description">${link.description}</div>` : '';

            linkElement.innerHTML = `
                <div class="link-title"><a href="${link.url}" target="_blank">${link.title}</a></div>
                ${descriptionHtml}
                <div class="link-tags">${tagsDisplay}</div>
            `;
            linksContainer.appendChild(linkElement);
        });

        linksList.appendChild(linksContainer);
    });
}

function displayMessage(message, isError = false) {
    const messageDiv = document.getElementById('message');
    if (messageDiv) {
        messageDiv.textContent = message;
        messageDiv.style.color = isError ? 'red' : 'green';
    }
}
