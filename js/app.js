document.addEventListener('DOMContentLoaded', () => {
    const surahList = document.getElementById('surah-list');
    const surahListContainer = document.getElementById('surah-list-container');
    const surahContainer = document.getElementById('surah-container');
    const surahTitle = document.getElementById('surah-title');
    const surahContent = document.getElementById('surah-content');

    let allSurahs = []; // Cache for all surahs
    let allJuz = []; // Cache for all juz

    // Fetch all necessary data
    Promise.all([
        fetch('surah.json').then(res => res.json()),
        fetch('juz.json').then(res => res.json())
    ]).then(([surahs, juzs]) => {
        allSurahs = surahs;
        allJuz = juzs;
        renderSurahList(allSurahs);
        renderJuzNavigation();
    }).catch(error => console.error("Error fetching initial data:", error));

    function renderJuzNavigation() {
        const navContainer = document.getElementById('juz-navigation');
        navContainer.innerHTML = ''; // Clear existing buttons

        const showAllButton = document.createElement('button');
        showAllButton.textContent = 'عرض الكل';
        showAllButton.className = 'juz-button active';
        showAllButton.onclick = () => {
            renderSurahList(allSurahs);
            document.querySelectorAll('.juz-button').forEach(btn => btn.classList.remove('active'));
            showAllButton.classList.add('active');
            searchBox.value = '';
        };
        navContainer.appendChild(showAllButton);

        allJuz.forEach(juz => {
            const button = document.createElement('button');
            button.textContent = `الجزء ${parseInt(juz.index)}`;
            button.className = 'juz-button';
            button.dataset.juz = juz.index;
            button.onclick = (e) => {
                filterSurahsByJuz(juz.index);
                document.querySelectorAll('.juz-button').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                searchBox.value = '';
            };
            navContainer.appendChild(button);
        });
    }

    function filterSurahsByJuz(juzIndex) {
        const filteredSurahs = allSurahs.filter(surah =>
            surah.juz.some(j => j.index === juzIndex)
        );
        renderSurahList(filteredSurahs);
    }

    function renderSurahList(surahs) {
        surahList.innerHTML = ''; // Clear existing list
        surahs.forEach(surah => {
            const li = document.createElement('li');

            const mainInfo = document.createElement('span');
            mainInfo.textContent = `${surah.index} - ${surah.titleAr} (${surah.title})`;

            const metaInfo = document.createElement('span');
            const juzNumbers = surah.juz.map(j => parseInt(j.index)).join(', ');
            metaInfo.textContent = `صفحة: ${surah.pages} | الجزء: ${juzNumbers}`;
            metaInfo.style.fontSize = '0.9em';
            metaInfo.style.color = '#666';

            li.appendChild(mainInfo);
            li.appendChild(metaInfo);

            li.dataset.index = surah.index;
            li.dataset.titleAr = surah.titleAr;
            surahList.appendChild(li);
        });
    }

    // Handle search input
    const searchBox = document.getElementById('search-box');
    searchBox.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        const filteredSurahs = allSurahs.filter(surah => {
            return surah.title.toLowerCase().includes(searchTerm) ||
                   surah.titleAr.toLowerCase().includes(searchTerm) ||
                   surah.index.includes(searchTerm);
        });
        renderSurahList(filteredSurahs);
    });

    // Handle clicks on the surah list
    surahList.addEventListener('click', (e) => {
        if (e.target.tagName === 'LI') {
            const surahIndex = e.target.dataset.index;
            const surahTitleAr = e.target.dataset.titleAr;
            displaySurah(surahIndex, surahTitleAr);
        }
    });

    async function displaySurah(index, title) {
        surahListContainer.style.display = 'none';
        surahContainer.style.display = 'block';
        surahTitle.textContent = title;
        surahContent.innerHTML = ''; // Clear previous content

        const surahInfo = allSurahs.find(s => s.index === index);

        // Clear previous metadata and add new
        const existingMeta = document.querySelector('.surah-meta-info');
        if (existingMeta) {
            existingMeta.remove();
        }

        if (surahInfo) {
            const metaDiv = document.createElement('div');
            metaDiv.className = 'surah-meta-info'; // Add class for easy selection
            metaDiv.style.textAlign = 'center';
            metaDiv.style.marginBottom = '20px';
            metaDiv.style.color = '#555';
            const juzNumbers = surahInfo.juz.map(j => parseInt(j.index)).join(', ');
            metaDiv.textContent = `صفحة: ${surahInfo.pages} | الجزء: ${juzNumbers} | ${surahInfo.type}`;
            surahTitle.insertAdjacentElement('afterend', metaDiv);
        }


        try {
            // Fetch surah data, translation, and audio in parallel
            const [surahRes, translationRes] = await Promise.all([
                fetch(`surah/surah_${parseInt(index)}.json`),
                fetch(`translation/ar/ar_translation_${parseInt(index)}.json`)
            ]);

            const surahData = await surahRes.json();
            const translationData = await translationRes.json();
            const verses = surahData.verse;
            const translations = translationData.verse;

            for (const verseKey in verses) {
                const verseNumber = verseKey.split('_')[1];
                const verseText = verses[verseKey];
                const verseTranslation = translations[verseKey];

                const ayahDiv = document.createElement('div');
                ayahDiv.classList.add('ayah');

                const textP = document.createElement('p');
                textP.classList.add('ayah-text');
                textP.textContent = `${verseText} (${verseNumber})`;

                const detailsDiv = document.createElement('div');
                detailsDiv.classList.add('ayah-details');

                const translationP = document.createElement('p');
                translationP.classList.add('ayah-translation');
                translationP.textContent = verseTranslation;

                const audioDiv = document.createElement('div');
                audioDiv.classList.add('ayah-audio');
                const audioControl = document.createElement('audio');
                audioControl.controls = true;
                const audioSource = document.createElement('source');

                const surahIndexPadded = String(parseInt(index)).padStart(3, '0');
                const verseIndexPadded = String(verseNumber).padStart(3, '0');
                audioSource.src = `audio/${surahIndexPadded}/${verseIndexPadded}.mp3`;
                audioSource.type = 'audio/mpeg';

                audioControl.appendChild(audioSource);
                audioDiv.appendChild(audioControl);

                detailsDiv.appendChild(translationP);
                detailsDiv.appendChild(audioDiv);

                textP.addEventListener('click', () => {
                    detailsDiv.classList.toggle('visible');
                });

                ayahDiv.appendChild(textP);
                ayahDiv.appendChild(detailsDiv);

                surahContent.appendChild(ayahDiv);
            }

        } catch (error) {
            console.error('Error fetching surah data:', error);
            surahContent.innerHTML = '<p>عفوا، حدث خطأ أثناء تحميل السورة.</p>';
        }

        // Add a back button
        const backButton = document.createElement('button');
        backButton.textContent = 'العودة إلى قائمة السور';
        backButton.className = 'back-button'; // Use the new CSS class
        backButton.onclick = () => {
            surahContainer.style.display = 'none';
            surahListContainer.style.display = 'block';
        };
        surahContent.prepend(backButton);
    }
});