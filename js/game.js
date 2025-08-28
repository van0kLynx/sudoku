class SudokuGame {
    constructor() {
        this.board = Array(9).fill().map(() => Array(9).fill(0));
        this.solution = Array(9).fill().map(() => Array(9).fill(0));
        this.originalBoard = Array(9).fill().map(() => Array(9).fill(0));
        this.selectedCell = null;
        this.notesMode = false;
        this.notes = Array(9).fill().map(() => Array(9).fill().map(() => new Set()));
        this.hints = 3;
        this.errors = 0;
        this.maxErrors = 3;
        this.startTime = Date.now();
        this.timer = null;
        this.moveHistory = [];
        this.difficulty = 'easy';
        this.invalidCells = new Set();
        this.difficultyLevels = {
            easy: { clues: 45, name: 'Easy' },
            medium: { clues: 35, name: 'Medium' },
            hard: { clues: 28, name: 'Hard' },
            expert: { clues: 22, name: 'Expert' },
            master: { clues: 17, name: 'Master' }
        };
        
        this.init();
    }

    init() {
        this.generatePuzzle();
        this.renderBoard();
        this.startTimer();
        this.updateDisplay();
    }

    generatePuzzle() {
        // Generate a solved board
        this.generateSolvedBoard();
        
        // Copy solution
        this.solution = this.board.map(row => [...row]);
        
        // Remove numbers based on difficulty
        const cluesToRemove = 81 - this.difficultyLevels[this.difficulty].clues;
        this.removeNumbers(cluesToRemove);
        
        // Copy to original board
        this.originalBoard = this.board.map(row => [...row]);
    }

    generateSolvedBoard() {
        // Simple Sudoku generation - in a real app you'd want a more sophisticated algorithm
        this.board = Array(9).fill().map(() => Array(9).fill(0));
        
        // Fill diagonal 3x3 boxes first
        this.fillBox(0, 0);
        this.fillBox(3, 3);
        this.fillBox(6, 6);
        
        // Fill remaining cells
        this.solveSudoku();
    }

    fillBox(row, col) {
        const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                const randomIndex = Math.floor(Math.random() * numbers.length);
                this.board[row + i][col + j] = numbers[randomIndex];
                numbers.splice(randomIndex, 1);
            }
        }
    }

    solveSudoku() {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (this.board[row][col] === 0) {
                    for (let num = 1; num <= 9; num++) {
                        if (this.isValid(row, col, num)) {
                            this.board[row][col] = num;
                            if (this.solveSudoku()) {
                                return true;
                            }
                            this.board[row][col] = 0;
                        }
                    }
                    return false;
                }
            }
        }
        return true;
    }

    isValid(row, col, num) {
        // Check row (excluding current cell)
        for (let x = 0; x < 9; x++) {
            if (x !== col && this.board[row][x] === num) return false;
        }
        
        // Check column (excluding current cell)
        for (let x = 0; x < 9; x++) {
            if (x !== row && this.board[x][col] === num) return false;
        }
        
        // Check 3x3 box (excluding current cell)
        const startRow = Math.floor(row / 3) * 3;
        const startCol = Math.floor(col / 3) * 3;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                const checkRow = startRow + i;
                const checkCol = startCol + j;
                if ((checkRow !== row || checkCol !== col) && this.board[checkRow][checkCol] === num) return false;
            }
        }
        
        return true;
    }

    removeNumbers(count) {
        let removed = 0;
        while (removed < count) {
            const row = Math.floor(Math.random() * 9);
            const col = Math.floor(Math.random() * 9);
            if (this.board[row][col] !== 0) {
                this.board[row][col] = 0;
                removed++;
            }
        }
    }

    renderBoard() {
        const grid = document.getElementById('sudokuGrid');
        grid.innerHTML = '';
        
        for (let row = 0; row < 9; row++) {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'sudoku-row';
            
            for (let col = 0; col < 9; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                if (this.board[row][col] !== 0) {
                    cell.textContent = this.board[row][col];
                    if (this.originalBoard[row][col] !== 0) {
                        cell.classList.add('original');
                    } else {
                        cell.classList.add('user-input');
                        
                        // Check if this number is invalid (conflicts with Sudoku rules)
                        if (this.invalidCells && this.invalidCells.has(`${row}-${col}`)) {
                            cell.classList.add('invalid');
                        }
                    }
                } else if (this.notes[row][col].size > 0) {
                    this.renderNotes(cell, row, col);
                }
                
                cell.addEventListener('click', () => this.selectCell(row, col));
                cell.addEventListener('touchstart', (e) => {
                    this.selectCell(row, col);
                }, { passive: true });
                rowDiv.appendChild(cell);
            }
            grid.appendChild(rowDiv);
        }
    }

    renderNotes(cell, row, col) {
        cell.innerHTML = '';
        const noteGrid = document.createElement('div');
        noteGrid.style.cssText = `
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-orient: vertical;
            -webkit-box-direction: normal;
            -ms-flex-direction: column;
            flex-direction: column;
            width: 100%;
            height: 100%;
            font-size: 8px;
            color: #666;
        `;
        
        // Create 3 rows for notes
        for (let noteRow = 0; noteRow < 3; noteRow++) {
            const noteRowDiv = document.createElement('div');
            noteRowDiv.style.cssText = `
                display: -webkit-box;
                display: -ms-flexbox;
                display: flex;
                -webkit-box-flex: 1;
                -ms-flex: 1;
                flex: 1;
            `;
            
            for (let noteCol = 0; noteCol < 3; noteCol++) {
                const noteCell = document.createElement('div');
                noteCell.style.cssText = `
                    display: -webkit-box;
                    display: -ms-flexbox;
                    display: flex;
                    -webkit-box-align: center;
                    -ms-flex-align: center;
                    align-items: center;
                    -webkit-box-pack: center;
                    -ms-flex-pack: center;
                    justify-content: center;
                    -webkit-box-flex: 1;
                    -ms-flex: 1;
                    flex: 1;
                    border: 1px solid #eee;
                    font-size: 6px;
                `;
                const noteNumber = noteRow * 3 + noteCol + 1;
                if (this.notes[row][col].has(noteNumber)) {
                    noteCell.textContent = noteNumber;
                }
                noteRowDiv.appendChild(noteCell);
            }
            noteGrid.appendChild(noteRowDiv);
        }
        
        cell.appendChild(noteGrid);
    }

    selectCell(row, col) {
        // Clear previous selection
        document.querySelectorAll('.cell.selected').forEach(cell => {
            cell.classList.remove('selected');
        });
        
        // Clear highlights
        document.querySelectorAll('.cell.highlighted').forEach(cell => {
            cell.classList.remove('highlighted');
        });
        
        // Clear previous digit highlighting
        document.querySelectorAll('.cell.same-digit').forEach(cell => {
            cell.classList.remove('same-digit');
        });
        
        // Select new cell
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        cell.classList.add('selected');
        this.selectedCell = { row, col };
        
        // Highlight related cells
        this.highlightRelatedCells(row, col);
        
        // Highlight all cells with the same digit
        if (this.board[row][col] !== 0) {
            this.highlightSameDigits(this.board[row][col]);
        }
    }

    highlightRelatedCells(row, col) {
        // Highlight row and column
        for (let i = 0; i < 9; i++) {
            const rowCell = document.querySelector(`[data-row="${row}"][data-col="${i}"]`);
            const colCell = document.querySelector(`[data-row="${i}"][data-col="${col}"]`);
            if (rowCell) rowCell.classList.add('highlighted');
            if (colCell) colCell.classList.add('highlighted');
        }
        
        // Highlight 3x3 box
        const startRow = Math.floor(row / 3) * 3;
        const startCol = Math.floor(col / 3) * 3;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                const boxCell = document.querySelector(`[data-row="${startRow + i}"][data-col="${startCol + j}"]`);
                if (boxCell) boxCell.classList.add('highlighted');
            }
        }
    }

    highlightSameDigits(digit) {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (this.board[row][col] === digit) {
                    const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                    if (cell) {
                        cell.classList.add('same-digit');
                    }
                }
            }
        }
    }

    inputNumber(num) {
        if (!this.selectedCell) return;
        
        const { row, col } = this.selectedCell;
        if (this.originalBoard[row][col] !== 0) return;
        
        // Save move for undo
        this.moveHistory.push({
            row, col,
            value: this.board[row][col],
            notes: new Set(this.notes[row][col])
        });
        
        if (this.notesMode) {
            // Toggle note
            if (this.notes[row][col].has(num)) {
                this.notes[row][col].delete(num);
            } else {
                this.notes[row][col].add(num);
            }
            this.board[row][col] = 0;
        } else {
            // Input number
            this.notes[row][col].clear();
            this.board[row][col] = num;
            
            // Check if valid
            if (!this.isValid(row, col, num)) {
                this.errors++;
                
                // Mark this cell as invalid in our data structure
                if (!this.invalidCells) this.invalidCells = new Set();
                this.invalidCells.add(`${row}-${col}`);
                
                const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                if (cell) {
                    cell.classList.add('error');
                    
                    // Keep error visible for longer and add invalid class
                    setTimeout(() => {
                        if (cell) {
                            cell.classList.remove('error');
                            cell.classList.add('invalid');
                        }
                    }, 1500);
                }
                
                if (this.errors >= this.maxErrors) {
                    this.gameOver(false);
                    return;
                }
            } else {
                // Remove invalid class if the number is now correct
                if (this.invalidCells) {
                    this.invalidCells.delete(`${row}-${col}`);
                }
                const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                if (cell) {
                    cell.classList.remove('invalid');
                }
            }
        }
        
        this.renderBoard();
        this.updateDisplay();
        
        // Check if puzzle is complete
        if (this.isComplete()) {
            this.gameOver(true);
        }
    }

    clearCell() {
        if (!this.selectedCell) return;
        
        const { row, col } = this.selectedCell;
        if (this.originalBoard[row][col] !== 0) return;
        
        // Save move for undo
        this.moveHistory.push({
            row, col,
            value: this.board[row][col],
            notes: new Set(this.notes[row][col])
        });
        
        this.board[row][col] = 0;
        this.notes[row][col].clear();
        this.renderBoard();
    }

    undo() {
        if (this.moveHistory.length === 0) return;
        
        const lastMove = this.moveHistory.pop();
        this.board[lastMove.row][lastMove.col] = lastMove.value;
        this.notes[lastMove.row][lastMove.col] = new Set(lastMove.notes);
        this.renderBoard();
    }

    toggleNotes() {
        this.notesMode = !this.notesMode;
        const notesBtn = document.getElementById('notesBtn');
        const status = notesBtn.querySelector('div:last-child');
        
        if (this.notesMode) {
            status.textContent = 'ON';
            notesBtn.classList.add('active');
        } else {
            status.textContent = 'OFF';
            notesBtn.classList.remove('active');
        }
    }

    getHint() {
        if (this.hints <= 0 || !this.selectedCell) return;
        
        const { row, col } = this.selectedCell;
        if (this.board[row][col] !== 0) return;
        
        const correctNumber = this.solution[row][col];
        
        // Save move for undo
        this.moveHistory.push({
            row, col,
            value: this.board[row][col],
            notes: new Set(this.notes[row][col])
        });
        
        this.board[row][col] = correctNumber;
        this.notes[row][col].clear();
        this.hints--;
        
        this.renderBoard();
        this.updateDisplay();
        
        // Check if puzzle is complete
        if (this.isComplete()) {
            this.gameOver(true);
        }
    }

    isComplete() {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (this.board[row][col] === 0) return false;
            }
        }
        return true;
    }

    gameOver(won) {
        clearInterval(this.timer);
        
        const gameOver = document.getElementById('gameOver');
        const title = document.getElementById('gameOverTitle');
        const message = document.getElementById('gameOverMessage');
        
        if (won) {
            title.textContent = 'Congratulations!';
            message.textContent = `You completed the ${this.difficulty} puzzle!`;
        } else {
            title.textContent = 'Game Over!';
            message.textContent = 'You made too many errors. Try again!';
        }
        
        gameOver.classList.add('show');
    }

    startTimer() {
        this.startTime = Date.now();
        this.timer = setInterval(() => {
            const elapsed = Date.now() - this.startTime;
            const minutes = Math.floor(elapsed / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            document.getElementById('timer').textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    updateDisplay() {
        document.getElementById('difficulty').textContent = this.difficultyLevels[this.difficulty].name;
        document.getElementById('errors').textContent = `${this.errors}/${this.maxErrors}`;
        document.getElementById('hintCount').textContent = this.hints;
        document.getElementById('score').textContent = Math.floor((Date.now() - this.startTime) / 1000);
    }

    setDifficulty(difficulty) {
        this.difficulty = difficulty;
        this.errors = 0;
        this.hints = 3;
        this.moveHistory = [];
        this.invalidCells.clear();
        clearInterval(this.timer);
        this.init();
    }
}

let game;

// Initialize game
document.addEventListener('DOMContentLoaded', () => {
    game = new SudokuGame();
    
    // Set up difficulty buttons
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            game.setDifficulty(btn.dataset.difficulty);
        });
    });
});

// Global functions for button clicks
function undo() {
    if (game) game.undo();
}

function clearCell() {
    if (game) game.clearCell();
}

function toggleNotes() {
    if (game) game.toggleNotes();
}

function getHint() {
    if (game) game.getHint();
}

function inputNumber(num) {
    if (game) game.inputNumber(num);
}

function newGame() {
    if (game) {
        game.setDifficulty(game.difficulty);
        closeGameOver();
    }
}

function closeGameOver() {
    document.getElementById('gameOver').classList.remove('show');
}

function goBack() {
    // In a real app, this would navigate back
    alert('Back button clicked');
}

function toggleSettings() {
    // In a real app, this would show settings
    alert('Settings button clicked');
}
