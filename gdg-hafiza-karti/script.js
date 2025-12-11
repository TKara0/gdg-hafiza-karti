// Oyun Durumu Değişkenleri
const totalPairs = 10;
let cards = [];
let flippedCards = [];
let matchedPairs = 0;
let currentPlayer = 1;
let scores = { 1: 0, 2: 0 };
let playerNames = { 1: '', 2: '' };
let isGameActive = false;
let lockBoard = false; // Kartlar eşleşme kontrolü yapılırken tıklamayı engellemek için
let turnTimer = null;
let timeLeft = 10;
const turnDuration = 10; // Saniye

// DOM Elementleri
const gameBoard = document.getElementById('game-board');
const player1ScoreEl = document.getElementById('player1-score');
const player2ScoreEl = document.getElementById('player2-score');
const modal = document.getElementById('game-over-modal');
const winnerMessage = document.getElementById('winner-message');
const finalScores = document.getElementById('final-scores');
const restartBtn = document.getElementById('restart-btn');
const nameInputModal = document.getElementById('name-input-modal');
const startGameBtn = document.getElementById('start-game-btn');
const player1NameInput = document.getElementById('player1-name');
const player2NameInput = document.getElementById('player2-name');

// Yerel Resimler
// Kullanıcı 'images' klasörüne 1.jpeg, 2.jpeg ... 10.jpeg şeklinde resim yüklemelidir.
const imageCount = 10;
const imageUrls = [];
for (let i = 1; i <= imageCount; i++) {
    imageUrls.push(`images/${i}.jpeg`);
}

// Resimleri Önceden Yükle
function preloadImages() {
    startGameBtn.disabled = true;
    startGameBtn.textContent = 'Resimler Yükleniyor...';
    
    const promises = imageUrls.map(url => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = url;
            img.onload = resolve;
            img.onerror = resolve; // Hata olsa bile devam et
        });
    });

    Promise.all(promises).then(() => {
        startGameBtn.disabled = false;
        startGameBtn.textContent = 'Oyunu Başlat';
    });
}

// Oyunu Başlat
function initGame() {
    // Değişkenleri Sıfırla
    matchedPairs = 0;
    currentPlayer = 1;
    scores = { 1: 0, 2: 0 };
    flippedCards = [];
    isGameActive = false;
    lockBoard = true; // Başlangıçta 5 saniye beklerken kilitli
    
    // UI Güncelle
    updateScoreUI();
    updateActivePlayerUI();
    modal.style.display = 'none';
    nameInputModal.style.display = 'none';
    
    // Kartları Hazırla
    createCards();
    
    // 5 Saniye Önizleme
    previewCards();
}

// İsim Giriş Modal'ını Başlat
function showNameInputModal() {
    modal.style.display = 'none'; // Oyun sonu modalını kapat
    nameInputModal.style.display = 'flex';
    player1NameInput.value = '';
    player2NameInput.value = '';
    player1NameInput.focus();
}

// Oyun Başlat Butonu
startGameBtn.addEventListener('click', () => {
    const player1Name = player1NameInput.value.trim();
    const player2Name = player2NameInput.value.trim();
    
    if (!player1Name || !player2Name) {
        alert('Lütfen tüm isimleri girin!');
        return;
    }
    
    playerNames[1] = player1Name;
    playerNames[2] = player2Name;
    
    // Oyuncu adlarını güncelle
    player1ScoreEl.querySelector('.player-name').textContent = playerNames[1];
    player2ScoreEl.querySelector('.player-name').textContent = playerNames[2];
    
    initGame();
});

// Kartları Oluştur ve Karıştır
function createCards() {
    gameBoard.innerHTML = '';
    cards = [];
    
    // Resimleri Çoğalt (Her biri 2 tane)
    let deck = [...imageUrls, ...imageUrls];
    
    // Karıştır (Fisher-Yates Shuffle)
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    
    // HTML'e Ekle
    deck.forEach((imgUrl, index) => {
        const card = document.createElement('div');
        card.classList.add('card');
        card.dataset.index = index;
        card.dataset.image = imgUrl;
        
        const cardInner = document.createElement('div');
        cardInner.classList.add('card-inner');
        
        const cardFront = document.createElement('div');
        cardFront.classList.add('card-front');
        const img = document.createElement('img');
        img.src = imgUrl;
        img.alt = 'Card Image';
        cardFront.appendChild(img);
        
        const cardBack = document.createElement('div');
        cardBack.classList.add('card-back');
        cardBack.textContent = '?';
        
        cardInner.appendChild(cardFront);
        cardInner.appendChild(cardBack);
        card.appendChild(cardInner);
        
        card.addEventListener('click', handleCardClick);
        gameBoard.appendChild(card);
        cards.push(card);
    });
}

// Kartları 5 Saniye Göster
function previewCards() {
    // Hepsini çevir
    cards.forEach(card => card.classList.add('flipped'));
    
    let countdown = 5;
    // İsteğe bağlı: Ekranda geri sayım gösterilebilir ama basitlik için sadece bekliyoruz.
    
    setTimeout(() => {
        cards.forEach(card => card.classList.remove('flipped'));
        isGameActive = true;
        lockBoard = false;
        startTurnTimer();
    }, 5000);
}

