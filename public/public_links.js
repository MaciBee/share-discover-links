let allLinks = [];
let searchTerm = '';

function highlightText(text, term) {
    if (!term || !text) return text;
    const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    return text.replace(regex, '<mark>$&</mark>');
}

// When page is loaded, fetch and display links
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        // Handle both keyboard and touch input
        ['input', 'change'].forEach(eventType => {
            searchInput.addEventListener(eventType, debounce(function(e) {
                searchTerm = e.target.value.toLowerCase().trim();
                if (allLinks.length > 0) {
                    displayPublicLinks(filterLinks());
                }
            }, 300));
        });

        // Clear button for mobile
        searchInput.addEventListener('search', function() {
            searchTerm = '';
            if (allLinks.length > 0) {
                displayPublicLinks(allLinks);
            }
        });
    }
    fetchPublicLinks();
});

// Debounce function to limit how often the search runs
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Filter links based on search term
function filterLinks() {
    if (!searchTerm) return allLinks;
    
    return allLinks.filter(link => {
        const title = (link.title || '').toLowerCase();
        const description = (link.description || '').toLowerCase();
        const tags = Array.isArray(link.tags) ? link.tags.join(' ').toLowerCase() : '';
        const category = (link.category_name || '').toLowerCase();
        
        link._matches = {
            title: title.includes(searchTerm),
            description: description.includes(searchTerm),
            tags: tags.includes(searchTerm),
            category: category.includes(searchTerm)
        };
        
        return Object.values(link._matches).some(match => match);
    });
}

function fetchPublicLinks() {
    console.log('Fetching links...');
    const timestamp = new Date().getTime();
    fetch(`/api/public-links?_=${timestamp}`, {
        headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        },
        credentials: 'same-origin'
    })
        .then(response => response.json())
        .then(data => {
            console.log('Got links:', data);
            if (data.success) {
                allLinks = data.links;
                displayPublicLinks(allLinks);
            } else {
                displayMessage('Failed to fetch links: ' + data.message, true);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            displayMessage('Failed to fetch links', true);
        });
}

// Get the ID from the link URL
function getLinkId(link) {
    if (!link || !link.url) return 0;
    const parts = link.url.split('/');
    const lastPart = parts[parts.length - 1];
    const id = parseInt(lastPart);
    return isNaN(id) ? 0 : id;
}

function displayPublicLinks(links) {
    const linksList = document.getElementById('publicLinksList');
    if (!linksList) return;

    linksList.innerHTML = '';

    // Sort links by ID (newer links have higher IDs)
    links.sort((a, b) => {
        const idA = getLinkId(a);
        const idB = getLinkId(b);
        return idB - idA; // Higher IDs (newer links) first
    });
    
    console.log('First 3 links:', 
        links.slice(0, 3).map(l => ({
            title: l.title,
            id: getLinkId(l)
        })));

    const groupedLinks = {};
    links.forEach(link => {
        const category = link.category_name || 'Uncategorized';
        if (!groupedLinks[category]) {
            groupedLinks[category] = [];
        }
        groupedLinks[category].push(link);
    });

    const categories = Object.keys(groupedLinks)
        .filter(c => c !== 'Uncategorized')
        .sort()
        .concat(groupedLinks['Uncategorized'] ? ['Uncategorized'] : []);

    let categoryNames = Object.keys(groupedLinks);

    // Move 'Uncategorized' to the end
    if (categoryNames.includes('Uncategorized')) {
        categoryNames = categoryNames.filter(c => c !== 'Uncategorized');
        categoryNames.push('Uncategorized');
    }

    // Display categories and their links
    categories.forEach(category => {
        const categoryHeader = document.createElement('h3');
        categoryHeader.textContent = category;
        categoryHeader.className = 'collapsible-header';
        categoryHeader.style.cursor = 'pointer';

        const viewLink = document.createElement('small');
        viewLink.innerHTML = ` (<a href="/category/${category.toLowerCase()}">View ${category}</a>)`;
        viewLink.style.marginLeft = '8px';
        categoryHeader.appendChild(viewLink);

        const linksContainer = document.createElement('div');
        linksContainer.className = 'category-container';

        // Handle both click and touch events for category headers
        ['click', 'touchend'].forEach(eventType => {
            categoryHeader.addEventListener(eventType, (e) => {
                if (e.target.tagName === 'A') return;
                e.preventDefault(); // Prevent double-firing on mobile
                const isVisible = linksContainer.style.display === 'block';
                linksContainer.style.display = isVisible ? 'none' : 'block';
            });
        });

        const hasMatches = searchTerm && groupedLinks[category].some(link => 
            Object.values(link._matches || {}).some(match => match)
        );

        linksContainer.style.display = hasMatches ? 'block' : 'none';

        linksList.appendChild(categoryHeader);

        groupedLinks[category].forEach(link => {
            const linkElement = document.createElement('div');
            linkElement.className = 'link-item';

            let title = link.title || '';
            let description = link.description || '';
            let tagsDisplay = link.tags?.length ? 
                `Tags: ${link.tags.join(', ')}` : 'No tags';
            
            if (searchTerm && link._matches) {
                if (link._matches.title) {
                    title = highlightText(title, searchTerm);
                }
                if (link._matches.description) {
                    description = highlightText(description, searchTerm);
                }
                if (link._matches.tags) {
                    tagsDisplay = highlightText(tagsDisplay, searchTerm);
                }
            }
            
            const descriptionHtml = description.trim() ? 
                `<div class="link-description">${description}</div>` : '';

            // No new badge needed
            
            linkElement.innerHTML = `
                <div class="link-title">
                    <a href="${link.url}" target="_blank">${title}</a>
                </div>
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
