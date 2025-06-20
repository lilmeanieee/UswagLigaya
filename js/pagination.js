document.addEventListener('DOMContentLoaded', function() {
    // Wait a short time to ensure resident data is loaded
    setTimeout(function() {
        initializePagination();
    }, 500);
    
    function initializePagination() {
      const itemsPerPage = 10; 
      let currentPage = 1;
  
      function getResidentRows() {
          return document.querySelector('#residentTable tbody').querySelectorAll('tr');
      }
  
      function getTotalPages() {
          return Math.ceil(getResidentRows().length / itemsPerPage);
      }
  
      function generatePagination() {
          const paginationList = document.querySelector('.pagination');
          const pageItems = document.querySelectorAll('.pagination .page-item:not(#prevPage):not(#nextPage)');
          pageItems.forEach(item => item.remove());
  
          const prevButton = document.getElementById('prevPage');
          const totalPages = getTotalPages();
  
          for (let i = 1; i <= totalPages; i++) {
              const pageItem = document.createElement('li');
              pageItem.classList.add('page-item');
              if (i === currentPage) pageItem.classList.add('active');
  
              const pageLink = document.createElement('a');
              pageLink.classList.add('page-link');
              pageLink.href = '#';
              pageLink.setAttribute('data-page', i);
              pageLink.textContent = i;
  
              pageLink.addEventListener('click', function(e) {
                  e.preventDefault();
                  const pageNum = parseInt(this.getAttribute('data-page'));
                  showPage(pageNum);
              });
  
              pageItem.appendChild(pageLink);
              prevButton.parentNode.insertBefore(pageItem, document.getElementById('nextPage'));
          }
      }
  
      function showPage(pageNumber) {
        const residentRows = getResidentRows();
        const totalPages = getTotalPages();
        currentPage = pageNumber;
    
        residentRows.forEach((row, index) => {
            row.style.display = 'none';
        });
    
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage - 1, residentRows.length - 1);
    
        for (let i = startIndex; i <= endIndex; i++) {
            if (residentRows[i]) {
                residentRows[i].style.display = '';
            }
        }
    
        // Update active class
        const pageItems = document.querySelectorAll('.pagination .page-item');
        pageItems.forEach(item => item.classList.remove('active'));
        const activeItem = document.querySelector(`.pagination .page-link[data-page="${pageNumber}"]`);
        if (activeItem && activeItem.parentElement) {
            activeItem.parentElement.classList.add('active');
        }
    
        // Disable/Enable Previous and Next buttons
        document.getElementById('prevPage').classList.toggle('disabled', currentPage === 1);
        document.getElementById('nextPage').classList.toggle('disabled', currentPage === totalPages);
    }
    
  
      // ✅ Only bind these ONCE
      document.getElementById('prevPage').addEventListener('click', function(e) {
          e.preventDefault();
          if (currentPage > 1) {
              showPage(currentPage - 1);
          }
      });
  
      document.getElementById('nextPage').addEventListener('click', function(e) {
          e.preventDefault();
          if (currentPage < getTotalPages()) {
              showPage(currentPage + 1);
          }
      });
  
      generatePagination();
      showPage(1);
  }
});


