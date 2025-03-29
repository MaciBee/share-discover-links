// v0.6 fixed category grouping and it shows tags now. xo H  3.17.25
//old code can be found in google docs byye
document.addEventListener('DOMContentLoaded', function() {
    fetchPublicLinks(); // Fetch and display links when page loads
});

function fetchPublicLinks() {
    fetch('/api/public-links', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
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

///new code fix uncategorized to come last 3.27.25 \
function displayPublicLinks(links) {
    console.log('Fetched public links:', links); // Debugging log
    const linksList = document.getElementById('publicLinksList');
    if (!linksList) {
        console.error('publicLinksList element not found');
        return;
    }

    linksList.innerHTML = ''; // Clear existing links

    const groupedLinks = links.reduce((acc, link) => {
        const category = link.category_name || 'Uncategorized';
        if (!acc[category]) acc[category] = [];
        acc[category].push(link);
        return acc;
    }, {});

    let categoryNames = Object.keys(groupedLinks);
    if (categoryNames.includes('Uncategorized')) {
        categoryNames = categoryNames.filter(c => c !== 'Uncategorized');
        categoryNames.push('Uncategorized');
    }

    categoryNames.forEach(category => {
        // Create the clickable category header
        const categoryHeader = document.createElement('h3');
        categoryHeader.textContent = category;
        categoryHeader.style.cursor = 'pointer';
        categoryHeader.className = 'collapsible-header';
        linksList.appendChild(categoryHeader);

        // Create the container for links and hide it initially
        const linksContainer = document.createElement('div');
        linksContainer.className = 'category-container';
        linksContainer.style.display = 'none'; // initially collapsed

        // Toggle display on click
        categoryHeader.addEventListener('click', () => {
            const isVisible = linksContainer.style.display === 'block';
            linksContainer.style.display = isVisible ? 'none' : 'block';
        });

        // Render each link
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


///
function displayMessage(message, isError = false) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = message;
    messageDiv.style.color = isError ? 'red' : 'green';
}

