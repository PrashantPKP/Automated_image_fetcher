let searchMode = "google"; // Default mode is "Search on Google"
let isDownloadCancelled = false; // Flag to track if the download is cancelled

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

function clearSearchAndImages() {
    // Clear the search input
    document.getElementById("searchInput").value = "";

    // Clear the image container
    var imageUrlsDiv = document.getElementById("imageUrls");
    imageUrlsDiv.innerHTML = "";

    // Disable the download button
    document.getElementById("downloadButton").disabled = true;

    // Clear any feedback messages
    document.getElementById("feedback").innerHTML = "";
}

document.addEventListener("DOMContentLoaded", function () {
    // Advanced options toggle
    const advancedOptionsButton = document.getElementById("advancedOptionsButton");
    const advancedOptions = document.getElementById("advancedOptions");

    advancedOptionsButton.addEventListener("click", function () {
        if (searchMode === "google") {
            advancedOptions.style.display = advancedOptions.style.display === "none" ? "block" : "none";
        }
    });

    // Set active button and mode
    const insertUrlButton = document.getElementById("insert-url");
    const searchGoogleButton = document.getElementById("search-google");

    // Ensure "Search on Google" is active by default
    searchGoogleButton.classList.add("active");
    document.getElementById("searchInput").placeholder = "What are you looking for?";

    insertUrlButton.addEventListener("click", function () {
        searchMode = "url";
        insertUrlButton.classList.add("active");
        searchGoogleButton.classList.remove("active");
        document.getElementById("searchInput").placeholder = "Paste website URL here";

        // Clear the search input and images
        clearSearchAndImages();

        // Hide advanced options and the "Advanced Options" button when "Insert a URL" is selected
        advancedOptions.style.display = "none";
        advancedOptionsButton.style.display = "none"; // Hide the button
    });

    searchGoogleButton.addEventListener("click", function () {
        searchMode = "google";
        searchGoogleButton.classList.add("active");
        insertUrlButton.classList.remove("active");
        document.getElementById("searchInput").placeholder = "What are you looking for?";

        // Clear the search input and images
        clearSearchAndImages();

        // Show the "Advanced Options" button when "Search on Google" is selected
        advancedOptionsButton.style.display = "block"; // Show the button
        advancedOptions.style.display = "none"; // Reset advanced options to hidden initially
    });

    // Search button functionality
    document.getElementById("searchButton").addEventListener("click", function () {
        document.getElementById("feedback").innerHTML = "";

        var searchQuery = document.getElementById("searchInput").value.trim();
        var quantity = document.getElementById("quantity").value;
        var filetype = document.getElementById("format").value;

        if (searchQuery === "") {
            displayFeedback("Please enter a search query or URL.", "error");
            return;
        }

        showLoading();

        if (searchMode === "google") {
            // Use Google search API
            var formattedQuery = searchQuery + " " + filetype;

            fetch('/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ query: formattedQuery, quantity: quantity })
            })
                .then(response => response.json())
                .then(data => {
                    hideLoading();

                    if (data.status === 'success') {
                        displayFeedback("Image search successful.", "success");
                        displayImageUrls(data.image_urls);
                        document.getElementById("downloadButton").disabled = false;
                        document.getElementById("downloadButton").dataset.imageUrls = JSON.stringify(data.image_urls);
                        document.getElementById("downloadButton").dataset.query = searchQuery;
                    } else {
                        displayFeedback(data.message, "error");
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    displayFeedback("An error occurred while fetching images.", "error");
                    hideLoading();
                });
        } else if (searchMode === "url") {
            // Scrape images from the provided website URL
            fetch('/scrape-website', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ website_url: searchQuery, max_images: 50 })
            })
                .then(response => response.json())
                .then(data => {
                    hideLoading();

                    if (data.status === 'success') {
                        displayFeedback("Website scraping successful.", "success");
                        displayImageUrls(data.image_urls);
                        document.getElementById("downloadButton").disabled = false;
                        document.getElementById("downloadButton").dataset.imageUrls = JSON.stringify(data.image_urls);
                        document.getElementById("downloadButton").dataset.query = "images_from_website";
                    } else {
                        displayFeedback(data.message, "error");
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    displayFeedback("An error occurred while scraping the website.", "error");
                    hideLoading();
                });
        }
    });

    // Download button functionality (for zip)
    document.getElementById("downloadButton").addEventListener("click", function () {
        displayFeedback("Downloading images...", "info");
        var imageUrls = JSON.parse(this.dataset.imageUrls);
        var searchQuery = this.dataset.query;
        var selectedFormat = document.getElementById("format").value; // Get the selected format

        // Reset the cancellation flag
        isDownloadCancelled = false;

        // Show the progress container
        document.getElementById("progressContainer").style.display = "block";
        var progressBar = document.getElementById("downloadProgress");
        var progressText = document.getElementById("progressText");

        // Initialize progress
        progressBar.value = 0;
        progressText.innerText = "0%";

        // Create a zip file in memory
        var zip = new JSZip();
        var totalImages = imageUrls.length;
        var imagesDownloaded = 0;
        var failedImages = []; // Track failed images

        // Function to update progress
        function updateProgress() {
            var progress = Math.round((imagesDownloaded / totalImages) * 100);
            progressBar.value = progress;
            progressText.innerText = `${progress}%`;
        }

        // Function to handle completion
        function handleCompletion() {
            if (imagesDownloaded === totalImages) {
                if (isDownloadCancelled) {
                    displayFeedback("Download cancelled.", "warning");
                    document.getElementById("progressContainer").style.display = "none";
                    return;
                }

                zip.generateAsync({ type: "blob" })
                    .then(function (content) {
                        saveAs(content, `${searchQuery}_images.zip`);
                        if (failedImages.length > 0) {
                            displayFeedback(`Download complete, but ${failedImages.length} images failed to download.`, "warning");
                            console.log("Failed images:", failedImages);
                        } else {
                            displayFeedback("Download complete!", "success");
                        }
                        // Hide the progress container after completion
                        document.getElementById("progressContainer").style.display = "none";
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        displayFeedback("An error occurred while creating the zip file.", "error");
                    });
            }
        }

        // Add a "Cancel Download" button
        const cancelButton = document.createElement("button");
        cancelButton.innerText = "Cancel Download";
        cancelButton.style.padding = "10px 20px";
        cancelButton.style.backgroundColor = "red";
        cancelButton.style.color = "white";
        cancelButton.style.border = "none";
        cancelButton.style.borderRadius = "15px";
        cancelButton.style.cursor = "pointer";
        cancelButton.style.fontSize = "16px";
        cancelButton.style.marginLeft = "10px";

        cancelButton.addEventListener("click", function () {
            isDownloadCancelled = true;
            displayFeedback("Download cancelled.", "warning");
            document.getElementById("progressContainer").style.display = "none";
            cancelButton.remove(); // Remove the cancel button after cancellation
        });

        // Insert the cancel button next to the download button
        document.getElementById("downloadButton").insertAdjacentElement("afterend", cancelButton);

        // Download each image and add it to the zip
        imageUrls.forEach(function (url, index) {
            if (isDownloadCancelled) return; // Stop processing if cancelled

            fetch(url)
                .then(response => {
                    if (!response.ok || isDownloadCancelled) {
                        throw new Error(`Failed to fetch image: ${url}`);
                    }
                    return response.blob();
                })
                .then(blob => {
                    if (isDownloadCancelled) return; // Stop processing if cancelled
                    // Use the selected format for the file extension
                    const fileExtension = selectedFormat.toLowerCase();
                    zip.file(`${searchQuery}_${index + 1}.${fileExtension}`, blob);
                    imagesDownloaded++;
                    updateProgress();
                    handleCompletion();
                })
                .catch(error => {
                    if (isDownloadCancelled) return; // Stop processing if cancelled
                    console.error('Error:', error);
                    failedImages.push(url);
                    imagesDownloaded++;
                    updateProgress();
                    handleCompletion();
                });
        });
    });
});

