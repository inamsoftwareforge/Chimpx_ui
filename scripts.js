const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const loadingIndicator = document.getElementById('loadingIndicator');
const errorMessage = document.getElementById('errorMessage');
const noResultsMessage = document.getElementById('noResultsMessage');
const resultsContainer = document.getElementById('resultsContainer');
const resultsList = document.getElementById('resultsList');
const paginationContainer = document.getElementById('paginationContainer');
const fromDateInput = document.getElementById('fromDateInput');
const toDateInput = document.getElementById('toDateInput');

// API endpoint
const API_ENDPOINT = 'https://search-chimp-chi.vercel.app/api/search';

// Search state
let currentSearchTerm = '';
let currentPage = 1;
let totalPages = 1;
let searchTimeout;
let isSearching = false;

// Add event listeners
searchButton.addEventListener('click', () => handleSearch());
searchInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        handleSearch();
    }
});

// Handle search
async function handleSearch(page = 1) {
    const searchTerm = searchInput.value.trim();

    if (searchTerm.length < 3) {
        hideAllContainers();
        return;
    }

    if (isSearching) return;

    currentSearchTerm = searchTerm;
    currentPage = page;

    try {
        isSearching = true;
        loadingIndicator.style.display = 'block';
        resultsContainer.style.display = 'none';
        noResultsMessage.style.display = 'none';
        errorMessage.style.display = 'none';

        const response = await fetch(
            `${API_ENDPOINT}?q=${encodeURIComponent(searchTerm)}&page=${page}&limit=10&from=${fromDateInput.value}&to=${toDateInput.value}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        loadingIndicator.style.display = 'none';

        if (data.resultsCount > 0) {
            totalPages = data.totalPages || 1;
            displayResults(data.results, data.query);
            updatePagination();
            resultsContainer.style.display = 'block';
        } else {
            noResultsMessage.style.display = 'block';
        }

    } catch (error) {
        console.error('Search error:', error);
        loadingIndicator.style.display = 'none';
        errorMessage.textContent = `Error searching: ${error.message}`;
        errorMessage.style.display = 'block';
    } finally {
        isSearching = false;
    }
}

// Highlight helper
function highlightMatch(text, keyword) {
    if (!text || !keyword) return text;
    const regex = new RegExp(`(${keyword})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}

// Display results
function displayResults(results, keyword) {
    resultsList.innerHTML = '';
    
    // Update results count
    const resultsCount = document.getElementById('resultsCount');
    resultsCount.textContent = `${results.length} result${results.length !== 1 ? 's' : ''} found`;

    results.forEach(result => {
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';

        const formattedDate = new Date(result.date).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        const highlightedPreview = highlightMatch(result.previewText, keyword);

        resultItem.innerHTML = `
            <div class="result-title">${result.title}</div>
            <div class="result-date"><i class="fas fa-calendar-day"></i> ${formattedDate}</div>
            <div class="result-preview">${highlightedPreview}</div>
        `;

        resultItem.addEventListener('click', () => {
            window.open(result.archiveUrl, '');
        });

        resultsList.appendChild(resultItem);
    });
}

// Pagination
function updatePagination() {
    paginationContainer.innerHTML = '';

    if (totalPages <= 1) return;

    const prevButton = document.createElement('button');
    prevButton.className = 'pagination-button';
    prevButton.innerHTML = '&laquo; Previous';
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener('click', () => {
        if (currentPage > 1) handleSearch(currentPage - 1);
    });
    paginationContainer.appendChild(prevButton);

    const maxButtons = 5;
    const startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    const endPage = Math.min(totalPages, startPage + maxButtons - 1);

    for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement('button');
        pageButton.className = `pagination-button ${i === currentPage ? 'active' : ''}`;
        pageButton.textContent = i;
        pageButton.addEventListener('click', () => {
            if (i !== currentPage) handleSearch(i);
        });
        paginationContainer.appendChild(pageButton);
    }

    const nextButton = document.createElement('button');
    nextButton.className = 'pagination-button';
    nextButton.innerHTML = 'Next &raquo;';
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener('click', () => {
        if (currentPage < totalPages) handleSearch(currentPage + 1);
    });
    paginationContainer.appendChild(nextButton);
}

// Utility
function hideAllContainers() {
    loadingIndicator.style.display = 'none';
    resultsContainer.style.display = 'none';
    noResultsMessage.style.display = 'none';
    errorMessage.style.display = 'none';
}

// Init
function init() {
    hideAllContainers();
    loadingIndicator.innerHTML = `
        <div class="spinner"></div>
        <div>Searching newsletters...</div>
    `;
}

init();