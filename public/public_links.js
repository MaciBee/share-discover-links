
document.addEventListener('DOMContentLoaded', function() {
    fetchPublicLinks(); // Initiate fetching and displaying public links on page load
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

// w/ categories
function displayPublicLinks(links) {
    console.log('Fetched public links:', links); // Debugging log
    const linksList = document.getElementById('publicLinksList');
    if (!linksList) {
        console.error('publicLinksList element not found');
        return;
    }

   linksList.innerHTML = ''; // Clear existing links
    links.forEach(link => {
        const linkElement = document.createElement('div');
        linkElement.className = 'link-item';

        const titleElement = document.createElement('h3');
        titleElement.textContent = link.title;
        linkElement.appendChild(titleElement);

        if (link.category_name) {
            const categoryElement = document.createElement('span');
            categoryElement.textContent = `Category: ${link.category_name}`;
            categoryElement.style.fontWeight = 'bold';
            linkElement.appendChild(categoryElement);
       }

        if (link.description) {
            const descriptionElement = document.createElement('p');
            descriptionElement.textContent = link.description;
            linkElement.appendChild(descriptionElement);
       }

        const urlElement = document.createElement('a');
        urlElement.href = link.url;
        urlElement.textContent = link.url;
        urlElement.target = "_blank";
        linkElement.appendChild(urlElement);

        linksList.appendChild(linkElement);
   });
}
//end of 10.26.24 code edit 






//commented out bc it was the old categores now 8.6.24function displayPublicLinks(links) {
  //  console.log('Fetched public links:', links); // Debugging log
  //  const linksList = document.getElementById('publicLinksList');
 //   if (!linksList) {
 //       console.error('publicLinksList element not found');
 //       return;
 //   }

 //   linksList.innerHTML = ''; // Clear existing links

 //   const groupedLinks = links.reduce((acc, link) => {
 //       const category = link.category || 'Uncategorized';
 //       if (!acc[category]) {
 //           acc[category] = [];
 //       }
 //       acc[category].push(link);
 //       return acc;
 //   }, {});

    // Display grouped links
  //    Object.entries(groupedLinks).forEach(([category, categoryLinks]) => {
 //   Object.entries(groupedLinks).reverse().forEach(([category, categoryLinks]) => {

//        const categoryHeader = document.createElement('h3');
//        categoryHeader.textContent = category;
//        linksList.appendChild(categoryHeader);

//        const linksContainer = document.createElement('div');
//        linksContainer.className = 'category-container';

//        categoryLinks.forEach(link => {
//            const linkElement = document.createElement('div');
//            linkElement.className = 'link-item';

//            let tagsDisplay = link.tags && link.tags.length ? `Tags: ${link.tags.join(', ')}` : 'No tags';
//            let descriptionHtml = link.description ? `<div class="link-description">${link.description}</div>` : '<div class="link-description">No description provided</div>';
//	   let descriptionHtml = link.description && link.description.trim() ? `<div class="link-description">${link.description}</div>` : '';

//            linkElement.innerHTML = `
//                <div class="link-title"><a href="${link.url}" target="_blank">${link.title}</a></div>
//                ${descriptionHtml}
//                <div class="link-tags">${tagsDisplay}</div>
//            `;
//            linksContainer.appendChild(linkElement);
//        });

//        linksList.appendChild(linksContainer);
//    });
//}

function displayMessage(message, isError = false) {
    const messageElement = document.getElementById('message');
    if(messageElement) {
        messageElement.textContent = message;
        messageElement.style.color = isError ? 'red' : 'green';
    }
}





//old code w/ tags and categoires- replaced ob 7.26
//document.addEventListener('DOMContentLoaded', function() {
//    const linksList = document.getElementById('publicLinksList');
//    if (linksList) {
//        fetch('/api/public-links')
//        .then(response => response.json())
//        .then(data => {
//            if (data.success) {
//                data.links.forEach(link => {
//                    const li = document.createElement('li');
//                    li.textContent = `${link.title} - ${link.url}`;
//                    linksList.appendChild(li);
//                });
//            } else {
//                console.error('Failed to fetch public links:', data.message);
//            }
//        })
//        .catch(error => console.error('Error fetching public links:', error));
//    } else {
//        console.error("Element with ID 'publicLinksList' does not exist.");
//    }
//});
