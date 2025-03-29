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


// code was changed in 10.26.24 and pasted old code and took it out bc it was claude and ive no fucking idea what i'm doing

//first display grouped links fixed on  8.5.24
//second grup links fix 3.28.25: include group links, clickable category and add bookshelf xo
function displayLinks(links) {
    const linksList = document.getElementById('linksList');
    if (!linksList) {
        console.error('linksList element not found');
        return;
    }

    linksList.innerHTML = ''; // Clear existing links

    // Group links by category
    const groupedLinks = links.reduce((acc, link) => {
        const category = link.category_name || 'Uncategorized';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(link);
        return acc;
    }, {});

    // Sort categories in desired order
    let categoryNames = Object.keys(groupedLinks);

    const preferredOrder = ['Bookshelf', 'Resources', 'Educational', 'Tutorial', 'Entertainment', 'Other', 'Uncategorized'];

    categoryNames.sort((a, b) => {
        return preferredOrder.indexOf(a) - preferredOrder.indexOf(b);
    });

    // Display grouped links
    categoryNames.forEach(category => {
        // Create clickable category header
        const categoryHeader = document.createElement('h3');
        categoryHeader.textContent = category;
        categoryHeader.style.cursor = 'pointer';
        categoryHeader.className = 'collapsible-header';
        linksList.appendChild(categoryHeader);

        // Create container for links, initially hidden
        const categoryContainer = document.createElement('div');
        categoryContainer.className = 'category-container';
        categoryContainer.style.display = 'none';

        // Click to show/hide links
        categoryHeader.addEventListener('click', () => {
            const isVisible = categoryContainer.style.display === 'block';
            categoryContainer.style.display = isVisible ? 'none' : 'block';
        });

        // Add all links for this category
        groupedLinks[category].forEach(link => {
            const linkElement = document.createElement('div');
            linkElement.className = 'link-item';

            let tagsDisplay = link.tags && link.tags.length ? `Tags: ${link.tags.join(', ')}` : 'No tags';
            let descriptionHtml = link.description ? `<div class="link-description">${link.description}</div>` : '';

            linkElement.innerHTML = `
                <div class="link-title"><a href="${link.url}" target="_blank">${link.title}</a></div>
                ${descriptionHtml}
                <div class="link-tags">${tagsDisplay}</div>
            `;
            categoryContainer.appendChild(linkElement);
        });

        linksList.appendChild(categoryContainer);
    });
}

///

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
//end of change made in 10.26 




//10.14.24 commented bc of inconsitency with display links :>> ?
//function fetchLinks() {
  //  fetch('/api/my-links', {
    //    method: 'GET',
    //    headers: {'Content-Type': 'application/json'}
   // })
   // .then(response => response.json())
   // .then(data => {
    //    if (data.success) {
      //      const linksList = document.getElementById('linksList');
        //    linksList.innerHTML = '';
          //  data.links.forEach(link => {
            //    const li = document.createElement('li');
             //   li.textContent = `${link.title} - ${link.url} (Tags: ${link.tags})`;
              //  linksList.appendChild(li);
           // });
       // } else {
         //   displayMessage('Failed to fetch links', true);
        //}
    //})
   // .catch(error => displayMessage('Failed to fetch links', true));
//}
//fml who knows>>

function displayMessage(message, isError = false) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = message;
    messageDiv.style.color = isError ? 'red' : 'green';
}