function displayImageUrls(imageUrls) {
    var imageUrlsDiv = document.getElementById("imageUrls");
    imageUrlsDiv.innerHTML = "<h2>Images</h2>";
    var container = document.createElement("div");
    container.style.display = "flex";
    container.style.flexWrap = "wrap";
    container.style.gap = "20px"; // Space between images

    imageUrls.forEach(function (url, index) {
        var imageContainer = document.createElement("div");
        imageContainer.style.display = "flex";
        imageContainer.style.flexDirection = "column";
        imageContainer.style.alignItems = "center";
        imageContainer.style.gap = "10px"; // Space between image and button

        var img = document.createElement("img");
        img.src = url;
        img.style.width = "200px"; // Fixed width for images
        img.style.height = "auto";
        img.style.borderRadius = "10px";

        // Check if the image URL is valid
        img.onerror = function () {
            displayFeedback("Failed to load image. Please check the URL and try again.", "error");
            imageContainer.remove(); // Remove the invalid image container
        };

        var downloadButton = document.createElement("button");
        downloadButton.innerText = "Download";
        downloadButton.style.padding = "10px 20px";
        downloadButton.style.backgroundColor = "green";
        downloadButton.style.color = "white";
        downloadButton.style.border = "none";
        downloadButton.style.borderRadius = "15px";
        downloadButton.style.cursor = "pointer";
        downloadButton.style.fontSize = "16px";

        // Add click event to download individual image
        downloadButton.addEventListener("click", function () {
            var selectedFormat = document.getElementById("format").value; // Get the selected format
            fetch(url)
                .then(response => response.blob())
                .then(blob => {
                    // Use the selected format for the file extension
                    const fileExtension = selectedFormat.toLowerCase();
                    saveAs(blob, `image_${index + 1}.${fileExtension}`);
                    displayFeedback(`Image ${index + 1} downloaded!`, "success");
                })
                .catch(error => {
                    console.error('Error:', error);
                    displayFeedback("An error occurred while downloading the image.", "error");
                });
        });

        imageContainer.appendChild(img);
        imageContainer.appendChild(downloadButton);
        container.appendChild(imageContainer);
    });

    imageUrlsDiv.appendChild(container);
}