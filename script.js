document.addEventListener('DOMContentLoaded', () => {
    // HTML要素の取得
    const startButton = document.getElementById('startButton');
    const reel1 = document.getElementById('reel1');
    const reel2 = document.getElementById('reel2');
    const reel3 = document.getElementById('reel3');
    const resultMessage = document.getElementById('result-message');

    const prizeModal = document.getElementById('prize-modal');
    const closeModalButton = document.getElementById('closeModalButton');
    const modalPrizeTitle = document.getElementById('modal-prize-title');
    const modalPrizeImage = document.getElementById('modal-prize-image');
    const modalPrizeDescription = document.getElementById('modal-prize-description');

    // 効果音とBGMの読み込み
    const bgm = new Audio('sounds/bgm.mp3');
    bgm.loop = true;
    bgm.volume = 0.2; // BGMは少し小さめに

    const spinSound = new Audio('sounds/spin_sound.wav');
    spinSound.volume = 0.5;

    const winSound = new Audio('sounds/win_sound.wav');
    winSound.volume = 0.8;

    const loseSound = new Audio('sounds/lose_sound.wav');
    loseSound.volume = 0.8;

    const buttonClickSound = new Audio('sounds/button_click.wav');
    buttonClickSound.volume = 0.6;

    // 景品リストと画像パス、重み、上限、説明
    // weight: 重み。大きいほど当選時に揃いやすい。
    // maxOccurrences: 最大発生回数。-1で無制限。
    // currentOccurrences: 現在の発生回数（初期値0）。
    // description: モーダル表示時に使う説明文。
    const prizes = [
        { id: 'S', name: "S賞：付箋 + パフェチケット", image: "prize_images/prize_S.png", weight: 20, maxOccurrences: 1, currentOccurrences: 0, description: "海のご褒美、召し上がれ♪" },
        { id: 'A', name: "A賞：オリジナル マスキングテープ・付箋セット", image: "prize_images/prize_A.png", weight: 20, maxOccurrences: 25, currentOccurrences: 0, description: "おめでとう！波紋のように、ひらめきが広がる便利ツール！" },
        { id: 'B', name: "B賞：オリジナル バンダナ", image: "prize_images/prize_B.png", weight: 20, maxOccurrences: 25, currentOccurrences: 0, description: "大漁旗のように、あなたの個性をアピールしよう！" },
        { id: 'C', name: "C賞：オリジナル スマホスタンド", image: "prize_images/prize_C.png", weight: 20, maxOccurrences: 50, currentOccurrences: 0, description: "おめでとうございます！スマホも喜ぶ特等席！！" },
        { id: 'D', name: "D賞：オリジナル マグネットorボールペン", image: "prize_images/prize_D.png", weight: 20, maxOccurrences: 150, currentOccurrences: 0, description: "おめでとう！ピタッと大漁の幸運引き寄せ！！" },
        { id: 'E', name: "E賞：オリジナル クリアファイル", image: "prize_images/prize_E.png", weight: 20, maxOccurrences: 250, currentOccurrences: 0, description: "漁師の網の如く、整理整頓の達人へ！！" }
    ];

    let isSpinning = false; // 抽選中フラグ
    const spinDuration =2000; // スロット回転時間（ミリ秒）を少し長めに
    const stopDelay = 400; // 各リールが止まる間隔（ミリ秒）

    // 全ての景品画像を事前にロード
    preloadImages(prizes.map(p => p.image));

    // 初期化処理
    resetReels();

    // スタートボタンのクリックイベントリスナー
    startButton.addEventListener('click', () => {
        if (isSpinning) return; // 抽選中は多重クリックを防ぐ

        buttonClickSound.currentTime = 0; // 再生位置を最初に戻す
        buttonClickSound.play(); // ボタンクリック音再生

        isSpinning = true;
        startButton.disabled = true; // ボタンを無効化
        resultMessage.innerHTML = '<p>抽選中...</p>';
        resultMessage.classList.remove('message-win', 'message-lose');
        hidePrizeModal(); // モーダルが開いていたら閉じる
        resetReels(); // リールを初期化

        // BGMとスロット回転音の開始
        bgm.play().catch(e => console.log("BGM再生失敗:", e)); // ユーザー操作でBGM開始
        spinSound.loop = true;
        spinSound.play();

        let reelIntervals = []; // 各リールのsetIntervalを管理

        // 各リールのスロット回転アニメーションを開始
        [reel1, reel2, reel3].forEach((reel, index) => {
            let currentImageIndex = 0;
            reelIntervals[index] = setInterval(() => {
                // 画像を高速で切り替える
                reel.innerHTML = `<img src="${prizes[currentImageIndex].image}" class="slot-image active">`;
                currentImageIndex = (currentImageIndex + 1) % prizes.length;
            }, 70); // 70msごとに画像切り替え (少し速めに)
        });

        // 最終的な抽選結果を決定
        const finalResults = getLotteryResults();

        // リール1の停止
        setTimeout(() => {
            clearInterval(reelIntervals[0]);
            displayFinalImage(reel1, finalResults[0]);
        }, spinDuration);

        // リール2の停止
        setTimeout(() => {
            clearInterval(reelIntervals[1]);
            displayFinalImage(reel2, finalResults[1]);
        }, spinDuration + stopDelay);

        // リール3の停止
        setTimeout(() => {
            clearInterval(reelIntervals[2]);
            displayFinalImage(reel3, finalResults[2]);

            // スロット回転音の停止
            spinSound.pause();
            spinSound.currentTime = 0;

            // 全てのリールが停止したら最終判定
            setTimeout(() => {
                const isWin = checkResult(finalResults); // 当選かハズレかを判定

                isSpinning = false;
                startButton.disabled = false;

                if (isWin) {
                    winSound.currentTime = 0;
                    winSound.play(); // 当選音再生
                    showPrizeModal(finalResults[0]); // 当選の場合、モーダルを表示
                } else {
                    loseSound.currentTime = 0;
                    loseSound.play(); // ハズレ音再生
                    resultMessage.innerHTML = '<p>残念！ハズレ...</p>'; // ハズレの場合、メッセージ表示
                    resultMessage.classList.add('message-lose');
                }
            }, stopDelay); // 最後の停止から少し遅れて判定
        }, spinDuration + stopDelay * 2);
    });

    // 景品の画像をプリロードする関数
    function preloadImages(imageUrls) {
        imageUrls.forEach(url => {
            const img = new Image();
            img.src = url;
        });
    }

    // スロットの各リールを初期化（画像を非表示にする）
    function resetReels() {
        reel1.innerHTML = '';
        reel2.innerHTML = '';
        reel3.innerHTML = '';
        resultMessage.innerHTML = '<p>スタートボタンを押してね</p>';
        resultMessage.classList.remove('message-win', 'message-lose');
    }

    // 最終的に表示する画像をリールにセット
    function displayFinalImage(reelElement, prize) {
        reelElement.innerHTML = `<img src="${prize.image}" class="slot-image active">`;
    }

    // 抽選可能な景品の中から、重みに基づいてランダムな景品を1つ選ぶ関数
    function getRandomPrizeByWeight(prizeList) {
        let totalWeight = prizeList.reduce((sum, prize) => sum + (prize.weight || 1), 0);
        let randomNumber = Math.random() * totalWeight;

        let cumulativeWeight = 0;
        for (const prize of prizeList) {
            cumulativeWeight += (prize.weight || 1);
            if (randomNumber < cumulativeWeight) {
                return prize;
            }
        }
        return prizeList[prizeList.length - 1]; // フォールバック
    }

    // 抽選結果を決定する関数 (当選確率と景品上限の考慮)
    function getLotteryResults() {
        const WIN_PROBABILITY = 1.0; // 全体の当選確率 (例: 20%)

        // 抽選可能な景品のみをフィルタリング
        const availablePrizesForWin = prizes.filter(prize =>
            prize.maxOccurrences === -1 || prize.currentOccurrences < prize.maxOccurrences
        );

        // もし当選可能な景品がなければ、強制的にハズレとする
        if (availablePrizesForWin.length === 0) {
            resultMessage.innerHTML = '<p>全ての特賞が終了しました！</p>';
            startButton.disabled = true; // ボタン無効化
            // ハズレ用の景品を選んで返す（またはランダムに３つ返す）
            const fallbackPrizes = prizes.filter(p => p.id !== 'A' && p.id !== 'B'); // A賞、B賞以外など
            return [getRandomPrizeByWeight(fallbackPrizes), getRandomPrizeByWeight(fallbackPrizes), getRandomPrizeByWeight(fallbackPrizes)];
        }

        if (Math.random() < WIN_PROBABILITY) {
            // 当選する場合：抽選可能な景品の中から重みに基づいて景品を決定
            const winningPrize = getRandomPrizeByWeight(availablePrizesForWin);

            // 当選した景品の発生回数を増やす
            winningPrize.currentOccurrences++;

            return [winningPrize, winningPrize, winningPrize]; // 3つ同じ景品を返す
        } else {
            // ハズレの場合
            let results = [];
            let availablePrizesForLoss = prizes; // ハズレの場合は全ての景品から選ぶ（上限は当選時のみ適用）

            // ただし、ハズレの時に景品の在庫を減らしたくない場合は、この部分の処理を見直す
            // 例: availablePrizesForLoss = prizes.filter(p => p.id === 'D' || p.id === 'E'); // D,E賞のみをハズレの対象とするなど

            while (true) {
                results = [
                    getRandomPrizeByWeight(availablePrizesForLoss),
                    getRandomPrizeByWeight(availablePrizesForLoss),
                    getRandomPrizeByWeight(availablePrizesForLoss)
                ];
                // 3つ揃ってしまわないようにチェック
                if (!(results[0].id === results[1].id && results[1].id === results[2].id)) {
                    break;
                }
            }
            return results;
        }
    }

    // 当選/ハズレを判定し、ブーリアンで結果を返す
    function checkResult(finalResults) {
        if (finalResults[0].id === finalResults[1].id && finalResults[1].id === finalResults[2].id) {
            resultMessage.innerHTML = `<p>🎉 当選！ 🎉</p>`; // 簡易メッセージ
            resultMessage.classList.add('message-win');
            return true; // 当選
        } else {
            // ハズレの場合は、スクリプト内でメッセージ表示を行うため、ここでは何もしない
            return false; // ハズレ
        }
    }

    // モーダルを表示する関数
    function showPrizeModal(prize) {
        modalPrizeTitle.textContent = `${prize.name} GET！`;
        modalPrizeImage.src = prize.image;
        modalPrizeImage.alt = prize.name;
        modalPrizeDescription.textContent = prize.description || `おめでとうございます！ ${prize.name} の当選です！`; // 説明がない場合のフォールバック

        prizeModal.classList.add('show'); // CSSでモーダルを表示
    }

    // モーダルを非表示にする関数
    function hidePrizeModal() {
        prizeModal.classList.remove('show'); // CSSでモーダルを非表示
    }

    // 閉じるボタンのイベントリスナー
    closeModalButton.addEventListener('click', hidePrizeModal);

    // モーダル外のクリックで閉じる
    window.addEventListener('click', (event) => {
        if (event.target === prizeModal) { // イベントのターゲットがモーダル自身の場合のみ閉じる
            hidePrizeModal();
        }
    });
});
