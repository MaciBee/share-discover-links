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

//display grouped links  8.5.24

function displayLinks(links) {
    const linksList = document.getElementById('linksList');
    if (!linksList) {
       console.error('linksList element not found');
        return;
    }

    linksList.innerHTML = '';  // Clear existing links

   // Group links by category
    const groupedLinks = links.reduce((acc, link) => {
//3.15.25 changed below line to display links 
//        const category = link.category || 'Uncategorized'; // Default to 'Uncategorized' if no category is provided//
// old code was above code- mistook category  = link.category instead of link.category = link.category_name was different and broke the code for months. Principle correctly cross-checking the names and ids (the table stores nmeric ids ONLY so needs idetical match. :0  
    const category = link.category_name || 'Uncategorized';
      if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(link);
        return acc;
   }, {});

    // Display grouped links
    Object.entries(groupedLinks).forEach(([category, categoryLinks]) => {
        const categoryHeader = document.createElement('h3');
        categoryHeader.textContent = category;
        linksList.appendChild(categoryHeader);

        const linksContainer = document.createElement('div');
        linksContainer.className = 'category-container';

        categoryLinks.forEach(link => {
            const linkElement = document.createElement('div');
            linkElement.className = 'link-item';

            let tagsDisplay = link.tags && link.tags.length ? `Tags: ${link.tags.join(', ')}` : 'No tags';
            let descriptionHtml = link.description ? `<div class="link-description">${link.description}</div>` : '';

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
