// Break the Code - Logic

function isPrime(num) {
    if (num <= 1) return false;
    for (let i = 2; i < num; i++) {
        if (num % i === 0) return false;
    }
    return true;
}

function getDecoderList(charSet, maxOpRes = 300) {
    const decoderRing = {};
    const usedNumbers = new Set();
    const chars = Array.from(charSet);

    for (const char of chars) {
        let r;
        do {
            r = Math.floor(Math.random() * maxOpRes) + 1;
        } while (usedNumbers.has(r));

        usedNumbers.add(r);
        decoderRing[char] = r;
    }
    return decoderRing;
}

function sentenceWriting(sentence, decoderRing) {
    const sentenceCoded = [];
    let currentWord = [];

    // Handle spaces and split into words
    for (const char of sentence) {
        if (char === ' ') {
            if (currentWord.length > 0) {
                sentenceCoded.push(currentWord);
                currentWord = [];
            }
        } else {
            if (decoderRing[char] !== undefined) {
                currentWord.push(decoderRing[char]);
            } else {
                console.warn(`${char} not found in decoder ring`);
            }
        }
    }
    if (currentWord.length > 0) {
        sentenceCoded.push(currentWord);
    }

    return sentenceCoded;
}

function generateOperations(decoderRing, ops = ['multiply', 'add', 'divide', 'subtract']) {
    const calcDict = {};

    for (const [char, v] of Object.entries(decoderRing)) {
        let op;
        if (isPrime(v)) {
            // Primes are hard for division/multiplication sometimes, prefer add/sub
            const allowed = ops.filter(o => o === 'add' || o === 'subtract');
            op = allowed.length > 0 ? allowed[Math.floor(Math.random() * allowed.length)] : 'add';
        } else {
            op = ops[Math.floor(Math.random() * ops.length)];
        }

        let operationStr = "";

        if (op === 'multiply') {
            let valid = false;
            let a, b;
            while (!valid) {
                a = Math.floor(Math.random() * v) + 1;
                // Avoid division by zero and ensure integer division
                if (v % a === 0 && a > 1 && (v/a) > 1) { // Ensure factors are > 1 for meaningful multiplication
                     b = v / a;
                     valid = true;
                } else if (a === 1 && v > 1) {
                    // Allow 1 * v only if we can't find anything else? No, try to avoid identity
                    // But if v is prime, we shouldn't be here (handled above).
                    // If v is composite but we picked a bad 'a', loop again.
                    // Safety break
                    if (Math.random() > 0.95) { // Fallback
                         b = v;
                         a = 1;
                         valid = true;
                    }
                }
            }
            // If we still didn't find good factors (e.g. strict loop), fallback to add
             if (!operationStr) operationStr = `${a} x ${b} = `;
        }

        if (op === 'divide') {
            let valid = false;
            let a;
            while (!valid) {
                a = Math.floor(Math.random() * 10) + 2; // Divisor between 2 and 12
                if (v * a <= 1000) { // Limit max number
                    valid = true;
                }
            }
            operationStr = `${v * a} / ${a} = `;
        }

        if (op === 'add') {
            let a = Math.floor(Math.random() * (v - 1)) + 1;
            if (v === 0) a = 0; // Edge case if v is 0 (though range is 1-300)
            operationStr = `${v - a} + ${a} = `;
        }

        if (op === 'subtract') {
            let a = Math.floor(Math.random() * 50) + 1; // Subtract random number
            operationStr = `${v + a} - ${a} = `;
        }

        // Fallback if logic failed (shouldn't happen with correct logic)
        if (!operationStr) {
             let a = Math.floor(Math.random() * v);
             operationStr = `${v - a} + ${a} = `;
        }

        calcDict[char] = operationStr;
    }

    return calcDict;
}

function generateWorksheet() {
    const messageInput = document.getElementById('messageInput').value.toUpperCase();
    if (!messageInput.trim()) {
        alert("Please enter a message!");
        return;
    }

    // Get selected operations
    const ops = [];
    if (document.getElementById('opAdd').checked) ops.push('add');
    if (document.getElementById('opSub').checked) ops.push('subtract');
    if (document.getElementById('opMul').checked) ops.push('multiply');
    if (document.getElementById('opDiv').checked) ops.push('divide');

    if (ops.length === 0) {
        alert("Please select at least one operation.");
        return;
    }

    // Clean text: keep only letters and numbers? Or just use what we have?
    // The Python script used `char_set.remove(' ')`.
    // Let's filter to A-Z and 0-9 for simplicity in the key, ignoring punctuation in the key generation?
    // If we have punctuation, we need to assign numbers to them too.
    const charSet = new Set();
    const allowedChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!?.,";
    const cleanMessage = [];

    for (const char of messageInput) {
        if (char !== ' ' && char !== '\n') {
            charSet.add(char);
        }
    }

    const decoderRing = getDecoderList(charSet);
    const codedSentence = sentenceWriting(messageInput, decoderRing);
    const operationsDict = generateOperations(decoderRing, ops);

    renderWorksheet(operationsDict, codedSentence, decoderRing);
}

function renderWorksheet(operationsDict, codedSentence, decoderRing) {
    const keySection = document.getElementById('keySection');
    const messageSection = document.getElementById('messageSection');
    const worksheet = document.getElementById('worksheet');

    keySection.innerHTML = '';
    messageSection.innerHTML = '';

    // Render Key
    // Sort keys alphabetically?
    const sortedChars = Object.keys(operationsDict).sort();

    for (const char of sortedChars) {
        const op = operationsDict[char];
        const keyItem = document.createElement('div');
        keyItem.className = 'key-item';
        keyItem.innerHTML = `<span class="operation">${op}</span> <span class="result">${char}</span>`;
        keySection.appendChild(keyItem);
    }

    // Render Message
    for (const word of codedSentence) {
        const wordBlock = document.createElement('div');
        wordBlock.className = 'word-block';

        for (const number of word) {
            const charBlock = document.createElement('div');
            charBlock.className = 'char-block';

            const charBox = document.createElement('div');
            charBox.className = 'char-box';

            const charNumber = document.createElement('div');
            charNumber.className = 'char-number';
            charNumber.textContent = number;

            charBlock.appendChild(charBox);
            charBlock.appendChild(charNumber);
            wordBlock.appendChild(charBlock);
        }
        messageSection.appendChild(wordBlock);
    }

    // Show worksheet
    worksheet.style.display = 'flex';

    // Scroll to worksheet
    worksheet.scrollIntoView({ behavior: 'smooth' });
}


// Module export for testing
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = { isPrime, getDecoderList, generateOperations, sentenceWriting };
}
