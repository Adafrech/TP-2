document.addEventListener('DOMContentLoaded', () => {    
    const animeContainer = document.getElementById('animeContainer');    
    const prevPageBtn = document.getElementById('prevPage');    
    const nextPageBtn = document.getElementById('nextPage');    
    const searchInput = document.getElementById('searchInput');    
    const loadingSpinner = document.getElementById('loadingSpinner');    
    let currentPage = 1;    
    const perPage = 12;    
    let currentSort = 'POPULARITY_DESC';    
    let currentSearch = '';    

    function traducirEstado(status) {        
        switch(status) {            
            case 'FINISHED':                
                return '<span class="status-finished">Finalizado</span>';            
            case 'RELEASING':                
                return '<span class="status-releasing">En Emisión</span>';            
            case 'NOT_YET_RELEASED':                
                return '<span class="status-other">No Lanzado</span>';            
            case 'CANCELLED':                
                return '<span class="status-other">Cancelado</span>';            
            case 'HIATUS':                
                return '<span class="status-other">En Pausa</span>';            
            default:                
                return '<span class="status-other">Desconocido</span>';        
        }    
    }    

    function sanitizarBusqueda(search) {        
        const div = document.createElement('div');        
        div.textContent = search;        
        return div.innerHTML;    
    }    

    function fetchAnimes(page, perPage, sort, search) {               
        animeContainer.innerHTML = '';         
        loadingSpinner.style.display = 'block';        
        const query = `            
            query ($page: Int, $perPage: Int, $search: String) {                
                Page(page: $page, perPage: $perPage) {                    
                    media(type: ANIME, sort: ${sort}, search: $search, isAdult: false) {                        
                        id                        
                        title {                            
                            romaji                            
                            english                        
                        }                        
                        coverImage {                            
                            large                        
                        }                        
                        episodes                        
                        status                    
                    }                
                }            
            }        
        `;        
        const variables = {            
            page: Number(page),            
            perPage: Number(perPage),            
            search: search || null        
        };        

        fetch('https://graphql.anilist.co', {            
            method: 'POST',            
            headers: {                
                'Content-Type': 'application/json',                
                'Accept': 'application/json',            
            },            
            body: JSON.stringify({                
                query,                
                variables            
            })        
        })        
        .then(response => response.json())         
        .then(data => {            
            if (data.errors) {                               
                animeContainer.innerHTML = '<p>Error al cargar los animes.</p>';                
                loadingSpinner.style.display = 'none';                
                return;            
            }            
            let animes = data.data.Page.media;            
            if (animes.length === 0) {                
                animeContainer.innerHTML = '<p>No se encontraron animes.</p>';                
                loadingSpinner.style.display = 'none';                
                return;            
            }                      

            animes = animes.filter(anime => anime.title.romaji.toLowerCase().includes(search.toLowerCase()) || (anime.title.english && anime.title.english.toLowerCase().includes(search.toLowerCase())));
            
            animes.forEach(anime => {                
                const estado = traducirEstado(anime.status);                
                const animeCard = `                    
                    <div class="col-md-4">                        
                        <div class="card">                            
                            <img src="${anime.coverImage.large}" class="card-img-top" alt="${anime.title.english || anime.title.romaji}">                            
                            <div class="card-body">                                
                                <h5 class="card-title">${anime.title.english || anime.title.romaji}</h5>                                
                                <p class="card-text">Episodios: ${anime.episodes || 'N/A'}</p>                                
                                <p class="card-text">Estado: ${estado}</p>                                
                                <a href="https://anilist.co/anime/${anime.id}" target="_blank" class="btn btn-primary">Ver más</a>                            
                            </div>                        
                        </div>                    
                    </div>                
                `;                
                animeContainer.innerHTML += animeCard;            
            });            
            loadingSpinner.style.display = 'none';         
        })        
        .catch(error => {                        
            animeContainer.innerHTML = '<p>Error al cargar los animes.</p>';            
            loadingSpinner.style.display = 'none';        
        });    
    }      

    function debounce(func, delay) {        
        let timeoutId;        
        return function(...args) {            
            if (timeoutId) {                
                clearTimeout(timeoutId);            
            }            
            timeoutId = setTimeout(() => {                
                func.apply(this, args);            
            }, delay);        
        };    
    }       

    const handleSearch = debounce(() => {        
        currentSearch = sanitizarBusqueda(searchInput.value.trim());        
        currentPage = 1;        
        fetchAnimes(currentPage, perPage, currentSort, currentSearch);    
    }, 300);      

    searchInput.addEventListener('input', handleSearch);    
    nextPageBtn.addEventListener('click', () => {        
        currentPage++;        
        fetchAnimes(currentPage, perPage, currentSort, currentSearch);    
    });    
    prevPageBtn.addEventListener('click', () => {        
        if (currentPage > 1) {            
            currentPage--;            
            fetchAnimes(currentPage, perPage, currentSort, currentSearch);        
        }    
    });       

    fetchAnimes(currentPage, perPage, currentSort, currentSearch);
});
