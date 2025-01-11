function displayFeedback(message, type) {
    var feedbackDiv = document.getElementById("feedback");
    feedbackDiv.innerHTML = message;
    feedbackDiv.className = type;
}

function showLoading() {
    var loadingDiv = document.getElementById("loading");
    loadingDiv.style.display = "block";
}

function hideLoading() {
    var loadingDiv = document.getElementById("loading");
    loadingDiv.style.display = "none";
}

document.addEventListener("DOMContentLoaded", function() {

    document.getElementById("advancedOptionsButton").addEventListener("click", function() {
        var advancedOptions = document.getElementById("advancedOptions");
        if (advancedOptions.style.display === "none") {
            advancedOptions.style.display = "block";
        } else {
            advancedOptions.style.display = "none";
        }
    });
    
    document.getElementById("searchButton").addEventListener("click", function() {
        document.getElementById("feedback").innerHTML = "";

        var searchQuery = document.getElementById("searchInput").value.trim();
        var quantity = document.getElementById("quantity").value;
        var filetype = document.getElementById("format").value;

        if (searchQuery === "") {
            displayFeedback("Please enter a search query.", "error");
            return;
        }

        var formattedQuery = searchQuery + " " + filetype;

        // Show loading indicator
        showLoading();

        // Send a POST request to the backend
        fetch('/search', {  // Use relative path
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query: formattedQuery, quantity: quantity })
        })
        .then(response => response.json())
        .then(data => {
            // Hide loading indicator
            hideLoading();

            if (data.status === 'success') {
                displayFeedback("Image search successful.", "success");
                displayImageUrls(data.image_urls);
                // Enable download button
                document.getElementById("downloadButton").disabled = false;
                // Store image URLs for download
                document.getElementById("downloadButton").dataset.imageUrls = JSON.stringify(data.image_urls);
                document.getElementById("downloadButton").dataset.query = searchQuery;
            } else {
                displayFeedback(data.message, "error");
            }
        })
        .catch(error => {
            console.error('Error:', error);
            displayFeedback("An error occurred while fetching images.", "error");
            hideLoading();  // Hide loading in case of error
        });
    });

    // Download images when the download button is clicked
    document.getElementById("downloadButton").addEventListener("click", function() {
        displayFeedback("Downloading images...", "info");
        var imageUrls = JSON.parse(this.dataset.imageUrls);
        var searchQuery = this.dataset.query;

        // Send a POST request to the backend to initiate download
        fetch('/download', {  // Use relative path
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query: searchQuery, image_urls: imageUrls })
        })
        .then(response => response.blob())
        .then(blob => {
            // Save the received blob as a file
            saveAs(blob, `${searchQuery}.zip`);  // Ensure the download library is loaded for saveAs
        })
        .catch(error => {
            console.error('Error:', error);
            displayFeedback("An error occurred while downloading images.", "error");
        });
    });
});

function displayImageUrls(imageUrls) {
    var imageUrlsDiv = document.getElementById("imageUrls");
    imageUrlsDiv.innerHTML = "<h2>Images</h2>";
    var container = document.createElement("div");

    imageUrls.forEach(function(url) {
        var img = document.createElement("img");
        img.src = url;
        container.appendChild(img);
    });

    imageUrlsDiv.appendChild(container);
}
