document.addEventListener('DOMContentLoaded', () => {
    const surahList = document.getElementById('surah-list');
    const surahListContainer = document.getElementById('surah-list-container');
    const surahContainer = document.getElementById('surah-container');
    const surahTitle = document.getElementById('surah-title');
    const surahContent = document.getElementById('surah-content');

    // Fetch and display the list of surahs
    fetch('surah.json')
        .then(response => response.json())
        .then(surahs => {
            surahs.forEach(surah => {
                const li = document.createElement('li');
                li.textContent = `${surah.index} - ${surah.titleAr} (${surah.title})`;
                li.dataset.index = surah.index;
                li.dataset.titleAr = surah.titleAr;
                surahList.appendChild(li);
            });
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
        backButton.onclick = () => {
            surahContainer.style.display = 'none';
            surahListContainer.style.display = 'block';
        };
        surahContent.prepend(backButton);
    }
});