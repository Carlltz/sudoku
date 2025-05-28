'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from './SudokuGame.module.css';

type SudokuGrid = (number | null)[][];
type Difficulty = 'easy' | 'medium' | 'hard' | 'killer';

interface KillerCage {
    id: number;
    cells: { row: number; col: number }[];
    sum: number;
}

interface LeaderboardEntry {
    id: string;
    playerName: string;
    difficulty: Difficulty;
    time: number;
    score: number;
    date: string;
}

interface GameState {
    grid: SudokuGrid;
    solution: SudokuGrid;
    initialGrid: SudokuGrid;
    selectedCell: { row: number; col: number } | null;
    errors: Set<string>;
    isComplete: boolean;
    timer: number;
    isTimerRunning: boolean;
    killerCages?: KillerCage[];
}

const SudokuGame = () => {
    const [gameState, setGameState] = useState<GameState>({
        grid: Array(9)
            .fill(null)
            .map(() => Array(9).fill(null)),
        solution: Array(9)
            .fill(null)
            .map(() => Array(9).fill(null)),
        initialGrid: Array(9)
            .fill(null)
            .map(() => Array(9).fill(null)),
        selectedCell: null,
        errors: new Set(),
        isComplete: false,
        timer: 0,
        isTimerRunning: false,
    });

    const [difficulty, setDifficulty] = useState<Difficulty>('medium');
    const [showErrors, setShowErrors] = useState(true);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [showNameInput, setShowNameInput] = useState(false);
    const [playerName, setPlayerName] = useState('');

    // Load leaderboard from localStorage on mount
    useEffect(() => {
        const savedLeaderboard = localStorage.getItem('sudoku-leaderboard');
        if (savedLeaderboard) {
            setLeaderboard(JSON.parse(savedLeaderboard));
        }
    }, []);

    // Timer effect
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (gameState.isTimerRunning && !gameState.isComplete) {
            interval = setInterval(() => {
                setGameState((prev) => ({ ...prev, timer: prev.timer + 1 }));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [gameState.isTimerRunning, gameState.isComplete]);

    // Handle game completion
    useEffect(() => {
        if (gameState.isComplete && gameState.timer > 0) {
            setShowNameInput(true);
        }
    }, [gameState.isComplete, gameState.timer]);

    // Generate a valid sudoku solution
    const generateSolution = (): SudokuGrid => {
        const grid: SudokuGrid = Array(9)
            .fill(null)
            .map(() => Array(9).fill(null));

        const isValid = (grid: SudokuGrid, row: number, col: number, num: number): boolean => {
            // Check row
            for (let x = 0; x < 9; x++) {
                if (grid[row][x] === num) return false;
            }

            // Check column
            for (let x = 0; x < 9; x++) {
                if (grid[x][col] === num) return false;
            }

            // Check 3x3 box
            const startRow = row - (row % 3);
            const startCol = col - (col % 3);
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) {
                    if (grid[i + startRow][j + startCol] === num) return false;
                }
            }

            return true;
        };

        const solve = (grid: SudokuGrid): boolean => {
            for (let row = 0; row < 9; row++) {
                for (let col = 0; col < 9; col++) {
                    if (grid[row][col] === null) {
                        const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
                        for (const num of numbers) {
                            if (isValid(grid, row, col, num)) {
                                grid[row][col] = num;
                                if (solve(grid)) return true;
                                grid[row][col] = null;
                            }
                        }
                        return false;
                    }
                }
            }
            return true;
        };

        solve(grid);
        return grid;
    };

    // Create puzzle by removing numbers from solution
    const createPuzzle = (solution: SudokuGrid, difficulty: Difficulty): SudokuGrid => {
        // For killer sudoku, start with completely empty grid
        if (difficulty === 'killer') {
            return Array(9)
                .fill(null)
                .map(() => Array(9).fill(null));
        }

        const puzzle = solution.map((row) => [...row]);
        const cellsToRemove = {
            easy: 40,
            medium: 50,
            hard: 60,
        }[difficulty];

        const positions = [];
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                positions.push([i, j]);
            }
        }

        // Shuffle positions
        for (let i = positions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [positions[i], positions[j]] = [positions[j], positions[i]];
        }

        for (let i = 0; i < cellsToRemove && i < positions.length; i++) {
            const [row, col] = positions[i];
            puzzle[row][col] = null;
        }

        return puzzle;
    };

    // Generate killer cages for killer sudoku
    const generateKillerCages = (solution: SudokuGrid): KillerCage[] => {
        const cages: KillerCage[] = [];
        const usedCells = new Set<string>();
        let cageId = 0;

        // Simple cage generation - create random sized cages (2-4 cells)
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const cellKey = `${row}-${col}`;
                if (usedCells.has(cellKey)) continue;

                const cage: KillerCage = {
                    id: cageId++,
                    cells: [{ row, col }],
                    sum: solution[row][col]!,
                };

                usedCells.add(cellKey);

                // Try to add adjacent cells to the cage
                const cageSize = Math.floor(Math.random() * 3) + 2; // 2-4 cells
                const directions = [
                    [0, 1], [1, 0], [0, -1], [-1, 0]
                ];

                for (let i = 1; i < cageSize; i++) {
                    let added = false;
                    const shuffledDirections = [...directions].sort(() => Math.random() - 0.5);
                    
                    for (const [dr, dc] of shuffledDirections) {
                        for (const cell of cage.cells) {
                            const newRow = cell.row + dr;
                            const newCol = cell.col + dc;
                            const newCellKey = `${newRow}-${newCol}`;
                            
                            if (
                                newRow >= 0 && newRow < 9 &&
                                newCol >= 0 && newCol < 9 &&
                                !usedCells.has(newCellKey)
                            ) {
                                cage.cells.push({ row: newRow, col: newCol });
                                cage.sum += solution[newRow][newCol]!;
                                usedCells.add(newCellKey);
                                added = true;
                                break;
                            }
                        }
                        if (added) break;
                    }
                    if (!added) break;
                }

                cages.push(cage);
            }
        }

        return cages;
    };

    // Start new game
    const startNewGame = useCallback(() => {
        const solution = generateSolution();
        const puzzle = createPuzzle(solution, difficulty);
        
        let killerCages: KillerCage[] | undefined;
        if (difficulty === 'killer') {
            killerCages = generateKillerCages(solution);
        }

        setGameState({
            grid: puzzle.map((row) => [...row]),
            solution,
            initialGrid: puzzle.map((row) => [...row]),
            selectedCell: null,
            errors: new Set(),
            isComplete: false,
            timer: 0,
            isTimerRunning: true,
            killerCages,
        });
    }, [difficulty]);

    // Check if current state is valid
    const validateGrid = (grid: SudokuGrid): Set<string> => {
        const errors = new Set<string>();

        const isValidValue = (row: number, col: number, value: number): boolean => {
            // Check row
            for (let c = 0; c < 9; c++) {
                if (c !== col && grid[row][c] === value) return false;
            }

            // Check column
            for (let r = 0; r < 9; r++) {
                if (r !== row && grid[r][col] === value) return false;
            }

            // Check 3x3 box
            const startRow = Math.floor(row / 3) * 3;
            const startCol = Math.floor(col / 3) * 3;
            for (let r = startRow; r < startRow + 3; r++) {
                for (let c = startCol; c < startCol + 3; c++) {
                    if ((r !== row || c !== col) && grid[r][c] === value) return false;
                }
            }

            return true;
        };

        // Validate killer cages if in killer mode
        const validateKillerCages = (): void => {
            if (!gameState.killerCages) return;

            for (const cage of gameState.killerCages) {
                const cageValues: number[] = [];
                let hasNull = false;

                for (const cell of cage.cells) {
                    const value = grid[cell.row][cell.col];
                    if (value === null) {
                        hasNull = true;
                    } else {
                        cageValues.push(value);
                    }
                }

                // Check for duplicates within cage
                const uniqueValues = new Set(cageValues);
                if (uniqueValues.size !== cageValues.length) {
                    // Mark all cells in cage as errors
                    for (const cell of cage.cells) {
                        errors.add(`${cell.row}-${cell.col}`);
                    }
                }

                // Check sum constraint (only if cage is complete)
                if (!hasNull && cageValues.length === cage.cells.length) {
                    const sum = cageValues.reduce((a, b) => a + b, 0);
                    if (sum !== cage.sum) {
                        // Mark all cells in cage as errors
                        for (const cell of cage.cells) {
                            errors.add(`${cell.row}-${cell.col}`);
                        }
                    }
                }
            }
        };

        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const value = grid[row][col];
                if (value !== null && !isValidValue(row, col, value)) {
                    errors.add(`${row}-${col}`);
                }
            }
        }

        // Add killer cage validation
        if (difficulty === 'killer') {
            validateKillerCages();
        }

        return errors;
    };

    // Handle cell click
    const handleCellClick = (row: number, col: number) => {
        if (gameState.initialGrid[row][col] !== null) return; // Can't edit initial numbers
        setGameState((prev) => ({
            ...prev,
            selectedCell: { row, col },
        }));
    };

    // Handle number input
    const handleNumberInput = (num: number | null) => {
        if (!gameState.selectedCell) return;

        const { row, col } = gameState.selectedCell;
        if (gameState.initialGrid[row][col] !== null) return;

        const newGrid = gameState.grid.map((r) => [...r]);
        newGrid[row][col] = num;

        const errors = showErrors ? validateGrid(newGrid) : new Set<string>();
        const isComplete = newGrid.every((row) => row.every((cell) => cell !== null)) && errors.size === 0;

        setGameState((prev) => ({
            ...prev,
            grid: newGrid,
            errors,
            isComplete,
            isTimerRunning: !isComplete,
        }));
    };

    // Handle keyboard input
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (!gameState.selectedCell) return;

            if (e.key >= '1' && e.key <= '9') {
                handleNumberInput(parseInt(e.key));
            } else if (e.key === 'Backspace' || e.key === 'Delete') {
                handleNumberInput(null);
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [gameState.selectedCell]);

    // Format timer
    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Calculate score based on time and difficulty
    const calculateScore = (time: number, difficulty: Difficulty): number => {
        const baseScore = {
            easy: 1000,
            medium: 1500,
            hard: 2000,
            killer: 2500,
        }[difficulty];

        // Bonus for speed (more points for faster completion)
        const timeBonus = Math.max(0, baseScore - time * 2);
        return Math.round(baseScore + timeBonus);
    };

    // Save score to leaderboard
    const saveScore = (name: string) => {
        const score = calculateScore(gameState.timer, difficulty);
        const newEntry: LeaderboardEntry = {
            id: Date.now().toString(),
            playerName: name,
            difficulty,
            time: gameState.timer,
            score,
            date: new Date().toLocaleDateString(),
        };

        const updatedLeaderboard = [...leaderboard, newEntry]
            .sort((a, b) => b.score - a.score)
            .slice(0, 10); // Keep top 10

        setLeaderboard(updatedLeaderboard);
        localStorage.setItem('sudoku-leaderboard', JSON.stringify(updatedLeaderboard));
        setShowNameInput(false);
        setPlayerName('');
    };

    // Get hint
    const getHint = () => {
        if (!gameState.selectedCell) return;

        const { row, col } = gameState.selectedCell;
        if (gameState.initialGrid[row][col] !== null) return;

        const correctValue = gameState.solution[row][col];
        if (correctValue) {
            handleNumberInput(correctValue);
        }
    };

    // Initialize game on mount
    useEffect(() => {
        startNewGame();
    }, [startNewGame]);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Sudoku</h1>
                <div className={styles.controls}>
                    <div className={styles.timer}>Time: {formatTime(gameState.timer)}</div>
                    <select
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                        className={styles.select}>
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                        <option value="killer">Killer Sudoku</option>
                    </select>
                    <button
                        onClick={startNewGame}
                        className={styles.button}>
                        New Game
                    </button>
                    <button
                        onClick={() => setShowLeaderboard(!showLeaderboard)}
                        className={styles.button}>
                        🏆 Leaderboard
                    </button>
                </div>
            </div>

            {gameState.isComplete && (
                <div className={styles.completion}>
                    🎉 Congratulations! You completed the puzzle in {formatTime(gameState.timer)}!
                    <div className={styles.scoreInfo}>
                        Score: {calculateScore(gameState.timer, difficulty)} points
                    </div>
                </div>
            )}

            {/* Name Input Modal */}
            {showNameInput && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <h3>🎉 Great job!</h3>
                        <p>You scored {calculateScore(gameState.timer, difficulty)} points!</p>
                        <p>Enter your name for the leaderboard:</p>
                        <input
                            type="text"
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value)}
                            placeholder="Your name"
                            className={styles.nameInput}
                            maxLength={20}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter' && playerName.trim()) {
                                    saveScore(playerName.trim());
                                }
                            }}
                        />
                        <div className={styles.modalButtons}>
                            <button
                                onClick={() => playerName.trim() && saveScore(playerName.trim())}
                                disabled={!playerName.trim()}
                                className={styles.button}>
                                Save Score
                            </button>
                            <button
                                onClick={() => setShowNameInput(false)}
                                className={`${styles.button} ${styles.secondaryButton}`}>
                                Skip
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Leaderboard Modal */}
            {showLeaderboard && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h3>🏆 Leaderboard</h3>
                            <button
                                onClick={() => setShowLeaderboard(false)}
                                className={styles.closeButton}>
                                ✕
                            </button>
                        </div>
                        <div className={styles.leaderboardContent}>
                            {leaderboard.length === 0 ? (
                                <p className={styles.emptyLeaderboard}>No scores yet. Be the first to complete a puzzle!</p>
                            ) : (
                                <div className={styles.leaderboardList}>
                                    {leaderboard.map((entry, index) => (
                                        <div key={entry.id} className={styles.leaderboardEntry}>
                                            <div className={styles.rank}>
                                                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                                            </div>
                                            <div className={styles.playerInfo}>
                                                <div className={styles.playerName}>{entry.playerName}</div>
                                                <div className={styles.gameDetails}>
                                                    {entry.difficulty} • {formatTime(entry.time)} • {entry.date}
                                                </div>
                                            </div>
                                            <div className={styles.score}>{entry.score}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className={styles.gameArea}>
                <div className={styles.gridContainer}>
                    <div className={styles.grid}>
                        {gameState.grid.map((row, rowIndex) =>
                            row.map((cell, colIndex) => {
                                const isSelected =
                                    gameState.selectedCell?.row === rowIndex &&
                                    gameState.selectedCell?.col === colIndex;
                                const isInitial = gameState.initialGrid[rowIndex][colIndex] !== null;
                                const hasError = gameState.errors.has(`${rowIndex}-${colIndex}`);
                                const isInSameRow = gameState.selectedCell?.row === rowIndex;
                                const isInSameCol = gameState.selectedCell?.col === colIndex;
                                const isInSameBox =
                                    gameState.selectedCell &&
                                    Math.floor(gameState.selectedCell.row / 3) === Math.floor(rowIndex / 3) &&
                                    Math.floor(gameState.selectedCell.col / 3) === Math.floor(colIndex / 3);

                                // Find killer cage for this cell
                                const killerCage = gameState.killerCages?.find(cage =>
                                    cage.cells.some(cageCell => cageCell.row === rowIndex && cageCell.col === colIndex)
                                );
                                const isFirstCellInCage = killerCage?.cells[0].row === rowIndex && killerCage?.cells[0].col === colIndex;

                                return (
                                    <div
                                        key={`${rowIndex}-${colIndex}`}
                                        className={`${styles.cell} ${isSelected ? styles.selected : ''} ${
                                            isInitial ? styles.initial : ''
                                        } ${hasError ? styles.error : ''} ${
                                            isInSameRow || isInSameCol || isInSameBox ? styles.highlighted : ''
                                        } ${killerCage ? styles.killerCell : ''}`}
                                        style={killerCage ? {
                                            backgroundColor: `hsl(${(killerCage.id * 137.5) % 360}, 30%, 95%)`,
                                            border: `2px solid hsl(${(killerCage.id * 137.5) % 360}, 50%, 70%)`
                                        } : {}}
                                        onClick={() => handleCellClick(rowIndex, colIndex)}>
                                        {isFirstCellInCage && killerCage && (
                                            <div className={styles.cageSum}>{killerCage.sum}</div>
                                        )}
                                        <div className={styles.cellValue}>{cell || ''}</div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                <div className={styles.sidebar}>
                    <div className={styles.numberPad}>
                        <h3>Numbers</h3>
                        <div className={styles.numbers}>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                <button
                                    key={num}
                                    onClick={() => handleNumberInput(num)}
                                    className={styles.numberButton}
                                    disabled={
                                        !gameState.selectedCell ||
                                        (gameState.selectedCell &&
                                            gameState.initialGrid[gameState.selectedCell.row][
                                                gameState.selectedCell.col
                                            ] !== null)
                                    }>
                                    {num}
                                </button>
                            ))}
                            <button
                                onClick={() => handleNumberInput(null)}
                                className={`${styles.numberButton} ${styles.eraseButton}`}
                                disabled={
                                    !gameState.selectedCell ||
                                    (gameState.selectedCell &&
                                        gameState.initialGrid[gameState.selectedCell.row][
                                            gameState.selectedCell.col
                                        ] !== null)
                                }>
                                ✕
                            </button>
                        </div>
                    </div>

                    <div className={styles.actions}>
                        <button
                            onClick={getHint}
                            className={styles.button}
                            disabled={
                                !gameState.selectedCell ||
                                (gameState.selectedCell &&
                                    gameState.initialGrid[gameState.selectedCell.row][gameState.selectedCell.col] !==
                                        null)
                            }>
                            💡 Hint
                        </button>
                        <label className={styles.checkbox}>
                            <input
                                type="checkbox"
                                checked={showErrors}
                                onChange={(e) => setShowErrors(e.target.checked)}
                            />
                            Show Errors
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SudokuGame;