// Kart Tıklama İşleyicisi
function handleCardClick() {
    if (!isGameActive || lockBoard) return;
    if (this.classList.contains('flipped') || this.classList.contains('matched')) return;
    
    // Hamle yapıldığı için süreyi sıfırla
    resetTurnTimer();
    
    this.classList.add('flipped');
    flippedCards.push(this);
    
    if (flippedCards.length === 2) {
        checkForMatch();
    }
}

// Eşleşme Kontrolü
function checkForMatch() {
    lockBoard = true; // Diğer kartlara tıklamayı engelle
    
    const [card1, card2] = flippedCards;
    const isMatch = card1.dataset.image === card2.dataset.image;
    
    if (isMatch) {
        disableCards();
    } else {
        unflipCards();
    }
}

// Eşleşme Durumu
function disableCards() {
    flippedCards.forEach(card => {
        card.classList.add('matched');
        // Olay dinleyicisini kaldırmaya gerek yok, matched class kontrolü var
    });
    
    // Puan Ekle
    scores[currentPlayer]++;
    updateScoreUI();
    matchedPairs++;
    
    flippedCards = [];
    lockBoard = false;
    
    // Oyun Bitti mi?
    if (matchedPairs === totalPairs) {
        endGame();
    } else {
        // Eşleşme bulan tekrar oynar, süre sıfırlanır (zaten click ile sıfırlandı)
        // Sıra değişmez.
    }
}

// Eşleşmeme Durumu
function unflipCards() {
    setTimeout(() => {
        flippedCards.forEach(card => card.classList.remove('flipped'));
        flippedCards = [];
        switchTurn();
        lockBoard = false;
    }, 1000);
}

// Sıra Değiştirme
function switchTurn() {
    currentPlayer = currentPlayer === 1 ? 2 : 1;
    updateActivePlayerUI();
    startTurnTimer(); // Yeni oyuncu için süre başlat
}

// Süre Zamanlayıcısı
function startTurnTimer() {
    clearInterval(turnTimer);
    timeLeft = turnDuration;
    updateTimerUI();
    
    turnTimer = setInterval(() => {
        timeLeft--;
        updateTimerUI();
        
        if (timeLeft <= 0) {
            clearInterval(turnTimer);
            // Süre doldu, sıra diğer oyuncuya geçer
            // Eğer açık kart varsa kapat
            if (flippedCards.length > 0) {
                flippedCards.forEach(card => card.classList.remove('flipped'));
                flippedCards = [];
                lockBoard = false;
            }
            switchTurn();
        }
    }, 1000);
}

function resetTurnTimer() {
    startTurnTimer();
}

// UI Güncellemeleri
function updateScoreUI() {
    player1ScoreEl.querySelector('.score').textContent = scores[1];
    player2ScoreEl.querySelector('.score').textContent = scores[2];
}

function updateActivePlayerUI() {
    if (currentPlayer === 1) {
        player1ScoreEl.classList.add('active');
        player2ScoreEl.classList.remove('active');
    } else {
        player1ScoreEl.classList.remove('active');
        player2ScoreEl.classList.add('active');
    }
    // Timer bar'ı sıfırla
    document.querySelectorAll('.timer-bar').forEach(bar => bar.style.width = '0%');
}

function updateTimerUI() {
    // Aktif oyuncunun timer bar'ını güncelle
    const activePlayerEl = currentPlayer === 1 ? player1ScoreEl : player2ScoreEl;
    const timerBar = activePlayerEl.querySelector('.timer-bar');
    
    // Yüzde hesapla (10sn -> 0sn)
    // Başlangıçta %100 dolu olsun, azalsın mı? Yoksa dolsun mu?
    // Genelde süre azalır.
    const percentage = (timeLeft / turnDuration) * 100;
    timerBar.style.width = `${percentage}%`;
    
    // Renk değişimi (isteğe bağlı)
    if (timeLeft <= 3) {
        timerBar.style.backgroundColor = '#e74c3c'; // Kırmızı
    } else {
        timerBar.style.backgroundColor = '#3498db'; // Mavi
    }
}

// Oyun Sonu
function endGame() {
    clearInterval(turnTimer);
    isGameActive = false;
    
    let message = '';
    if (scores[1] > scores[2]) {
        message = `🎉 Tebrikler! ${playerNames[1]} OYUNU KAZANDI! 🎉`;
    } else if (scores[2] > scores[1]) {
        message = `🎉 Tebrikler! ${playerNames[2]} OYUNU KAZANDI! 🎉`;
    } else {
        message = 'Oyun Berabere!';
    }
    
    winnerMessage.textContent = message;
    finalScores.textContent = `${playerNames[1]}: ${scores[1]} - ${playerNames[2]}: ${scores[2]}`;
    modal.style.display = 'flex';
}

// Event Listeners
restartBtn.addEventListener('click', showNameInputModal);

// Başlat
showNameInputModal();
preloadImages();
